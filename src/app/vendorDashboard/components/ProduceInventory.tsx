// components/ProduceInventory.tsx
"use client";

import React, { useEffect, useState } from "react";
import styles from "../styles/ProduceInventory.module.scss";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface ProduceApiItem {
  itemId: string;
  name: string;
  price: number;
  isAvailable: "Y" | "N";
  type: string;
  isSpecial: "Y" | "N";
}

type FilterOption = "all" | "specials" | "available" | "unavailable";

interface ProduceInventoryProps {
  vendorId: string;
  onLoaded?: (vendorName: string, vendorId: string) => void;
}

export const ProduceInventory: React.FC<ProduceInventoryProps> = ({
  vendorId,
  onLoaded,
}) => {
  const [items, setItems] = useState<ProduceApiItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOption>("all");

  useEffect(() => {
    const fetchProduce = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BASE}/items/getvendors/${vendorId}/produce`);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch produce items (status ${res.status})`
          );
        }
        const json: any = await res.json();

        // Determine items array path as before...
        let rawItems: any[] = [];
        if (json.data && Array.isArray(json.data.produceItems)) {
          rawItems = json.data.produceItems;
        } else if (Array.isArray(json.items)) {
          rawItems = json.items;
        } else {
          console.warn("ProduceInventory: items array not found", json);
          rawItems = [];
        }

        const dataItems: ProduceApiItem[] = rawItems.map((it: any) => ({
          itemId: it.itemId ?? it._id ?? "",
          name: it.name ?? "",
          price:
            typeof it.price === "number"
              ? it.price
              : typeof it.price === "string"
              ? parseFloat(it.price) || 0
              : 0,
          isAvailable: it.isAvailable === "Y" ? "Y" : "N",
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

    fetchProduce();
  }, [vendorId, onLoaded]);

  const filteredItems = items.filter((item) => {
    switch (filter) {
      case "specials":
        return item.isSpecial === "Y";
      case "available":
        return item.isAvailable === "Y";
      case "unavailable":
        return item.isAvailable === "N";
      case "all":
      default:
        return true;
    }
  });

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <label htmlFor="produce-filter" className={styles.filterLabel}>
          Show:
        </label>
        <select
          id="produce-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterOption)}
          className={styles.filterSelect}
        >
          <option value="all">All items</option>
          <option value="specials">Specials only</option>
          <option value="available">Available only</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      {loading ? (
        <p className={styles.message}>Loading produce items…</p>
      ) : error ? (
        <p className={`${styles.message} ${styles.error}`}>Error: {error}</p>
      ) : items.length === 0 ? (
        <p className={styles.message}>No produce items found.</p>
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
                <th>Status</th>
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
                    {item.isAvailable === "Y" ? (
                      <span className={styles.inStock}>Available</span>
                    ) : (
                      <span className={styles.outOfStock}>Unavailable</span>
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
