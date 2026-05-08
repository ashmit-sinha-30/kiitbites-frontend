"use client";

import { useState } from "react";
import api from "@/utils/apiUtils";

type Props = {
  bookingId: string;
  guestPhone: string;
  allowFood?: boolean;
  allowServiceRequests?: boolean;
  foodMenuNote?: string;
};

type ServiceRequest = {
  _id: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  createdAt: string;
};

export default function GuestServiceRequestsPanel({
  bookingId,
  guestPhone,
  allowFood = false,
  allowServiceRequests = true,
  foodMenuNote = "",
}: Props) {
  const [rows, setRows] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    category: "housekeeping",
    priority: "medium",
    description: "",
  });

  const load = async () => {
    if (!bookingId || !guestPhone) return;
    setLoading(true);
    try {
      const res = await api.get("/api/guest-house-bookings/public/service-requests", {
        params: { bookingId, guestPhone },
      });
      setRows(res.data?.data || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    if (!bookingId || !guestPhone || !form.description.trim()) return;
    try {
      await api.post("/api/guest-house-bookings/public/service-requests", {
        bookingId,
        guestPhone,
        category: form.category,
        priority: form.priority,
        description: form.description,
      });
      setForm((p) => ({ ...p, description: "" }));
      await load();
      setMessage("Request submitted successfully.");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setMessage(err.response?.data?.message || err.message || "Could not create request");
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-[#d8ece8] bg-[#fcfefe] p-4">
      <h4 className="text-sm font-semibold text-slate-900">Need Help During Stay?</h4>
      <p className="mt-1 text-xs text-slate-600">Raise a request for housekeeping, maintenance, laundry, food, or transport.</p>
      {allowServiceRequests === false ? (
        <p className="mt-2 text-xs text-amber-700">This guest house has disabled service requests.</p>
      ) : null}
      {allowFood && foodMenuNote ? (
        <p className="mt-2 text-xs text-slate-700">In-room food info: {foodMenuNote}</p>
      ) : null}
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
        <select className="rounded border border-[#cce5e0] px-2 py-1 text-sm outline-none focus:border-[#4ea199]" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
          <option value="housekeeping">Housekeeping</option>
          <option value="laundry">Laundry</option>
          <option value="maintenance">Maintenance</option>
          {allowFood ? <option value="food">Food</option> : null}
          <option value="transport">Transport</option>
          <option value="other">Other</option>
        </select>
        <select className="rounded border border-[#cce5e0] px-2 py-1 text-sm outline-none focus:border-[#4ea199]" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <input
          className="rounded border border-[#cce5e0] px-2 py-1 text-sm outline-none focus:border-[#4ea199] md:col-span-2"
          placeholder="Describe your request..."
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        />
      </div>
      <div className="mt-2 flex gap-2">
        <button
          className="rounded bg-[#4ea199] px-3 py-1.5 text-xs text-white transition hover:bg-[#3e8e86] disabled:opacity-50"
          onClick={() => void create()}
          disabled={!allowServiceRequests}
        >
          Submit Request
        </button>
        <button className="rounded border border-[#cce5e0] px-3 py-1.5 text-xs text-[#2f6f66] hover:bg-[#f3fbf9]" onClick={() => void load()}>
          {loading ? "Loading..." : "Refresh Requests"}
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-slate-700">{message}</p> : null}
      {rows.length > 0 ? (
        <div className="mt-3 space-y-1">
          {rows.map((r) => (
            <div key={r._id} className="rounded border border-[#d8ece8] bg-white px-2 py-1 text-xs">
              {r.category} · {r.priority} · <span className="font-medium">{r.status}</span> · {r.description}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
