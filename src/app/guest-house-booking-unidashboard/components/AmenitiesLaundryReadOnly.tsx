"use client";

import { useMemo, useState } from "react";
import api from "@/utils/apiUtils";

type GuestHouseLite = { _id: string; name: string };
type Entry = {
  itemName: string;
  estimatedCurrentInRoom: number;
  estimatedCurrentInLaundry: number;
  sentToLaundry: number;
  washedAndDried: number;
};
type Room = { unitLabel: string; floor: number; entries: Entry[] };

const todayDateInput = () => new Date().toISOString().slice(0, 10);

export default function AmenitiesLaundryReadOnly({ guestHouses }: { guestHouses: GuestHouseLite[] }) {
  const [guestHouseId, setGuestHouseId] = useState(guestHouses[0]?._id || "");
  const [date, setDate] = useState(todayDateInput());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const rows = useMemo(
    () =>
      rooms.flatMap((room) =>
        room.entries.map((entry) => ({
          roomLabel: room.unitLabel,
          floor: room.floor,
          ...entry,
        }))
      ),
    [rooms]
  );

  const load = async () => {
    if (!guestHouseId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/api/guest-house/${guestHouseId}/amenities-tracker?date=${date}`);
      setRooms(res.data?.data?.rooms || []);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Failed to load tracker");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Amenities & Laundry (Read Only)</h2>
      <p className="mt-1 text-sm text-slate-600">
        University can review room-wise linen/amenities usage and laundry movement for each guest house.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">Guest House</span>
          <select
            value={guestHouseId}
            onChange={(e) => setGuestHouseId(e.target.value)}
            className="rounded-md border px-3 py-2"
          >
            {guestHouses.map((gh) => (
              <option key={gh._id} value={gh._id}>
                {gh.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-md border px-3 py-2" />
        </label>
        <button onClick={() => void load()} className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white">
          {loading ? "Loading..." : "Load"}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[820px] w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2 pr-3">Room</th>
              <th className="py-2 pr-3">Item</th>
              <th className="py-2 pr-3">Now in Room</th>
              <th className="py-2 pr-3">Now in Laundry</th>
              <th className="py-2 pr-3">Sent to Laundry</th>
              <th className="py-2">Washed & Dried</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.roomLabel}-${row.itemName}`} className="border-b last:border-b-0">
                <td className="py-2 pr-3">{row.roomLabel}</td>
                <td className="py-2 pr-3">{row.itemName}</td>
                <td className="py-2 pr-3">{Math.max(0, row.estimatedCurrentInRoom)}</td>
                <td className="py-2 pr-3">{Math.max(0, row.estimatedCurrentInLaundry)}</td>
                <td className="py-2 pr-3">{row.sentToLaundry}</td>
                <td className="py-2">{row.washedAndDried}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-3 text-center text-slate-500">
                  No data loaded yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
