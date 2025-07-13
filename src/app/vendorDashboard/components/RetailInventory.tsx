// components/RetailInventory.tsx
"use client";

import React, { useEffect, useState } from "react";
import styles from "../styles/RetailInventory.module.scss"; // ensure filename matches
import * as Switch from '@radix-ui/react-switch';

interface RetailApiItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  type: string;
  isSpecial: "Y" | "N";
  isAvailable: "Y" | "N" | undefined;
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
  const [search, setSearch] = useState("");

  // State for update inventory modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updatingItem, setUpdatingItem] = useState<RetailApiItem | null>(null);
  const [updateQuantity, setUpdateQuantity] = useState(0);
  const [updateType, setUpdateType] = useState<"add" | "set">("add");

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
          isAvailable: typeof it.isAvailable === "string" ? (it.isAvailable === "Y" ? "Y" : "N") : undefined,
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
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.type.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
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

  const handleUpdateInventory = (item: RetailApiItem) => {
    setUpdatingItem(item);
    setUpdateQuantity(0);
    setUpdateType("add");
    setShowUpdateModal(true);
  };

  const confirmUpdateInventory = async () => {
    if (!updatingItem) return;

    try {
      setLoading(true);
      setError(null);

      // Calculate new quantity based on update type
      const newQuantity = updateType === "add" 
        ? updatingItem.quantity + updateQuantity 
        : updateQuantity;

      if (newQuantity < 0) {
        setError("Quantity cannot be negative");
        return;
      }

      // Call the inventory update API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/inventory/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vendorId,
            itemId: updatingItem.itemId,
            itemType: "retail",
            quantity: updateType === "add" ? updateQuantity : newQuantity - updatingItem.quantity,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update inventory");
      }

      // Refresh the items list
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/item/getvendors/${vendorId}/retail`
      );
      if (res.ok) {
        const json = await res.json();
        const rawItems = json.data?.retailItems || [];
        setItems(rawItems);
      }

      setShowUpdateModal(false);
      setUpdatingItem(null);
      setUpdateQuantity(0);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to update inventory");
    } finally {
      setLoading(false);
    }
  };

  const cancelUpdateInventory = () => {
    setShowUpdateModal(false);
    setUpdatingItem(null);
    setUpdateQuantity(0);
    setError(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        {/* Search box */}
        <input
          type="text"
          placeholder="Search by name or type..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchInput}
          style={{ marginRight: 16, padding: '0.4rem 0.7rem', borderRadius: 6, border: '1px solid #a5b4fc', fontSize: '1rem' }}
        />
        {/* Existing filter controls */}
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

      {/* Update Inventory Modal */}
      {showUpdateModal && updatingItem && (
        <div className={styles.formOverlay}>
          <div className={styles.form}>
            <h3>Update Inventory - {updatingItem.name}</h3>
            <p>Current Stock: {updatingItem.quantity} units</p>
            
            <div className={styles.formGroup}>
              <label>Update Type:</label>
              <select
                value={updateType}
                onChange={(e) => setUpdateType(e.target.value as "add" | "set")}
                className={styles.formSelect}
              >
                <option value="add">Add to Stock</option>
                <option value="set">Set Stock Level</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>
                {updateType === "add" ? "Quantity to Add:" : "New Stock Level:"}
              </label>
              <input
                type="number"
                min="0"
                value={updateQuantity}
                onChange={(e) => setUpdateQuantity(parseInt(e.target.value) || 0)}
                className={styles.formInput}
                placeholder={updateType === "add" ? "Enter quantity to add" : "Enter new stock level"}
              />
            </div>

            {updateType === "set" && (
              <div className={styles.formGroup}>
                <p className={styles.preview}>
                  New Stock Level: {updateQuantity} units
                </p>
              </div>
            )}

            {updateType === "add" && (
              <div className={styles.formGroup}>
                <p className={styles.preview}>
                  New Stock Level: {updatingItem.quantity + updateQuantity} units
                </p>
              </div>
            )}

            <div className={styles.formActions}>
              <button 
                onClick={confirmUpdateInventory} 
                disabled={loading || updateQuantity < 0}
                className={styles.updateButton}
              >
                {loading ? "Updating..." : "Update Inventory"}
              </button>
              <button onClick={cancelUpdateInventory} className={styles.cancelButton}>
                Cancel
              </button>
            </div>
            
            {error && <div className={styles.error}>{error}</div>}
          </div>
        </div>
      )}

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
                <th>Available</th>
                <th>Actions</th>
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
                    <Switch.Root
                      checked={item.isSpecial === 'Y'}
                      onCheckedChange={async (checked: boolean) => {
                        const newSpecial = checked ? 'Y' : 'N';
                        try {
                          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/${vendorId}/item/${item.itemId}/retail/special`, {
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
                  <td>
                    {/* Determine availability: if isAvailable is missing, use quantity > 0 */}
                    {(() => {
                      const isAvailable =
                        item.isAvailable === 'Y' ||
                        (item.isAvailable == null && item.quantity > 0);
                      return (
                        <>
                          <Switch.Root
                            checked={isAvailable}
                            onCheckedChange={async (checked: boolean) => {
                              const newAvailable = checked ? 'Y' : 'N';
                              try {
                                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/inventory/retail/availability`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ vendorId, itemId: item.itemId, isAvailable: newAvailable }),
                                });
                                if (!res.ok) throw new Error('Failed to update availability');
                                setItems(prev => prev.map(it => it.itemId === item.itemId ? { ...it, isAvailable: newAvailable } : it));
                              } catch {
                                alert('Failed to update availability');
                              }
                            }}
                            className={styles.switch}
                            id={`available-switch-${item.itemId}`}
                          >
                            <Switch.Thumb className={styles.switchThumb} />
                          </Switch.Root>
                          <label htmlFor={`available-switch-${item.itemId}`} style={{ marginLeft: 8 }}>
                            {isAvailable ? 'Available' : 'Unavailable'}
                          </label>
                        </>
                      );
                    })()}
                  </td>
                  <td>
                    <button
                      onClick={() => handleUpdateInventory(item)}
                      className={styles.updateInventoryButton}
                    >
                      Update Stock
                    </button>
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
