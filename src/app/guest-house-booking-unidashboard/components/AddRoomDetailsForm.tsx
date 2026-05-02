"use client";

import React, { useEffect, useState } from "react";
import api from "@/utils/apiUtils";

interface GuestHouseOption {
  _id: string;
  name: string;
}

interface RoomItem {
  _id: string;
  guestHouseId?: { _id?: string; name?: string } | string;
  roomName: string;
  roomCount: number;
  price: number;
  services: string[];
  isActive: boolean;
  coverImage?: string;
  detailedImages?: string[];
}

export default function AddRoomDetailsForm() {
  const [loadingGuestHouses, setLoadingGuestHouses] = useState(true);
  const [guestHouses, setGuestHouses] = useState<GuestHouseOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [savingRoomId, setSavingRoomId] = useState<string | null>(null);
  const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null);
  const [editGuestHouseId, setEditGuestHouseId] = useState("");
  const [editRoomName, setEditRoomName] = useState("");
  const [editRoomCount, setEditRoomCount] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editServices, setEditServices] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editCoverImage, setEditCoverImage] = useState<File | null>(null);
  const [editDetailedImages, setEditDetailedImages] = useState<File[]>([]);
  const [replaceDetailedImages, setReplaceDetailedImages] = useState(false);

  const [form, setForm] = useState({
    guestHouseId: "",
    roomName: "",
    roomCount: "",
    price: "",
    services: "",
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [detailedImages, setDetailedImages] = useState<File[]>([]);

  useEffect(() => {
    const loadGuestHouses = async () => {
      try {
        setLoadingGuestHouses(true);
        const res = await api.get("/api/guest-house");
        const json = res.data;
        if (json.success) {
          const houses: GuestHouseOption[] = json.data || [];
          setGuestHouses(houses);
          if (houses.length > 0) {
            setForm((prev) => ({ ...prev, guestHouseId: houses[0]._id }));
          }
        }
      } catch {
        setGuestHouses([]);
      } finally {
        setLoadingGuestHouses(false);
      }
    };

    void loadGuestHouses();
  }, []);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const params = form.guestHouseId ? `?guestHouseId=${form.guestHouseId}` : "";
        const res = await api.get(`/api/guest-house-rooms${params}`);
        const json = res.data;
        if (json.success) {
          setRooms(json.data || []);
        }
      } catch {
        setRooms([]);
      }
    };
    void loadRooms();
  }, [form.guestHouseId]);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guestHouseId) return alert("Please select a guest house.");
    if (!coverImage || detailedImages.length === 0) return alert("Cover image and at least one detailed image are required.");
    if (!form.roomCount || Number(form.roomCount) < 1) return alert("Please enter a valid room count.");
    if (form.price === "" || Number(form.price) < 0) return alert("Please enter a valid room price.");

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("guestHouseId", form.guestHouseId);
      payload.append("roomName", form.roomName.trim());
      payload.append("roomCount", form.roomCount);
      payload.append("price", form.price);
      payload.append("services", form.services);
      payload.append("coverImage", coverImage);
      detailedImages.forEach((image) => payload.append("detailedImage", image));

      const res = await api.post("/api/guest-house-rooms", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!res.data?.success) throw new Error(res.data?.message || "Failed to add room details");

      setForm((prev) => ({ ...prev, roomName: "", roomCount: "", price: "", services: "" }));
      setCoverImage(null);
      setDetailedImages([]);
      const refreshed = await api.get(`/api/guest-house-rooms?guestHouseId=${form.guestHouseId}`);
      if (refreshed.data?.success) setRooms(refreshed.data.data || []);
      alert("Room details added successfully");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      alert(err.response?.data?.message || err.message || "Failed to add room details");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (room: RoomItem) => {
    const currentGuestHouseId =
      typeof room.guestHouseId === "string"
        ? room.guestHouseId
        : room.guestHouseId?._id || "";
    setEditingRoom(room);
    setEditGuestHouseId(currentGuestHouseId);
    setEditRoomName(room.roomName || "");
    setEditRoomCount(String(room.roomCount || ""));
    setEditPrice(String(room.price ?? ""));
    setEditServices((room.services || []).join(", "));
    setEditIsActive(room.isActive);
    setEditCoverImage(null);
    setEditDetailedImages([]);
    setReplaceDetailedImages(false);
  };

  const closeEditModal = () => {
    setEditingRoom(null);
    setEditCoverImage(null);
    setEditDetailedImages([]);
    setReplaceDetailedImages(false);
  };

  const updateRoom = async () => {
    if (!editingRoom) return;
    if (!editGuestHouseId) return alert("Please select a parent guest house.");
    if (!editRoomCount || Number(editRoomCount) < 1) return alert("Room count must be at least 1");
    if (editPrice === "" || Number(editPrice) < 0) return alert("Room price must be a valid non-negative number");
    setSavingRoomId(editingRoom._id);
    try {
      const payload = new FormData();
      payload.append("guestHouseId", editGuestHouseId);
      payload.append("roomName", editRoomName.trim());
      payload.append("roomCount", editRoomCount);
      payload.append("price", editPrice);
      payload.append("services", editServices);
      payload.append("isActive", String(editIsActive));
      payload.append("replaceDetailedImages", String(replaceDetailedImages));
      if (editCoverImage) payload.append("coverImage", editCoverImage);
      editDetailedImages.forEach((img) => payload.append("detailedImage", img));

      const res = await api.put(`/api/guest-house-rooms/${editingRoom._id}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!res.data?.success) throw new Error(res.data?.message || "Failed to update room");
      const refreshed = await api.get(`/api/guest-house-rooms?guestHouseId=${form.guestHouseId}`);
      if (refreshed.data?.success) setRooms(refreshed.data.data || []);
      closeEditModal();
      alert("Room updated successfully");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      alert(err.response?.data?.message || err.message || "Failed to update room");
    } finally {
      setSavingRoomId(null);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Add Room Details</h2>
      <p className="mt-1 text-sm text-slate-600">
        Select a guest house and define room information with images and room services.
      </p>

      <form className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <Field label="Guest House *">
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.guestHouseId}
            onChange={(e) => updateField("guestHouseId", e.target.value)}
            required
            disabled={loadingGuestHouses || guestHouses.length === 0}
          >
            {guestHouses.length === 0 ? (
              <option value="">No guest houses available</option>
            ) : (
              guestHouses.map((house) => (
                <option key={house._id} value={house._id}>
                  {house.name}
                </option>
              ))
            )}
          </select>
        </Field>

        <Field label="Room Name *">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.roomName}
            onChange={(e) => updateField("roomName", e.target.value)}
            required
          />
        </Field>

        <Field label="How Many Rooms of This Type *">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="number"
            min={1}
            value={form.roomCount}
            onChange={(e) => updateField("roomCount", e.target.value)}
            required
          />
        </Field>

        <Field label="Room Services (comma separated)">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="WiFi, TV, AC, Balcony"
            value={form.services}
            onChange={(e) => updateField("services", e.target.value)}
          />
        </Field>

        <Field label="Price *">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="number"
            min={0}
            step="0.01"
            value={form.price}
            onChange={(e) => updateField("price", e.target.value)}
            required
          />
        </Field>

        <Field label="Cover Image *">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="file"
            accept="image/*"
            required
            onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
          />
        </Field>

        <Field label="Detailed Images *">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="file"
            accept="image/*"
            multiple
            required
            onChange={(e) => setDetailedImages(Array.from(e.target.files || []))}
          />
        </Field>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting || guestHouses.length === 0}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? "Adding..." : "Add Room Details"}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <h3 className="text-base font-semibold text-slate-900">Existing Room Entries (Editable)</h3>
        <div className="mt-3 space-y-3">
          {rooms.length === 0 ? (
            <p className="text-sm text-slate-500">No rooms added yet for this guest house.</p>
          ) : (
            rooms.map((room) => (
              <div
                key={room._id}
                className="cursor-pointer rounded-lg border p-3 hover:bg-slate-50"
                onClick={() => openEditModal(room)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{room.roomName}</p>
                    <p className="text-xs text-slate-600">
                      Count: {room.roomCount} | Price: ₹{Number(room.price || 0).toFixed(2)} | Detailed Images: {room.detailedImages?.length || 0}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">Click to edit</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Edit Room Details</h3>
              <button onClick={closeEditModal} className="text-xl text-slate-500">×</button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Parent Guest House *">
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={editGuestHouseId}
                  onChange={(e) => setEditGuestHouseId(e.target.value)}
                  required
                >
                  <option value="">Select guest house</option>
                  {guestHouses.map((house) => (
                    <option key={house._id} value={house._id}>
                      {house.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Room Name *">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={editRoomName}
                  onChange={(e) => setEditRoomName(e.target.value)}
                />
              </Field>

              <Field label="How Many Rooms of This Type *">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  type="number"
                  min={1}
                  value={editRoomCount}
                  onChange={(e) => setEditRoomCount(e.target.value)}
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Room Services (comma separated)">
                  <input
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={editServices}
                    onChange={(e) => setEditServices(e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Price *">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  type="number"
                  min={0}
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />
              </Field>

              <Field label="Replace Cover Image">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditCoverImage(e.target.files?.[0] || null)}
                />
              </Field>

              <Field label="Add/Replace Detailed Images">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setEditDetailedImages(Array.from(e.target.files || []))}
                />
              </Field>

              <div className="md:col-span-2">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={replaceDetailedImages}
                    onChange={(e) => setReplaceDetailedImages(e.target.checked)}
                  />
                  Replace existing detailed images with newly uploaded ones
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                  />
                  Active
                </label>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2">
                <button type="button" className="rounded border px-4 py-2 text-sm" onClick={closeEditModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  disabled={savingRoomId === editingRoom._id}
                  onClick={() => void updateRoom()}
                >
                  {savingRoomId === editingRoom._id ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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

