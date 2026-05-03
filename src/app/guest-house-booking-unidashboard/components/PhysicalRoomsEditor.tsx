"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/utils/apiUtils";

interface RoomTypeOption {
  _id: string;
  roomName: string;
}

interface PhysicalUnitRow {
  _id: string;
  floor: number;
  unitLabel: string;
  busyOnPreviewNight?: boolean;
  roomTypeId?: { roomName?: string };
}

interface SummaryFloor {
  floor: number;
  roomsOnFloor: number;
}

interface SummaryByType {
  roomName: string;
  count: number;
}

interface Props {
  guestHouseId: string;
  roomTypes: RoomTypeOption[];
  /** Bump when parent refreshes room types list */
  refreshToken?: number;
}

function todayLocalDateInput(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function PhysicalRoomsEditor({ guestHouseId, roomTypes, refreshToken = 0 }: Props) {
  const [previewDate, setPreviewDate] = useState(todayLocalDateInput);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<{
    totalUnits: number;
    floorCount: number;
    floors: SummaryFloor[];
    byRoomType: SummaryByType[];
    freeOnPreviewNight?: number;
    busyOnPreviewNight?: number;
  } | null>(null);
  const [units, setUnits] = useState<PhysicalUnitRow[]>([]);
  const [floorIn, setFloorIn] = useState("1");
  const [labelIn, setLabelIn] = useState("");
  const [roomTypeIdIn, setRoomTypeIdIn] = useState("");
  const [adding, setAdding] = useState(false);

  const activeRoomTypes = useMemo(() => roomTypes.filter(Boolean), [roomTypes]);

  useEffect(() => {
    const first = activeRoomTypes[0]?._id || "";
    setRoomTypeIdIn((prev) => {
      if (prev && activeRoomTypes.some((r) => r._id === prev)) return prev;
      return first;
    });
  }, [activeRoomTypes]);

  const loadPhysical = useCallback(async () => {
    if (!guestHouseId) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/guest-house/${guestHouseId}/physical-rooms`, {
        params: { asOfDate: previewDate },
      });
      const json = res.data;
      if (!json.success) throw new Error(json.message || "Failed to load");
      setSummary(json.data?.summary || null);
      setUnits(json.data?.units || []);
    } catch {
      setSummary(null);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, [guestHouseId, previewDate]);

  useEffect(() => {
    void loadPhysical();
  }, [loadPhysical, refreshToken]);

  const addUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestHouseId || !roomTypeIdIn || !labelIn.trim()) return;
    try {
      setAdding(true);
      const res = await api.post(`/api/guest-house/${guestHouseId}/physical-rooms`, {
        floor: Number(floorIn) || 0,
        unitLabel: labelIn.trim(),
        roomTypeId: roomTypeIdIn,
      });
      if (!res.data?.success) throw new Error(res.data?.message || "Failed to add");
      setLabelIn("");
      await loadPhysical();
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { message?: string } }; message?: string };
      alert(e2.response?.data?.message || e2.message || "Could not add unit");
    } finally {
      setAdding(false);
    }
  };

  const removeUnit = async (physicalRoomId: string) => {
    if (!window.confirm("Remove this physical unit from the map?")) return;
    try {
      const res = await api.delete(`/api/guest-house/physical-rooms/${physicalRoomId}`);
      if (!res.data?.success) throw new Error(res.data?.message || "Failed");
      await loadPhysical();
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { message?: string } }; message?: string };
      alert(e2.response?.data?.message || e2.message || "Could not remove");
    }
  };

  if (!guestHouseId) {
    return (
      <p className="text-sm text-slate-500">Select a guest house above to map floors and units.</p>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/80 p-5">
      <h3 className="text-base font-semibold text-slate-900">Floors &amp; physical units</h3>
      <p className="mt-1 text-sm text-slate-600">
        Link each real door (floor + label) to a room type above. Guest-house managers assign bookings to specific units for stay dates.
      </p>
      <p className="mt-2 rounded-lg bg-white/90 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
        <strong className="text-slate-800">Preview night</strong> is only a calendar date you pick to glance at occupancy.{" "}
        <strong className="text-slate-800">Free</strong> means no other booking has that unit saved as a{" "}
        <em>physical assignment</em> for a stay that overlaps that night. If staff only typed labels manually (without using “Pick units”), overlaps are not tracked here—so units often look{" "}
        <strong className="text-slate-800">Free</strong> until assignments use the unit picker.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="block min-w-[160px]">
          <span className="mb-1 block text-xs font-medium text-slate-600">Preview night (glance)</span>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            value={previewDate}
            onChange={(e) => setPreviewDate(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          onClick={() => void loadPhysical()}
        >
          Refresh map
        </button>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Loading inventory…</p>
      ) : summary ? (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <MiniStat label="Floors mapped" value={String(summary.floorCount)} />
            <MiniStat label="Physical units" value={String(summary.totalUnits)} />
            {summary.freeOnPreviewNight !== undefined ? (
              <MiniStat label="Free that night" value={String(summary.freeOnPreviewNight)} />
            ) : null}
            {summary.busyOnPreviewNight !== undefined ? (
              <MiniStat label="Busy that night" value={String(summary.busyOnPreviewNight)} />
            ) : null}
          </div>

          <div className="rounded-lg border border-white bg-white p-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Rooms per floor</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {summary.floors.length === 0 ? (
                <span className="text-sm text-slate-500">No units yet.</span>
              ) : (
                summary.floors.map((f) => (
                  <span
                    key={f.floor}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800"
                  >
                    Floor {f.floor}: {f.roomsOnFloor}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border border-white bg-white p-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Units by room type</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {summary.byRoomType.length === 0 ? (
                <span className="text-sm text-slate-500">Add room types first.</span>
              ) : (
                summary.byRoomType.map((t, i) => (
                  <span
                    key={`${t.roomName}-${i}`}
                    className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-900 ring-1 ring-indigo-100"
                  >
                    {t.roomName}: {t.count}
                  </span>
                ))
              )}
            </div>
          </div>

          <form onSubmit={addUnit} className="rounded-lg border border-dashed border-slate-300 bg-white p-4">
            <p className="text-sm font-medium text-slate-800">Add a physical unit</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
              <label className="block text-xs text-slate-600">
                Floor #
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                  value={floorIn}
                  onChange={(e) => setFloorIn(e.target.value)}
                  placeholder="e.g. 1"
                />
              </label>
              <label className="block text-xs text-slate-600 sm:col-span-2">
                Door / unit label
                <input
                  className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                  value={labelIn}
                  onChange={(e) => setLabelIn(e.target.value)}
                  placeholder="e.g. 101"
                />
              </label>
              <label className="block text-xs text-slate-600">
                Room type
                <select
                  className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                  value={roomTypeIdIn}
                  onChange={(e) => setRoomTypeIdIn(e.target.value)}
                >
                  {activeRoomTypes.length === 0 ? (
                    <option value="">— Add a room type first —</option>
                  ) : (
                    activeRoomTypes.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.roomName}
                      </option>
                    ))
                  )}
                </select>
              </label>
            </div>
            <button
              type="submit"
              disabled={adding || !roomTypeIdIn || !labelIn.trim()}
              className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {adding ? "Adding…" : "Add unit"}
            </button>
          </form>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Floor</th>
                  <th className="px-3 py-2">Unit</th>
                  <th className="px-3 py-2">Room type</th>
                  <th className="px-3 py-2" title="Busy/Free for the selected night, using physical assignments only">
                    That night
                  </th>
                  <th className="px-3 py-2"> </th>
                </tr>
              </thead>
              <tbody>
                {units.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                      No physical units mapped yet.
                    </td>
                  </tr>
                ) : (
                  units.map((u) => (
                    <tr key={u._id} className="border-b border-slate-100">
                      <td className="px-3 py-2 font-medium">{u.floor}</td>
                      <td className="px-3 py-2">{u.unitLabel}</td>
                      <td className="px-3 py-2">{u.roomTypeId?.roomName || "—"}</td>
                      <td className="px-3 py-2">
                        {u.busyOnPreviewNight === undefined ? (
                          <span className="text-slate-400">—</span>
                        ) : u.busyOnPreviewNight ? (
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            Busy
                          </span>
                        ) : (
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                            Free
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          className="text-xs text-rose-600 hover:underline"
                          onClick={() => void removeUnit(u._id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Could not load physical rooms.</p>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}
