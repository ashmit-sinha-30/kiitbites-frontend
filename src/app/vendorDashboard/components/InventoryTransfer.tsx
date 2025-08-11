"use client";

import React, { useState, useEffect } from "react";
import { AiOutlineSend, AiOutlineInbox, AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
import styles from "../styles/InventoryTransfer.module.scss";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface TransferItem {
  itemId: string;
  quantity: number;
  itemName?: string;
  itemType?: string;
  unit?: string;
}

interface TransferRequest {
  senderId: string;
  receiverId: string;
  items: TransferItem[];
}

interface TransferOrder {
  orderId: string;
  status: "pending" | "confirmed" | "rejected" | string;
  items: TransferItem[];
  createdAt: string;
}

interface Vendor {
  _id: string;
  fullName: string;
}

export const InventoryTransfer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"send" | "receive">("send");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedReceiverId, setSelectedReceiverId] = useState<string>("");
  const [availableItems, setAvailableItems] = useState<{ _id: string; name: string; quantity: number }[]>([]);
  const [selectedItems, setSelectedItems] = useState<TransferItem[]>([]);
  const [transferOrders, setTransferOrders] = useState<TransferOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const currentVendorId = "6834622e10d75a5ba7b7740d"; // TODO: replace with auth context

  useEffect(() => {
    fetchVendors();
    fetchAvailableItems();
    fetchTransferOrders();
  }, []);

  // Load vendors of same university (excluding self)
  const fetchVendors = async () => {
    try {
      // First get current vendor's uniID
      const vendorResp = await fetch(`${BASE_URL}/api/item/getvendors/${currentVendorId}`);
      if (!vendorResp.ok) return;
      const vendorJson = await vendorResp.json();
      const uniId: string | undefined = vendorJson?.uniID;
      if (!uniId) return;

      const response = await fetch(`${BASE_URL}/api/vendor/list/uni/${uniId}`);
      if (response.ok) {
        const data: Vendor[] = await response.json();
        const otherVendors = data.filter((v) => v._id !== currentVendorId);
        setVendors(otherVendors);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  // Load current vendor retail items (available to transfer)
  const fetchAvailableItems = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/item/getvendors/${currentVendorId}/retail`);
      if (response.ok) {
        const json = await response.json();
        const rawItems = json?.data?.retailItems ?? json?.items ?? [];
        // Normalize shape to {_id, name, quantity}
        const normalized = (rawItems as { itemId?: string; _id?: string; name?: string; quantity?: number | string }[]).map((it) => ({
          _id: it.itemId ?? it._id ?? "",
          name: it.name ?? "",
          quantity: typeof it.quantity === "number" ? it.quantity : parseInt(String(it.quantity) || "0", 10),
        }));
        setAvailableItems(normalized);
      }
    } catch (error) {
      console.error("Error fetching available items:", error);
    }
  };

  // Load pending transfers for this vendor as receiver
  const fetchTransferOrders = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/transfer-orders/${currentVendorId}`);
      if (response.ok) {
        const data = await response.json();
        const orders = (data?.orders ?? []).map((o: { _id: string; status: string; items: Array<{ itemId: string; quantity: number; itemName?: string; itemType?: string; unit?: string }>; createdAt: string }) => ({
          orderId: o._id,
          status: o.status,
          items: (o.items ?? []).map((it: { itemId: string; quantity: number; itemName?: string; itemType?: string; unit?: string }) => ({ 
            itemId: String(it.itemId), 
            quantity: Number(it.quantity),
            itemName: it.itemName,
            itemType: it.itemType,
            unit: it.unit
          })),
          createdAt: o.createdAt,
        })) as TransferOrder[];
        setTransferOrders(orders);
      }
    } catch (error) {
      console.error("Error fetching transfer orders:", error);
    }
  };

  const handleItemSelection = (itemId: string, quantity: number) => {
    setSelectedItems((prev) => {
      const qty = Math.max(0, quantity | 0);
      const existing = prev.find((item) => item.itemId === itemId);
      if (existing) {
        return prev.map((item) => (item.itemId === itemId ? { ...item, quantity: qty } : item));
      } else {
        return [...prev, { itemId, quantity: qty }];
      }
    });
  };

  const handleSendTransfer = async () => {
    if (!selectedReceiverId || selectedItems.length === 0) {
      setMessage({ type: "error", text: "Please select a receiver and items" });
      return;
    }

    setLoading(true);
    try {
      const transferRequest: TransferRequest = {
        senderId: currentVendorId,
        receiverId: selectedReceiverId,
        items: selectedItems.filter((i) => i.quantity > 0),
      };

      const response = await fetch(`${BASE_URL}/api/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferRequest),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Transfer request sent successfully!" });
        // Clear all form data and selections
        setSelectedItems([]);
        setSelectedReceiverId("");
        setAvailableItems([]);
        setVendors([]);
        setTransferOrders([]);
        // Refresh data
        fetchAvailableItems();
        fetchTransferOrders();
        fetchVendors();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({ type: "error", text: errorData.error || errorData.message || "Failed to send transfer" });
      }
    } catch {
      setMessage({ type: "error", text: "Error sending transfer request" });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransfer = async (orderId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/confirm-transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          receiverVendorId: currentVendorId,
        }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Transfer confirmed successfully!" });
        fetchAvailableItems();
        fetchTransferOrders();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({ type: "error", text: errorData.error || errorData.message || "Failed to confirm transfer" });
      }
    } catch {
      setMessage({ type: "error", text: "Error confirming transfer" });
    }
  };

  const removeSelectedItem = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.itemId !== itemId));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Inventory Transfer</h2>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "send" ? styles.active : ""}`}
            onClick={() => setActiveTab("send")}
          >
            <AiOutlineSend /> Send Inventory
          </button>
          <button
            className={`${styles.tab} ${activeTab === "receive" ? styles.active : ""}`}
            onClick={() => setActiveTab("receive")}
          >
            <AiOutlineInbox /> Receive Inventory
          </button>
        </div>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className={styles.closeButton}>
            <AiOutlineClose />
          </button>
        </div>
      )}

      {activeTab === "send" && (
        <div className={styles.sendSection}>
          <div className={styles.formGroup}>
            <label>Select Receiver Vendor:</label>
            <select
              value={selectedReceiverId}
              onChange={(e) => setSelectedReceiverId(e.target.value)}
              className={styles.select}
            >
              <option value="">Choose a vendor...</option>
              {vendors.map((vendor) => (
                <option key={vendor._id} value={vendor._id}>
                  {vendor.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.itemsSection}>
            <h3>Select Items to Transfer</h3>
            <div className={styles.itemsGrid}>
              {availableItems.map((item) => (
                <div key={item._id} className={styles.itemCard}>
                  <div className={styles.itemInfo}>
                    <h4>{item.name}</h4>
                    <p>Available: {item.quantity}</p>
                  </div>
                  <div className={styles.itemActions}>
                    <input
                      type="number"
                      min="1"
                      max={item.quantity}
                      placeholder="Qty"
                      onChange={(e) => handleItemSelection(item._id, parseInt(e.target.value) || 0)}
                      className={styles.quantityInput}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedItems.length > 0 && (
            <div className={styles.selectedItems}>
              <h3>Selected Items</h3>
              <div className={styles.selectedItemsList}>
                {selectedItems.map((item) => {
                  const selectedItem = availableItems.find((ai) => ai._id === item.itemId);
                  return (
                    <div key={item.itemId} className={styles.selectedItem}>
                      <span>{selectedItem?.name}</span>
                      <span>Qty: {item.quantity}</span>
                      <button
                        onClick={() => removeSelectedItem(item.itemId)}
                        className={styles.removeButton}
                      >
                        <AiOutlineClose />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={handleSendTransfer}
                disabled={loading || !selectedReceiverId}
                className={styles.sendButton}
              >
                {loading ? "Sending..." : "Send Transfer Request"}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "receive" && (
        <div className={styles.receiveSection}>
          <h3>Pending Transfer Orders</h3>
          {transferOrders.length === 0 ? (
            <p className={styles.noOrders}>No pending transfer orders</p>
          ) : (
            <div className={styles.transferOrders}>
              {transferOrders.map((order) => (
                <div key={order.orderId} className={styles.transferOrder}>
                  <div className={styles.orderHeader}>
                    <span className={styles.orderId}>Order #{order.orderId.slice(-8)}</span>
                    <span className={`${styles.status} ${styles[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className={styles.orderItems}>
                    {order.items.map((item, index) => (
                      <div key={index} className={styles.orderItem}>
                        <span>{item.itemName || `Item ID: ${String(item.itemId).slice(-8)}`}</span>
                        <span>Quantity: {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.orderActions}>
                    {order.status === "pending" || order.status === "onTheWay" ? (
                      <button
                        onClick={() => handleConfirmTransfer(order.orderId)}
                        className={styles.confirmButton}
                      >
                        <AiOutlineCheck /> Confirm Receipt
                      </button>
                    ) : null}
                    <span className={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
