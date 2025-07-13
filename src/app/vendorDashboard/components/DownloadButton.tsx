// components/DownloadButton.tsx
"use client";

import { FiDownload } from "react-icons/fi";
import * as XLSX from "xlsx";
import styles from "../styles/DateFilter.module.scss";
import { InventoryReport } from "../types";

type Props = Pick<
  InventoryReport,
  "vendorName" | "reportDate" | "stats" | "items"
>;

export default function DownloadButton({
  vendorName,
  reportDate,
  stats,
  items,
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
    sheetData.push(["Items Sold Today", stats.soldToday]);
    sheetData.push(["Items Received", stats.receivedToday]);
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
    
    if (retailItems.length === 0) {
      sheetData.push(["No retail items found", "", "", "", ""]);
    } else {
      retailItems.forEach((item) => {
        sheetData.push([
          item.name,
          item.opening,
          item.received,
          item.sold,
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
          else if (R > 12 && R < 12 + retailItems.length + 1 && retailItems.length > 0) {
            cell.s = styles.retailRow;
          }
          // Produce data rows
          else if (R > 16 && R < 16 + produceItems.length + 1 && produceItems.length > 0) {
            cell.s = styles.produceRow;
          }
          // Raw data rows
          else if (R > 20 && R < 20 + rawItems.length + 1 && rawItems.length > 0) {
            cell.s = styles.rawRow;
          }
        }
      }
    }

    // 6) Set column widths
    ws['!cols'] = [
      { width: 25 }, // Item Name
      { width: 15 }, // Opening Stock/Amount
      { width: 15 }, // Received/Closing Amount
      { width: 15 }, // Sold/Unit
      { width: 15 }  // Closing Stock
    ];

    // 7) Append sheet and download
    XLSX.utils.book_append_sheet(wb, ws, "Inventory Report");
    const filename = `${vendorName}_Inventory_${reportDate}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <button className={styles.download} onClick={handleDownload}>
      <FiDownload /> Download Report
    </button>
  );
}
