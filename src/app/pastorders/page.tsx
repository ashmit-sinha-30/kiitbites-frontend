"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import styles from "./styles/pastorder.module.scss";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

interface OrderItem {
  name: string;
  price: number;
  unit: string;
  type: string;
  quantity: number;
}

interface PastOrder {
  _id: string;
  orderId: string;
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
    uniID?: string;
    college?: {
      _id: string;
      fullName: string;
    };
  };
  items: OrderItem[];
}

interface College {
  _id: string;
  fullName: string;
  shortName: string;
}

interface User {
  _id: string;
  name: string;
}

const PastOrdersPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [pastOrders, setPastOrders] = useState<PastOrder[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await axios.get(
          `${BACKEND_URL}/api/user/auth/user`,
          getAuthConfig()
        );
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user details:", error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push("/login");
        }
      }
    };
    fetchUserDetails();
  }, [router]);

  // Fetch colleges list
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/api/user/auth/list`,
          getAuthConfig()
        );
        setColleges(response.data);
      } catch (error) {
        console.error("Error fetching colleges:", error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push("/login");
        }
      }
    };
    fetchColleges();
  }, [router]);

  // Fetch past orders based on selected college
  useEffect(() => {
    const fetchPastOrders = async () => {
      if (!user?._id) return;

      try {
        setLoading(true);
        const url = selectedCollege
          ? `${BACKEND_URL}/order/past/${user._id}?collegeId=${selectedCollege._id}`
          : `${BACKEND_URL}/order/past/${user._id}`;

        const response = await axios.get(url, getAuthConfig());
        console.log('Past orders response:', response.data);
        setPastOrders(response.data.orders || []);
      } catch (error) {
        console.error("Error fetching past orders:", error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPastOrders();
  }, [user?._id, selectedCollege, router]);

  // Handle URL query parameter on initial load
  useEffect(() => {
    const collegeId = searchParams.get("college");
    if (collegeId && colleges.length > 0) {
      const college = colleges.find((c) => c._id === collegeId);
      if (college) {
        setSelectedCollege(college);
      }
    } else {
      setSelectedCollege(null);
      const params = new URLSearchParams(window.location.search);
      params.delete("college");
      window.history.pushState(null, "", `?${params.toString()}`);
    }
  }, [searchParams, colleges]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleCollegeSelect = (college: College | null) => {
    setSelectedCollege(college);
    const params = new URLSearchParams(window.location.search);
    if (college) {
      params.set("college", college._id);
    } else {
      params.delete("college");
    }
    window.history.pushState(null, "", `?${params.toString()}`);
    setIsDropdownOpen(false);
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '#10b981'; // green
      case 'completed':
        return '#3b82f6'; // blue
      case 'inprogress':
        return '#f59e0b'; // yellow
      default:
        return '#6b7280'; // gray
    }
  };

  return (
    <div className={styles.container}>
      <ToastContainer
        position="bottom-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className={styles.header}>
        <h1>Your Past Orders</h1>
      </div>

      <div className={styles.dropdownContainer} ref={dropdownRef}>
        <button
          className={styles.dropdownButton}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          aria-expanded={isDropdownOpen}
        >
          <span>
            {selectedCollege ? selectedCollege.fullName : "Select your college"}
          </span>
          <ChevronDown
            size={20}
            style={{
              transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </button>

        {isDropdownOpen && (
          <div className={styles.dropdownMenu}>
            <button
              className={styles.dropdownItem}
              onClick={() => handleCollegeSelect(null)}
            >
              <span>All Colleges</span>
              <ChevronRight size={16} />
            </button>
            {colleges.map((college) => (
              <button
                key={college._id}
                className={styles.dropdownItem}
                onClick={() => handleCollegeSelect(college)}
              >
                <span>{college.fullName}</span>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.contentSection}>
        <div className={styles.collegeHeader}>
          <h2 className={styles.collegeName}>
            {selectedCollege ? selectedCollege.fullName : "All Colleges"}
          </h2>
          <p className={styles.subTitle}>Your Past Orders</p>
        </div>

        {loading ? (
          <div className={styles.header}>
            <h1>Loading...</h1>
          </div>
        ) : pastOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>No past orders found</h2>
            <p>You haven&apos;t placed any orders yet. Start ordering to see your history here!</p>
            <button 
              className={styles.homeButton}
              onClick={() => router.push('/')}
            >
              Go to Home
            </button>
          </div>
        ) : (
          <div className={styles.orderGrid}>
            {pastOrders.map((order) => {
              console.log('Order vendor data:', order.vendorId);
              return (
                <div key={order._id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div className={styles.orderInfo}>
                      <h3 className={styles.orderId}>Order #{order.orderNumber}</h3>
                      <p className={styles.orderDate}>{formatDate(order.createdAt)}</p>
                      {order.vendorId && (
                        <div className={styles.orderSource}>
                          <p className={styles.vendorName}>
                            <strong>Vendor:</strong> {order.vendorId.fullName || "Unknown Vendor"}
                          </p>
                          {order.vendorId.college && (
                            <p className={styles.collegeName}>
                              <strong>College:</strong> {order.vendorId.college.fullName || "Unknown College"}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span 
                        className={styles.orderStatus}
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {order.status}
                      </span>
                      <span className={styles.orderType}>
                        {order.orderType}
                      </span>
                    </div>
                  </div>

                  <div className={styles.orderDetails}>
                    <div className={styles.collectorInfo}>
                      <h4 className={styles.collectorName}>{order.collectorName}</h4>
                      <p className={styles.collectorPhone}>{order.collectorPhone}</p>
                      {order.address && (
                        <p className={styles.address}>{order.address}</p>
                      )}
                    </div>

                    <div className={styles.itemsList}>
                      {order.items.map((item, index) => (
                        <div key={index} className={styles.itemCard}>
                          <div className={styles.itemInfo}>
                            <h5 className={styles.itemName}>{item.name}</h5>
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

                    <div className={styles.orderTotal}>
                      <p className={styles.totalAmount}>
                        Total: ₹{order.total}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const PastOrdersPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>Loading...</h1>
          </div>
        </div>
      }
    >
      <PastOrdersPageContent />
    </Suspense>
  );
};

export default PastOrdersPage;
