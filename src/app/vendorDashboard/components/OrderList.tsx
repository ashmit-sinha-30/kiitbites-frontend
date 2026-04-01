"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Order } from "../types";
import { OrderCard, LocalStatus } from "./OrderCard";
import api from "@/utils/apiUtils";
import { useOrderEvents } from "@/hooks/useOrderEvents";
import styles from "../styles/OrderList.module.scss";

const PAGE_SIZE = 5; // number of orders per page

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

interface OrderListProps {
  vendorId: string;
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

export const OrderList: React.FC<OrderListProps> = ({ vendorId, onLoaded, onOrderStatusChange, orderStatusChanges }) => {
  const [list, setList] = useState<OrderState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const previousListRef = useRef<OrderState[]>([]);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);
    try {
      const fetchType = async (type: Order["orderType"]) => {
        const res = await api.get(`/order/active/${vendorId}/${type}`);
        return res.data; // response includes vendorId, vendorName, orders
      };

      const [delRes, takeRes, dineRes, cashRes] = await Promise.all([
        fetchType("delivery"),
        fetchType("takeaway"),
        fetchType("dinein"),
        fetchType("cash"),
      ]);

      // Call onLoaded using any one of the responses
      if (onLoaded) {
        const vendorName =
          delRes.vendorName || takeRes.vendorName || dineRes.vendorName || cashRes.vendorName;
        const vendorId =
          delRes.vendorId || takeRes.vendorId || dineRes.vendorId || cashRes.vendorId;
        if (vendorName && vendorId) onLoaded(vendorName, vendorId);
      }

      // Combine all orders from the four responses
      const allOrders = [
        ...delRes.orders,
        ...takeRes.orders,
        ...dineRes.orders,
        ...cashRes.orders,
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Filter out delivery orders that are on the way (they'll be shown in separate delivery section)
      const filteredOrders = allOrders.filter((order: ApiOrder) => {
        if (order.orderType === "delivery" && order.status === "onTheWay") {
          return false; // Exclude delivery orders that are on the way
        }
        return true; // Include all other orders
      });

      const combined: OrderState[] = filteredOrders.map((o) => ({
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

      previousListRef.current = combined;
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
  }, [onLoaded, vendorId]);

  // Load once + auto-refresh
  useEffect(() => {
    fetchOrders(false);
  }, [fetchOrders]);

  const eventListeners = React.useMemo(() => ({
    "active-order-update": () => {
      console.log("SSE: Active orders updated, refreshing...");
      fetchOrders(true);
    }
  }), [fetchOrders]);

  useOrderEvents(vendorId, eventListeners);

  // Handle incoming order status changes
  useEffect(() => {
    if (orderStatusChanges && orderStatusChanges.length > 0) {
      orderStatusChanges.forEach(change => {
        if (change.newStatus === "onTheWay" && change.orderData?.orderType === "delivery") {
          console.log(`OrderList: Removing order ${change.orderId} from active orders (status: ${change.newStatus})`);
          // Remove delivery order from active orders list when it becomes onTheWay
          setList(prev => prev.filter(os => os.order.orderId !== change.orderId));
        } else if (change.newStatus === "delivered") {
          console.log(`OrderList: Removing order ${change.orderId} from active orders (status: ${change.newStatus})`);
          // Remove order from active orders list when it's delivered
          setList(prev => prev.filter(os => os.order.orderId !== change.orderId));
        }
      });
    }
  }, [orderStatusChanges]);

  useEffect(() => {
    if (!loading && !isInitialLoad) {
      // After every list update, check if the current page is still valid
      const totalPages = Math.ceil(list.length / PAGE_SIZE);
      if (page > totalPages && totalPages > 0) {
        setPage(totalPages);
      } else if (list.length === 0 && page !== 1) {
        setPage(1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, loading, isInitialLoad]);

  const advance = (orderId: string, next: LocalStatus | "delivered") => {
    // Find the order being updated
    const orderToUpdate = list.find(os => os.order.orderId === orderId);

    if (!orderToUpdate) {
      console.error(`Order not found: ${orderId}`);
      return;
    }

    // Optimistic update with loading state
    setList(
      (prev) =>
        prev
          .map((os) => {
            if (os.order.orderId !== orderId) return os;
            if (next === "delivered") return null; // Remove from active orders when delivered
            return { ...os, localStatus: next as LocalStatus, isUpdating: true };
          })
          .filter(Boolean) as OrderState[]
    );

    // Notify parent component about the status change
    if (onOrderStatusChange) {
      onOrderStatusChange(orderId, next, orderToUpdate.order);
    }

    // --- DELIVERY ORDERS ---
    if (orderToUpdate?.order.orderType === "delivery") {
      if (next === "ready") {
        // Mark as ready - persist to backend
        api.patch(`/order/${orderId}/ready`)
          .then(() => {
            setList(prev => prev.map(os =>
              os.order.orderId === orderId
                ? { ...os, localStatus: mapToLocal("ready"), isUpdating: false }
                : os
            ));
          })
          .catch((err) => {
            console.error("Failed to PATCH /ready", err);
            // Revert on error
            setList(prev => prev.map(os =>
              os.order.orderId === orderId
                ? { ...os, localStatus: orderToUpdate.localStatus, isUpdating: false }
                : os
            ));
          });
        return;
      } else if (next === "onTheWay") {
        // Start delivery - moves to delivery orders section
        api.patch(`/order/${orderId}/onTheWay`)
          .then(() => {
            // Order will be removed by the status change handler
          })
          .catch((err) => {
            console.error("Failed to PATCH /onTheWay", err);
            // Revert on error
            setList(prev => prev.map(os =>
              os.order.orderId === orderId
                ? { ...os, localStatus: orderToUpdate.localStatus, isUpdating: false }
                : os
            ));
          });
        return;
      } else if (next === "delivered") {
        // Mark as delivered - moves to past orders
        api.patch(`/order/${orderId}/deliver`)
          .then(() => {
            // Order will be removed by the status change handler
          })
          .catch((err) => {
            console.error("Failed to PATCH /deliver", err);
            // Revert on error
            setList(prev => [...prev, { ...orderToUpdate, isUpdating: false }]);
          });
        return;
      }
      // Do not allow 'completed' for delivery orders
    }

    // --- TAKEAWAY & DINE-IN ---
    if (orderToUpdate?.order.orderType === "takeaway" || orderToUpdate?.order.orderType === "dinein") {
      if (next === "ready") {
        // Mark as ready - persist to backend
        api.patch(`/order/${orderId}/ready`)
          .then(() => {
            setList(prev => prev.map(os =>
              os.order.orderId === orderId
                ? { ...os, localStatus: mapToLocal("ready"), isUpdating: false }
                : os
            ));
          })
          .catch((err) => {
            console.error("Failed to PATCH /ready", err);
            // Revert on error
            setList(prev => prev.map(os =>
              os.order.orderId === orderId
                ? { ...os, localStatus: orderToUpdate.localStatus, isUpdating: false }
                : os
            ));
          });
        return;
      } else if (next === "completed") {
        // Mark as completed - stays in active orders
        api.patch(`/order/${orderId}/complete`)
          .then(() => {
            setList(prev => prev.map(os =>
              os.order.orderId === orderId
                ? { ...os, isUpdating: false }
                : os
            ));
          })
          .catch((err) => {
            console.error("Failed to PATCH /complete", err);
            // Revert on error
            setList(prev => prev.map(os =>
              os.order.orderId === orderId
                ? { ...os, localStatus: orderToUpdate.localStatus, isUpdating: false }
                : os
            ));
          });
        return;
      } else if (next === "delivered") {
        // Mark as delivered - moves to past orders
        api.patch(`/order/${orderId}/deliver`)
          .then(() => {
            // Order will be removed by the status change handler
          })
          .catch((err) => {
            console.error("Failed to PATCH /deliver", err);
            // Revert on error
            setList(prev => [...prev, { ...orderToUpdate, isUpdating: false }]);
          });
        return;
      }
    }

    // Fallback for any other types or transitions
    const endpoint =
      next === "delivered"
        ? `/order/${orderId}/deliver`
        : next === "onTheWay"
          ? `/order/${orderId}/onTheWay`
          : `/order/${orderId}/complete`;
    api.patch(endpoint)
      .then(() => {
        setList(prev => prev.map(os =>
          os.order.orderId === orderId
            ? { ...os, isUpdating: false }
            : os
        ));
      })
      .catch((err) => {
        console.error("Failed to PATCH", endpoint, err);
        // Revert on error
        setList(prev => prev.map(os =>
          os.order.orderId === orderId
            ? { ...os, localStatus: orderToUpdate.localStatus, isUpdating: false }
            : os
        ));
      });
  };

  const totalPages = Math.ceil(list.length / PAGE_SIZE);
  const currentPageList = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Show skeleton loading only on initial load
  if (isInitialLoad && loading) {
    return (
      <div className={styles.wrap}>
        {Array.from({ length: 3 }).map((_, i) => (
          <OrderSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) return <p className={styles.empty}>Error: {error}</p>;
  if (list.length === 0 && !isRefreshing)
    return <p className={styles.empty}>No active orders.</p>;

  return (
    <div className={styles.wrap}>
      {/* Subtle refresh indicator */}
      {isRefreshing && (
        <div className={styles.refreshIndicator}>
          <div className={styles.refreshSpinner} />
          <span>Refreshing...</span>
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
