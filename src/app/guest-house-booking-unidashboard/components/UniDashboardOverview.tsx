"use client";

import React, { useEffect, useState } from "react";
import api from "@/utils/apiUtils";

interface GuestHouse {
  _id: string;
  name: string;
  totalRooms: number;
  contactNumber: string;
  location: string;
  managerName?: string;
  managerEmail?: string;
  description?: string;
  amenities?: string[];
  images?: string[];
  isActive: boolean;
  createdAt: string;
}

interface Summary {
  totalGuestHouses: number;
  totalRooms: number;
  activeGuestHouses: number;
}

interface Props {
  refreshKey?: number;
}

export default function UniDashboardOverview({ refreshKey = 0 }: Props) {
  const [loading, setLoading] = useState(true);
  const [guestHouses, setGuestHouses] = useState<GuestHouse[]>([]);
  const [editingGuestHouse, setEditingGuestHouse] = useState<GuestHouse | null>(null);
  const [editImages, setEditImages] = useState<File[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [summary, setSummary] = useState<Summary>({
    totalGuestHouses: 0,
    totalRooms: 0,
    activeGuestHouses: 0,
  });

  const loadGuestHouses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/guest-house");
      const json = res.data;
      if (json.success) {
        setGuestHouses(json.data || []);
        setSummary(
          json.summary || {
            totalGuestHouses: 0,
            totalRooms: 0,
            activeGuestHouses: 0,
          }
        );
      }
    } catch {
      // Silent fail here; parent dashboard already handles auth redirects.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGuestHouses();
  }, [refreshKey]);

  const deleteGuestHouse = async (id: string) => {
    const shouldDelete = window.confirm("Delete this guest house?");
    if (!shouldDelete) return;

    try {
      const res = await api.delete(`/api/guest-house/${id}`);
      if (!res.data?.success) throw new Error(res.data?.message || "Failed to delete guest house");
      await loadGuestHouses();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      alert(err.response?.data?.message || err.message || "Failed to delete guest house");
    }
  };

  const updateGuestHouse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingGuestHouse) return;
    setSavingEdit(true);
    try {
      const formData = new FormData(e.currentTarget);
      const payload = new FormData();
      payload.append("name", String(formData.get("name") || ""));
      payload.append("totalRooms", String(formData.get("totalRooms") || ""));
      payload.append("contactNumber", String(formData.get("contactNumber") || ""));
      payload.append("location", String(formData.get("location") || ""));
      payload.append("managerName", String(formData.get("managerName") || ""));
      payload.append("managerEmail", String(formData.get("managerEmail") || ""));
      payload.append("description", String(formData.get("description") || ""));
      payload.append("amenities", String(formData.get("amenities") || ""));
      payload.append("isActive", String(formData.get("isActive") === "on"));
      payload.append("replaceImages", "false");
      editImages.forEach((image) => payload.append("images", image));

      const res = await api.put(`/api/guest-house/${editingGuestHouse._id}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!res.data?.success) throw new Error(res.data?.message || "Failed to update guest house");
      setEditingGuestHouse(null);
      setEditImages([]);
      await loadGuestHouses();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      alert(err.response?.data?.message || err.message || "Failed to update guest house");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Guest Houses" value={String(summary.totalGuestHouses)} />
        <StatCard title="Total Rooms" value={String(summary.totalRooms)} />
        <StatCard title="Active Properties" value={String(summary.activeGuestHouses)} />
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Guest House List</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Loading guest houses...</p>
        ) : guestHouses.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No guest houses found. Add your first one.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Rooms</th>
                  <th className="py-2 pr-4 font-medium">Contact</th>
                  <th className="py-2 pr-4 font-medium">Location</th>
                  <th className="py-2 pr-4 font-medium">Images</th>
                  <th className="py-2 pr-4 font-medium">Manager</th>
                  <th className="py-2 pr-0 font-medium">Status</th>
                  <th className="py-2 pr-0 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {guestHouses.map((item) => (
                  <tr key={item._id} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-medium text-slate-800">{item.name}</td>
                    <td className="py-3 pr-4">{item.totalRooms}</td>
                    <td className="py-3 pr-4">{item.contactNumber}</td>
                    <td className="py-3 pr-4">{item.location}</td>
                    <td className="py-3 pr-4">{item.images?.length || 0}</td>
                    <td className="py-3 pr-4">{item.managerName || "—"}</td>
                    <td className="py-3 pr-0">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 pl-3">
                      <div className="flex gap-2">
                        <button
                          className="rounded border px-2 py-1 text-xs hover:bg-slate-50"
                          onClick={() => setEditingGuestHouse(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                          onClick={() => void deleteGuestHouse(item._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editingGuestHouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Edit Guest House</h3>
              <button onClick={() => setEditingGuestHouse(null)} className="text-xl text-slate-500">×</button>
            </div>
            <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={updateGuestHouse}>
              <Field label="Guest House Name *">
                <input name="name" className="w-full rounded-md border px-3 py-2 text-sm" defaultValue={editingGuestHouse.name} required />
              </Field>
              <Field label="Number of Rooms *">
                <input name="totalRooms" type="number" min={1} className="w-full rounded-md border px-3 py-2 text-sm" defaultValue={editingGuestHouse.totalRooms} required />
              </Field>
              <Field label="Contact Number *">
                <input name="contactNumber" className="w-full rounded-md border px-3 py-2 text-sm" defaultValue={editingGuestHouse.contactNumber} required />
              </Field>
              <Field label="Location *">
                <input name="location" className="w-full rounded-md border px-3 py-2 text-sm" defaultValue={editingGuestHouse.location} required />
              </Field>
              <Field label="Manager Name">
                <input name="managerName" className="w-full rounded-md border px-3 py-2 text-sm" defaultValue={editingGuestHouse.managerName || ""} />
              </Field>
              <Field label="Manager Email">
                <input name="managerEmail" type="email" className="w-full rounded-md border px-3 py-2 text-sm" defaultValue={editingGuestHouse.managerEmail || ""} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Amenities (comma separated)">
                  <input name="amenities" className="w-full rounded-md border px-3 py-2 text-sm" defaultValue={(editingGuestHouse.amenities || []).join(", ")} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Description">
                  <textarea name="description" rows={4} className="w-full rounded-md border px-3 py-2 text-sm" defaultValue={editingGuestHouse.description || ""} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Add More Images">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    onChange={(e) => setEditImages(Array.from(e.target.files || []))}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="isActive" defaultChecked={editingGuestHouse.isActive} />
                  Active
                </label>
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <button type="button" className="rounded border px-4 py-2 text-sm" onClick={() => setEditingGuestHouse(null)}>
                  Cancel
                </button>
                <button type="submit" disabled={savingEdit} className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

