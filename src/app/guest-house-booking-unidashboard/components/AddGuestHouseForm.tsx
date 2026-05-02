"use client";

import React, { useState } from "react";
import api from "@/utils/apiUtils";

interface Props {
  onCreated?: () => void;
}

export default function AddGuestHouseForm({ onCreated }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [form, setForm] = useState({
    name: "",
    totalRooms: "",
    contactNumber: "",
    location: "",
    managerName: "",
    managerEmail: "",
    email: "",
    password: "",
    confirmPassword: "",
    description: "",
    amenities: "",
  });

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverImage) {
      alert("Please upload a guest house cover image.");
      return;
    }
    if (form.password.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      alert("Password and confirm password must match.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("name", form.name.trim());
      payload.append("totalRooms", String(Number(form.totalRooms)));
      payload.append("contactNumber", form.contactNumber.trim());
      payload.append("location", form.location.trim());
      payload.append("managerName", form.managerName.trim());
      payload.append("managerEmail", form.managerEmail.trim());
      payload.append("email", form.email.trim().toLowerCase());
      payload.append("password", form.password);
      payload.append("description", form.description.trim());
      payload.append("amenities", form.amenities);
      payload.append("coverImage", coverImage);
      additionalImages.forEach((image) => payload.append("additionalImages", image));

      const res = await api.post("/api/guest-house", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!res.data?.success) {
        throw new Error(res.data?.message || "Failed to create guest house");
      }

      setForm({
        name: "",
        totalRooms: "",
        contactNumber: "",
        location: "",
        managerName: "",
        managerEmail: "",
        email: "",
        password: "",
        confirmPassword: "",
        description: "",
        amenities: "",
      });
      setCoverImage(null);
      setAdditionalImages([]);
      onCreated?.();
      alert("Guest house created successfully");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      alert(err.response?.data?.message || err.message || "Failed to create guest house");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Add Guest House</h2>
      <p className="mt-1 text-sm text-slate-600">Create a new guest house for your university.</p>

      <form className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <Field label="Guest House Name *">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
          />
        </Field>

        <Field label="Number of Rooms *">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="number"
            min={1}
            value={form.totalRooms}
            onChange={(e) => updateField("totalRooms", e.target.value)}
            required
          />
        </Field>

        <Field label="Contact Number *">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.contactNumber}
            onChange={(e) => updateField("contactNumber", e.target.value)}
            required
          />
        </Field>

        <Field label="Location *">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.location}
            onChange={(e) => updateField("location", e.target.value)}
            required
          />
        </Field>

        <Field label="Manager Name">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.managerName}
            onChange={(e) => updateField("managerName", e.target.value)}
          />
        </Field>

        <Field label="Manager Email">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="email"
            value={form.managerEmail}
            onChange={(e) => updateField("managerEmail", e.target.value)}
          />
        </Field>

        <Field label="Guest House Login Email *">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            required
          />
        </Field>

        <Field label="Guest House Login Password *">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="password"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            required
          />
        </Field>

        <Field label="Confirm Password *">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
            required
          />
        </Field>

        <div className="md:col-span-2">
          <Field label="Amenities (comma separated)">
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="WiFi, Parking, AC, Laundry"
              value={form.amenities}
              onChange={(e) => updateField("amenities", e.target.value)}
            />
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label="Guest House Image (Cover) *">
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              type="file"
              accept="image/*"
              required
              onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
            />
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label="Additional Images (Optional)">
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setAdditionalImages(Array.from(e.target.files || []))}
            />
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label="Description">
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm"
              rows={4}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </Field>
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Guest House"}
          </button>
        </div>
      </form>
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

