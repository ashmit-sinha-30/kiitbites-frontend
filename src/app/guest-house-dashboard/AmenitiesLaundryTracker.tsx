"use client";

import { useMemo, useState } from "react";
import api from "@/utils/apiUtils";

type Entry = {
  physicalRoomId: string;
  itemName: string;
  openingInRoom: number;
  openingInLaundry: number;
  takenOutOfRoom: number;
  sentToLaundry: number;
  washedAndDried: number;
  returnedToRoom: number;
  placedInRoom: number;
  notes: string;
  estimatedCurrentInRoom: number;
  estimatedCurrentInLaundry: number;
};

type RoomRow = {
  physicalRoomId: string;
  unitLabel: string;
  floor: number;
  entries: Entry[];
};

type TrackerResponse = {
  date: string;
  rooms: RoomRow[];
};

const todayDateInput = () => new Date().toISOString().slice(0, 10);

export default function AmenitiesLaundryTracker() {
  const [date, setDate] = useState(todayDateInput());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [error, setError] = useState("");

  const flatRows = useMemo(
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

  const load = async (selectedDate: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/api/guest-house-bookings/manager/amenities-tracker?date=${selectedDate}`);
      const data: TrackerResponse | undefined = res.data?.data;
      setRooms(data?.rooms || []);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Failed to load amenities tracker");
    } finally {
      setLoading(false);
    }
  };

  const updateCell = (roomId: string, itemName: string, field: keyof Entry, value: string) => {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.physicalRoomId !== roomId) return room;
        return {
          ...room,
          entries: room.entries.map((entry) => {
            if (entry.itemName !== itemName) return entry;
            if (field === "notes") return { ...entry, notes: value };
            const num = Number(value);
            return { ...entry, [field]: Number.isFinite(num) && num >= 0 ? num : 0 };
          }),
        };
      })
    );
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const updates = flatRows.map((row) => ({
        physicalRoomId: row.physicalRoomId,
        itemName: row.itemName,
        openingInRoom: row.openingInRoom,
        openingInLaundry: row.openingInLaundry,
        takenOutOfRoom: row.takenOutOfRoom,
        sentToLaundry: row.sentToLaundry,
        washedAndDried: row.washedAndDried,
        returnedToRoom: row.returnedToRoom,
        placedInRoom: row.placedInRoom,
        notes: row.notes,
      }));
      await api.patch(`/api/guest-house-bookings/manager/amenities-tracker?date=${date}`, { updates });
      await load(date);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Failed to save amenities tracker");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-gray-900">Amenities & Laundry Tracker</h2>
        <p className="mt-1 text-sm text-gray-600">
          Update daily room-wise movement of toiletries, bedsheets, blankets and other amenities.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-gray-700">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <button onClick={() => void load(date)} className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white">
            {loading ? "Loading..." : "Load"}
          </button>
          <button
            onClick={() => void save()}
            disabled={saving || loading || flatRows.length === 0}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Updates"}
          </button>
        </div>
        {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-600">
              <th className="p-2">Room</th>
              <th className="p-2">Item</th>
              <th className="p-2">Open Room</th>
              <th className="p-2">Open Laundry</th>
              <th className="p-2">Out of Room</th>
              <th className="p-2">Sent Laundry</th>
              <th className="p-2">Washed+Dried</th>
              <th className="p-2">Returned Room</th>
              <th className="p-2">Placed Room</th>
              <th className="p-2">Now in Room</th>
              <th className="p-2">Now in Laundry</th>
              <th className="p-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {flatRows.map((row) => (
              <tr key={`${row.physicalRoomId}-${row.itemName}`} className="border-t">
                <td className="p-2">{row.roomLabel}</td>
                <td className="p-2">{row.itemName}</td>
                {(
                  [
                    "openingInRoom",
                    "openingInLaundry",
                    "takenOutOfRoom",
                    "sentToLaundry",
                    "washedAndDried",
                    "returnedToRoom",
                    "placedInRoom",
                  ] as Array<keyof Entry>
                ).map((field) => (
                  <td key={field} className="p-2">
                    <input
                      type="number"
                      min={0}
                      value={row[field] as number}
                      onChange={(e) => updateCell(row.physicalRoomId, row.itemName, field, e.target.value)}
                      className="w-24 rounded border border-gray-300 px-2 py-1"
                    />
                  </td>
                ))}
                <td className="p-2 font-medium">{Math.max(0, row.estimatedCurrentInRoom)}</td>
                <td className="p-2 font-medium">{Math.max(0, row.estimatedCurrentInLaundry)}</td>
                <td className="p-2">
                  <input
                    value={row.notes}
                    onChange={(e) => updateCell(row.physicalRoomId, row.itemName, "notes", e.target.value)}
                    className="w-48 rounded border border-gray-300 px-2 py-1"
                  />
                </td>
              </tr>
            ))}
            {!loading && flatRows.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-4 text-center text-gray-500">
                  No tracker data loaded. Choose a date and click Load.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
