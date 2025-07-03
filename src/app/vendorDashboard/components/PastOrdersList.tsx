"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Order, OrderType, Status, Item } from "../types";
import styles from "../styles/OrderList.module.scss";

const VENDOR_ID = "6834622e10d75a5ba7b7740d";
const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";
const PAGE_SIZE = 5; // number of orders per page
const REFRESH_INTERVAL = 60000; // 60 seconds (less frequent for past orders)

type OrderState = {
  order: Order;
  status: string;
};

interface ApiOrder {
  orderId: string;
  orderNumber: string;
  orderType: OrderType;
  status: Status;
  createdAt: string;
  collectorName: string;
  collectorPhone: string;
  address?: string;
  total: number;
  items: Item[];
}

interface ApiResponse {
  vendorId: string;
  vendorName: string;
  orders: ApiOrder[];
}

interface PastOrdersListProps {
  onLoaded?: (vendorName: string, vendorId: string) => void;
}

export const PastOrdersList: React.FC<PastOrdersListProps> = ({ onLoaded }) => {
  const [list, setList] = useState<OrderState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchPastOrders = useCallback(async () => {
    setError(null);
    try {
      // Fetch past orders for the vendor
      const res = await fetch(`${BASE}/order/vendor-past/${VENDOR_ID}`);
      if (!res.ok) throw new Error('Failed to load past orders');
      const data: ApiResponse = await res.json();
      
      if (onLoaded && data.vendorName && data.vendorId) {
        onLoaded(data.vendorName, data.vendorId);
      }

      const orders: OrderState[] = data.orders.map((o: ApiOrder) => ({
        order: o,
        status: o.status,
      }));

      setList(orders);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    }
  }, [onLoaded]);

  // Load once + auto-refresh
  useEffect(() => {
    setLoading(true);
    fetchPastOrders().finally(() => setLoading(false));
    const interval = setInterval(fetchPastOrders, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPastOrders]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#c6f6d5"; // light green
      case "delivered":
        return "#9ae6b4"; // darker green
      case "failed":
        return "#fed7d7"; // light red
      default:
        return "#e2e8f0"; // light gray
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#2f855a"; // dark green
      case "delivered":
        return "#22543d"; // darker green
      case "failed":
        return "#c53030"; // dark red
      default:
        return "#4a5568"; // dark gray
    }
  };

  const totalPages = Math.ceil(list.length / PAGE_SIZE);
  const currentPageList = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <p className={styles.empty}>Loading past orders…</p>;
  if (error) return <p className={styles.empty}>Error: {error}</p>;
  if (list.length === 0)
    return (
      <div>
        <div style={{ background: 'red', color: 'white', padding: '10px', margin: '10px' }}>
          PastOrdersList Component is working! No orders found.
        </div>
        <p className={styles.empty}>No past orders found.</p>
      </div>
    );

  return (
    <div className={styles.wrap}>
      {/* <div style={{ background: 'green', color: 'white', padding: '10px', margin: '10px' }}>
        PastOrdersList Component is working! Found {list.length} orders.
      </div> */}
      {currentPageList.map((os) => (
        <div key={os.order.orderId} className={styles.card}>
          <div className={styles.stripe} style={{ backgroundColor: getStatusColor(os.status) }} />
          <div className={styles.content}>
            {/* HEADER */}
            <div className={styles.header}>
              <div className={styles.titleBlock}>
                <h3 className={styles.orderId}>#{os.order.orderNumber}</h3>
                <span className={styles.typePill} style={{ backgroundColor: "#4ea199" }}>
                  {os.order.orderType.charAt(0).toUpperCase() + os.order.orderType.slice(1)}
                </span>
              </div>
              <span
                className={styles.statusBadge}
                style={{ 
                  backgroundColor: getStatusColor(os.status),
                  color: getStatusTextColor(os.status)
                }}
              >
                {os.status.charAt(0).toUpperCase() + os.status.slice(1)}
              </span>
            </div>

            {/* META */}
            <div className={styles.meta}>
              <div>Name: {os.order.collectorName}</div>
              <div>Phone: {os.order.collectorPhone}</div>
              {os.order.address && <div>Address: {os.order.address}</div>}
              <div>Ordered at: {formatTime(os.order.createdAt)}</div>
            </div>

            {/* ITEMS */}
            <ul className={styles.items}>
              {os.order.items.map((it, idx) => (
                <li key={`${it.itemId}-${idx}`}>
                  <span className={styles.itemQty}>{it.quantity}×</span>
                  <span className={styles.itemName}>{it.name}</span>
                  <span className={styles.itemPrice}>
                    ₹{(it.price * it.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>

            {/* FOOTER */}
            <div className={styles.footer}>
              <div className={styles.total}>Total: ₹{os.order.total.toFixed(2)}</div>
            </div>
          </div>
        </div>
      ))}

      {/* Pagination */}
      <div className={styles.pagination}>
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className={styles.pageButton}
        >
          ◀ Prev
        </button>
        <span className={styles.pageIndicator}>
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className={styles.pageButton}
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}; 