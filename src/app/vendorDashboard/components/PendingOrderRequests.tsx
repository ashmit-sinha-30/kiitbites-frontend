// NEW FILE: Component for vendors to see and respond to pending order requests

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import styles from "./styles/PendingOrderRequests.module.scss";

interface PendingOrder {
  orderId: string;
  orderNumber: string;
  orderType: string;
  status: string;
  collectorName: string;
  collectorPhone: string;
  address?: string;
  total: number;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    unit: string;
  }>;
  createdAt: string;
}

interface PendingOrderRequestsProps {
  vendorId: string;
  onOrderProcessed?: () => void;
}

export const PendingOrderRequests: React.FC<PendingOrderRequestsProps> = ({
  vendorId,
  onOrderProcessed,
}) => {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  const fetchPendingOrders = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/order-approval/pending/${vendorId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setPendingOrders(response.data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching pending orders:", error);
      toast.error("Failed to load pending orders");
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchPendingOrders();
    // Refresh every 5 seconds
    const interval = setInterval(fetchPendingOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchPendingOrders]);

  const handleAcceptOrder = async (orderId: string) => {
    if (processingOrderId) return; // Prevent multiple clicks
    
    setProcessingOrderId(orderId);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/order-approval/${orderId}/accept`,
        { vendorId },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success("Order accepted successfully!");
        // Remove from pending list
        setPendingOrders((prev) => prev.filter((o) => o.orderId !== orderId));
        if (onOrderProcessed) {
          onOrderProcessed();
        }
        // Refresh to get updated list
        fetchPendingOrders();
      } else {
        toast.error(response.data.message || "Failed to accept order");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to accept order");
      } else {
        toast.error("Failed to accept order");
      }
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleDenyOrder = async (orderId: string, reason?: string) => {
    if (processingOrderId) return;
    
    const denialReason = reason || prompt("Please provide a reason for denial (e.g., Item not available):") || "Item not available";
    
    if (!denialReason.trim()) {
      toast.error("Please provide a reason for denial");
      return;
    }

    setProcessingOrderId(orderId);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/order-approval/${orderId}/deny`,
        { vendorId, denialReason },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success("Order denied");
        // Remove from pending list
        setPendingOrders((prev) => prev.filter((o) => o.orderId !== orderId));
        if (onOrderProcessed) {
          onOrderProcessed();
        }
        // Refresh to get updated list
        fetchPendingOrders();
      } else {
        toast.error(response.data.message || "Failed to deny order");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to deny order");
      } else {
        toast.error("Failed to deny order");
      }
    } finally {
      setProcessingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading pending orders...</div>
      </div>
    );
  }

  if (pendingOrders.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h3>No Pending Orders</h3>
          <p>You don&apos;t have any orders waiting for approval at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Pending Order Requests</h2>
        <p>{pendingOrders.length} order(s) waiting for your approval</p>
      </div>
      <div className={styles.ordersList}>
        {pendingOrders.map((order) => (
          <div key={order.orderId} className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <div>
                <h3>Order #{order.orderNumber}</h3>
                <span className={styles.orderType}>{order.orderType}</span>
              </div>
              <div className={styles.orderTotal}>₹{order.total}</div>
            </div>
            
            <div className={styles.orderDetails}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Customer:</span>
                <span>{order.collectorName}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Phone:</span>
                <span>{order.collectorPhone}</span>
              </div>
              {order.address && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Address:</span>
                  <span>{order.address}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.label}>Time:</span>
                <span>{new Date(order.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className={styles.itemsList}>
              <strong>Items:</strong>
              <ul>
                {order.items.map((item, index) => (
                  <li key={index}>
                    {item.name} × {item.quantity} {item.unit} - ₹{item.price * item.quantity}
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.actions}>
              <button
                className={`${styles.button} ${styles.acceptButton}`}
                onClick={() => handleAcceptOrder(order.orderId)}
                disabled={processingOrderId === order.orderId}
              >
                {processingOrderId === order.orderId ? "Processing..." : "Accept Order"}
              </button>
              <button
                className={`${styles.button} ${styles.denyButton}`}
                onClick={() => handleDenyOrder(order.orderId)}
                disabled={processingOrderId === order.orderId}
              >
                Deny Order
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

