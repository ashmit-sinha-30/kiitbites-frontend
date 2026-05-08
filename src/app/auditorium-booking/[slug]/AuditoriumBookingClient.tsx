"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import api from "@/utils/apiUtils";

interface Auditorium {
  _id: string;
  name: string;
  sittingSpace: number;
  pricePerDay?: number;
  location: string;
  contactNumber?: string;
  description?: string;
  amenities?: string[];
  rules?: string;
  coverImage?: string;
  additionalImages?: string[];
}

export default function AuditoriumBookingClient() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const cid = searchParams.get("cid") || "";
  const slug = params?.slug || "";

  const [auditoriums, setAuditoriums] = useState<Auditorium[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    eventName: "",
    attendeeCount: "",
    bookedByName: "",
    bookedByEmail: "",
    bookedByPhone: "",
    notes: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = async () => {
    if (typeof window === "undefined") return;
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) return;
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay"));
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    const load = async () => {
      if (!cid) return;
      try {
        const res = await api.get(`/api/auditoriums/public/${cid}`);
        setAuditoriums(res.data?.data || []);
      } catch {
        setAuditoriums([]);
      }
    };
    void load();
  }, [cid]);

  const pageTitle = useMemo(() => `Auditorium Booking - ${slug || "Campus"}`, [slug]);
  const selected = auditoriums.find((a) => a._id === selectedId);

  const checkAndBook = async () => {
    if (!selectedId) return setMessage("Select an auditorium first.");
    try {
      setLoading(true);
      setMessage("");
      const availRes = await api.get(`/api/auditorium-bookings/public/availability/${selectedId}`, {
        params: {
          startDate: form.startDate,
          endDate: form.endDate,
          attendeeCount: form.attendeeCount,
        },
      });
      const avail = availRes.data?.data;
      if (!availRes.data?.success || !avail?.canBook) {
        return setMessage("Selected dates are unavailable or attendee count exceeds capacity.");
      }

      const orderRes = await api.post("/api/auditorium-bookings/public/create-payment-order", {
        auditoriumId: selectedId,
        ...form,
      });
      if (!orderRes.data?.success) throw new Error(orderRes.data?.message || "Could not start payment");
      await loadRazorpayScript();
      const pay = orderRes.data?.data || {};
      const RazorpayCtor = (window as unknown as { Razorpay?: new (opts: Record<string, unknown>) => { open: () => void } }).Razorpay;
      if (!RazorpayCtor) throw new Error("Razorpay failed to load");

      const options = {
        key: pay.keyId,
        amount: pay.amount,
        currency: pay.currency || "INR",
        order_id: pay.razorpayOrderId,
        name: "Auditorium booking",
        description: `${selected?.name || "Auditorium"} - ${pay.totalDays || 0} day(s)`,
        prefill: {
          name: form.bookedByName.trim(),
          email: form.bookedByEmail.trim() || undefined,
          contact: form.bookedByPhone.trim(),
        },
        theme: { color: "#0f172a" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await api.post("/api/auditorium-bookings/public/verify-payment", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          if (!verifyRes.data?.success) throw new Error(verifyRes.data?.message || "Payment verification failed");
          setMessage(
            `Booking confirmed. Paid ₹${Number(verifyRes.data?.data?.totalPrice || 0).toFixed(2)}.`
          );
        },
      };

      const rzp = new RazorpayCtor(options);
      rzp.open();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      setMessage(err.response?.data?.message || err.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7fbfa] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-[#d8ece8] bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
          <p className="mt-1 text-sm text-slate-600">Choose an auditorium and book it for your event dates.</p>
        </div>

        <div className="rounded-3xl border border-[#d8ece8] bg-white p-6 shadow-sm">
          <label className="mb-2 block text-sm font-semibold text-[#2f6f66]">Select Auditorium</label>
          {auditoriums.length === 0 ? (
            <p className="text-sm text-slate-600">
              No auditoriums are available for your university right now.
            </p>
          ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {auditoriums.map((a) => (
              <button
                key={a._id}
                type="button"
                onClick={() => setSelectedId(a._id)}
                className={`rounded-xl border p-3 text-left transition ${selectedId === a._id ? "border-[#4ea199] bg-[#f3fbf9]" : "border-slate-200 hover:border-[#9ad0c8]"}`}
              >
                {a.coverImage ? (
                  <img
                    src={a.coverImage}
                    alt={a.name}
                    className="mb-2 h-32 w-full rounded object-cover"
                  />
                ) : null}
                <p className="font-semibold text-slate-900">{a.name}</p>
                <p className="text-xs text-slate-600">Capacity: {a.sittingSpace} | {a.location}</p>
                <p className="mt-1 text-xs text-slate-600">
                  Price per day: ₹{Number(a.pricePerDay || 0).toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Contact: {a.contactNumber || "Not provided"}
                </p>
                {a.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">{a.description}</p>
                ) : null}
              </button>
            ))}
          </div>
          )}
        </div>

        {selected && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Book {selected.name}</h2>
            <div className="mt-2 rounded-xl border border-[#d8ece8] bg-[#f7fbfa] p-3 text-sm text-slate-700">
              <p><span className="font-medium">Location:</span> {selected.location}</p>
              <p><span className="font-medium">Capacity:</span> {selected.sittingSpace}</p>
              <p><span className="font-medium">Price per day:</span> ₹{Number(selected.pricePerDay || 0).toFixed(2)}</p>
              <p><span className="font-medium">Contact:</span> {selected.contactNumber || "Not provided"}</p>
              {selected.amenities && selected.amenities.length > 0 ? (
                <p><span className="font-medium">Amenities:</span> {selected.amenities.join(", ")}</p>
              ) : null}
              {selected.rules ? (
                <p><span className="font-medium">Rules:</span> {selected.rules}</p>
              ) : null}
              {selected.description ? (
                <p><span className="font-medium">Description:</span> {selected.description}</p>
              ) : null}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <input className="rounded-lg border border-[#cce5e0] px-3 py-2 text-sm outline-none focus:border-[#4ea199]" type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
              <input className="rounded-lg border border-[#cce5e0] px-3 py-2 text-sm outline-none focus:border-[#4ea199]" type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} />
              <input className="rounded-lg border border-[#cce5e0] px-3 py-2 text-sm outline-none focus:border-[#4ea199]" placeholder="Event name" value={form.eventName} onChange={(e) => setForm((p) => ({ ...p, eventName: e.target.value }))} />
              <input className="rounded-lg border border-[#cce5e0] px-3 py-2 text-sm outline-none focus:border-[#4ea199]" type="number" min={1} placeholder="Expected attendees" value={form.attendeeCount} onChange={(e) => setForm((p) => ({ ...p, attendeeCount: e.target.value }))} />
              <input className="rounded-lg border border-[#cce5e0] px-3 py-2 text-sm outline-none focus:border-[#4ea199]" placeholder="Your full name" value={form.bookedByName} onChange={(e) => setForm((p) => ({ ...p, bookedByName: e.target.value }))} />
              <input className="rounded-lg border border-[#cce5e0] px-3 py-2 text-sm outline-none focus:border-[#4ea199]" placeholder="Phone number" value={form.bookedByPhone} onChange={(e) => setForm((p) => ({ ...p, bookedByPhone: e.target.value }))} />
              <input className="md:col-span-2 rounded-lg border border-[#cce5e0] px-3 py-2 text-sm outline-none focus:border-[#4ea199]" type="email" placeholder="Email (optional)" value={form.bookedByEmail} onChange={(e) => setForm((p) => ({ ...p, bookedByEmail: e.target.value }))} />
              <textarea className="md:col-span-2 rounded-lg border border-[#cce5e0] px-3 py-2 text-sm outline-none focus:border-[#4ea199]" rows={3} placeholder="Additional notes (optional)" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button disabled={loading} onClick={() => void checkAndBook()} className="rounded-lg bg-[#4ea199] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#3e8e86] disabled:opacity-60">
                {loading ? "Booking..." : "Check Availability & Book"}
              </button>
              {message ? <p className="text-sm text-slate-700">{message}</p> : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
