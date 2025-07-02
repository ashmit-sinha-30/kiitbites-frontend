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
        const res = await fetch(`${BASE}/api/item/getvendors/${vendorId}/produce`);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch produce items (status ${res.status})`
          );
        }
        const json = await res.json() as unknown;
        let rawItems: unknown[] = [];
        function isObject(val: unknown): val is Record<string, unknown> {
          return typeof val === 'object' && val !== null;
        }
        if (isObject(json)) {
          const jsonObj = json as Record<string, unknown>;
          const data = jsonObj.data;
          if (isObject(data) && Array.isArray((data as { produceItems?: unknown[] }).produceItems)) {
            rawItems = (data as { produceItems: unknown[] }).produceItems;
          } else if (Array.isArray((jsonObj as { items?: unknown[] }).items)) {
            rawItems = (jsonObj as { items: unknown[] }).items;
          } else {
            rawItems = [];
          }
        } else {
          rawItems = [];
        }
        const dataItems: ProduceApiItem[] = (rawItems as Partial<ProduceApiItem>[]).map((it) => ({
          itemId: it.itemId ?? (it as { _id?: string })._id ?? "",
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

        // --- Type-safe vendorNameFromResp and vendorIdFromResp extraction ---
        let vendorNameFromResp: string | undefined;
        let vendorIdFromResp: string | undefined;
        if (isObject(json) && typeof (json as Record<string, unknown>).foodCourtName === "string") {
          vendorNameFromResp = (json as Record<string, unknown>).foodCourtName as string;
        }
        if (isObject(json) && isObject((json as Record<string, unknown>).data)) {
          const data = (json as Record<string, unknown>).data as Record<string, unknown>;
          if (typeof data.vendorName === "string") {
            vendorNameFromResp = data.vendorName;
          }
          if (typeof data.vendorId === "string") {
            vendorIdFromResp = data.vendorId;
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
