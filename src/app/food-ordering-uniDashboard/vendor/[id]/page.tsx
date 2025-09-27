"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../styles/VendorManagement.module.scss";
import * as XLSX from "xlsx";
import Modal from "react-modal";
import { VendorMenuManagement } from "../../components/VendorMenuManagement";
import VendorAnalytics from "../../components/VendorAnalytics";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface Vendor {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  location?: string;
  isAvailable: "Y" | "N";
}

interface Order {
  _id?: string;
  orderId?: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  orderType: string;
  total: number;
  items: { 
    name: string; 
    quantity: number;
    price?: number;
    unit?: string;
    type?: string;
  }[];
}

interface InventoryItem {
  name: string;
  opening: number;
  received: number;
  sold: number;
  closing: number;
  itemType: string;
}

// Add interface for inventory report entries
interface InventoryReportEntry {
  item?: {
    _id: string;
    name: string;
  };
  openingQty?: number;
  receivedQty?: number;
  soldQty?: number;
  closingQty?: number;
}

interface RawInventoryReportEntry {
  item?: {
    _id: string;
    name: string;
    unit?: string;
  };
  openingQty?: number;
  closingQty?: number;
}

export default function VendorMenuPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: vendorId } = React.use(params);
  const [universityId, setUniversityId] = useState<string>("");

  // Load logged-in university id
  useEffect(() => {
    async function loadUni() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${BACKEND_URL}/api/uni/auth/user`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (!res.ok) return;
        const user = await res.json();
        setUniversityId(user._id || user.id || "");
      } catch {
        // ignore
      }
    }
    loadUni();
  }, []);

  // Vendor details
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [vendorLoading, setVendorLoading] = useState(true);
  const [vendorError, setVendorError] = useState<string | null>(null);
  const [updatingVendor, setUpdatingVendor] = useState(false);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Inventory
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  // Inventory report download
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [downloading, setDownloading] = useState(false);

  // Available dates
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [datesLoading, setDatesLoading] = useState(true);
  const [datesError, setDatesError] = useState<string | null>(null);

  // Show all dates
  const [showAllDates, setShowAllDates] = useState(false);
  const maxVisibleDates = 5;

  // Edit vendor
  const [showEditModal, setShowEditModal] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch vendor details
  useEffect(() => {
    async function fetchVendor() {
      setVendorLoading(true);
      setVendorError(null);
      try {
        const res = await fetch(`${BACKEND_URL}/api/vendor/availability/uni/${universityId}`);
        if (!res.ok) throw new Error("Failed to fetch vendor details");
        const data = await res.json();
        const found = data.find((v: Vendor) => v._id === vendorId);
        setVendor(found || null);
      } catch {
        setVendorError("Failed to fetch vendor details");
      } finally {
        setVendorLoading(false);
      }
    }
    if (vendorId && universityId) fetchVendor();
  }, [vendorId, universityId]);

  // Toggle vendor availability
  async function toggleVendorAvailability() {
    if (!vendor) return;
    setUpdatingVendor(true);
    try {
      const newStatus = vendor.isAvailable === "Y" ? "N" : "Y";
      const res = await fetch(
        `${BACKEND_URL}/api/vendor/availability/uni/${universityId}/vendor/${vendorId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isAvailable: newStatus }),
        }
      );
      if (!res.ok) throw new Error("Failed to update vendor");
      setVendor((prev) => prev ? { ...prev, isAvailable: newStatus } : prev);
    } catch  {
      alert("Failed to update vendor availability");
    } finally {
      setUpdatingVendor(false);
    }
  }

  // Fetch current orders
  useEffect(() => {
    async function fetchOrders() {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const res = await fetch(`${BACKEND_URL}/order/vendor/${vendorId}/active`);
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();
        console.log("Orders data received:", data);
        console.log("Orders array:", data.orders);
        if (data.orders && data.orders.length > 0) {
          console.log("First order:", data.orders[0]);
          console.log("First order total:", data.orders[0].total);
        }
        setOrders(data.orders || []);
      } catch {
        setOrdersError("Failed to fetch orders");
      } finally {
        setOrdersLoading(false);
      }
    }
    if (vendorId) fetchOrders();
  }, [vendorId]);

  // Fetch inventory report (today)
  useEffect(() => {
    async function fetchInventory() {
      setInventoryLoading(true);
      setInventoryError(null);
      try {
        const today = new Date().toISOString().slice(0, 10);
        const res = await fetch(`${BACKEND_URL}/inventoryreport/vendor/${vendorId}?date=${today}`);
        if (!res.ok) throw new Error("Failed to fetch inventory report");
        const data = await res.json();
        setInventory(data.data?.items || []);
      } catch {
        setInventoryError("Failed to fetch inventory report");
      } finally {
        setInventoryLoading(false);
      }
    }
    if (vendorId) fetchInventory();
  }, [vendorId]);

  // Fetch available dates
  useEffect(() => {
    async function fetchDates() {
      setDatesLoading(true);
      setDatesError(null);
      try {
        const res = await fetch(`${BACKEND_URL}/inventoryreport/vendor/${vendorId}/dates`);
        if (!res.ok) throw new Error("Failed to fetch report dates");
        const data = await res.json();
        setAvailableDates(data.dates || []);
      } catch {
        setDatesError("Failed to fetch report dates");
      } finally {
        setDatesLoading(false);
      }
    }
    if (vendorId) fetchDates();
  }, [vendorId]);

  // Download inventory report for selected date
  async function downloadReport() {
    setDownloading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/inventoryreport/vendor/${vendorId}?date=${reportDate}`);
      if (!res.ok) throw new Error("Failed to fetch inventory report");
      const data = await res.json();
      
      // Combine retail, produce, and raw entries
      const retailEntries = data.data?.retailEntries || [];
      const produceEntries = data.data?.produceEntries || [];
      const rawEntries = data.data?.rawEntries || [];
      
      if (!retailEntries.length && !produceEntries.length && !rawEntries.length) {
        alert("No report data for this date.");
        return;
      }
      
      // Build comprehensive sheet data
      const sheetData: (string | number)[][] = [];

      // Header with vendor info
      const vendorName = data.data?.vendor?.fullName || "Unknown Vendor";
      sheetData.push([`${vendorName} - Inventory Report`]);
      sheetData.push([`Date: ${new Date(reportDate).toLocaleDateString()}`]);
      sheetData.push([]); // Empty row

      // Stats section
      const totalItems = retailEntries.length + produceEntries.length + rawEntries.length;
      const totalSold = retailEntries.reduce((sum: number, entry: InventoryReportEntry) => sum + (entry.soldQty || 0), 0) +
                       produceEntries.reduce((sum: number, entry: InventoryReportEntry) => sum + (entry.soldQty || 0), 0);
      const totalReceived = retailEntries.reduce((sum: number, entry: InventoryReportEntry) => sum + (entry.receivedQty || 0), 0);

      sheetData.push(["SUMMARY STATISTICS"]);
      sheetData.push(["Metric", "Value"]);
      sheetData.push(["Total Items Tracked", totalItems]);
      sheetData.push(["Items Sold Today", totalSold]);
      sheetData.push(["Items Received", totalReceived]);
      sheetData.push([]); // Empty row

      // Retail Inventory Section
      sheetData.push(["RETAIL INVENTORY"]);
      sheetData.push([
        "Item Name",
        "Opening Stock",
        "Received",
        "Sold",
        "Closing Stock"
      ]);
      
      if (retailEntries.length === 0) {
        sheetData.push(["No retail items found", "", "", "", ""]);
      } else {
        retailEntries.forEach((entry: InventoryReportEntry) => {
          sheetData.push([
            entry.item?.name || "Unknown Item",
            entry.openingQty || 0,
            entry.receivedQty || 0,
            entry.soldQty || 0,
            entry.closingQty || 0
          ]);
        });
      }
      sheetData.push([]); // Empty row

      // Produce Inventory Section
      sheetData.push(["PRODUCE INVENTORY"]);
      sheetData.push(["Item Name", "Times Sold"]);
      
      if (produceEntries.length === 0) {
        sheetData.push(["No produce items found", ""]);
      } else {
        produceEntries.forEach((entry: InventoryReportEntry) => {
          sheetData.push([
            entry.item?.name || "Unknown Item",
            entry.soldQty || 0
          ]);
        });
      }
      sheetData.push([]); // Empty row

      // Raw Material Inventory Section
      sheetData.push(["RAW MATERIAL INVENTORY"]);
      sheetData.push([
        "Item Name",
        "Opening Amount",
        "Closing Amount",
        "Unit"
      ]);
      
      if (rawEntries.length === 0) {
        sheetData.push(["No raw material items found", "", "", ""]);
      } else {
        rawEntries.forEach((entry: RawInventoryReportEntry) => {
          sheetData.push([
            entry.item?.name || "Unknown Item",
            entry.openingQty || 0,
            entry.closingQty || 0,
            entry.item?.unit || "-"
          ]);
        });
      }
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      // Apply styling and formatting
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      
      // Define styles for different sections
      const styles = {
        header: {
          font: { bold: true, size: 14, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1976D2" } },
          alignment: { horizontal: "center" }
        },
        sectionHeader: {
          font: { bold: true, size: 12, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1976D2" } },
          alignment: { horizontal: "left" }
        },
        retailHeader: {
          font: { bold: true, size: 11, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1976D2" } },
          alignment: { horizontal: "center" }
        },
        produceHeader: {
          font: { bold: true, size: 11, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "388E3C" } },
          alignment: { horizontal: "center" }
        },
        rawHeader: {
          font: { bold: true, size: 11, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "F57C00" } },
          alignment: { horizontal: "center" }
        },
        retailRow: {
          fill: { fgColor: { rgb: "E3F2FD" } }
        },
        produceRow: {
          fill: { fgColor: { rgb: "E8F5E8" } }
        },
        rawRow: {
          fill: { fgColor: { rgb: "FFF3E0" } }
        }
      };

      // Apply styles to cells
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = ws[cellAddress];
          
          if (cell) {
            const cellValue = cell.v?.toString() || '';
            
            // Main header (vendor name)
            if (R === 0) {
              cell.s = styles.header;
            }
            // Date row
            else if (R === 1) {
              cell.s = { font: { bold: true, size: 12 } };
            }
            // Summary Statistics header
            else if (cellValue === "SUMMARY STATISTICS") {
              cell.s = styles.sectionHeader;
            }
            // Retail Inventory header
            else if (cellValue === "RETAIL INVENTORY") {
              cell.s = { ...styles.sectionHeader, fill: { fgColor: { rgb: "1976D2" } } };
            }
            // Produce Inventory header
            else if (cellValue === "PRODUCE INVENTORY") {
              cell.s = { ...styles.sectionHeader, fill: { fgColor: { rgb: "388E3C" } } };
            }
            // Raw Material Inventory header
            else if (cellValue === "RAW MATERIAL INVENTORY") {
              cell.s = { ...styles.sectionHeader, fill: { fgColor: { rgb: "F57C00" } } };
            }
            // Retail table headers
            else if (R === 12 && C <= 4) {
              cell.s = styles.retailHeader;
            }
            // Produce table headers
            else if (cellValue === "Item Name" && R > 15 && R < 20) {
              cell.s = styles.produceHeader;
            }
            // Raw table headers
            else if (cellValue === "Item Name" && R > 20) {
              cell.s = styles.rawHeader;
            }
            // Retail data rows
            else if (R > 12 && R < 12 + retailEntries.length + 1 && retailEntries.length > 0) {
              cell.s = styles.retailRow;
            }
            // Produce data rows
            else if (R > 16 && R < 16 + produceEntries.length + 1 && produceEntries.length > 0) {
              cell.s = styles.produceRow;
            }
            // Raw data rows
            else if (R > 20 && R < 20 + rawEntries.length + 1 && rawEntries.length > 0) {
              cell.s = styles.rawRow;
            }
          }
        }
      }

      // Set column widths
      ws['!cols'] = [
        { width: 25 }, // Item Name
        { width: 15 }, // Opening Stock/Amount
        { width: 15 }, // Received/Closing Amount
        { width: 15 }, // Sold/Unit
        { width: 15 }  // Closing Stock
      ];

      // Generate automatic filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '_');
      const filename = `${vendorName}_Inventory_${timestamp}.xlsx`;

      XLSX.utils.book_append_sheet(wb, ws, "Inventory Report");
      XLSX.writeFile(wb, filename);
    } catch {
      alert("Failed to download report");
    } finally {
      setDownloading(false);
    }
  }

  // Download inventory report for a specific date
  async function downloadReportForDate(date: string) {
    setDownloading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/inventoryreport/vendor/${vendorId}?date=${date}`);
      if (!res.ok) throw new Error("Failed to fetch inventory report");
      const data = await res.json();
      
      // Combine retail, produce, and raw entries
      const retailEntries = data.data?.retailEntries || [];
      const produceEntries = data.data?.produceEntries || [];
      const rawEntries = data.data?.rawEntries || [];
      
      if (!retailEntries.length && !produceEntries.length && !rawEntries.length) {
        alert("No report data for this date.");
        return;
      }
      
      // Build comprehensive sheet data
      const sheetData: (string | number)[][] = [];

      // Header with vendor info
      const vendorName = data.data?.vendor?.fullName || "Unknown Vendor";
      sheetData.push([`${vendorName} - Inventory Report`]);
      sheetData.push([`Date: ${new Date(date).toLocaleDateString()}`]);
      sheetData.push([]); // Empty row

      // Stats section
      const totalItems = retailEntries.length + produceEntries.length + rawEntries.length;
      const totalSold = retailEntries.reduce((sum: number, entry: InventoryReportEntry) => sum + (entry.soldQty || 0), 0) +
                       produceEntries.reduce((sum: number, entry: InventoryReportEntry) => sum + (entry.soldQty || 0), 0);
      const totalReceived = retailEntries.reduce((sum: number, entry: InventoryReportEntry) => sum + (entry.receivedQty || 0), 0);

      sheetData.push(["SUMMARY STATISTICS"]);
      sheetData.push(["Metric", "Value"]);
      sheetData.push(["Total Items Tracked", totalItems]);
      sheetData.push(["Items Sold Today", totalSold]);
      sheetData.push(["Items Received", totalReceived]);
      sheetData.push([]); // Empty row

      // Retail Inventory Section
      sheetData.push(["RETAIL INVENTORY"]);
      sheetData.push([
        "Item Name",
        "Opening Stock",
        "Received",
        "Sold",
        "Closing Stock"
      ]);
      
      if (retailEntries.length === 0) {
        sheetData.push(["No retail items found", "", "", "", ""]);
      } else {
        retailEntries.forEach((entry: InventoryReportEntry) => {
          sheetData.push([
            entry.item?.name || "Unknown Item",
            entry.openingQty || 0,
            entry.receivedQty || 0,
            entry.soldQty || 0,
            entry.closingQty || 0
          ]);
        });
      }
      sheetData.push([]); // Empty row

      // Produce Inventory Section
      sheetData.push(["PRODUCE INVENTORY"]);
      sheetData.push(["Item Name", "Times Sold"]);
      
      if (produceEntries.length === 0) {
        sheetData.push(["No produce items found", ""]);
      } else {
        produceEntries.forEach((entry: InventoryReportEntry) => {
          sheetData.push([
            entry.item?.name || "Unknown Item",
            entry.soldQty || 0
          ]);
        });
      }
      sheetData.push([]); // Empty row

      // Raw Material Inventory Section
      sheetData.push(["RAW MATERIAL INVENTORY"]);
      sheetData.push([
        "Item Name",
        "Opening Amount",
        "Closing Amount",
        "Unit"
      ]);
      
      if (rawEntries.length === 0) {
        sheetData.push(["No raw material items found", "", "", ""]);
      } else {
        rawEntries.forEach((entry: RawInventoryReportEntry) => {
          sheetData.push([
            entry.item?.name || "Unknown Item",
            entry.openingQty || 0,
            entry.closingQty || 0,
            entry.item?.unit || "-"
          ]);
        });
      }
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      // Apply styling and formatting
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      
      // Define styles for different sections
      const styles = {
        header: {
          font: { bold: true, size: 14, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1976D2" } },
          alignment: { horizontal: "center" }
        },
        sectionHeader: {
          font: { bold: true, size: 12, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1976D2" } },
          alignment: { horizontal: "left" }
        },
        retailHeader: {
          font: { bold: true, size: 11, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1976D2" } },
          alignment: { horizontal: "center" }
        },
        produceHeader: {
          font: { bold: true, size: 11, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "388E3C" } },
          alignment: { horizontal: "center" }
        },
        rawHeader: {
          font: { bold: true, size: 11, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "F57C00" } },
          alignment: { horizontal: "center" }
        },
        retailRow: {
          fill: { fgColor: { rgb: "E3F2FD" } }
        },
        produceRow: {
          fill: { fgColor: { rgb: "E8F5E8" } }
        },
        rawRow: {
          fill: { fgColor: { rgb: "FFF3E0" } }
        }
      };

      // Apply styles to cells
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = ws[cellAddress];
          
          if (cell) {
            const cellValue = cell.v?.toString() || '';
            
            // Main header (vendor name)
            if (R === 0) {
              cell.s = styles.header;
            }
            // Date row
            else if (R === 1) {
              cell.s = { font: { bold: true, size: 12 } };
            }
            // Summary Statistics header
            else if (cellValue === "SUMMARY STATISTICS") {
              cell.s = styles.sectionHeader;
            }
            // Retail Inventory header
            else if (cellValue === "RETAIL INVENTORY") {
              cell.s = { ...styles.sectionHeader, fill: { fgColor: { rgb: "1976D2" } } };
            }
            // Produce Inventory header
            else if (cellValue === "PRODUCE INVENTORY") {
              cell.s = { ...styles.sectionHeader, fill: { fgColor: { rgb: "388E3C" } } };
            }
            // Raw Material Inventory header
            else if (cellValue === "RAW MATERIAL INVENTORY") {
              cell.s = { ...styles.sectionHeader, fill: { fgColor: { rgb: "F57C00" } } };
            }
            // Retail table headers
            else if (R === 12 && C <= 4) {
              cell.s = styles.retailHeader;
            }
            // Produce table headers
            else if (cellValue === "Item Name" && R > 15 && R < 20) {
              cell.s = styles.produceHeader;
            }
            // Raw table headers
            else if (cellValue === "Item Name" && R > 20) {
              cell.s = styles.rawHeader;
            }
            // Retail data rows
            else if (R > 12 && R < 12 + retailEntries.length + 1 && retailEntries.length > 0) {
              cell.s = styles.retailRow;
            }
            // Produce data rows
            else if (R > 16 && R < 16 + produceEntries.length + 1 && produceEntries.length > 0) {
              cell.s = styles.produceRow;
            }
            // Raw data rows
            else if (R > 20 && R < 20 + rawEntries.length + 1 && rawEntries.length > 0) {
              cell.s = styles.rawRow;
            }
          }
        }
      }

      // Set column widths
      ws['!cols'] = [
        { width: 25 }, // Item Name
        { width: 15 }, // Opening Stock/Amount
        { width: 15 }, // Received/Closing Amount
        { width: 15 }, // Sold/Unit
        { width: 15 }  // Closing Stock
      ];

      // Generate automatic filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '_');
      const filename = `${vendorName}_Inventory_${timestamp}.xlsx`;

      XLSX.utils.book_append_sheet(wb, ws, "Inventory Report");
      XLSX.writeFile(wb, filename);
    } catch {
      alert("Failed to download report");
    } finally {
      setDownloading(false);
    }
  }

  async function handleDeleteVendor() {
    setDeleteLoading(true);
    setSuccessMsg("");
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/vendor/delete/uni/${universityId}/vendor/${vendorId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete vendor");
      setSuccessMsg("Vendor deleted successfully.");
      setShowDeleteModal(false);
      setTimeout(() => router.push("/uniDashboard"), 1200);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete vendor");
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleEditVendor() {
    setEditVendor(vendor);
    setShowEditModal(true);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editVendor) return;
    setEditLoading(true);
    setSuccessMsg("");
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/vendor/update/${editVendor._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editVendor),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update vendor");
      setSuccessMsg("Vendor updated successfully.");
      setVendor(editVendor);
      setShowEditModal(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update vendor");
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.vendorDetailHeader}>
        <button onClick={() => router.back()} className={styles.retryButton}>
          ← Back
        </button>
        <h2 className={styles.vendorDetailTitle}>Vendor Details</h2>
      </div>

      {/* Vendor Info Card */}
      <section className={styles.section} style={{ marginBottom: 24 }}>
        {vendorLoading ? (
          <div>Loading vendor details...</div>
        ) : vendorError ? (
          <div style={{ color: "#dc3545" }}>{vendorError}</div>
        ) : vendor ? (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24, justifyContent: "space-between" }}>
            <div style={{ minWidth: 220 }}>
              <div style={{ fontWeight: 600, fontSize: 20, color: "#4ea199" }}>{vendor.fullName}</div>
              <div style={{ color: "#888", fontSize: 14 }}>ID: {vendor._id}</div>
              <div style={{ color: "#444", marginTop: 8 }}>Email: <b>{vendor.email}</b></div>
              <div style={{ color: "#444" }}>Phone: <b>{vendor.phone}</b></div>
              {vendor.location && <div style={{ color: "#444" }}>Location: <b>{vendor.location}</b></div>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
              <span className={vendor.isAvailable === "Y" ? styles.statusBadge + " " + styles.available : styles.statusBadge + " " + styles.unavailable}>
                {vendor.isAvailable === "Y" ? "Available" : "Unavailable"}
              </span>
              <button
                onClick={toggleVendorAvailability}
                disabled={updatingVendor}
                className={vendor.isAvailable === "Y" ? styles.toggleButton + " " + styles.turnOff : styles.toggleButton + " " + styles.turnOn}
              >
                {updatingVendor ? "Updating..." : vendor.isAvailable === "Y" ? "Turn Off" : "Turn On"}
              </button>
            </div>
          </div>
        ) : null}
        {vendor && (
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button className={styles.toggleButton} onClick={handleEditVendor}>Edit</button>
            <button className={styles.toggleButton + ' ' + styles.turnOff} onClick={() => setShowDeleteModal(true)} disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Delete'}</button>
          </div>
        )}
      </section>

      {/* Orders Section */}
      <section className={styles.section} style={{ marginBottom: 32 }}>
        <h3>Current Orders</h3>
        {ordersLoading ? (
          <div>Loading orders...</div>
        ) : ordersError ? (
          <div style={{ color: "#dc3545" }}>{ordersError}</div>
        ) : orders.length === 0 ? (
          <div>No active orders.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Created</th>
                <th>Items</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderId || order._id}>
                  <td>{order.orderNumber}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      textTransform: 'capitalize',
                      backgroundColor: 
                        order.orderType === 'delivery' ? '#e3f2fd' :
                        order.orderType === 'dinein' ? '#f3e5f5' :
                        order.orderType === 'takeaway' ? '#e8f5e8' :
                        '#fff3e0',
                      color: 
                        order.orderType === 'delivery' ? '#1976d2' :
                        order.orderType === 'dinein' ? '#7b1fa2' :
                        order.orderType === 'takeaway' ? '#388e3c' :
                        '#f57c00'
                    }}>
                      {order.orderType}
                    </span>
                  </td>
                  <td>{order.status}</td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                  <td>
                    {order.items.map((item, idx) => (
                      <span key={`${order.orderId || order._id}-${item.name}-${idx}`}>
                        {item.name} × {item.quantity}
                        {idx < order.items.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </td>
                  <td style={{ fontWeight: '600', color: '#4ea199' }}>
                    ₹{order.total || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Vendor Analytics Section */}
      <section className={styles.section} style={{ marginBottom: 32 }}>
        <VendorAnalytics vendorId={vendorId} vendorName={vendor?.fullName} />
      </section>

      {/* Inventory Section */}
      <section className={styles.section}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Inventory Reports</h3>
          {datesLoading ? (
            <div>Loading available reports...</div>
          ) : datesError ? (
            <div style={{ color: "#dc3545" }}>{datesError}</div>
          ) : availableDates.length === 0 ? (
            <div>No previous reports found.</div>
          ) : (
            <div style={{ marginTop: 12 }}>
              <b>Download previous reports:</b>
              <div className={styles.scrollableDates + (showAllDates ? ' ' + styles.expanded : '')}>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {(showAllDates ? availableDates : availableDates.slice(0, maxVisibleDates)).map(date => (
                    <li key={date} style={{ margin: "8px 0", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ minWidth: 100 }}>{date}</span>
                      <button
                        onClick={() => downloadReportForDate(date)}
                        className={styles.download}
                        style={{ padding: "0.3rem 1rem" }}
                      >
                        Download
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              {availableDates.length > maxVisibleDates && (
                <button
                  className={styles.showMoreBtn}
                  onClick={() => setShowAllDates(v => !v)}
                  style={{ marginTop: 8 }}
                >
                  {showAllDates ? "Show Less" : `Show More (${availableDates.length - maxVisibleDates} more)`}
                </button>
              )}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Inventory Report</h3>
          <input
            type="date"
            value={reportDate}
            onChange={e => setReportDate(e.target.value)}
            style={{ padding: "0.4rem 0.7rem", borderRadius: 6, border: "1px solid #ccc", fontSize: 15 }}
            max={new Date().toISOString().slice(0, 10)}
          />
          <button
            onClick={downloadReport}
            disabled={downloading}
            className={styles.download}
            style={{ marginLeft: 8 }}
          >
            {downloading ? "Downloading..." : "Download Report"}
          </button>
        </div>
        {inventoryLoading ? (
          <div>Loading inventory report...</div>
        ) : inventoryError ? (
          <div style={{ color: "#dc3545" }}>{inventoryError}</div>
        ) : inventory.length === 0 ? (
          <div>No inventory data.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Opening</th>
                <th>Received</th>
                <th>Sold</th>
                <th>Closing</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, idx) => (
                <tr key={`${item.name}-${item.itemType}-${idx}`}>
                  <td>{item.name}</td>
                  <td>{item.opening}</td>
                  <td>{item.received}</td>
                  <td>{item.sold}</td>
                  <td>{item.closing}</td>
                  <td>{item.itemType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Edit Vendor Modal */}
      <Modal
        isOpen={showEditModal}
        onRequestClose={() => setShowEditModal(false)}
        contentLabel="Edit Vendor"
        ariaHideApp={false}
        className={styles.modal}
      >
        <h3>Edit Vendor</h3>
        {editVendor && (
          <form onSubmit={handleEditSubmit} className={styles.modalForm}>
            <label>Name
              <input type="text" value={editVendor.fullName} onChange={e => setEditVendor({ ...editVendor, fullName: e.target.value })} required />
            </label>
            <label>Email
              <input type="email" value={editVendor.email} onChange={e => setEditVendor({ ...editVendor, email: e.target.value })} required />
            </label>
            <label>Phone
              <input type="text" value={editVendor.phone} onChange={e => setEditVendor({ ...editVendor, phone: e.target.value })} required />
            </label>
            <label>Location
              <input type="text" value={editVendor.location || ""} onChange={e => setEditVendor({ ...editVendor, location: e.target.value })} />
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="submit" className={styles.toggleButton} disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
              <button type="button" className={styles.toggleButton} onClick={() => setShowEditModal(false)} disabled={editLoading}>Cancel</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Vendor Modal */}
      <Modal
        isOpen={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
        contentLabel="Delete Vendor"
        ariaHideApp={false}
        className={styles.modal}
      >
        <h3>Delete Vendor</h3>
        <p>Are you sure you want to delete this vendor?</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
          <button className={styles.toggleButton + ' ' + styles.turnOff} onClick={handleDeleteVendor} disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Delete'}</button>
          <button className={styles.toggleButton} onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>Cancel</button>
        </div>
      </Modal>

      {successMsg && <div style={{ color: 'green', marginTop: 12 }}>{successMsg}</div>}

      {/* Vendor Menu Management Section */}
      <section className={styles.section} style={{ marginTop: 32, border: "2px solid #4ea199", padding: "2rem" }}>
        <h3 style={{ color: "#4ea199", fontSize: "1.5rem", marginBottom: "1rem" }}>Menu Management</h3>
        <div style={{ minHeight: "200px", border: "1px dashed #ccc", padding: "1rem", background: "#f9f9f9" }}>
          <VendorMenuManagement vendorId={vendorId} />
        </div>
      </section>
    </div>
  );
} 