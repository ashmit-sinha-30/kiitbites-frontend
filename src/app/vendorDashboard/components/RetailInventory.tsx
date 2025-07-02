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

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
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
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/item/getvendors/${vendorId}/retail`
        );
        if (!res.ok) {
          throw new Error(
            `Failed to fetch retail items (status ${res.status})`
          );
        }
        const json = await res.json() as unknown;
        let rawItems: unknown[] = [];
        if (isObject(json)) {
          const jsonObj = json as Record<string, unknown>;
          const data = jsonObj.data;
          if (isObject(data) && Array.isArray((data as { retailItems?: unknown[] }).retailItems)) {
            rawItems = (data as { retailItems: unknown[] }).retailItems;
          } else if (Array.isArray((jsonObj as { items?: unknown[] }).items)) {
            rawItems = (jsonObj as { items: unknown[] }).items;
          } else {
            rawItems = [];
          }
        } else {
          rawItems = [];
        }
        const dataItems: RetailApiItem[] = (rawItems as Partial<RetailApiItem>[]).map((it) => ({
          itemId: it.itemId ?? (it as { _id?: string })._id ?? "",
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
              : parseInt(it.quantity as unknown as string, 10) || 0,
          type: it.type ?? "",
          isSpecial: it.isSpecial === "Y" ? "Y" : "N",
        }));
        setItems(dataItems);
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
