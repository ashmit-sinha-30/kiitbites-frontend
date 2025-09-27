"use client";

import React, { useEffect, useState } from "react";
import { ENV_CONFIG } from "@/config/environment";

interface Vendor {
  _id: string;
  fullName: string;
}

interface Props {
  universityId: string;
}

export default function Invoices({ universityId }: Props) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVendors = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch university to get its vendors
        const res = await fetch(`${ENV_CONFIG.BACKEND.URL}/admin/universities/${universityId}`);
        const json = await res.json();
        if (json.success) {
          const list: Vendor[] = (json.data.vendors || []).map((v: { vendorId: Vendor }) => v.vendorId).filter(Boolean);
          setVendors(list);
        } else {
          setError(json.message || "Failed to load vendors");
        }
      } catch {
        setError("Failed to load vendors");
      } finally {
        setLoading(false);
      }
    };
    if (universityId) loadVendors();
  }, [universityId]);

  const downloadVendorInvoices = async (vendorId: string) => {
    try {
      const res = await fetch(`${ENV_CONFIG.BACKEND.URL}/api/invoices/vendor/${vendorId}`);
      const json = await res.json();
      if (!json || !Array.isArray(json)) {
        alert("No invoices found for this vendor");
        return;
      }
      // If backend returns downloadable links, open them; otherwise provide basic list
      // Here we just open the first invoice if available
      if (json[0]?.cloudinaryUrl) {
        window.open(json[0].cloudinaryUrl, "_blank");
      } else if (json[0]?._id) {
        window.open(`${ENV_CONFIG.BACKEND.URL}/api/invoices/${json[0]._id}/download`, "_blank");
      } else {
        alert("No downloadable invoice found");
      }
    } catch {
      alert("Failed to download invoices");
    }
  };

  const downloadAllUniInvoices = () => {
    if (!universityId) return;
    window.open(`${ENV_CONFIG.BACKEND.URL}/api/invoices/university/${universityId}`, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <button
          className="border rounded px-3 py-1 text-sm hover:bg-gray-50"
          onClick={downloadAllUniInvoices}
        >
          Download All University Invoices
        </button>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading vendors…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {vendors.map((v) => (
          <div key={v._id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{v.fullName}</div>
              <div className="text-xs text-gray-500">ID: {v._id.slice(-8)}</div>
            </div>
            <button
              className="border rounded px-3 py-1 text-sm hover:bg-gray-50"
              onClick={() => downloadVendorInvoices(v._id)}
            >
              Download Invoices
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


