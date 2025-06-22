// components/RetailInventory.tsx
"use client";

import React, { useEffect, useState } from "react";
import styles from "../styles/RetailInventory.module.scss"; // ensure filename matches

interface RetailApiItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  type: string;
  isSpecial: "Y" | "N";
}

// Added "lowstock" filter option, removed "unavailable"
type FilterOption = "all" | "specials" | "available" | "lowstock";

interface RetailInventoryProps {
  vendorId: string;
  onLoaded?: (vendorName: string, vendorId: string) => void;
}

export const RetailInventory: React.FC<RetailInventoryProps> = ({
  vendorId,
  onLoaded,
}) => {
  const [items, setItems] = useState<RetailApiItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOption>("all");

  useEffect(() => {
    const fetchRetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/items/getvendors/${vendorId}/retail`
        );
        if (!res.ok) {
          throw new Error(
            `Failed to fetch retail items (status ${res.status})`
          );
        }
        const json: any = await res.json();
        // Extract rawItems based on actual response shape
        let rawItems: any[] = [];
        if (json.data && Array.isArray(json.data.retailItems)) {
          rawItems = json.data.retailItems;
        } else if (Array.isArray(json.items)) {
          rawItems = json.items;
        } else {
          console.warn("RetailInventory: items array not found", json);
          rawItems = [];
        }
        const dataItems: RetailApiItem[] = rawItems.map((it: any) => ({
          itemId: it.itemId ?? it._id ?? "",
          name: it.name ?? "",
          price:
            typeof it.price === "number"
              ? it.price
              : typeof it.price === "string"
              ? parseFloat(it.price) || 0
              : 0,
          quantity:
            typeof it.quantity === "number"
              ? it.quantity
              : parseInt(it.quantity, 10) || 0,
          type: it.type ?? "",
          isSpecial: it.isSpecial === "Y" ? "Y" : "N",
        }));
        setItems(dataItems);

        // onLoaded for sidebar if needed
        let vendorNameFromResp: string | undefined;
        let vendorIdFromResp: string | undefined;
        if (typeof json.foodCourtName === "string") {
          vendorNameFromResp = json.foodCourtName;
        }
        if (json.data) {
          if (typeof json.data.vendorName === "string") {
            vendorNameFromResp = json.data.vendorName;
          }
          if (typeof json.data.vendorId === "string") {
            vendorIdFromResp = json.data.vendorId;
          }
        }
        if (!vendorIdFromResp) {
          vendorIdFromResp = vendorId;
        }
        if (onLoaded && vendorNameFromResp && vendorIdFromResp) {
          onLoaded(vendorNameFromResp, vendorIdFromResp);
        }
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRetail();
  }, [vendorId, onLoaded]);

  // Filtering: available means quantity >= 30; lowstock means quantity < 30
  const filteredItems = items.filter((item) => {
    switch (filter) {
      case "specials":
        return item.isSpecial === "Y";
      case "available":
        return item.quantity >= 30;
      case "lowstock":
        return item.quantity < 30;
      case "all":
      default:
        return true;
    }
  });

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <label htmlFor="retail-filter" className={styles.filterLabel}>
          Show:
        </label>
        <select
          id="retail-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterOption)}
          className={styles.filterSelect}
        >
          <option value="all">All items</option>
          <option value="specials">Specials only</option>
          <option value="available">Available items</option>
          <option value="lowstock">Low in stock</option>
        </select>
      </div>

      {loading ? (
        <p className={styles.message}>Loading retail items…</p>
      ) : error ? (
        <p className={`${styles.message} ${styles.error}`}>Error: {error}</p>
      ) : items.length === 0 ? (
        <p className={styles.message}>No retail items found.</p>
      ) : filteredItems.length === 0 ? (
        <p className={styles.message}>No items match the filter.</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Special</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.itemId}>
                  <td>{item.name}</td>
                  <td>{item.type}</td>
                  <td>{item.price.toFixed(2)}</td>
                  <td>
                    {item.quantity < 30 ? (
                      <span className={styles.lowStock}>{item.quantity}</span>
                    ) : (
                      <span>{item.quantity}</span>
                    )}
                  </td>
                  <td>
                    {item.isSpecial === "Y" ? (
                      <span className={styles.specialYes}>Yes</span>
                    ) : (
                      <span className={styles.specialNo}>No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
