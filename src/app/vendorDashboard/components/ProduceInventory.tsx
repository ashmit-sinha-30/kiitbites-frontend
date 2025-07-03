// components/ProduceInventory.tsx
"use client";

import React, { useEffect, useState } from "react";
import styles from "../styles/ProduceInventory.module.scss";
import * as Switch from '@radix-ui/react-switch';

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
  const [search, setSearch] = useState("");

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
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.type.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
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
        <input
          type="text"
          placeholder="Search by name or type..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchInput}
          style={{ marginRight: 16, padding: '0.4rem 0.7rem', borderRadius: 6, border: '1px solid #a5b4fc', fontSize: '1rem' }}
        />
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
                <th>Available</th>
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
                    <Switch.Root
                      checked={item.isAvailable === 'Y'}
                      onCheckedChange={async (checked: boolean) => {
                        const newAvailable = checked ? 'Y' : 'N';
                        try {
                          const res = await fetch(`${BASE}/api/vendor/${vendorId}/item/${item.itemId}/produce/available`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ isAvailable: newAvailable }),
                          });
                          if (!res.ok) throw new Error('Failed to update available status');
                          setItems(prev => prev.map(it => it.itemId === item.itemId ? { ...it, isAvailable: newAvailable } : it));
                        } catch {
                          alert('Failed to update available status');
                        }
                      }}
                      className={styles.switch}
                      id={`available-switch-${item.itemId}`}
                    >
                      <Switch.Thumb className={styles.switchThumb} />
                    </Switch.Root>
                    <label htmlFor={`available-switch-${item.itemId}`} style={{ marginLeft: 8 }}>
                      {item.isAvailable === 'Y' ? 'Yes' : 'No'}
                    </label>
                  </td>
                  <td>
                    <Switch.Root
                      checked={item.isSpecial === 'Y'}
                      onCheckedChange={async (checked: boolean) => {
                        const newSpecial = checked ? 'Y' : 'N';
                        try {
                          const res = await fetch(`${BASE}/api/vendor/${vendorId}/item/${item.itemId}/produce/special`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ isSpecial: newSpecial }),
                          });
                          if (!res.ok) throw new Error('Failed to update special status');
                          setItems(prev => prev.map(it => it.itemId === item.itemId ? { ...it, isSpecial: newSpecial } : it));
                        } catch {
                          alert('Failed to update special status');
                        }
                      }}
                      className={styles.switch}
                      id={`special-switch-${item.itemId}`}
                    >
                      <Switch.Thumb className={styles.switchThumb} />
                    </Switch.Root>
                    <label htmlFor={`special-switch-${item.itemId}`} style={{ marginLeft: 8 }}>
                      {item.isSpecial === 'Y' ? 'Yes' : 'No'}
                    </label>
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
