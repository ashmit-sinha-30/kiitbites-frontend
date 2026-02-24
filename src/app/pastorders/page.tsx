"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { FaChevronDown, FaStar } from "react-icons/fa";
import styles from "./styles/pastorder.module.scss";
import axios from "axios";
import ReviewForm from "./components/ReviewForm";
import { useRouter, useSearchParams } from "next/navigation";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "";

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
  isReviewed?: boolean;
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
  const [allowedReview, setAllowedReview] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  // Consolidate initial data fetching and use a ref guard to strictly run once
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializePage = async () => {
      const token = getAuthToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // Fetch user and colleges in parallel
        const [userRes, collegesRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/user/auth/user`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BACKEND_URL}/api/user/auth/list`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        setUser(userRes.data);
        setColleges(collegesRes.data);

        // Check for review assignments
        try {
          const uniId = userRes.data?.uniID || userRes.data?.college?._id;
          if (uniId && token) {
            const assignRes = await axios.get(`${BACKEND_URL}/api/university/universities/${uniId}/assignments`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const services = assignRes.data?.data?.services || [];
            const isAllowed = services.some((s: { name: string }) =>
              String(s.name || '').toLowerCase().includes('review')
            );
            setAllowedReview(!!isAllowed);
          } else {
            setAllowedReview(false);
          }
        } catch (innerError) {
          console.warn("Could not check review permissions - backend might be unavailable:", innerError);
          setAllowedReview(false);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push("/login");
        }
      }
    };

    initializePage();
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
  }, [user?._id, selectedCollege]); // Removed router from dependencies

  // Handle URL query parameter on initial load or change
  useEffect(() => {
    if (colleges.length === 0) return;

    const collegeId = searchParams.get("college");
    if (collegeId) {
      if (selectedCollege?._id !== collegeId) {
        const college = colleges.find((c) => c._id === collegeId);
        if (college) {
          setSelectedCollege(college);
        }
      }
    } else if (selectedCollege) {
      setSelectedCollege(null);
    }
  }, [searchParams, colleges, selectedCollege?._id]);

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
        <div className={styles.collegeField}>
          <input
            name="college"
            value={selectedCollege ? selectedCollege.fullName : ""}
            readOnly
            placeholder="Select your college"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          />
          <FaChevronDown
            className={`${styles.dropdownIcon} ${isDropdownOpen ? styles.open : ''}`}
          />
          <ul className={`${styles.collegeList} ${isDropdownOpen ? styles.show : ''}`}>
            <li onClick={() => handleCollegeSelect(null)}>
              All Colleges
            </li>
            {colleges.map((college) => (
              <li
                key={college._id}
                onClick={() => handleCollegeSelect(college)}
              >
                {college.fullName}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.contentSection}>
        <div className={styles.collegeHeader}>
          <h2 className={styles.collegeName}>
            {selectedCollege ? selectedCollege.fullName : "All Colleges"}
          </h2>
          <p className={styles.subTitle}>Your Past Orders</p>
        </div>

        {loading ? (
          null
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
                        <span className={styles.orderType}>
                          {order.orderType}
                        </span>
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
                      {order.address && (
                        <p className={styles.address}>{order.address}</p>
                      )}
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
                          <span className={styles.itemQuantity}>
                            {item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className={styles.orderFooter}>
                      <div className={styles.orderTotal}>
                        <p className={styles.totalAmount}>
                          Total: ₹{order.total}
                        </p>
                      </div>
                    </div>
                  </div>

                  {allowedReview && (
                    <div className={styles.reviewSection}>
                      {order.isReviewed ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#4ea199',
                          fontWeight: 600,
                          padding: '12px',
                          backgroundColor: '#f0fdfa',
                          borderRadius: '8px',
                          border: '1px solid #ccfbf1',
                          width: '100%'
                        }}>
                          <FaStar /> Order Reviewed
                        </div>
                      ) : (
                        <ReviewForm
                          disabled={submitting === order._id}
                          onSubmit={async (rating, comment) => {
                            try {
                              setSubmitting(order._id);
                              const token = getAuthToken();
                              await axios.post(`${BACKEND_URL}/api/reviews/order/${order._id}`,
                                { rating, comment },
                                { headers: { Authorization: `Bearer ${token}` } }
                              );
                              toast.success('Review submitted');
                              // Optimistically update review status
                              setPastOrders(prev => prev.map(o =>
                                o._id === order._id ? { ...o, isReviewed: true } : o
                              ));
                            } catch (err) {
                              const msg = axios.isAxiosError(err) && err.response?.data?.message
                                ? err.response.data.message
                                : 'Failed to submit review';
                              toast.error(msg);
                            } finally {
                              setSubmitting(null);
                            }
                          }}
                        />
                      )}
                    </div>
                  )}
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
        null
      }
    >
      <PastOrdersPageContent />
    </Suspense>
  );
};

export default PastOrdersPage;
