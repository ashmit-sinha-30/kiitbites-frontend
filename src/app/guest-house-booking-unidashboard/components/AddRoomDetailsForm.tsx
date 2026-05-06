"use client";

import React, { useEffect, useState } from "react";
import api from "@/utils/apiUtils";
import AppDialog from "@/components/AppDialog";

type BedVariant = "none" | "single" | "double";

function parseRoomNameToBaseAndBed(roomName: string): { base: string; bed: BedVariant } {
  const name = String(roomName || "").trim();
  if (!name) return { base: "", bed: "none" };

  const compound = /^(.+?)\s*[—–\-]\s*(Single bedroom|Double bedroom)\s*$/i.exec(name);
  if (compound) {
    const base = compound[1].trim();
    const bed: BedVariant = /^single/i.test(compound[2]) ? "single" : "double";
    return { base: base || name, bed };
  }

  if (/^single bedroom$/i.test(name)) return { base: "General", bed: "single" };
  if (/^double bedroom$/i.test(name)) return { base: "General", bed: "double" };

  return { base: name, bed: "none" };
}

function buildRoomNameFromBaseAndBed(base: string, bed: BedVariant): string {
  const b = String(base || "").trim();
  if (!b) return "";
  if (bed === "none") return b;
  return `${b} — ${bed === "single" ? "Single bedroom" : "Double bedroom"}`;
}

function EditRoomNameField({
  roomName,
  onChange,
}: {
  roomName: string;
  onChange: (nextRoomName: string) => void;
}) {
  const parsed = parseRoomNameToBaseAndBed(roomName);
  const [base, setBase] = useState(parsed.base);
  const [bed, setBed] = useState<BedVariant>(parsed.bed);

  useEffect(() => {
    const p = parseRoomNameToBaseAndBed(roomName);
    setBase(p.base);
    setBed(p.bed);
     
  }, [roomName]);

  const preview = buildRoomNameFromBaseAndBed(base, bed);

  return (
    <div className="space-y-2">
      <Field label="Room Type (base name) *">
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="e.g. Suites"
          title="Base room type name"
          value={base}
          onChange={(e) => {
            const nextBase = e.target.value;
            setBase(nextBase);
            onChange(buildRoomNameFromBaseAndBed(nextBase, bed));
          }}
        />
      </Field>
      <Field label="Bed Type (optional)">
        <select
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={bed}
          onChange={(e) => {
            const nextBed = e.target.value as BedVariant;
            setBed(nextBed);
            onChange(buildRoomNameFromBaseAndBed(base, nextBed));
          }}
          title="If you choose Single/Double, it becomes a bed-variant under the base room type"
        >
          <option value="none">Not a bedroom variant</option>
          <option value="single">Single bedroom</option>
          <option value="double">Double bedroom</option>
        </select>
        <span className="block text-[11px] text-slate-500">
          Guests will see: <strong>{preview || "—"}</strong>
        </span>
      </Field>
    </div>
  );
}

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

interface RateRule {
  _id: string;
  startDate: string;
  endDate: string;
  overridePricePerNight: number | null;
  isBlackout: boolean;
  minNights: number;
  notes?: string;
  isActive: boolean;
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
    baseRoomTypeName: "",
    bedType: "none" as BedVariant,
    roomCount: "",
    price: "",
    services: "",
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [detailedImages, setDetailedImages] = useState<File[]>([]);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [rulesRoom, setRulesRoom] = useState<RoomItem | null>(null);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rules, setRules] = useState<RateRule[]>([]);
  const [newRule, setNewRule] = useState({
    startDate: "",
    endDate: "",
    overridePricePerNight: "",
    isBlackout: false,
    minNights: "1",
    notes: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogVariant, setDialogVariant] = useState<"info" | "error" | "confirm">("info");
  const [pendingDeleteRoom, setPendingDeleteRoom] = useState<RoomItem | null>(null);

  const showInfo = (message: string) => {
    setDialogVariant("info");
    setDialogMessage(message);
    setDialogOpen(true);
  };

  const showError = (message: string) => {
    setDialogVariant("error");
    setDialogMessage(message);
    setDialogOpen(true);
  };

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
    if (!form.guestHouseId) return showError("Please select a guest house.");
    if (!coverImage || detailedImages.length === 0)
      return showError("Cover image and at least one detailed image are required.");
    if (!form.roomCount || Number(form.roomCount) < 1) return showError("Please enter a valid room count.");
    if (form.price === "" || Number(form.price) < 0) return showError("Please enter a valid room price per night.");
    if (!form.baseRoomTypeName.trim()) return showError("Please enter a room type name (e.g. Suites).");

    setSubmitting(true);
    try {
      const roomName = buildRoomNameFromBaseAndBed(form.baseRoomTypeName, form.bedType);
      const payload = new FormData();
      payload.append("guestHouseId", form.guestHouseId);
      payload.append("roomName", roomName);
      payload.append("roomCount", form.roomCount);
      payload.append("price", form.price);
      payload.append("services", form.services);
      payload.append("coverImage", coverImage);
      detailedImages.forEach((image) => payload.append("detailedImage", image));

      const res = await api.post("/api/guest-house-rooms", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!res.data?.success) throw new Error(res.data?.message || "Failed to add room details");

      setForm((prev) => ({ ...prev, baseRoomTypeName: "", bedType: "none", roomCount: "", price: "", services: "" }));
      setCoverImage(null);
      setDetailedImages([]);
      const refreshed = await api.get(`/api/guest-house-rooms?guestHouseId=${form.guestHouseId}`);
      if (refreshed.data?.success) setRooms(refreshed.data.data || []);
      showInfo("Room details added successfully.");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      showError(err.response?.data?.message || err.message || "Failed to add room details.");
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
    if (!editGuestHouseId) return showError("Please select a parent guest house.");
    if (!editRoomCount || Number(editRoomCount) < 1) return showError("Room count must be at least 1.");
    if (editPrice === "" || Number(editPrice) < 0)
      return showError("Room price per night must be a valid non-negative number.");
    if (!editRoomName.trim()) return showError("Room name is required.");
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
      showInfo("Room updated successfully.");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      showError(err.response?.data?.message || err.message || "Failed to update room.");
    } finally {
      setSavingRoomId(null);
    }
  };

  const deleteRoom = async (room: RoomItem) => {
    setPendingDeleteRoom(room);
    setDialogVariant("confirm");
    setDialogMessage(
      room.isActive === false
        ? "Remove this deactivated room type permanently? (Only if the server has no blocking records.)"
        : "Delete this room type? If any active bookings use it, it will be deactivated instead of removed."
    );
    setDialogOpen(true);
  };

  const confirmDeleteRoom = async () => {
    const room = pendingDeleteRoom;
    if (!room) {
      setDialogOpen(false);
      return;
    }
    setDeletingRoomId(room._id);
    setDialogOpen(false);
    setPendingDeleteRoom(null);
    try {
      const res = await api.delete(`/api/guest-house-rooms/${room._id}`);
      if (!res.data?.success) throw new Error(res.data?.message || "Failed to delete room");
      showInfo(String(res.data?.message || "Room updated."));
      const refreshed = await api.get(`/api/guest-house-rooms?guestHouseId=${form.guestHouseId}`);
      if (refreshed.data?.success) setRooms(refreshed.data.data || []);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      showError(err.response?.data?.message || err.message || "Failed to delete room.");
    } finally {
      setDeletingRoomId(null);
    }
  };

  const openRules = async (room: RoomItem) => {
    setRulesRoom(room);
    setRules([]);
    setRulesLoading(true);
    try {
      const res = await api.get(`/api/guest-house-rooms/rate-rules?roomId=${room._id}`);
      if (res.data?.success) setRules(res.data.data || []);
    } catch {
      setRules([]);
    } finally {
      setRulesLoading(false);
    }
  };

  const createRule = async () => {
    if (!rulesRoom) return;
    try {
      const payload = {
        ...newRule,
        overridePricePerNight: newRule.overridePricePerNight === "" ? null : Number(newRule.overridePricePerNight),
      };
      const res = await api.post(`/api/guest-house-rooms/${rulesRoom._id}/rate-rules`, payload);
      if (!res.data?.success) throw new Error(res.data?.message || "Failed");
      await openRules(rulesRoom);
      setNewRule({
        startDate: "",
        endDate: "",
        overridePricePerNight: "",
        isBlackout: false,
        minNights: "1",
        notes: "",
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      showError(err.response?.data?.message || err.message || "Failed to create rate rule.");
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!rulesRoom) return;
    try {
      const res = await api.delete(`/api/guest-house-rooms/rate-rules/${ruleId}`);
      if (!res.data?.success) throw new Error(res.data?.message || "Failed");
      await openRules(rulesRoom);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      showError(err.response?.data?.message || err.message || "Failed to delete rate rule.");
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Add Room Details</h2>
      <p className="mt-1 text-sm text-slate-600">
        Define room types with photos and pricing, delete or deactivate types when needed, then map floors and physical units below for allocation on the guest-house dashboard.
      </p>

      <form className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <Field label="Guest House *">
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.guestHouseId}
            onChange={(e) => updateField("guestHouseId", e.target.value)}
            required
            disabled={loadingGuestHouses || guestHouses.length === 0}
            title="Which property these room types belong to"
          >
            {guestHouses.length === 0 ? (
              <option value="">No guest houses available — add one first</option>
            ) : (
              <>
                <option value="" disabled>
                  Select guest house…
                </option>
                {guestHouses.map((house) => (
                  <option key={house._id} value={house._id}>
                    {house.name}
                  </option>
                ))}
              </>
            )}
          </select>
          <span className="mt-1 block text-[11px] text-slate-500">Choose the parent guest house for this room type.</span>
        </Field>

        <Field label="Room Type (base name) *">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder='e.g. Suites, Deluxe Suite, Executive'
            title="Base room type name. You can optionally tag it as Single/Double below."
            value={form.baseRoomTypeName}
            onChange={(e) => updateField("baseRoomTypeName", e.target.value)}
            required
          />
          <span className="mt-1 block text-[11px] text-slate-500">
            Guests will see: <strong>{buildRoomNameFromBaseAndBed(form.baseRoomTypeName, form.bedType) || "—"}</strong>
          </span>
        </Field>

        <Field label="Bed Type (optional)">
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.bedType}
            onChange={(e) => updateField("bedType", e.target.value)}
            title="If you choose Single/Double, it becomes a bed-variant under the base room type"
          >
            <option value="none">Not a bedroom variant (no Single/Double)</option>
            <option value="single">Single bedroom</option>
            <option value="double">Double bedroom</option>
          </select>
          <span className="mt-1 block text-[11px] text-slate-500">
            Use this to create pairs like <span className="font-mono">Suites — Single bedroom</span> and{" "}
            <span className="font-mono">Suites — Double bedroom</span>.
          </span>
        </Field>

        <Field label="How Many Rooms of This Type *">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="number"
            min={1}
            placeholder="e.g. 5"
            title="Physical rooms of this exact type (capacity check)"
            value={form.roomCount}
            onChange={(e) => updateField("roomCount", e.target.value)}
            required
          />
        </Field>

        <Field label="Room Services (comma separated)">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="e.g. WiFi, TV, AC, Balcony"
            title="Comma-separated amenities for this room type"
            value={form.services}
            onChange={(e) => updateField("services", e.target.value)}
          />
        </Field>

        <Field label="Price Per Night *">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="number"
            min={0}
            step="0.01"
            placeholder="e.g. 2500"
            title="Price in ₹ per room per night"
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
            title="Main thumbnail for this room type"
            required
            onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
          />
          <span className="mt-1 block text-[11px] text-slate-500">One image — shown first in lists.</span>
        </Field>

        <Field label="Detailed Images *">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="file"
            accept="image/*"
            multiple
            title="Gallery photos for this room type"
            required
            onChange={(e) => setDetailedImages(Array.from(e.target.files || []))}
          />
          <span className="mt-1 block text-[11px] text-slate-500">One or more images — interior, bathroom, etc.</span>
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
        <h3 className="text-base font-semibold text-slate-900">Existing room types</h3>
        <p className="mt-1 text-xs text-slate-500">
          Edit pricing and images, or delete. Types with bookings are deactivated instead of removed.
        </p>
        <div className="mt-3 space-y-3">
          {rooms.length === 0 ? (
            <p className="text-sm text-slate-500">No rooms added yet for this guest house.</p>
          ) : (
            rooms.map((room) => {
              const parsed = parseRoomNameToBaseAndBed(room.roomName);
              const bedLabel =
                parsed.bed === "none" ? "" : parsed.bed === "single" ? "Single bedroom" : "Double bedroom";
              return (
              <div
                key={room._id}
                className={`rounded-lg border p-3 ${room.isActive === false ? "border-amber-200 bg-amber-50/40" : "bg-white"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {parsed.base}
                      {bedLabel ? (
                        <span className="ml-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-700 ring-1 ring-slate-200">
                          {bedLabel}
                        </span>
                      ) : null}
                    </p>
                    {room.isActive === false ? (
                      <span className="mt-1 inline-block rounded bg-amber-200 px-2 py-0.5 text-[10px] font-medium uppercase text-amber-900">
                        Inactive
                      </span>
                    ) : null}
                    <p className="mt-1 text-xs text-slate-600">
                      Count: {room.roomCount} | Price: ₹{Number(room.price || 0).toFixed(2)} / night | Gallery:{" "}
                      {room.detailedImages?.length || 0}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                      onClick={() => openEditModal(room)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-indigo-300 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                      onClick={() => void openRules(room)}
                    >
                      Yield rules
                    </button>
                    <button
                      type="button"
                      disabled={deletingRoomId === room._id}
                      className="rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      onClick={() => void deleteRoom(room)}
                    >
                      {deletingRoomId === room._id ? "…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>

      <p className="mt-8 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/60 p-4 text-sm text-indigo-950">
        Map physical slots and paint room categories in the <strong>Floor Plan</strong> service (touch-friendly grid).
      </p>

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
                  title="Move this room type to another guest house if needed"
                >
                  <option value="">— Select guest house —</option>
                  {guestHouses.map((house) => (
                    <option key={house._id} value={house._id}>
                      {house.name}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="md:col-span-2">
                <EditRoomNameField roomName={editRoomName} onChange={setEditRoomName} />
              </div>

              <Field label="How Many Rooms of This Type *">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  type="number"
                  min={1}
                  placeholder="e.g. 10"
                  title="Count of physical rooms of this type"
                  value={editRoomCount}
                  onChange={(e) => setEditRoomCount(e.target.value)}
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Room Services (comma separated)">
                  <input
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="e.g. WiFi, TV, AC"
                    title="Comma-separated services"
                    value={editServices}
                    onChange={(e) => setEditServices(e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Price Per Night *">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="e.g. 2500"
                  title="₹ per room per night"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />
              </Field>

              <Field label="Replace Cover Image">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  type="file"
                  accept="image/*"
                  title="Upload only if you want a new cover photo"
                  onChange={(e) => setEditCoverImage(e.target.files?.[0] || null)}
                />
                <span className="mt-1 block text-[11px] text-slate-500">Leave empty to keep the current cover.</span>
              </Field>

              <Field label="Add/Replace Detailed Images">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  type="file"
                  accept="image/*"
                  multiple
                  title="Add more photos or replace all if checked below"
                  onChange={(e) => setEditDetailedImages(Array.from(e.target.files || []))}
                />
                <span className="mt-1 block text-[11px] text-slate-500">Optional — tick replace below to swap all gallery images.</span>
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

      {rulesRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Yield Rules · {rulesRoom.roomName}</h3>
              <button onClick={() => setRulesRoom(null)} className="text-xl text-slate-500">×</button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="Start Date">
                <input type="date" className="w-full rounded-md border px-3 py-2 text-sm" value={newRule.startDate} onChange={(e) => setNewRule((p) => ({ ...p, startDate: e.target.value }))} />
              </Field>
              <Field label="End Date">
                <input type="date" className="w-full rounded-md border px-3 py-2 text-sm" value={newRule.endDate} onChange={(e) => setNewRule((p) => ({ ...p, endDate: e.target.value }))} />
              </Field>
              <Field label="Override Price/Night">
                <input type="number" min={0} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="leave blank for no override" value={newRule.overridePricePerNight} onChange={(e) => setNewRule((p) => ({ ...p, overridePricePerNight: e.target.value }))} />
              </Field>
              <Field label="Minimum Nights">
                <input type="number" min={1} className="w-full rounded-md border px-3 py-2 text-sm" value={newRule.minNights} onChange={(e) => setNewRule((p) => ({ ...p, minNights: e.target.value }))} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Notes">
                  <input className="w-full rounded-md border px-3 py-2 text-sm" value={newRule.notes} onChange={(e) => setNewRule((p) => ({ ...p, notes: e.target.value }))} />
                </Field>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={newRule.isBlackout} onChange={(e) => setNewRule((p) => ({ ...p, isBlackout: e.target.checked }))} />
                Blackout period (no booking allowed)
              </label>
            </div>
            <div className="mt-3 flex justify-end">
              <button className="rounded bg-slate-900 px-4 py-2 text-sm text-white" onClick={() => void createRule()}>
                Create rule
              </button>
            </div>
            <div className="mt-5">
              <h4 className="text-sm font-semibold text-slate-900">Existing rules</h4>
              {rulesLoading ? (
                <p className="mt-2 text-sm text-slate-500">Loading rules...</p>
              ) : rules.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No rules added.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {rules.map((rule) => (
                    <div key={rule._id} className="flex items-center justify-between rounded border p-2 text-sm">
                      <div>
                        <p className="font-medium">
                          {new Date(rule.startDate).toLocaleDateString()} - {new Date(rule.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-slate-600">
                          {rule.isBlackout ? "Blackout" : `Override: ${rule.overridePricePerNight ?? "none"}`} | Min nights: {rule.minNights}
                        </p>
                      </div>
                      <button className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700" onClick={() => void deleteRule(rule._id)}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AppDialog
        open={dialogOpen}
        message={dialogMessage}
        variant={dialogVariant}
        onConfirm={dialogVariant === "confirm" ? confirmDeleteRoom : () => setDialogOpen(false)}
        onCancel={dialogVariant === "confirm" ? () => {
          setDialogOpen(false);
          setPendingDeleteRoom(null);
        } : undefined}
      />
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

