"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";
import { VendorManagement } from "./components/VendorManagement";
import { AddVendorForm } from "./components/AddVendorForm";
// import { ImageUploadSection } from "./components/ImageUploadSection";
import { UploadItemForm } from "./components/UploadItemForm";
import ManageItems from "./components/ManageItems";
import ManageCharges from "./components/ManageCharges";
import Invoices from "./components/Invoices";
import styles from "./styles/InventoryReport.module.scss";
import { ENV_CONFIG } from "@/config/environment";

const segmentsMap: Record<string, string> = {
  dashboard: "Dashboard",
  "inventory-reports": "Inventory Reports",
  "retail-inventory": "Retail Inventory",
  "produce-inventory": "Produce Inventory",
  "delivery-orders": "Delivery Orders",
  "past-orders": "Past Orders",
  "uni-cart": "University Cart",
  // ...other segments
  "add-vendor": "Add Vendor",
  "delete-vendor": "Delete Vendor",
  "addItem": "Add Food Item",
  "manage-charges": "Manage Charges",
  logout: "Logout",
};

export default function UniDashboardPage() {
  const router = useRouter();
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [universityName, setUniversityName] = useState<string>("University");
  const [features, setFeatures] = useState<{ _id: string; name: string }[]>([]);
  const [services, setServices] = useState<{ _id: string; name: string; feature: { _id: string; name: string } }[]>([]);
  const [activeSegment, setActiveSegment] = useState<string>("dashboard");

  useEffect(() => {
    const saved = localStorage.getItem("activeSegment");
    if (saved) setActiveSegment(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("activeSegment", activeSegment);
  }, [activeSegment]);

  // Load university identity and assignments
  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const userRes = await fetch(`${ENV_CONFIG.BACKEND.URL}/api/uni/auth/user`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (userRes.ok) {
          const user = await userRes.json();
          const uniId = user._id || user.id;
          setUniversityId(uniId);
          setUniversityName(user.fullName || "University");
          const assignRes = await fetch(`${ENV_CONFIG.BACKEND.URL}/api/university/universities/${uniId}/assignments`);
          const assignJson = await assignRes.json();
          if (assignJson.success) {
            setFeatures(assignJson.data.features);
            setServices(assignJson.data.services);
          }
        }
      } catch (e) {
        console.error("Failed to init uni dashboard", e);
      }
    };
    init();
  }, []);

  const sidebarSegments = useMemo(() => {
    const serviceSegments = services.map((s) => ({ key: s._id, label: s.name, icon: <></> }));
    return [
      ...serviceSegments,
      { key: "logout", label: "Logout", icon: <></> },
    ];
  }, [services]);

  return (
    <div className={styles.container}>
      <Sidebar
        active={activeSegment}
        onSegmentChange={setActiveSegment}
        universityName={universityName}
        universityId={universityId || "—"}
        segments={sidebarSegments}
      />

      <main className={styles.main}>
        {/* Service-specific content mapping */}
        {(() => {
          const currentService = services.find((s) => s._id === activeSegment);
          const name = currentService?.name?.toLowerCase() || "";
          if (!name) return null;
          if (name === "uni dashboard" || name.includes("uni dashboard") || name === "dashboard") {
            return <VendorManagement universityId={universityId || ""} />;
          }
          if (name === "add vendor" || name.includes("add vendor")) {
            return <AddVendorForm universityId={universityId || ""} />;
          }
          if (name === "add food item" || name.includes("add food item")) {
            return <UploadItemForm universityId={universityId || ""} />;
          }
          if (name === "manage items" || name.includes("manage items")) {
            return <ManageItems universityId={universityId || ""} />;
          }
          if (name === "manage charges" || name.includes("manage charges")) {
            return <ManageCharges universityId={universityId || ""} />;
          }
          if (name === "invoice" || name.includes("invoice")) {
            return <Invoices universityId={universityId || ""} />;
          }
          return null;
        })()}

        {/* Add Vendor Segment */}
        {activeSegment === "add-vendor" && (
          <AddVendorForm universityId={universityId || ""} />
        )}

        {/* Upload Item Segment */}
        {activeSegment === "addItem" && (
          <UploadItemForm universityId={universityId || ""} />
        )}

        {/* Manage Items Segment */}
        {activeSegment === "manage-items" && (
          <ManageItems universityId={universityId || ""} />
        )}

        {/* Manage Charges Segment */}
        {activeSegment === "manage-charges" && (
          <ManageCharges universityId={universityId || ""} />
        )}
      </main>
    </div>
  );
} 