"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/utils/apiUtils";

type RoomRef = {
  roomName?: string;
  roomCount?: number;
  price?: number;
} | null;

export type ManagerBooking = {
  _id: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  roomsBooked: number;
  adultsCount: number;
  kidsCount: number;
  totalPrice: number;
  guestName: string;
  guestEmail?: string;
  guestPhone: string;
  status: string;
  paymentStatus: string;
  assignedRoomNumbers?: string;
  assignedPhysicalRoomIds?: string[];
  createdAt?: string;
  roomId: RoomRef;
};

type AssignableUnit = {
  _id: string;
  floor: number;
  unitLabel: string;
  availability: "free" | "busy";
  selectedForThisBooking: boolean;
};

function formatDateLabel(iso: string | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function todayLocalDateInput(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function AssignUnitsRow({
  bookingId,
  roomsBooked,
  checkInLabel,
  checkOutLabel,
  onSaved,
  onClose,
}: {
  bookingId: string;
  roomsBooked: number;
  checkInLabel: string;
  checkOutLabel: string;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<AssignableUnit[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await api.get(`/api/guest-house-bookings/manager/bookings/${bookingId}/assignable-units`);
        const json = res.data;
        if (!json.success) throw new Error(json.message || "Failed");
        const u = (json.data?.units || []) as AssignableUnit[];
        if (cancelled) return;
        setUnits(u);
        const init = new Set<string>();
        for (const row of u) {
          if (row.selectedForThisBooking) init.add(row._id);
        }
        setSelected(init);
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message ||
          (e as Error).message ||
          "Failed to load units";
        if (!cancelled) setErr(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const toggle = (u: AssignableUnit) => {
    if (u.availability === "busy" && !u.selectedForThisBooking) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(u._id)) next.delete(u._id);
      else {
        if (next.size >= roomsBooked) return prev;
        next.add(u._id);
      }
      return next;
    });
  };

  const apply = async () => {
    try {
      setSaving(true);
      const res = await api.patch(`/api/guest-house-bookings/manager/bookings/${bookingId}`, {
        assignedPhysicalRoomIds: Array.from(selected),
      });
      if (!res.data?.success) throw new Error(res.data?.message || "Save failed");
      onSaved();
      onClose();
    } catch (e: unknown) {
      const err2 = e as { response?: { data?: { message?: string } }; message?: string };
      alert(err2.response?.data?.message || err2.message || "Could not save assignment");
    } finally {
      setSaving(false);
    }
  };

  const clearUnits = async () => {
    try {
      setSaving(true);
      const res = await api.patch(`/api/guest-house-bookings/manager/bookings/${bookingId}`, {
        assignedPhysicalRoomIds: [],
        assignedRoomNumbers: "",
      });
      if (!res.data?.success) throw new Error(res.data?.message || "Save failed");
      onSaved();
      onClose();
    } catch (e: unknown) {
      const err2 = e as { response?: { data?: { message?: string } }; message?: string };
      alert(err2.response?.data?.message || err2.message || "Could not clear");
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="border-b border-gray-100 bg-slate-50">
      <td colSpan={8} className="px-3 py-4">
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">Pick physical units</p>
              <p className="text-xs text-slate-600">
                Stay overlap: {checkInLabel} → {checkOutLabel}. Choose {roomsBooked} unit(s); busy units are blocked by other bookings.
              </p>
            </div>
            <button type="button" className="text-xs text-slate-500 hover:text-slate-800" onClick={onClose}>
              Close
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading units…</p>
          ) : err ? (
            <p className="text-sm text-red-600">{err}</p>
          ) : units.length === 0 ? (
            <p className="text-sm text-slate-600">
              No physical units are configured for this room type on your property. Ask your university admin to map floors under Floors &amp; physical rooms, or enter labels manually in the row above.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {units.map((u) => {
                  const active = selected.has(u._id);
                  const blocked = u.availability === "busy" && !u.selectedForThisBooking;
                  return (
                    <button
                      key={u._id}
                      type="button"
                      disabled={blocked}
                      onClick={() => toggle(u)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                        blocked
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through"
                          : active
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                      }`}
                      title={blocked ? "Assigned to another booking for these dates" : "Tap to toggle"}
                    >
                      Fl {u.floor} · {u.unitLabel}
                      {!blocked ? " · free" : ""}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500">
                Selected {selected.size} / {roomsBooked}. Saving replaces any manual label with unit codes.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving || selected.size !== roomsBooked}
                  onClick={() => void apply()}
                  className="rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? "Saving…" : "Apply selection"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void clearUnits()}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
                >
                  Clear assignment
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function GuestHouseBookingsPanel() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<ManagerBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [draftRooms, setDraftRooms] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [allocateForId, setAllocateForId] = useState<string | null>(null);

  const [invLoading, setInvLoading] = useState(true);
  const [previewNight, setPreviewNight] = useState(todayLocalDateInput);
  const [inventory, setInventory] = useState<{
    summary: {
      floorCount: number;
      totalUnits: number;
      floors: { floor: number; roomsOnFloor: number }[];
      byRoomType: { roomName: string; count: number }[];
      freeOnPreviewNight?: number;
      busyOnPreviewNight?: number;
    };
  } | null>(null);

  const loadInventory = useCallback(async () => {
    try {
      setInvLoading(true);
      const res = await api.get("/api/guest-house-bookings/manager/inventory-overview", {
        params: { asOfDate: previewNight },
      });
      const json = res.data;
      if (!json.success) throw new Error(json.message || "Failed");
      setInventory({ summary: json.data.summary });
    } catch {
      setInventory(null);
    } finally {
      setInvLoading(false);
    }
  }, [previewNight]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await api.get("/api/guest-house-bookings/manager/bookings", { params });
      const json = res.data;
      if (!json.success) throw new Error(json.message || "Failed to load bookings");
      const rows = (json.data || []) as ManagerBooking[];
      setBookings(rows);
      setDraftRooms(() => {
        const next: Record<string, string> = {};
        for (const b of rows) {
          next[b._id] = b.assignedRoomNumbers || "";
        }
        return next;
      });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err.response?.data?.message || err.message || "Could not load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    let upcoming = 0;
    for (const b of bookings) {
      const ci = new Date(b.checkInDate);
      if (!Number.isNaN(ci.getTime()) && ci >= startToday) upcoming += 1;
    }
    return { total: bookings.length, upcoming };
  }, [bookings]);

  const saveAssignment = async (bookingId: string) => {
    const value = draftRooms[bookingId] ?? "";
    try {
      setSavingId(bookingId);
      const res = await api.patch(`/api/guest-house-bookings/manager/bookings/${bookingId}`, {
        assignedRoomNumbers: value,
      });
      if (!res.data?.success) throw new Error(res.data?.message || "Save failed");
      await load();
      await loadInventory();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      alert(err.response?.data?.message || err.message || "Could not save room assignment");
    } finally {
      setSavingId(null);
    }
  };

  const summ = inventory?.summary;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Property layout snapshot</h3>
            <p className="text-xs text-slate-600">
              Pick one calendar night to see which units look busy vs free. Only bookings where rooms were assigned with the{" "}
              <strong>unit picker</strong> count—manual labels don&apos;t block units here.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            Preview night
            <input
              type="date"
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
              value={previewNight}
              onChange={(e) => setPreviewNight(e.target.value)}
            />
          </label>
        </div>
        {invLoading ? (
          <p className="mt-3 text-xs text-slate-500">Loading inventory…</p>
        ) : summ ? (
          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
            <MiniStat label="Floors" value={String(summ.floorCount)} />
            <MiniStat label="Physical units" value={String(summ.totalUnits)} />
            {summ.freeOnPreviewNight !== undefined ? (
              <MiniStat label="Free that night" value={String(summ.freeOnPreviewNight)} />
            ) : null}
            {summ.busyOnPreviewNight !== undefined ? (
              <MiniStat label="Busy that night" value={String(summ.busyOnPreviewNight)} />
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-xs text-amber-800">Inventory not loaded yet.</p>
        )}
        {summ && summ.floors?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {summ.floors.map((f) => (
              <span
                key={f.floor}
                className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-sm ring-1 ring-indigo-100"
              >
                Floor {f.floor}: {f.roomsOnFloor}
              </span>
            ))}
          </div>
        ) : null}
        {summ && summ.byRoomType?.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {summ.byRoomType.map((t, i) => (
              <span key={`${t.roomName}-${i}`} className="rounded-full bg-white px-2.5 py-1 text-xs text-indigo-900 ring-1 ring-indigo-100">
                {t.roomName}: {t.count}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Bookings</h2>
          <p className="text-sm text-gray-600">
            Allocate concrete units when inventory exists — busy rooms hide automatically for overlapping stays.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-gray-500" htmlFor="booking-status-filter">
            Status
          </label>
          <select
            id="booking-status-filter"
            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            type="button"
            onClick={() => {
              void load();
              void loadInventory();
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total loaded</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Upcoming (check-in today onward)</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.upcoming}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      ) : null}

      {loading ? (
        <p className="text-sm text-gray-500">Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-gray-500">No bookings yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-[920px] w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-3 py-2">Stay</th>
                <th className="px-3 py-2">Room type</th>
                <th className="px-3 py-2">Guest</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Guests</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Payment</th>
                <th className="px-3 py-2 min-w-[220px]">Assignment</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const roomType = b.roomId?.roomName || "—";
                const draft = draftRooms[b._id] ?? b.assignedRoomNumbers ?? "";
                const dirty = draft !== (b.assignedRoomNumbers || "");
                const ci = formatDateLabel(b.checkInDate);
                const co = formatDateLabel(b.checkOutDate);
                return (
                  <React.Fragment key={b._id}>
                    <tr className="border-b border-gray-100 align-top">
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{ci}</div>
                        <div className="text-xs text-gray-500">to {co}</div>
                        <div className="text-xs text-gray-400">
                          {b.nights} night(s) · {b.roomsBooked} unit(s)
                        </div>
                      </td>
                      <td className="px-3 py-2 text-gray-800">{roomType}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{b.guestName}</div>
                        {b.createdAt ? (
                          <div className="mt-0.5 text-xs text-gray-500">Booked on {formatDateLabel(b.createdAt)}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-700">
                        <div>{b.guestPhone}</div>
                        {b.guestEmail ? <div className="text-gray-500">{b.guestEmail}</div> : null}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {b.adultsCount} adults, {b.kidsCount} kids
                      </td>
                      <td className="px-3 py-2">₹{Number(b.totalPrice || 0).toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{b.paymentStatus}</span>
                        <div className="text-xs text-gray-400">{b.status}</div>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="mb-2 rounded-md border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-50"
                          onClick={() => setAllocateForId((prev) => (prev === b._id ? null : b._id))}
                        >
                          {allocateForId === b._id ? "Hide unit picker" : "Pick units (free/busy)"}
                        </button>
                        <input
                          type="text"
                          placeholder="Manual labels if needed"
                          className="w-full min-w-[140px] rounded-md border border-gray-300 px-2 py-1 text-xs"
                          value={draft}
                          onChange={(e) => setDraftRooms((prev) => ({ ...prev, [b._id]: e.target.value }))}
                        />
                        <button
                          type="button"
                          disabled={!dirty || savingId === b._id}
                          onClick={() => void saveAssignment(b._id)}
                          className="mt-1 rounded-md bg-black px-2 py-1 text-xs text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {savingId === b._id ? "Saving…" : "Save manual label"}
                        </button>
                      </td>
                    </tr>
                    {allocateForId === b._id ? (
                      <AssignUnitsRow
                        bookingId={b._id}
                        roomsBooked={b.roomsBooked}
                        checkInLabel={ci}
                        checkOutLabel={co}
                        onSaved={() => {
                          void load();
                          void loadInventory();
                        }}
                        onClose={() => setAllocateForId(null)}
                      />
                    ) : null}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white bg-white/90 p-3 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}
