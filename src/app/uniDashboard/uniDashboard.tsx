"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import { VendorManagement } from "./components/VendorManagement";
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

        {/* Other segments under construction */}
        {activeSegment !== "dashboard" && (
          <div className={styles.underConstruction}>
            🚧{" "}
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