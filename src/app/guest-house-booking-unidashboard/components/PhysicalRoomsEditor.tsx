"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/utils/apiUtils";
import {
  HK_OPTIONS,
  hkBadgeClass,
  type PhysicalRoomsSummary,
  type PhysicalUnitRow,
  type RoomTypeOption,
  todayLocalDateInput,
} from "../lib/physicalRoomsShared";

interface Props {
  guestHouseId: string;
  refreshToken?: number;
}

interface LayoutRow {
  floor: string;
  roomsOnFloor: string;
}

/** Guest-house staff CRM: layout sync, HK, notes. Campus floor / categories are edited in uni Floor Plan. */
export default function PhysicalRoomsEditor({ guestHouseId, refreshToken = 0 }: Props) {
  const [previewDate, setPreviewDate] = useState(todayLocalDateInput);
  const [loading, setLoading] = useState(false);
  const [layoutGenerating, setLayoutGenerating] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [summary, setSummary] = useState<PhysicalRoomsSummary | null>(null);
  const [units, setUnits] = useState<PhysicalUnitRow[]>([]);
  const [floorTab, setFloorTab] = useState<number | "all">("all");

  const [managerRoomTypes, setManagerRoomTypes] = useState<RoomTypeOption[]>([]);

  const [layoutRows, setLayoutRows] = useState<LayoutRow[]>([
    { floor: "1", roomsOnFloor: "6" },
    { floor: "2", roomsOnFloor: "6" },
  ]);

  const [floorIn, setFloorIn] = useState("1");
  const [labelIn, setLabelIn] = useState("");
  const [roomTypeIdIn, setRoomTypeIdIn] = useState("");
  const [adding, setAdding] = useState(false);

  const [modalUnit, setModalUnit] = useState<PhysicalUnitRow | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editHk, setEditHk] = useState("ready");
  const [savingEdit, setSavingEdit] = useState(false);

  const activeRoomTypes = useMemo(() => managerRoomTypes.filter(Boolean), [managerRoomTypes]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/api/guest-house-bookings/manager/room-types");
        const json = res.data;
        if (!json.success || cancelled) return;
        setManagerRoomTypes(json.data || []);
      } catch {
        if (!cancelled) setManagerRoomTypes([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  useEffect(() => {
    const first = activeRoomTypes[0]?._id || "";
    setRoomTypeIdIn((prev) => {
      if (prev && activeRoomTypes.some((r) => r._id === prev)) return prev;
      return first;
    });
  }, [activeRoomTypes]);

  const floorNumbers = useMemo(() => {
    const s = new Set<number>();
    for (const u of units) s.add(u.floor);
    return [...s].sort((a, b) => a - b);
  }, [units]);

  const loadPhysical = useCallback(async () => {
    if (!guestHouseId) return;
    try {
      setLoading(true);
      const res = await api.get("/api/guest-house-bookings/manager/physical-rooms", {
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

  useEffect(() => {
    if (floorTab !== "all" && !floorNumbers.includes(floorTab as number)) {
      setFloorTab(floorNumbers.length ? floorNumbers[0] : "all");
    }
  }, [floorNumbers, floorTab]);

  const visibleUnits = useMemo(() => {
    if (floorTab === "all") return units;
    return units.filter((u) => u.floor === floorTab);
  }, [units, floorTab]);

  const openCard = (u: PhysicalUnitRow) => {
    setModalUnit(u);
    setEditLabel(u.unitLabel);
    setEditNotes(u.notes || "");
    setEditHk(u.housekeepingStatus || "ready");
  };

  const closeModal = () => {
    setModalUnit(null);
    setSavingEdit(false);
  };

  const saveEdit = async () => {
    if (!modalUnit) return;
    const lab = editLabel.trim();
    if (!lab) return alert("Unit label is required");
    try {
      setSavingEdit(true);
      const res = await api.patch(`/api/guest-house-bookings/manager/physical-rooms/${modalUnit._id}`, {
        unitLabel: lab,
        notes: editNotes.trim(),
        housekeepingStatus: editHk,
      });
      if (!res.data?.success) throw new Error(res.data?.message || "Save failed");
      closeModal();
      await loadPhysical();
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { message?: string } }; message?: string };
      alert(e2.response?.data?.message || e2.message || "Could not save");
    } finally {
      setSavingEdit(false);
    }
  };

  const generateLayout = async () => {
    const floorsPayload = layoutRows
      .map((row) => ({
        floor: Number(row.floor),
        roomsOnFloor: Number(row.roomsOnFloor),
      }))
      .filter((r) => Number.isFinite(r.floor) && Number.isFinite(r.roomsOnFloor));
    if (floorsPayload.length === 0) return alert("Add at least one floor with a room count.");
    try {
      setLayoutGenerating(true);
      const res = await api.post("/api/guest-house-bookings/manager/physical-rooms/layout", {
        floors: floorsPayload,
      });
      if (!res.data?.success) throw new Error(res.data?.message || "Could not generate");
      alert(String(res.data?.message || "Layout updated"));
      await loadPhysical();
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { message?: string } }; message?: string };
      alert(e2.response?.data?.message || e2.message || "Generate failed");
    } finally {
      setLayoutGenerating(false);
    }
  };

  const addUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labelIn.trim()) return;
    try {
      setAdding(true);
      const res = await api.post("/api/guest-house-bookings/manager/physical-rooms", {
        floor: Number(floorIn) || 0,
        unitLabel: labelIn.trim(),
        roomTypeId: roomTypeIdIn || undefined,
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
    if (!window.confirm("Remove this room slot from the map?")) return;
    try {
      const res = await api.delete(`/api/guest-house-bookings/manager/physical-rooms/${physicalRoomId}`);
      if (!res.data?.success) throw new Error(res.data?.message || "Failed");
      if (modalUnit?._id === physicalRoomId) closeModal();
      await loadPhysical();
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { message?: string } }; message?: string };
      alert(e2.response?.data?.message || e2.message || "Could not remove");
    }
  };

  if (!guestHouseId) {
    return <p className="text-sm text-slate-500">Select a guest house above to map floors and units.</p>;
  }

  return (
    <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/80 p-5">
      <h3 className="text-base font-semibold text-slate-900">Floors & room map (CRM)</h3>
      <>
        <p className="mt-1 text-sm text-slate-600">
          Step 1: define floors and rooms per floor — we create clickable slots (labels like <code className="rounded bg-slate-200 px-1">2-04</code>). Step 2: click each room to set{" "}
          <strong>notes</strong> and <strong>housekeeping</strong>. Sellable categories and campus floor indices are maintained by the university in{" "}
          <strong>Floor Plan</strong>.
        </p>
        <p className="mt-2 rounded-lg bg-white/90 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
          <strong className="text-slate-800">Preview night</strong> shows booked vs available for that date when bookings use <em>Pick units</em>.
        </p>
      </>

      <section className="mt-5 rounded-xl border border-indigo-100 bg-white p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-900">1. Building layout</h4>
        <p className="mt-1 text-xs text-slate-600">
          Each row is one floor number and how many doors on that floor. Generating adds only missing codes (existing labels stay).
        </p>
        <div className="mt-3 space-y-2">
          {layoutRows.map((row, idx) => (
            <div key={idx} className="flex flex-wrap items-end gap-2">
              <label className="text-xs text-slate-600">
                Floor #
                <input
                  type="number"
                  className="mt-0.5 block w-24 rounded-lg border px-2 py-1.5 text-sm"
                  value={row.floor}
                  onChange={(e) => {
                    const next = [...layoutRows];
                    next[idx] = { ...next[idx], floor: e.target.value };
                    setLayoutRows(next);
                  }}
                />
              </label>
              <label className="text-xs text-slate-600">
                Rooms on floor
                <input
                  type="number"
                  min={1}
                  className="mt-0.5 block w-28 rounded-lg border px-2 py-1.5 text-sm"
                  value={row.roomsOnFloor}
                  onChange={(e) => {
                    const next = [...layoutRows];
                    next[idx] = { ...next[idx], roomsOnFloor: e.target.value };
                    setLayoutRows(next);
                  }}
                />
              </label>
              <button
                type="button"
                className="text-xs text-rose-600 hover:underline"
                onClick={() => setLayoutRows((r) => r.filter((_, i) => i !== idx))}
                disabled={layoutRows.length <= 1}
              >
                Remove row
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm hover:bg-slate-100"
            onClick={() =>
              setLayoutRows((r) => [...r, { floor: String(Number(r[r.length - 1]?.floor || 1) + 1), roomsOnFloor: "6" }])
            }
          >
            + Add floor row
          </button>
          <button
            type="button"
            disabled={layoutGenerating}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            onClick={() => void generateLayout()}
          >
            {layoutGenerating ? "Generating…" : "Generate / sync room slots"}
          </button>
        </div>
      </section>

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
            <MiniStat label="Physical slots" value={String(summary.totalUnits)} />
            {summary.freeOnPreviewNight !== undefined ? (
              <MiniStat label="Available that night" value={String(summary.freeOnPreviewNight)} />
            ) : null}
            {summary.busyOnPreviewNight !== undefined ? (
              <MiniStat label="Occupied that night" value={String(summary.busyOnPreviewNight)} />
            ) : null}
          </div>

          <div className="rounded-lg border border-white bg-white p-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Mix by room type</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {summary.byRoomType.length === 0 ? (
                <span className="text-sm text-slate-500">No slots yet.</span>
              ) : (
                summary.byRoomType.map((t, i) => (
                  <span
                    key={`${t.roomName}-${i}`}
                    className={`rounded-full px-3 py-1 text-xs ring-1 ${
                      t.roomName === "Unassigned"
                        ? "bg-slate-100 text-slate-700 ring-slate-200"
                        : "bg-indigo-50 text-indigo-900 ring-indigo-100"
                    }`}
                  >
                    {t.roomName}: {t.count}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border border-white bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Housekeeping legend</span>
              {HK_OPTIONS.map((o) => (
                <span key={o.value} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${hkBadgeClass(o.value)}`}>
                  {o.label}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
              <span className="text-xs font-semibold text-slate-700">Floor:</span>
              <button
                type="button"
                onClick={() => setFloorTab("all")}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  floorTab === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              {floorNumbers.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFloorTab(f)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    floorTab === f ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            {visibleUnits.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No slots on this floor — generate layout above.</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {visibleUnits.map((u) => {
                  const typed = Boolean(u.roomTypeId?.roomName);
                  const occ = u.busyOnPreviewNight === true;
                  return (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => openCard(u)}
                      className={`flex flex-col rounded-xl border-2 p-2 text-left transition hover:shadow-md ${
                        typed ? "border-indigo-200 bg-indigo-50/40" : "border-dashed border-slate-300 bg-slate-50"
                      }`}
                      title="Configure housekeeping & notes"
                    >
                      <span className="text-xs font-bold text-slate-900">{u.unitLabel}</span>
                      <span className="mt-0.5 truncate text-[10px] text-slate-600">{typed ? u.roomTypeId!.roomName : "Unassigned"}</span>
                      <span
                        className={`mt-1 inline-flex w-fit rounded-full px-1.5 py-0.5 text-[9px] font-medium ring-1 ${hkBadgeClass(u.housekeepingStatus)}`}
                      >
                        {(HK_OPTIONS.find((h) => h.value === u.housekeepingStatus)?.label || "Ready").split("—")[0].trim()}
                      </span>
                      {u.busyOnPreviewNight !== undefined ? (
                        <span className={`mt-1 text-[9px] font-medium ${occ ? "text-amber-700" : "text-emerald-700"}`}>
                          {occ ? "Booked (night)" : "Avail. (night)"}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <>
            <button
              type="button"
              className="text-xs font-medium text-slate-600 underline decoration-dotted hover:text-slate-900"
              onClick={() => setShowManualAdd((v) => !v)}
            >
              {showManualAdd ? "Hide" : "Show"} manual add (custom label / odd layout)
            </button>

            {showManualAdd ? (
              <form onSubmit={addUnit} className="rounded-lg border border-dashed border-slate-300 bg-white p-4">
                <p className="text-sm font-medium text-slate-800">Add one slot manually</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <label className="block text-xs text-slate-600">
                    Floor #
                    <input
                      type="number"
                      className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                      value={floorIn}
                      onChange={(e) => setFloorIn(e.target.value)}
                    />
                  </label>
                  <label className="block text-xs text-slate-600 sm:col-span-2">
                    Label (must be unique)
                    <input
                      className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                      value={labelIn}
                      onChange={(e) => setLabelIn(e.target.value)}
                      placeholder="e.g. VIP-A"
                    />
                  </label>
                  <label className="block text-xs text-slate-600">
                    Room type (optional)
                    <select
                      className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                      value={roomTypeIdIn}
                      onChange={(e) => setRoomTypeIdIn(e.target.value)}
                    >
                      <option value="">— Unassigned —</option>
                      {activeRoomTypes.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.roomName}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={adding || !labelIn.trim()}
                  className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                  {adding ? "Adding…" : "Add slot"}
                </button>
              </form>
            ) : null}
          </>

          <details className="rounded-lg border border-slate-200 bg-white">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-700">Table view</summary>
            <div className="overflow-x-auto border-t border-slate-100">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Floor</th>
                    <th className="px-3 py-2">Unit</th>
                    <th className="px-3 py-2">Room type</th>
                    <th className="px-3 py-2">HK</th>
                    <th className="px-3 py-2">Night</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((u) => (
                    <tr key={u._id} className="border-b border-slate-100">
                      <td className="px-3 py-2">{u.floor}</td>
                      <td className="px-3 py-2 font-medium">{u.unitLabel}</td>
                      <td className="px-3 py-2">{u.roomTypeId?.roomName || "Unassigned"}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-medium ring-1 ${hkBadgeClass(u.housekeepingStatus)}`}>
                          {u.housekeepingStatus || "ready"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {u.busyOnPreviewNight === undefined ? (
                          "—"
                        ) : u.busyOnPreviewNight ? (
                          <span className="text-amber-700">Occupied</span>
                        ) : (
                          <span className="text-emerald-700">Available</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button type="button" className="text-xs text-indigo-600 hover:underline" onClick={() => openCard(u)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="ml-2 text-xs text-rose-600 hover:underline"
                          onClick={() => void removeUnit(u._id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Could not load physical rooms.</p>
      )}

      {modalUnit ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">Configure room</h4>
                <p className="text-xs text-slate-600">
                  Campus floor and sellable category are set in <strong>Floor Plan</strong> (university). You manage labels where allowed, housekeeping, and notes.
                </p>
              </div>
              <button type="button" className="text-2xl leading-none text-slate-400 hover:text-slate-700" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <ReadRow label="Campus floor" value={String(modalUnit.floor)} />
              <label className="block text-xs font-medium text-slate-700">
                Door label
                <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
              </label>
              <ReadRow label="Room type (guest-facing)" value={modalUnit.roomTypeId?.roomName || "Unassigned"} />
              <label className="block text-xs font-medium text-slate-700">
                Housekeeping / ops status
                <select className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={editHk} onChange={(e) => setEditHk(e.target.value)}>
                  {HK_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-700">
                Internal notes (staff only)
                <textarea
                  className="mt-1 min-h-[72px] w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="Maintenance scheduled, VIP, linen prefs…"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  maxLength={500}
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap justify-between gap-2">
              <button
                type="button"
                className="rounded-lg border border-rose-200 px-4 py-2 text-sm text-rose-700 hover:bg-rose-50"
                onClick={() => void removeUnit(modalUnit._id)}
              >
                Remove slot
              </button>
              <div className="flex gap-2">
                <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingEdit}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  onClick={() => void saveEdit()}
                >
                  {savingEdit ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReadRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 font-medium text-slate-900">{value}</p>
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
