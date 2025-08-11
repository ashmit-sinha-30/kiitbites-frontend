"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Order } from "../types";
import { OrderCard, LocalStatus } from "./OrderCard";
import styles from "../styles/OrderList.module.scss";

const VENDOR_ID = "6834622710d75a5ba7b77403";
const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";
const PAGE_SIZE = 5; // number of orders per page
const REFRESH_INTERVAL = 30000; // 30 seconds

type OrderState = {
  order: Order;
  localStatus: LocalStatus;
  isUpdating?: boolean; // For optimistic updates
};

interface ApiOrder {
  orderId: string;
  orderNumber: string;
  orderType: string;
  status: string;
  createdAt: string;
  collectorName: string;
  collectorPhone: string;
  address?: string;
  total: number;
  items: Array<{
    name: string;
    price: number;
    unit: string;
    type: string;
    quantity: number;
  }>;
}

interface DeliveryOrdersListProps {
  onLoaded?: (vendorName: string, vendorId: string) => void;
  onOrderStatusChange?: (orderId: string, newStatus: string, orderData?: Order) => void;
  orderStatusChanges?: {
    orderId: string;
    newStatus: string;
    orderData?: Order;
  }[];
}

// Skeleton loading component
const OrderSkeleton = () => (
  <div className={styles.cardSkeleton}>
    <div className={styles.skeletonStripe} />
    <div className={styles.skeletonContent}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonBadge} />
      </div>
      <div className={styles.skeletonMeta}>
        <div className={styles.skeletonText} />
        <div className={styles.skeletonText} />
        <div className={styles.skeletonText} />
      </div>
      <div className={styles.skeletonItems}>
        <div className={styles.skeletonItem} />
        <div className={styles.skeletonItem} />
      </div>
      <div className={styles.skeletonButton} />
    </div>
  </div>
);

export const DeliveryOrdersList: React.FC<DeliveryOrdersListProps> = ({ onLoaded, onOrderStatusChange, orderStatusChanges }) => {
  const [list, setList] = useState<OrderState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDeliveryOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);
    try {
      // Fetch only delivery orders that are on the way
      const res = await fetch(`${BASE}/order/delivery/${VENDOR_ID}`);
      if (!res.ok) throw new Error('Failed to load delivery orders');
      const data = await res.json();
      
      if (onLoaded && data.vendorName && data.vendorId) {
        onLoaded(data.vendorName, data.vendorId);
      }

      // The backend now returns only onTheWay orders, so no filtering needed
      const deliveryOrders = data.orders;

      const combined: OrderState[] = deliveryOrders.map((o: ApiOrder) => ({
        order: o,
        localStatus: mapToLocal(o.status),
      }));

      // Smooth update: preserve existing orders and merge with new ones
      if (isRefresh) {
        setList(prev => {
          const newList = [...combined];
          // Preserve any orders that are currently being updated
          prev.forEach(existingOrder => {
            if (existingOrder.isUpdating) {
              const existingIndex = newList.findIndex(o => o.order.orderId === existingOrder.order.orderId);
              if (existingIndex >= 0) {
                newList[existingIndex] = { ...newList[existingIndex], isUpdating: true };
              }
            }
          });
          return newList;
        });
      } else {
        setList(combined);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  }, [onLoaded]);

  // Load once + auto-refresh
  useEffect(() => {
    fetchDeliveryOrders(false);
    const interval = setInterval(() => fetchDeliveryOrders(true), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchDeliveryOrders]);

  // Handle incoming order status changes
  useEffect(() => {
    if (orderStatusChanges && orderStatusChanges.length > 0) {
      orderStatusChanges.forEach(change => {
        if (change.newStatus === "onTheWay" && change.orderData?.orderType === "delivery") {
          console.log(`DeliveryOrdersList: Adding order ${change.orderId} to delivery orders (status: ${change.newStatus})`);
          // Add new delivery order to the list when it starts delivery
          const newOrder: OrderState = {
            order: change.orderData,
            localStatus: "onTheWay"
          };
          setList(prev => [newOrder, ...prev]);
        } else if (change.newStatus === "delivered") {
          console.log(`DeliveryOrdersList: Removing order ${change.orderId} from delivery orders (status: ${change.newStatus})`);
          // Remove order from delivery list when it's delivered
          setList(prev => prev.filter(os => os.order.orderId !== change.orderId));
        }
      });
    }
  }, [orderStatusChanges]);

  const advance = (orderId: string, next: LocalStatus | "delivered") => {
    // Find the order being updated
    const orderToUpdate = list.find(os => os.order.orderId === orderId);
    
    if (!orderToUpdate) {
      console.error(`Order not found: ${orderId}`);
      return;
    }
    // Prevent multiple delivery requests for the same order
    if (orderToUpdate.isUpdating) {
      return;
    }
    // Optimistic update with loading state
    setList(
      (prev) =>
        prev
          .map((os) => {
            if (os.order.orderId !== orderId) return os;
            if (next === "delivered") return null; // Remove from delivery orders when delivered
            return { ...os, localStatus: next as LocalStatus, isUpdating: true };
          })
          .filter(Boolean) as OrderState[]
    );

    // Notify parent component about the status change
    if (onOrderStatusChange) {
      onOrderStatusChange(orderId, next, orderToUpdate.order);
    }

    // For delivery orders in onTheWay status, only allow marking as delivered
    if (next === "delivered") {
      fetch(`${BASE}/order/${orderId}/deliver`, { method: "PATCH" })
        .then(() => {
          // Order will be removed by the status change handler
        })
        .catch((err) => {
          console.error("Failed to PATCH /deliver", err);
          // Revert on error
          setList(prev => [...prev, { ...orderToUpdate, isUpdating: false }]);
        });
    }
  };

  const totalPages = Math.ceil(list.length / PAGE_SIZE);
  const currentPageList = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Show skeleton loading only on initial load
  if (isInitialLoad && loading) {
    return (
      <div className={styles.wrap}>
        {Array.from({ length: 2 }).map((_, i) => (
          <OrderSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) return <p className={styles.empty}>Error: {error}</p>;
  if (list.length === 0 && !isRefreshing)
    return <p className={styles.empty}>No orders out for delivery.</p>;

  return (
    <div className={styles.wrap}>
      {/* Subtle refresh indicator */}
      {isRefreshing && (
        <div className={styles.refreshIndicator}>
          <div className={styles.refreshSpinner} />
          <span>Refreshing delivery orders...</span>
        </div>
      )}
      
      {currentPageList.map((os) => (
        <OrderCard
          key={os.order.orderId}
          order={os.order}
          localStatus={os.localStatus}
          onAdvance={advance}
          isUpdating={os.isUpdating}
        />
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

function mapToLocal(status: string): LocalStatus {
  switch (status) {
    case "inProgress":
      return "inProgress";
    case "ready":
      return "ready";
    case "completed":
      return "completed";
    case "onTheWay":
      return "onTheWay";
    default:
      return "inProgress";
  }
} 