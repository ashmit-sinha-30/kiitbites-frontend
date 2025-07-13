"use client";

import React, { useEffect, useState } from "react";
import styles from "../styles/RawMaterialInventory.module.scss";

interface RawMaterialApiItem {
  itemId: string;
  name: string;
  openingAmount: number;
  closingAmount: number;
  unit: string;
}

interface RawMaterialInventoryProps {
  vendorId: string;
  onLoaded?: (vendorName: string, vendorId: string) => void;
}

export const RawMaterialInventory: React.FC<RawMaterialInventoryProps> = ({
  vendorId,
  onLoaded,
}) => {
  const [items, setItems] = useState<RawMaterialApiItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Form state for adding/editing items
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<RawMaterialApiItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    openingAmount: 0,
    closingAmount: 0,
    unit: "kg" as "kg" | "l",
  });

  // State for delete confirmation modal
  const [deletePending, setDeletePending] = useState<string | null>(null);

  useEffect(() => {
    const fetchRawMaterials = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/item/getvendors/${vendorId}/raw`
        );
        if (!res.ok) {
          throw new Error(
            `Failed to fetch raw material items (status ${res.status})`
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
          if (isObject(data) && Array.isArray((data as { rawItems?: unknown[] }).rawItems)) {
            rawItems = (data as { rawItems: unknown[] }).rawItems;
          } else if (Array.isArray((jsonObj as { items?: unknown[] }).items)) {
            rawItems = (jsonObj as { items: unknown[] }).items;
          } else {
            rawItems = [];
          }
        } else {
          rawItems = [];
        }
        const dataItems: RawMaterialApiItem[] = (rawItems as Partial<RawMaterialApiItem>[]).map((it) => ({
          itemId: it.itemId ?? (it as { _id?: string })._id ?? "",
          name: it.name ?? "",
          openingAmount: typeof it.openingAmount === "number" ? it.openingAmount : 0,
          closingAmount: typeof it.closingAmount === "number" ? it.closingAmount : 0,
          unit: it.unit ?? "kg",
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

    fetchRawMaterials();
  }, [vendorId, onLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Item name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let itemId = editingItem?.itemId;

      // If we're adding a new item, we need to create it first
      if (!editingItem) {
        // Create the raw material item
        const createResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/item/raw`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: formData.name,
              unit: formData.unit,
              uniId: "68320fd75c6f79ec179ad3bb", // Default uniId - you might want to get this from context
              vendorId: vendorId,
            }),
          }
        );

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.error || "Failed to create raw material item");
        }

        const createData = await createResponse.json();
        itemId = createData.item._id;
      }

      // Now update the inventory
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/inventory/raw-materials`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vendorId,
            itemId: itemId,
            openingAmount: formData.openingAmount,
            closingAmount: formData.closingAmount,
            unit: formData.unit,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update raw material inventory");
      }

      // Refresh the list
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/item/getvendors/${vendorId}/raw`
      );
      if (res.ok) {
        const json = await res.json();
        const rawItems = json.data?.rawItems || [];
        setItems(rawItems);
      }

      setShowForm(false);
      setEditingItem(null);
      setFormData({ name: "", openingAmount: 0, closingAmount: 0, unit: "kg" });
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to update inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: RawMaterialApiItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      openingAmount: item.openingAmount,
      closingAmount: item.closingAmount,
      unit: item.unit as "kg" | "l",
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({ name: "", openingAmount: 0, closingAmount: 0, unit: "kg" });
    setError(null);
  };

  const handleDelete = async (itemId: string) => {
    setDeletePending(itemId);
  };

  const confirmDelete = async () => {
    if (!deletePending) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/inventory/raw-materials`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendorId, itemId: deletePending }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete raw material");
      }
      // Refresh the list
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/item/getvendors/${vendorId}/raw`
      );
      if (res.ok) {
        const json = await res.json();
        const rawItems = json.data?.rawItems || [];
        setItems(rawItems);
      }
      setDeletePending(null);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to delete raw material");
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => setDeletePending(null);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && items.length === 0) {
    return <div>Loading raw materials...</div>;
  }

  if (error && items.length === 0) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  return (
    <div className={styles.inventoryContainer}>
      <div className={styles.header}>
        <h2>Raw Material Inventory</h2>
        <button
          onClick={() => setShowForm(true)}
          className={styles.addButton}
        >
          Add Raw Material
        </button>
      </div>

      {showForm && (
        <div className={styles.formOverlay}>
          <div className={styles.form}>
            <h3>{editingItem ? "Edit Raw Material" : "Add Raw Material"}</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Item Name:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter item name"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Opening Amount:</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.openingAmount}
                  onChange={(e) => setFormData({ ...formData, openingAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Closing Amount:</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.closingAmount}
                  onChange={(e) => setFormData({ ...formData, closingAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Unit:</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value as "kg" | "l" })}
                  required
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="l">Liters (l)</option>
                </select>
              </div>
              <div className={styles.formActions}>
                <button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingItem ? "Update" : "Add"}
                </button>
                <button type="button" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
            {error && <div className={styles.error}>{error}</div>}
          </div>
        </div>
      )}

      {deletePending && (
        <div className={styles.formOverlay}>
          <div className={styles.form}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this raw material?</p>
            <div className={styles.formActions}>
              <button onClick={confirmDelete} className={styles.deleteButton} disabled={loading}>
                {loading ? "Deleting..." : "Yes, Delete"}
              </button>
              <button onClick={cancelDelete} type="button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search raw materials..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Opening Amount</th>
              <th>Closing Amount</th>
              <th>Unit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.itemId}>
                <td>{item.name}</td>
                <td>{item.openingAmount}</td>
                <td>{item.closingAmount}</td>
                <td>{item.unit}</td>
                <td>
                  <button
                    onClick={() => handleEdit(item)}
                    className={styles.editButton}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.itemId)}
                    className={styles.deleteButton}
                    style={{ marginLeft: 8 }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredItems.length === 0 && (
          <div className={styles.noItems}>
            {search ? "No raw materials found matching your search." : "No raw materials added yet."}
          </div>
        )}
      </div>
    </div>
  );
}; 