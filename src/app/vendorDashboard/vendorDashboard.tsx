// page.tsx (VendorDashboardPage)

"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import StatCard from "./components/StatCard";
import InventoryTable from "./components/InventoryTable";
import DateFilter from "./components/DateFilter";
import DownloadButton from "./components/DownloadButton";
import { OrderList } from "./components/OrderList";
import { PastOrdersList } from "./components/PastOrdersList";
import { DeliveryOrdersList } from "./components/DeliveryOrdersList";
import { VendorCartComponent } from "./components/VendorCart";
import { Order } from "./types";

// Import the new inventory components:
import { RetailInventory } from "./components/RetailInventory";
import { ProduceInventory } from "./components/ProduceInventory";

import styles from "./styles/InventoryReport.module.scss";
import { InventoryReport, transformApiReport } from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "<UNDEFINED>";

const segmentsMap: Record<string, string> = {
  dashboard: "Dashboard",
  "inventory-reports": "Inventory Reports",
  "retail-inventory": "Retail Inventory",
  "produce-inventory": "Produce Inventory",
  "delivery-orders": "Delivery Orders",
  "past-orders": "Past Orders",
  "vendor-cart": "Vendor Cart",
  // ...other segments
};

export default function VendorDashboardPage() {
  const VENDOR_ID = "6834622e10d75a5ba7b7740d";

  const [activeSegment, setActiveSegment] = useState<string>("dashboard");

  // State for managing order transitions between components
  const [orderStatusChanges, setOrderStatusChanges] = useState<{
    orderId: string;
    newStatus: string;
    orderData?: Order;
  }[]>([]);

  // Function to handle order status changes
  const handleOrderStatusChange = (orderId: string, newStatus: string, orderData?: Order) => {
    console.log(`Dashboard: Order status change - ID: ${orderId}, Status: ${newStatus}, Type: ${orderData?.orderType}`);
    setOrderStatusChanges(prev => [...prev, { orderId, newStatus, orderData }]);
    
    // Clear the change after a short delay to prevent memory leaks
    setTimeout(() => {
      setOrderStatusChanges(prev => prev.filter(change => change.orderId !== orderId));
    }, 5000);
  };

  useEffect(() => {
    const saved = localStorage.getItem("activeSegment");
    if (saved) setActiveSegment(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("activeSegment", activeSegment);
  }, [activeSegment]);

  // For sidebar vendor display from any loaded data
  const [vendorNameFromAPI, setVendorNameFromAPI] = useState<
    string | undefined
  >();
  const [vendorIdFromAPI, setVendorIdFromAPI] = useState<string | undefined>();

  // Inventory Reports state:
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [appliedDate, setAppliedDate] = useState(selectedDate);
  const [report, setReport] = useState<InventoryReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [errorReport, setErrorReport] = useState<string | null>(null);

  const fetchReport = async (date: string) => {
    setLoadingReport(true);
    setErrorReport(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/inventoryreport/vendor/${VENDOR_ID}?date=${date}`
      );
      const json = await res.json();
      if (!json.success) {
        setReport(null);
        setErrorReport("No report found for the selected date.");
        return;
      }
      setReport(transformApiReport(json.data));
      // update sidebar vendor info
      if (
        json.data.vendor &&
        json.data.vendor.fullName &&
        json.data.vendor._id
      ) {
        setVendorNameFromAPI(json.data.vendor.fullName);
        setVendorIdFromAPI(json.data.vendor._id);
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorReport(err instanceof Error ? err.message : "Unknown error");
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (activeSegment === "inventory-reports") {
      fetchReport(appliedDate);
    }
  }, [appliedDate, activeSegment]);

  const applyFilter = () => {
    setAppliedDate(selectedDate);
  };

  // Common onLoaded handler for retail/produce/orders to update sidebar
  const handleOnLoaded = (vendorName: string, vendorId: string) => {
    setVendorNameFromAPI(vendorName);
    setVendorIdFromAPI(vendorId);
  };

  return (
    <div className={styles.container}>
      <Sidebar
        active={activeSegment}
        onSegmentChange={setActiveSegment}
        vendorName={report?.vendorName || vendorNameFromAPI}
        vendorId={report?.vendorId || vendorIdFromAPI}
      />

      <main className={styles.main}>
        {/* Dashboard Segment: Active Orders */}
        {activeSegment === "dashboard" && (
          <>
            <div className={styles.header}>
              <h1>Active Orders</h1>
              <p>Manage your incoming orders in real-time</p>
            </div>
            <OrderList 
              onLoaded={handleOnLoaded} 
              onOrderStatusChange={handleOrderStatusChange}
              orderStatusChanges={orderStatusChanges}
            />
          </>
        )}

        {/* Retail Inventory Segment */}
        {activeSegment === "retail-inventory" && (
          <>
            <div className={styles.header}>
              <h1>Retail Inventory</h1>
              <p>Manage your packaged items</p>
            </div>
            <RetailInventory vendorId={VENDOR_ID} onLoaded={handleOnLoaded} />
          </>
        )}

        {/* Produce Inventory Segment */}
        {activeSegment === "produce-inventory" && (
          <>
            <div className={styles.header}>
              <h1>Produce Inventory</h1>
              <p>Manage your fresh produce items</p>
            </div>
            <ProduceInventory vendorId={VENDOR_ID} onLoaded={handleOnLoaded} />
          </>
        )}

        {/* Inventory Reports Segment */}
        {activeSegment === "inventory-reports" && (
          <>
            <div className={styles.header}>
              <h1>Inventory Reports</h1>
              <p>View and export detailed inventory reports</p>
            </div>
            <div className={styles.topBar}>
              <div className={styles.stats}>
                {report ? (
                  <>
                    <StatCard
                      label="Total Items Tracked"
                      value={report.stats.totalTracked}
                    />
                    <StatCard
                      label="Items Sold Today"
                      value={report.stats.soldToday}
                      positive
                    />
                    <StatCard
                      label="Items Received"
                      value={report.stats.receivedToday}
                    />
                  </>
                ) : (
                  <div>Loading stats…</div>
                )}
              </div>
              <div className={styles.controls}>
                <DateFilter
                  date={selectedDate}
                  onChange={setSelectedDate}
                  onFilter={applyFilter}
                />
                {report && (
                  <DownloadButton
                    vendorName={report.vendorName}
                    reportDate={report.reportDate}
                    stats={report.stats}
                    items={report.items}
                  />
                )}
              </div>
            </div>
            {loadingReport ? (
              <p>Loading report…</p>
            ) : errorReport ? (
              <p className={styles.error}>{errorReport}</p>
            ) : report ? (
              <InventoryTable
                items={report.items ?? []}
                date={report.reportDate}
              />
            ) : (
              <p>No report data available.</p>
            )}
          </>
        )}

        {/* Past Orders Segment */}
        {activeSegment === "past-orders" && (
          <>
            <div className={styles.header}>
              <h1>Past Orders</h1>
              <p>View and manage past orders</p>
            </div>
            <PastOrdersList onLoaded={handleOnLoaded} />
          </>
        )}

        {/* Delivery Orders Segment */}
        {activeSegment === "delivery-orders" && (
          <>
            <div className={styles.header}>
              <h1>Delivery Orders</h1>
              <p>Manage your delivery orders</p>
            </div>
            <DeliveryOrdersList 
              onLoaded={handleOnLoaded} 
              onOrderStatusChange={handleOrderStatusChange}
              orderStatusChanges={orderStatusChanges}
            />
          </>
        )}

        {/* Vendor Cart Segment */}
        {activeSegment === "vendor-cart" && (
          <>
            <div className={styles.header}>
              <h1>Vendor Cart</h1>
              <p>Create orders for customers directly</p>
            </div>
            <VendorCartComponent vendorId={VENDOR_ID} onLoaded={handleOnLoaded} />
          </>
        )}

        {/* Other segments under construction */}
        {activeSegment !== "dashboard" &&
          activeSegment !== "inventory-reports" &&
          activeSegment !== "retail-inventory" &&
          activeSegment !== "produce-inventory" &&
          activeSegment !== "past-orders" &&
          activeSegment !== "delivery-orders" &&
          activeSegment !== "vendor-cart" && (
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
