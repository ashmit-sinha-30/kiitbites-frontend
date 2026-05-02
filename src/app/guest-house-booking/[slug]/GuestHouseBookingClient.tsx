"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect } from "react";
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
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  loadingAvailability: boolean;
  loadingBooking: boolean;
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

export default function GuestHouseBookingClient() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const cid = searchParams.get("cid") || "";
  const slug = params?.slug || "";

  const [loadingGuestHouses, setLoadingGuestHouses] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [guestHouses, setGuestHouses] = useState<GuestHouse[]>([]);
  const [selectedGuestHouse, setSelectedGuestHouse] = useState<GuestHouse | null>(null);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [roomBookingDrafts, setRoomBookingDrafts] = useState<Record<string, RoomBookingDraft>>({});

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
          drafts[room._id] = {
            checkInDate: "",
            checkOutDate: "",
            roomsRequested: "1",
            guestName: "",
            guestEmail: "",
            guestPhone: "",
            loadingAvailability: false,
            loadingBooking: false,
            availabilityMessage: "",
            pricingMessage: "",
            canBook: false,
          };
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

    try {
      updateDraft(room._id, { loadingAvailability: true, availabilityMessage: "", pricingMessage: "" });
      const res = await api.get(`/api/guest-house-bookings/public/availability/${room._id}`, {
        params: {
          checkInDate: draft.checkInDate,
          checkOutDate: draft.checkOutDate,
          roomsRequested: draft.roomsRequested || "1",
        },
      });
      const json = res.data;
      if (!json.success) throw new Error(json.message || "Failed to check availability");

      const data = json.data;
      const availabilityMessage = `${data.availableRooms} room(s) available for selected dates.`;
      const pricingMessage = `${data.roomsRequested} room(s) x ${data.nights} night(s) x ₹${Number(data.pricePerNight).toFixed(2)} = ₹${Number(data.totalPrice).toFixed(2)}`;
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

  const bookRoom = async (room: RoomType) => {
    const draft = roomBookingDrafts[room._id];
    if (!draft) return;
    if (!draft.checkInDate || !draft.checkOutDate) {
      return updateDraft(room._id, { availabilityMessage: "Please select check-in/check-out dates first." });
    }
    if (!draft.guestName.trim() || !draft.guestPhone.trim()) {
      return updateDraft(room._id, { availabilityMessage: "Guest name and phone are required for booking." });
    }

    try {
      updateDraft(room._id, { loadingBooking: true });
      const res = await api.post("/api/guest-house-bookings/public/book", {
        roomId: room._id,
        checkInDate: draft.checkInDate,
        checkOutDate: draft.checkOutDate,
        roomsRequested: draft.roomsRequested || "1",
        guestName: draft.guestName.trim(),
        guestEmail: draft.guestEmail.trim(),
        guestPhone: draft.guestPhone.trim(),
      });
      const json = res.data;
      if (!json.success) throw new Error(json.message || "Failed to book room");

      alert(`Booking submitted. Total price: ₹${Number(json.data?.totalPrice || 0).toFixed(2)}`);
      updateDraft(room._id, {
        loadingBooking: false,
        availabilityMessage: "Booking request submitted successfully.",
        canBook: false,
      });
      await checkAvailability(room);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      updateDraft(room._id, {
        loadingBooking: false,
        availabilityMessage: err.response?.data?.message || err.message || "Failed to create booking",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Browse available guest houses and view room types.
          </p>
        </div>

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
                      {(house.coverImage || house.images?.[0]) ? (
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
                {(selectedGuestHouse.coverImage || selectedGuestHouse.images?.[0]) ? (
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
                          Available units: {room.roomCount} | Price: ₹{Number(room.price || 0).toFixed(2)} / night
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

                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                      <input
                        type="date"
                        className="rounded-md border px-2 py-1 text-xs"
                        value={roomBookingDrafts[room._id]?.checkInDate || ""}
                        onChange={(e) => updateDraft(room._id, { checkInDate: e.target.value })}
                      />
                      <input
                        type="date"
                        className="rounded-md border px-2 py-1 text-xs"
                        value={roomBookingDrafts[room._id]?.checkOutDate || ""}
                        onChange={(e) => updateDraft(room._id, { checkOutDate: e.target.value })}
                      />
                      <input
                        type="number"
                        min={1}
                        className="rounded-md border px-2 py-1 text-xs"
                        placeholder="Rooms needed"
                        value={roomBookingDrafts[room._id]?.roomsRequested || "1"}
                        onChange={(e) => updateDraft(room._id, { roomsRequested: e.target.value })}
                      />
                      <input
                        type="text"
                        className="rounded-md border px-2 py-1 text-xs md:col-span-1"
                        placeholder="Your name *"
                        value={roomBookingDrafts[room._id]?.guestName || ""}
                        onChange={(e) => updateDraft(room._id, { guestName: e.target.value })}
                      />
                      <input
                        type="email"
                        className="rounded-md border px-2 py-1 text-xs md:col-span-1"
                        placeholder="Your email (optional)"
                        value={roomBookingDrafts[room._id]?.guestEmail || ""}
                        onChange={(e) => updateDraft(room._id, { guestEmail: e.target.value })}
                      />
                      <input
                        type="text"
                        className="rounded-md border px-2 py-1 text-xs md:col-span-1"
                        placeholder="Your phone *"
                        value={roomBookingDrafts[room._id]?.guestPhone || ""}
                        onChange={(e) => updateDraft(room._id, { guestPhone: e.target.value })}
                      />
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded bg-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-300"
                        disabled={roomBookingDrafts[room._id]?.loadingAvailability}
                        onClick={() => void checkAvailability(room)}
                      >
                        {roomBookingDrafts[room._id]?.loadingAvailability ? "Checking..." : "Check Availability"}
                      </button>
                      <button
                        type="button"
                        className="rounded bg-slate-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
                        disabled={!roomBookingDrafts[room._id]?.canBook || roomBookingDrafts[room._id]?.loadingBooking}
                        onClick={() => void bookRoom(room)}
                      >
                        {roomBookingDrafts[room._id]?.loadingBooking ? "Booking..." : "Book Now"}
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

