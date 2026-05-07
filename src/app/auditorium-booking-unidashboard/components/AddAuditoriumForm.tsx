"use client";

import React, { useState } from "react";
import api from "@/utils/apiUtils";

export default function AddAuditoriumForm({ onCreated }: { onCreated?: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [form, setForm] = useState({
    name: "",
    sittingSpace: "",
    pricePerDay: "",
    location: "",
    contactNumber: "",
    amenities: "",
    rules: "",
    description: "",
  });

  const updateField = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverImage) return alert("Please upload an auditorium cover image.");
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("name", form.name.trim());
      payload.append("sittingSpace", String(Number(form.sittingSpace)));
      payload.append("pricePerDay", String(Number(form.pricePerDay)));
      payload.append("location", form.location.trim());
      payload.append("contactNumber", form.contactNumber.trim());
      payload.append("amenities", form.amenities.trim());
      payload.append("rules", form.rules.trim());
      payload.append("description", form.description.trim());
      payload.append("coverImage", coverImage);
      additionalImages.forEach((img) => payload.append("additionalImages", img));
      const res = await api.post("/api/auditoriums", payload, { headers: { "Content-Type": "multipart/form-data" } });
      if (!res.data?.success) throw new Error(res.data?.message || "Failed to create auditorium");
      setForm({ name: "", sittingSpace: "", pricePerDay: "", location: "", contactNumber: "", amenities: "", rules: "", description: "" });
      setCoverImage(null);
      setAdditionalImages([]);
      onCreated?.();
      alert("Auditorium created successfully");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      alert(err.response?.data?.message || err.message || "Failed to create auditorium");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Add Auditorium</h2>
      <form className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <input className="rounded-md border px-3 py-2 text-sm" placeholder="Auditorium name" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
        <input className="rounded-md border px-3 py-2 text-sm" type="number" min={1} placeholder="Sitting space" value={form.sittingSpace} onChange={(e) => updateField("sittingSpace", e.target.value)} required />
        <input className="rounded-md border px-3 py-2 text-sm" type="number" min={0} placeholder="Price per day (INR)" value={form.pricePerDay} onChange={(e) => updateField("pricePerDay", e.target.value)} required />
        <input className="rounded-md border px-3 py-2 text-sm" placeholder="Location" value={form.location} onChange={(e) => updateField("location", e.target.value)} required />
        <input className="rounded-md border px-3 py-2 text-sm" placeholder="Contact number" value={form.contactNumber} onChange={(e) => updateField("contactNumber", e.target.value)} required />
        <input className="md:col-span-2 rounded-md border px-3 py-2 text-sm" placeholder="Amenities (comma separated)" value={form.amenities} onChange={(e) => updateField("amenities", e.target.value)} />
        <textarea className="md:col-span-2 rounded-md border px-3 py-2 text-sm" rows={3} placeholder="Rules / usage policy" value={form.rules} onChange={(e) => updateField("rules", e.target.value)} />
        <textarea className="md:col-span-2 rounded-md border px-3 py-2 text-sm" rows={4} placeholder="Description" value={form.description} onChange={(e) => updateField("description", e.target.value)} />
        <input className="md:col-span-2 rounded-md border px-3 py-2 text-sm" type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0] || null)} required />
        <input className="md:col-span-2 rounded-md border px-3 py-2 text-sm" type="file" accept="image/*" multiple onChange={(e) => setAdditionalImages(Array.from(e.target.files || []))} />
        <div className="md:col-span-2 flex justify-end">
          <button type="submit" disabled={submitting} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {submitting ? "Creating..." : "Create Auditorium"}
          </button>
        </div>
      </form>
    </div>
  );
}
