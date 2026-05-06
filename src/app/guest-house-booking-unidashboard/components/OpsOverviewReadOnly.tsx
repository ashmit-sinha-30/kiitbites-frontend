"use client";

import { useState } from "react";
import api from "@/utils/apiUtils";

type GuestHouseLite = { _id: string; name: string };

type OpsData = {
  today: {
    arrivals: number;
    departures: number;
    checkedIn: number;
    checkedOut: number;
    pendingCheckIn: number;
    pendingCheckOut: number;
    noShow: number;
  };
  live: {
    inHouseNow: number;
    dirtyOverdue: number;
    maintenanceBlocked: number;
  };
};

export default function OpsOverviewReadOnly({ guestHouses }: { guestHouses: GuestHouseLite[] }) {
  const [guestHouseId, setGuestHouseId] = useState(guestHouses[0]?._id || "");
  const [data, setData] = useState<OpsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!guestHouseId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/api/guest-house/${guestHouseId}/ops-overview`);
      setData(res.data?.data || null);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Failed to load operations overview");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Operations Overview (Read Only)</h2>
      <p className="mt-1 text-sm text-slate-600">University view of check-ins, check-outs, no-shows and housekeeping risk.</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">Guest House</span>
          <select value={guestHouseId} onChange={(e) => setGuestHouseId(e.target.value)} className="rounded-md border px-3 py-2">
            {guestHouses.map((gh) => (
              <option key={gh._id} value={gh._id}>
                {gh.name}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => void load()} className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white">
          {loading ? "Loading..." : "Load"}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
      {data ? (
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <Metric label="Arrivals today" value={data.today.arrivals} />
          <Metric label="Pending check-in" value={data.today.pendingCheckIn} />
          <Metric label="Departures today" value={data.today.departures} />
          <Metric label="Pending check-out" value={data.today.pendingCheckOut} />
          <Metric label="No-show today" value={data.today.noShow} />
          <Metric label="In-house now" value={data.live.inHouseNow} />
          <Metric label="Dirty overdue" value={data.live.dirtyOverdue} />
          <Metric label="Maint/blocked" value={data.live.maintenanceBlocked} />
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
