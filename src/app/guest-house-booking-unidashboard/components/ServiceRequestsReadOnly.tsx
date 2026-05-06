"use client";

import { useState } from "react";
import api from "@/utils/apiUtils";

type GuestHouseLite = { _id: string; name: string };
type Row = {
  _id: string;
  guestName: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  createdAt: string;
};

export default function ServiceRequestsReadOnly({ guestHouses }: { guestHouses: GuestHouseLite[] }) {
  const [guestHouseId, setGuestHouseId] = useState(guestHouses[0]?._id || "");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!guestHouseId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/guest-house/${guestHouseId}/service-requests`);
      setRows(res.data?.data || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Service Requests (Read Only)</h2>
      <div className="mt-3 flex items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">Guest House</span>
          <select className="rounded border px-3 py-2" value={guestHouseId} onChange={(e) => setGuestHouseId(e.target.value)}>
            {guestHouses.map((gh) => (
              <option key={gh._id} value={gh._id}>{gh.name}</option>
            ))}
          </select>
        </label>
        <button className="rounded bg-slate-900 px-4 py-2 text-sm text-white" onClick={() => void load()}>
          {loading ? "Loading..." : "Load"}
        </button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[760px] w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2 pr-3">Guest</th>
              <th className="py-2 pr-3">Category</th>
              <th className="py-2 pr-3">Priority</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2">Request</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="border-b last:border-b-0">
                <td className="py-2 pr-3">{r.guestName || "Guest"}</td>
                <td className="py-2 pr-3">{r.category}</td>
                <td className="py-2 pr-3">{r.priority}</td>
                <td className="py-2 pr-3">{r.status}</td>
                <td className="py-2">{r.description}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 ? (
              <tr><td colSpan={5} className="py-3 text-center text-slate-500">No requests loaded.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
