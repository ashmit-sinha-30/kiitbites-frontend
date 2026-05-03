"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import api from "@/utils/apiUtils";

interface GuestHouse {
  _id: string;
  name: string;
  totalRooms: number;
  contactNumber: string;
  location: string;
  managerName?: string;
  description?: string;
  coverImage?: string;
  additionalImages?: string[];
  images?: string[];
}

interface RoomType {
  _id: string;
  roomName: string;
  roomCount: number;
  price: number;
  coverImage: string;
  detailedImages: string[];
  services: string[];
}

interface RoomBookingDraft {
  checkInDate: string;
  checkOutDate: string;
  roomsRequested: string;
  adultsCount: string;
  kidsCount: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  loadingAvailability: boolean;
  loadingPay: boolean;
  availabilityMessage: string;
  pricingMessage: string;
  canBook: boolean;
}

const prettifySlug = (slug: string) =>
  slug
    .split("-")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as unknown as { Razorpay?: unknown }).Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(s);
  });
}

const LAST_BOOKING_STORAGE_KEY = "lastGuestHouseBookingId";

export default function GuestHouseBookingClient() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const cid = searchParams.get("cid") || "";
  const slug = params?.slug || "";

  const [lookupBookingId, setLookupBookingId] = useState("");
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<{
    assignedRoomNumbers: string;
    guestName: string;
    guestHouseName?: string;
    roomTypeName?: string;
    checkInDate: string;
    checkOutDate: string;
    bookingId: string;
  } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [loadingGuestHouses, setLoadingGuestHouses] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [guestHouses, setGuestHouses] = useState<GuestHouse[]>([]);
  const [selectedGuestHouse, setSelectedGuestHouse] = useState<GuestHouse | null>(null);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [roomBookingDrafts, setRoomBookingDrafts] = useState<Record<string, RoomBookingDraft>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem(LAST_BOOKING_STORAGE_KEY);
    if (stored) {
      setLookupBookingId((prev) => (prev ? prev : stored));
    }
  }, []);

  const runBookingLookup = async () => {
    setLookupError(null);
    setLookupResult(null);
    const id = lookupBookingId.trim();
    const phone = lookupPhone.trim();
    if (!id || !phone) {
      setLookupError("Enter your booking id and the phone number used when booking.");
      return;
    }
    try {
      setLookupLoading(true);
      const res = await api.get("/api/guest-house-bookings/public/booking-lookup", {
        params: { bookingId: id, guestPhone: phone },
      });
      const json = res.data;
      if (!json.success) throw new Error(json.message || "Lookup failed");
      setLookupResult(json.data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setLookupError(err.response?.data?.message || err.message || "Could not find that booking.");
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    const loadGuestHouses = async () => {
      if (!cid) {
        setGuestHouses([]);
        setLoadingGuestHouses(false);
        return;
      }

      try {
        setLoadingGuestHouses(true);
        const res = await api.get(`/api/guest-house/public/${cid}`);
        const json = res.data;
        if (json.success) {
          setGuestHouses(json.data || []);
        } else {
          setGuestHouses([]);
        }
      } catch {
        setGuestHouses([]);
      } finally {
        setLoadingGuestHouses(false);
      }
    };

    void loadGuestHouses();
  }, [cid]);

  const pageTitle = useMemo(() => {
    if (!slug) return "Guest House Booking";
    return `Guest House Booking - ${prettifySlug(slug)}`;
  }, [slug]);

  const emptyDraft = useCallback(
    (): RoomBookingDraft => ({
      checkInDate: "",
      checkOutDate: "",
      roomsRequested: "1",
      adultsCount: "1",
      kidsCount: "0",
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      loadingAvailability: false,
      loadingPay: false,
      availabilityMessage: "",
      pricingMessage: "",
      canBook: false,
    }),
    []
  );

  const selectGuestHouse = async (guestHouse: GuestHouse) => {
    setSelectedGuestHouse(guestHouse);
    try {
      setLoadingRooms(true);
      const res = await api.get(`/api/guest-house-rooms/public/${guestHouse._id}`);
      const json = res.data;
      if (json.success) {
        const loadedRooms: RoomType[] = json.data || [];
        setRooms(loadedRooms);
        const drafts: Record<string, RoomBookingDraft> = {};
        loadedRooms.forEach((room) => {
          drafts[room._id] = emptyDraft();
        });
        setRoomBookingDrafts(drafts);
      } else {
        setRooms([]);
        setRoomBookingDrafts({});
      }
    } catch {
      setRooms([]);
      setRoomBookingDrafts({});
    } finally {
      setLoadingRooms(false);
    }
  };

  const updateDraft = (roomId: string, patch: Partial<RoomBookingDraft>) => {
    setRoomBookingDrafts((prev) => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        ...patch,
      },
    }));
  };

  const checkAvailability = async (room: RoomType) => {
    const draft = roomBookingDrafts[room._id];
    if (!draft?.checkInDate || !draft?.checkOutDate) {
      updateDraft(room._id, {
        availabilityMessage: "Please select check-in and check-out dates.",
        pricingMessage: "",
        canBook: false,
      });
      return;
    }

    const adults = Number(draft.adultsCount || 0);
    const kids = Number(draft.kidsCount || 0);
    if (adults < 0 || kids < 0 || adults + kids < 1) {
      updateDraft(room._id, {
        availabilityMessage: "Enter at least one guest (adult or child under 14).",
        pricingMessage: "",
        canBook: false,
      });
      return;
    }

    try {
      updateDraft(room._id, { loadingAvailability: true, availabilityMessage: "", pricingMessage: "" });
      const res = await api.get(`/api/guest-house-bookings/public/availability/${room._id}`, {
        params: {
          checkInDate: draft.checkInDate,
          checkOutDate: draft.checkOutDate,
          roomsRequested: draft.roomsRequested || "1",
          adultsCount: draft.adultsCount || "0",
          kidsCount: draft.kidsCount || "0",
        },
      });
      const json = res.data;
      if (!json.success) throw new Error(json.message || "Failed to check availability");

      const data = json.data;
      const availabilityMessage = `${data.availableRooms} room(s) available for selected dates.`;
      const pricingMessage = `${data.roomsRequested} room(s) × ${data.nights} night(s) × ₹${Number(data.pricePerNight).toFixed(2)}/night = ₹${Number(data.totalPrice).toFixed(2)}`;
      updateDraft(room._id, {
        loadingAvailability: false,
        availabilityMessage,
        pricingMessage,
        canBook: Boolean(data.canBook),
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      updateDraft(room._id, {
        loadingAvailability: false,
        availabilityMessage: err.response?.data?.message || err.message || "Failed to check availability",
        pricingMessage: "",
        canBook: false,
      });
    }
  };

  const payAndBook = async (room: RoomType) => {
    const draft = roomBookingDrafts[room._id];
    if (!draft) return;
    if (!draft.checkInDate || !draft.checkOutDate) {
      return updateDraft(room._id, { availabilityMessage: "Please select check-in and check-out dates first." });
    }
    if (!draft.guestName.trim() || !draft.guestPhone.trim()) {
      return updateDraft(room._id, { availabilityMessage: "Guest name and phone are required." });
    }

    const adults = Number(draft.adultsCount || 0);
    const kids = Number(draft.kidsCount || 0);
    if (adults < 0 || kids < 0 || adults + kids < 1) {
      return updateDraft(room._id, {
        availabilityMessage: "Enter adults and children (under 14); at least one guest is required.",
      });
    }

    if (!draft.canBook) {
      return updateDraft(room._id, {
        availabilityMessage: "Check availability first and ensure rooms are available.",
      });
    }

    try {
      updateDraft(room._id, { loadingPay: true });
      await loadRazorpayScript();

      const orderRes = await api.post("/api/guest-house-bookings/public/create-payment-order", {
        roomId: room._id,
        checkInDate: draft.checkInDate,
        checkOutDate: draft.checkOutDate,
        roomsRequested: draft.roomsRequested || "1",
        adultsCount: adults,
        kidsCount: kids,
        guestName: draft.guestName.trim(),
        guestEmail: draft.guestEmail.trim(),
        guestPhone: draft.guestPhone.trim(),
      });

      const orderJson = orderRes.data;
      if (!orderJson.success) throw new Error(orderJson.message || "Could not start payment");

      const pay = orderJson.data;
      const RazorpayCtor = (window as unknown as { Razorpay?: new (opts: Record<string, unknown>) => { open: () => void } }).Razorpay;
      if (!RazorpayCtor) throw new Error("Razorpay failed to load");

      const options = {
        key: pay.keyId,
        amount: pay.amount,
        currency: pay.currency || "INR",
        order_id: pay.razorpayOrderId,
        name: "Guest house booking",
        description: `${room.roomName} — ${pay.nights} night(s)`,
        prefill: {
          name: draft.guestName.trim(),
          email: draft.guestEmail.trim() || undefined,
          contact: draft.guestPhone.trim(),
        },
        theme: { color: "#0f172a" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await api.post("/api/guest-house-bookings/public/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            const v = verifyRes.data;
            if (!v.success) throw new Error(v.message || "Verification failed");
            const bid = v.data?.bookingId ? String(v.data.bookingId) : "";
            if (bid && typeof window !== "undefined") {
              sessionStorage.setItem(LAST_BOOKING_STORAGE_KEY, bid);
            }
            alert(
              `Booking confirmed. Paid ₹${Number(v.data?.totalPrice ?? 0).toFixed(2)}.\nBooking id: ${bid}\nSave this id — use it with your phone on “Look up room assignment” below once your room is assigned.`
            );
            updateDraft(room._id, {
              loadingPay: false,
              availabilityMessage: "Booking confirmed. Thank you!",
              canBook: false,
            });
            await checkAvailability(room);
          } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } }; message?: string };
            alert(err.response?.data?.message || err.message || "Payment verification failed");
            updateDraft(room._id, { loadingPay: false });
          }
        },
        modal: {
          ondismiss: () => {
            updateDraft(room._id, { loadingPay: false });
          },
        },
      };

      const rzp = new RazorpayCtor(options);
      rzp.open();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      updateDraft(room._id, {
        loadingPay: false,
        availabilityMessage: err.response?.data?.message || err.message || "Could not start payment",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Browse guest houses, pick dates, add guests, and pay securely with Razorpay.
          </p>
        </div>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Look up room assignment</h2>
          <p className="mt-1 text-sm text-slate-600">
            After the guest house assigns your room, enter the booking id from your confirmation and the phone number you used when paying.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-[200px] flex-1">
              <label className="mb-0.5 block text-xs font-medium text-slate-600" htmlFor="lookup-booking-id">
                Booking id
              </label>
              <input
                id="lookup-booking-id"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="Paste booking id from confirmation"
                value={lookupBookingId}
                onChange={(e) => setLookupBookingId(e.target.value)}
              />
            </div>
            <div className="min-w-[180px] flex-1">
              <label className="mb-0.5 block text-xs font-medium text-slate-600" htmlFor="lookup-phone">
                Phone (same as booking)
              </label>
              <input
                id="lookup-phone"
                type="tel"
                autoComplete="tel"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="e.g. 9876543210"
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => void runBookingLookup()}
              disabled={lookupLoading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {lookupLoading ? "Checking…" : "Check booking"}
            </button>
          </div>
          {lookupError ? (
            <p className="mt-3 text-sm text-red-600">{lookupError}</p>
          ) : null}
          {lookupResult ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <p className="font-semibold text-slate-900">{lookupResult.guestName}</p>
              <p className="mt-1 text-slate-600">
                {lookupResult.guestHouseName ? `${lookupResult.guestHouseName} · ` : null}
                {lookupResult.roomTypeName || "Room"}
              </p>
              <p className="mt-2 text-slate-700">
                Check-in: {new Date(lookupResult.checkInDate).toLocaleDateString()} · Check-out:{" "}
                {new Date(lookupResult.checkOutDate).toLocaleDateString()}
              </p>
              <p className="mt-3 text-base font-semibold text-slate-900">
                Assigned room(s):{" "}
                {lookupResult.assignedRoomNumbers?.trim()
                  ? lookupResult.assignedRoomNumbers
                  : "Not assigned yet — check back later."}
              </p>
            </div>
          ) : null}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Available Guest Houses</h2>
            {loadingGuestHouses ? (
              <p className="mt-3 text-sm text-slate-500">Loading guest houses...</p>
            ) : guestHouses.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No guest houses available right now.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {guestHouses.map((house) => (
                  <button
                    key={house._id}
                    type="button"
                    onClick={() => void selectGuestHouse(house)}
                    className={`w-full rounded-xl border p-4 text-left transition hover:bg-slate-50 ${
                      selectedGuestHouse?._id === house._id ? "border-slate-900" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {house.coverImage || house.images?.[0] ? (
                        <img
                          src={house.coverImage || house.images?.[0]}
                          alt={house.name}
                          className="h-16 w-20 rounded-md object-cover"
                        />
                      ) : null}
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{house.name}</p>
                        <p className="mt-1 text-xs text-slate-600">
                          Rooms: {house.totalRooms} | Location: {house.location}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              {selectedGuestHouse ? `Room Types - ${selectedGuestHouse.name}` : "Room Types"}
            </h2>

            {!selectedGuestHouse ? (
              <p className="mt-3 text-sm text-slate-500">Select a guest house to view room types.</p>
            ) : loadingRooms ? (
              <p className="mt-3 text-sm text-slate-500">Loading room types...</p>
            ) : rooms.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No room types configured yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {selectedGuestHouse.coverImage || selectedGuestHouse.images?.[0] ? (
                  <img
                    src={selectedGuestHouse.coverImage || selectedGuestHouse.images?.[0]}
                    alt={selectedGuestHouse.name}
                    className="h-44 w-full rounded-xl object-cover"
                  />
                ) : null}
                {rooms.map((room) => (
                  <div key={room._id} className="rounded-xl border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{room.roomName}</p>
                        <p className="text-xs text-slate-600">
                          Units of this type: {room.roomCount} | ₹{Number(room.price || 0).toFixed(2)} / night
                        </p>
                      </div>
                      {room.coverImage ? (
                        <img
                          src={room.coverImage}
                          alt={room.roomName}
                          className="h-16 w-20 rounded-md object-cover"
                        />
                      ) : null}
                    </div>
                    {room.services?.length ? (
                      <p className="mt-2 text-xs text-slate-600">Services: {room.services.join(", ")}</p>
                    ) : null}

                    <p className="mt-2 text-[11px] text-slate-500">
                      Fill dates first, then guest counts. Children = age under 14. “Rooms” = how many units of this room type.
                    </p>

                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">Stay dates</p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div>
                            <label className="mb-0.5 block text-[11px] text-slate-600" htmlFor={`checkin-${room._id}`}>
                              Check-in (first night)
                            </label>
                            <input
                              id={`checkin-${room._id}`}
                              type="date"
                              title="First night of your stay"
                              aria-label="Check-in date"
                              className="w-full rounded-md border px-2 py-1.5 text-xs"
                              value={roomBookingDrafts[room._id]?.checkInDate || ""}
                              onChange={(e) => updateDraft(room._id, { checkInDate: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="mb-0.5 block text-[11px] text-slate-600" htmlFor={`checkout-${room._id}`}>
                              Check-out (morning you leave)
                            </label>
                            <input
                              id={`checkout-${room._id}`}
                              type="date"
                              title="Morning you leave (not charged as a night)"
                              aria-label="Check-out date"
                              className="w-full rounded-md border px-2 py-1.5 text-xs"
                              value={roomBookingDrafts[room._id]?.checkOutDate || ""}
                              onChange={(e) => updateDraft(room._id, { checkOutDate: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">Rooms & guests</p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <div>
                            <label className="mb-0.5 block text-[11px] text-slate-600" htmlFor={`rooms-${room._id}`}>
                              Rooms (this type)
                            </label>
                            <input
                              id={`rooms-${room._id}`}
                              type="number"
                              min={1}
                              placeholder="e.g. 1"
                              title="Number of rooms of this room type"
                              aria-label="Number of rooms to book"
                              className="w-full rounded-md border px-2 py-1.5 text-xs"
                              value={roomBookingDrafts[room._id]?.roomsRequested || "1"}
                              onChange={(e) => updateDraft(room._id, { roomsRequested: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="mb-0.5 block text-[11px] text-slate-600" htmlFor={`adults-${room._id}`}>
                              Adults
                            </label>
                            <input
                              id={`adults-${room._id}`}
                              type="number"
                              min={0}
                              placeholder="e.g. 2"
                              title="Guests aged 14 or older"
                              aria-label="Number of adults"
                              className="w-full rounded-md border px-2 py-1.5 text-xs"
                              value={roomBookingDrafts[room._id]?.adultsCount ?? "1"}
                              onChange={(e) => updateDraft(room._id, { adultsCount: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="mb-0.5 block text-[11px] text-slate-600" htmlFor={`kids-${room._id}`}>
                              Kids (under 14)
                            </label>
                            <input
                              id={`kids-${room._id}`}
                              type="number"
                              min={0}
                              placeholder="e.g. 0"
                              title="Children under 14 years old"
                              aria-label="Number of children under 14"
                              className="w-full rounded-md border px-2 py-1.5 text-xs"
                              value={roomBookingDrafts[room._id]?.kidsCount ?? "0"}
                              onChange={(e) => updateDraft(room._id, { kidsCount: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">Lead guest / contact</p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <div>
                            <label className="mb-0.5 block text-[11px] text-slate-600" htmlFor={`name-${room._id}`}>
                              Full name
                            </label>
                            <input
                              id={`name-${room._id}`}
                              type="text"
                              placeholder="e.g. Priya Sharma"
                              title="Primary guest name for this booking"
                              aria-label="Full name"
                              autoComplete="name"
                              className="w-full rounded-md border px-2 py-1.5 text-xs"
                              value={roomBookingDrafts[room._id]?.guestName || ""}
                              onChange={(e) => updateDraft(room._id, { guestName: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="mb-0.5 block text-[11px] text-slate-600" htmlFor={`email-${room._id}`}>
                              Email (optional)
                            </label>
                            <input
                              id={`email-${room._id}`}
                              type="email"
                              placeholder="e.g. you@email.com"
                              title="For booking confirmation"
                              aria-label="Email address optional"
                              autoComplete="email"
                              className="w-full rounded-md border px-2 py-1.5 text-xs"
                              value={roomBookingDrafts[room._id]?.guestEmail || ""}
                              onChange={(e) => updateDraft(room._id, { guestEmail: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="mb-0.5 block text-[11px] text-slate-600" htmlFor={`phone-${room._id}`}>
                              Phone (required)
                            </label>
                            <input
                              id={`phone-${room._id}`}
                              type="tel"
                              placeholder="e.g. 9876543210"
                              title="Mobile number for contact"
                              aria-label="Phone number"
                              autoComplete="tel"
                              className="w-full rounded-md border px-2 py-1.5 text-xs"
                              value={roomBookingDrafts[room._id]?.guestPhone || ""}
                              onChange={(e) => updateDraft(room._id, { guestPhone: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded bg-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-300"
                        disabled={roomBookingDrafts[room._id]?.loadingAvailability}
                        onClick={() => void checkAvailability(room)}
                      >
                        {roomBookingDrafts[room._id]?.loadingAvailability ? "Checking..." : "Check availability & price"}
                      </button>
                      <button
                        type="button"
                        className="rounded bg-slate-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
                        disabled={
                          !roomBookingDrafts[room._id]?.canBook ||
                          roomBookingDrafts[room._id]?.loadingPay ||
                          roomBookingDrafts[room._id]?.loadingAvailability
                        }
                        onClick={() => void payAndBook(room)}
                      >
                        {roomBookingDrafts[room._id]?.loadingPay ? "Opening payment..." : "Pay & book (Razorpay)"}
                      </button>
                    </div>

                    {roomBookingDrafts[room._id]?.availabilityMessage ? (
                      <p className="mt-2 text-xs text-slate-700">{roomBookingDrafts[room._id]?.availabilityMessage}</p>
                    ) : null}
                    {roomBookingDrafts[room._id]?.pricingMessage ? (
                      <p className="mt-1 text-xs font-medium text-slate-900">{roomBookingDrafts[room._id]?.pricingMessage}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
