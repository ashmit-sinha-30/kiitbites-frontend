"use client";

import { useEffect, useState } from "react";
import api from "@/utils/apiUtils";

type RoomType = { _id: string; roomName: string };
type RateRule = {
  _id: string;
  startDate: string;
  endDate: string;
  overridePricePerNight: number | null;
  isBlackout: boolean;
  minNights: number;
};

export default function YieldRulesManager() {
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [roomId, setRoomId] = useState("");
  const [rules, setRules] = useState<RateRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    overridePricePerNight: "",
    isBlackout: false,
    minNights: "1",
    notes: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/guest-house-bookings/manager/room-types");
        const list = res.data?.data || [];
        setRooms(list);
        if (list[0]?._id) setRoomId(list[0]._id);
      } catch {
        setRooms([]);
      }
    })();
  }, []);

  const loadRules = async (rid = roomId) => {
    if (!rid) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/guest-house-bookings/manager/rate-rules?roomId=${rid}`);
      setRules(res.data?.data || []);
    } catch {
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRules();
  }, [roomId]);

  const create = async () => {
    try {
      await api.post("/api/guest-house-bookings/manager/rate-rules", {
        roomId,
        ...form,
        overridePricePerNight: form.overridePricePerNight === "" ? null : Number(form.overridePricePerNight),
      });
      await loadRules();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      alert(err.response?.data?.message || err.message || "Failed to create rule");
    }
  };

  return (
    <div className="space-y-4 rounded-xl border bg-white p-4">
      <h2 className="text-lg font-semibold text-gray-900">Dynamic Pricing & Blackout Rules</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block">Room type</span>
          <select className="w-full rounded border px-3 py-2" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            {rooms.map((r) => (
              <option key={r._id} value={r._id}>
                {r.roomName}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block">Start date</span>
          <input type="date" className="w-full rounded border px-3 py-2" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block">End date</span>
          <input type="date" className="w-full rounded border px-3 py-2" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block">Override price/night</span>
          <input type="number" min={0} className="w-full rounded border px-3 py-2" value={form.overridePricePerNight} onChange={(e) => setForm((p) => ({ ...p, overridePricePerNight: e.target.value }))} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block">Minimum nights</span>
          <input type="number" min={1} className="w-full rounded border px-3 py-2" value={form.minNights} onChange={(e) => setForm((p) => ({ ...p, minNights: e.target.value }))} />
        </label>
        <label className="inline-flex items-center gap-2 text-sm pt-7">
          <input type="checkbox" checked={form.isBlackout} onChange={(e) => setForm((p) => ({ ...p, isBlackout: e.target.checked }))} />
          Blackout period
        </label>
      </div>
      <button onClick={() => void create()} className="rounded bg-gray-900 px-4 py-2 text-sm text-white">
        Create rule
      </button>
      <div>
        <h3 className="text-sm font-semibold text-gray-800">Existing rules</h3>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {rules.map((r) => (
              <li key={r._id} className="rounded border px-2 py-1">
                {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()} |{" "}
                {r.isBlackout ? "Blackout" : `Override ₹${r.overridePricePerNight ?? "-"}`} | Min {r.minNights} nights
              </li>
            ))}
            {rules.length === 0 ? <li className="text-gray-500">No rules found.</li> : null}
          </ul>
        )}
      </div>
    </div>
  );
}
