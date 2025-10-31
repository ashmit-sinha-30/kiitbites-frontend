// components/DownloadButton.tsx
"use client";

import { FiDownload } from "react-icons/fi";
import * as XLSX from "xlsx";
import styles from "../styles/DateFilter.module.scss";
import { InventoryReport } from "../types";

type Props = Pick<
  InventoryReport,
  "vendorName" | "reportDate" | "stats" | "items" | "receivedFrom" | "sent" | "sentTo"
>;

export default function DownloadButton({
  vendorName,
  reportDate,
  stats,
  items,
  receivedFrom,
  sent,
  sentTo,
}: Props) {
  const handleDownload = () => {
    // 1) Create a new workbook
    const wb = XLSX.utils.book_new();

    // 2) Split items by type
    const retailItems = items.filter((item) => item.itemType === "Retail");
    const produceItems = items.filter((item) => item.itemType === "Produce");
    const rawItems = items.filter((item) => item.itemType === "Raw");

    // 3) Build comprehensive sheet data
    const sheetData: (string | number)[][] = [];

    // Header with vendor info
    sheetData.push([`${vendorName} - Inventory Report`]);
    sheetData.push([`Date: ${new Date(reportDate).toLocaleDateString()}`]);
    sheetData.push([]); // Empty row

    // Stats section
    sheetData.push(["SUMMARY STATISTICS"]);
    sheetData.push(["Metric", "Value"]);
    sheetData.push(["Total Items Tracked", stats.totalTracked]);
    sheetData.push(["Produced Today", stats.producedToday]);
    sheetData.push(["Received Today", stats.receivedToday]);
    sheetData.push(["Sold Today", stats.soldToday]);
    sheetData.push(["Sent Today", stats.sentToday]);
    sheetData.push([]); // Empty row

    // Retail Inventory Section
    sheetData.push(["RETAIL INVENTORY"]);
    sheetData.push([
      "Item Name",
      "Opening Stock",
      "Produced",
      "Received",
      "Received From",
      "Sold",
      "Sent",
      "Sent To",
      "Closing Stock"
    ]);
    
    if (retailItems.length === 0) {
      sheetData.push(["No retail items found", "", "", "", "", "", "", "", ""]);
    } else {
      // Create maps for sent and received data
      const sentMap = new Map<string, number>();
      const sentToMap = new Map<string, string>();
      const receivedFromMap = new Map<string, string>();
      
      if (sent) {
        sent.forEach((s) => {
          if (s.item?._id) sentMap.set(s.item._id, s.quantity);
        });
      }
      
      if (sentTo) {
        sentTo.forEach((s) => {
          if (s.item?._id) {
            const key = s.item._id;
            const existing = sentToMap.get(key) || "";
            const newEntry = `${s.to?.name || "Unknown"}: ${s.quantity}`;
            sentToMap.set(key, existing ? `${existing}; ${newEntry}` : newEntry);
          }
        });
      }

      if (receivedFrom) {
        receivedFrom.forEach((r) => {
          if (r.item?._id) {
            const key = r.item._id;
            const existing = receivedFromMap.get(key) || "";
            const newEntry = `${r.from?.name || "Unknown"}: ${r.quantity}`;
            receivedFromMap.set(key, existing ? `${existing}; ${newEntry}` : newEntry);
          }
        });
      }

      retailItems.forEach((item) => {
        sheetData.push([
          item.name,
          item.opening,
          item.produced,
          item.received,
          item.itemId ? (receivedFromMap.get(item.itemId) || "") : "",
          item.sold,
          item.itemId ? (sentMap.get(item.itemId) || 0) : 0,
          item.itemId ? (sentToMap.get(item.itemId) || "") : "",
          item.closing
        ]);
      });
    }
    sheetData.push([]); // Empty row

    // Produce Inventory Section
    sheetData.push(["PRODUCE INVENTORY"]);
    sheetData.push(["Item Name", "Times Sold"]);
    
    if (produceItems.length === 0) {
      sheetData.push(["No produce items found", ""]);
    } else {
      produceItems.forEach((item) => {
        sheetData.push([item.name, item.sold]);
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
    
    if (rawItems.length === 0) {
      sheetData.push(["No raw material items found", "", "", ""]);
    } else {
      rawItems.forEach((item) => {
        sheetData.push([
          item.name,
          item.opening,
          item.closing,
          item.unit || "-"
        ]);
      });
    }

    // 4) Convert to worksheet
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // 5) Apply styling and formatting
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
          // Retail Inventory section header
          else if (cellValue === "RETAIL INVENTORY") {
            cell.s = { ...styles.sectionHeader, fill: { fgColor: { rgb: "1976D2" } } };
          }
          // Produce Inventory section header
          else if (cellValue === "PRODUCE INVENTORY") {
            cell.s = { ...styles.sectionHeader, fill: { fgColor: { rgb: "388E3C" } } };
          }
          // Raw Material Inventory section header
          else if (cellValue === "RAW MATERIAL INVENTORY") {
            cell.s = { ...styles.sectionHeader, fill: { fgColor: { rgb: "F57C00" } } };
          }
          // Retail table headers (row after "RETAIL INVENTORY")
          else if (sheetData[R - 1] && sheetData[R - 1].includes && sheetData[R - 1].includes("RETAIL INVENTORY")) {
            if (C < 9) {
              cell.s = styles.retailHeader;
            }
          }
          // Produce table headers (row after "PRODUCE INVENTORY")
          else if (sheetData[R - 1] && sheetData[R - 1].includes && sheetData[R - 1].includes("PRODUCE INVENTORY")) {
            if (C < 2) {
              cell.s = styles.produceHeader;
            }
          }
          // Raw table headers (row after "RAW MATERIAL INVENTORY")
          else if (sheetData[R - 1] && sheetData[R - 1].includes && sheetData[R - 1].includes("RAW MATERIAL INVENTORY")) {
            if (C < 4) {
              cell.s = styles.rawHeader;
            }
          }
        }
      }
    }

    // 6) Set column widths
    ws['!cols'] = [
      { width: 25 }, // Item Name
      { width: 15 }, // Opening Stock
      { width: 15 }, // Produced
      { width: 15 }, // Received
      { width: 40 }, // Received From
      { width: 15 }, // Sold
      { width: 15 }, // Sent
      { width: 40 }, // Sent To
      { width: 15 }  // Closing Stock
    ];

    // 7) Generate automatic filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '_');
    const filename = `${vendorName}_Inventory_${timestamp}.xlsx`;

    // 8) Append sheet and download
    XLSX.utils.book_append_sheet(wb, ws, "Inventory Report");
    XLSX.writeFile(wb, filename);
  };

  return (
    <button className={styles.download} onClick={handleDownload}>
      <FiDownload /> Download Report
    </button>
  );
}
