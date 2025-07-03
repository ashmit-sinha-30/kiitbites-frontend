"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import { VendorManagement } from "./components/VendorManagement";
import { AddVendorForm } from "./components/AddVendorForm";
import { DeleteVendorList } from "./components/DeleteVendorList";
// import { ImageUploadSection } from "./components/ImageUploadSection";
import { UploadItemForm } from "./components/UploadItemForm";
import ManageItems from "./components/ManageItems";
import styles from "./styles/InventoryReport.module.scss";

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
};

export default function UniDashboardPage() {
  const UNIVERSITY_ID = "68320fd75c6f79ec179ad3bb";

  const [activeSegment, setActiveSegment] = useState<string>("dashboard");

  useEffect(() => {
    const saved = localStorage.getItem("activeSegment");
    if (saved) setActiveSegment(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("activeSegment", activeSegment);
  }, [activeSegment]);

  return (
    <div className={styles.container}>
      <Sidebar
        active={activeSegment}
        onSegmentChange={setActiveSegment}
        universityName="KIIT University"
        universityId={UNIVERSITY_ID}
      />

      <main className={activeSegment === "dashboard" ? styles.dashboardMain : styles.main}>
        {/* Dashboard Segment: Vendor Management */}
        {activeSegment === "dashboard" && (
          <VendorManagement universityId={UNIVERSITY_ID} />
        )}

        {/* Add Vendor Segment */}
        {activeSegment === "add-vendor" && (
          <AddVendorForm universityId={UNIVERSITY_ID} />
        )}

        {/* Delete Vendor Segment */}
        {activeSegment === "delete-vendor" && (
          <DeleteVendorList universityId={UNIVERSITY_ID} />
        )}

        {/* Image Upload Section */}
        {/* {activeSegment === "dashboard" && (
          <ImageUploadSection universityId={UNIVERSITY_ID} />
        )} */}

        {/* Upload Item Segment */}
        {activeSegment === "addItem" && (
          <UploadItemForm universityId={UNIVERSITY_ID} />
        )}

        {/* Manage Items Segment */}
        {activeSegment === "manage-items" && (
          <ManageItems universityId={UNIVERSITY_ID} />
        )}

        {/* Other segments under construction */}
        {!["dashboard", "add-vendor", "delete-vendor", "addItem", "manage-items"].includes(activeSegment) && (
          <div className={styles.underConstruction}>
            {segmentsMap[activeSegment]
              ? segmentsMap[activeSegment]
              : activeSegment.replace(/-/g, " ")}{" "}
            is under construction.
          </div>
        )}
      </main>
    </div>
  );
} 