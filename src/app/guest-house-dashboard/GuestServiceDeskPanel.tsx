"use client";

import { useEffect, useState } from "react";
import api from "@/utils/apiUtils";
import AppDialog from "@/components/AppDialog";

type ServiceRequest = {
  _id: string;
  guestName: string;
  roomLabel: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  description: string;
  status: "open" | "in_progress" | "resolved" | "cancelled";
  assignedTo?: string;
  etaMinutes?: number | null;
  resolutionNote?: string;
  createdAt: string;
};

export default function GuestServiceDeskPanel() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

  const showError = (message: string) => {
    setDialogMessage(message);
    setDialogOpen(true);
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const res = await api.get(`/api/guest-house-bookings/manager/service-requests${params}`);
      setRequests(res.data?.data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [statusFilter]);

  const update = async (requestId: string, payload: Partial<ServiceRequest>) => {
    try {
      await api.patch(`/api/guest-house-bookings/manager/service-requests/${requestId}`, payload);
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      showError(err.response?.data?.message || err.message || "Failed to update request.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Service Desk</h2>
        <select
          className="rounded border px-2 py-1 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-[980px] w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-slate-600">
              <th className="px-3 py-2">Guest</th>
              <th className="px-3 py-2">Room</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Request</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-3 py-3 text-slate-500">Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-3 text-slate-500">No requests found.</td></tr>
            ) : (
              requests.map((r) => (
                <tr key={r._id} className="border-b last:border-b-0">
                  <td className="px-3 py-2">{r.guestName || "Guest"}</td>
                  <td className="px-3 py-2">{r.roomLabel || "—"}</td>
                  <td className="px-3 py-2">{r.category}</td>
                  <td className="px-3 py-2">{r.priority}</td>
                  <td className="px-3 py-2">{r.description}</td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <button className="rounded border px-2 py-0.5 text-xs" onClick={() => void update(r._id, { status: "in_progress" })}>Start</button>
                      <button className="rounded border px-2 py-0.5 text-xs" onClick={() => void update(r._id, { status: "resolved" })}>Resolve</button>
                      <button className="rounded border px-2 py-0.5 text-xs" onClick={() => void update(r._id, { status: "cancelled" })}>Cancel</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <AppDialog
        open={dialogOpen}
        message={dialogMessage}
        variant="error"
        onConfirm={() => setDialogOpen(false)}
      />
    </div>
  );
}
