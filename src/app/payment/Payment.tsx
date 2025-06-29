"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./styles/Payment.module.scss";

interface OrderItem {
  name: string;
  price: number;
  unit: string;
  type: string;
  quantity: number;
}

interface OrderDetails {
  _id: string;
  orderId: string;
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
    uniID?: string;
    college?: {
      _id: string;
      fullName: string;
    };
  };
  items: OrderItem[];
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

const PaymentPage = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Get auth token
  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  // Configure axios with auth header
  const getAuthConfig = () => {
    const token = getAuthToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        // First get user details to get user ID
        const userResponse = await axios.get(
          `${BACKEND_URL}/api/user/auth/user`,
          getAuthConfig()
        );
        const userId = userResponse.data._id;

        // Then fetch order details
        const orderResponse = await axios.get(
          `${BACKEND_URL}/order/user-active/${userId}`,
          getAuthConfig()
        );

        // Find the specific order
        const order = orderResponse.data.orders.find(
          (order: OrderDetails) => order._id === orderId
        );

        if (order) {
          setOrderDetails(order);
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const formatOrderId = (orderId: string) => {
    return orderId.slice(-8).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading order details...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Payment Successful!</h1>
      <p className={styles.message}>Thank you for your order.</p>
      
      {orderDetails && (
        <div className={styles.orderDetails}>
          <div className={styles.orderInfo}>
            <p className={styles.orderId}>
              <strong>Order ID:</strong> #{formatOrderId(orderDetails.orderId)}
            </p>
            <p className={styles.orderDate}>
              <strong>Order Date:</strong> {formatDate(orderDetails.createdAt)}
            </p>
            <p className={styles.orderType}>
              <strong>Order Type:</strong> {orderDetails.orderType.toUpperCase()}
            </p>
            <p className={styles.orderStatus}>
              <strong>Status:</strong> {orderDetails.status.toUpperCase()}
            </p>
          </div>

          {orderDetails.vendorId && (
            <div className={styles.vendorInfo}>
              <p className={styles.vendorName}>
                <strong>Vendor:</strong> {orderDetails.vendorId.fullName || "Unknown Vendor"}
              </p>
              {orderDetails.vendorId.college && (
                <p className={styles.collegeName}>
                  <strong>College:</strong> {orderDetails.vendorId.college.fullName || "Unknown College"}
                </p>
              )}
            </div>
          )}

          <div className={styles.collectorInfo}>
            <h3>Order Details</h3>
            <p><strong>Name:</strong> {orderDetails.collectorName}</p>
            <p><strong>Phone:</strong> {orderDetails.collectorPhone}</p>
            {orderDetails.address && (
              <p><strong>Address:</strong> {orderDetails.address}</p>
            )}
          </div>

          <div className={styles.itemsSection}>
            <h3>Items Ordered</h3>
            <div className={styles.itemsList}>
              {orderDetails.items.map((item, index) => (
                <div key={index} className={styles.itemCard}>
                  <div className={styles.itemInfo}>
                    <h4 className={styles.itemName}>{item.name}</h4>
                    <p className={styles.itemDetails}>
                      ₹{item.price} per {item.unit} • {item.type}
                    </p>
                  </div>
                  <span className={styles.itemQuantity}>
                    {item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.orderTotal}>
            <p className={styles.totalAmount}>
              Total: ₹{orderDetails.total}
            </p>
          </div>
        </div>
      )}

      <button className={styles.button} onClick={() => router.push("/")}>
        Go to Home
      </button>
    </div>
  );
};

export default PaymentPage;
