"use client";

import React from "react";
import { OrderSkeleton } from "../skeleton/SkeletonLoader/SkeletonLoader";

interface OrderItem {
  name: string;
  price: number;
  unit: string;
  type: string;
  quantity: number;
}

interface OrderRecord {
  _id: string;
  orderNumber: string;
  orderType: string;
  status: string;
  createdAt: string;
  collectorName: string;
  collectorPhone: string;
  address?: string;
  total: number;
  vendorId: {
    _id: string;
    fullName: string;
    college?: {
      _id: string;
      fullName: string;
    };
  };
  items: OrderItem[];
  isReviewed?: boolean;
}

interface OrderListViewProps {
  orders: OrderRecord[];
  loading: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onGoHome: () => void;
  styles: Record<string, string>;
  renderAfterCard?: (order: OrderRecord) => React.ReactNode;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "delivered":
      return "#10b981";
    case "completed":
      return "#3b82f6";
    case "inprogress":
      return "#f59e0b";
    case "ontheway":
      return "#8b5cf6";
    default:
      return "#6b7280";
  }
};

const OrderListView: React.FC<OrderListViewProps> = ({
  orders,
  loading,
  emptyTitle,
  emptyDescription,
  onGoHome,
  styles,
  renderAfterCard,
}) => {
  if (loading) {
    return <OrderSkeleton />;
  }

  if (orders.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h2>{emptyTitle}</h2>
        <p>{emptyDescription}</p>
        <button className={styles.homeButton} onClick={onGoHome}>
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className={styles.orderGrid}>
      {orders.map((order) => (
        <div key={order._id} className={styles.orderCard}>
          <div className={styles.cardLeft}>
            <div className={styles.orderHeader}>
              <div className={styles.orderInfo}>
                <h3 className={styles.orderId}>Order #{order.orderNumber}</h3>
                <p className={styles.orderDate}>{formatDate(order.createdAt)}</p>
              </div>
              <div className={styles.badgeRow}>
                <span
                  className={styles.orderStatus}
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {order.status}
                </span>
                <span className={styles.orderType}>{order.orderType}</span>
              </div>
            </div>

            <div className={styles.vendorSource}>
              {order.vendorId && (
                <>
                  <p className={styles.vendorName}>
                    <strong>Vendor:</strong> {order.vendorId.fullName || "Unknown Vendor"}
                  </p>
                  {order.vendorId.college && (
                    <p className={styles.collegeName}>
                      <strong>College:</strong> {order.vendorId.college.fullName || "Unknown College"}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className={styles.collectorInfo}>
              <h4 className={styles.collectorName}>{order.collectorName}</h4>
              <p className={styles.collectorPhone}>{order.collectorPhone}</p>
              {order.address && <p className={styles.address}>{order.address}</p>}
            </div>
          </div>

          <div className={styles.cardRight}>
            <div className={styles.itemsList}>
              {order.items.map((item, index) => (
                <div key={index} className={styles.itemCard}>
                  <div className={styles.itemInfo}>
                    <h5 className={styles.itemName}>{item.name}</h5>
                    <p className={styles.itemDetails}>
                      ₹{item.price} per {item.unit} • {item.type}
                    </p>
                  </div>
                  <span className={styles.itemQuantity}>x{item.quantity}</span>
                </div>
              ))}
            </div>

            <div className={styles.orderFooter}>
              <div className={styles.orderTotal}>
                <p className={styles.totalAmount}>Total: ₹{order.total}</p>
              </div>
            </div>
          </div>

          {renderAfterCard?.(order)}
        </div>
      ))}
    </div>
  );
};

export type { OrderRecord };
export default OrderListView;
