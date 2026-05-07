"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { FaStar } from "react-icons/fa";
import styles from "./styles/pastorder.module.scss";
import { userApi } from "@/utils/apiUtils";
import ReviewForm from "./components/ReviewForm";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import OrderListView from "../components/order/OrderListView";
import axios from "axios";
import { BaseOrder, College, User } from "../components/order/orderTypes";
import useCollegeFilter from "../components/order/useCollegeFilter";
import OrderPageLayout from "../components/order/OrderPageLayout";

type PastOrder = BaseOrder;

const PastOrdersPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [colleges, setColleges] = useState<College[]>([]);
  const [pastOrders, setPastOrders] = useState<PastOrder[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowedReview, setAllowedReview] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const hasInitialized = useRef(false);
  const { isDropdownOpen, setIsDropdownOpen, selectedCollege, dropdownRef, handleCollegeSelect } =
    useCollegeFilter({ searchParams, colleges });

  // Consolidate initial data fetching and use a ref guard to strictly run once
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializePage = async () => {
      try {
        // Fetch user and colleges in parallel
        const [userRes, collegesRes] = await Promise.all([
          userApi.get("/api/user/auth/user"),
          userApi.get("/api/user/auth/list")
        ]);

        setUser(userRes.data);
        setColleges(collegesRes.data);

        // Check for review assignments
        try {
          const uniId = userRes.data?.uniID || userRes.data?.college?._id;
          if (uniId) {
            const assignRes = await userApi.get(`/api/university/universities/${uniId}/assignments`);
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
          ? `/order/past/${user._id}?collegeId=${selectedCollege._id}`
          : `/order/past/${user._id}`;

        const response = await userApi.get(url);
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

  return (
    <OrderPageLayout
      title="Your Past Orders"
      subtitle="Your Past Orders"
      styles={styles}
      isDropdownOpen={isDropdownOpen}
      selectedCollege={selectedCollege}
      colleges={colleges}
      dropdownRef={dropdownRef}
      onToggleDropdown={() => setIsDropdownOpen(!isDropdownOpen)}
      onSelectCollege={handleCollegeSelect}
    >
      <OrderListView
        orders={pastOrders}
        loading={loading}
        emptyTitle="No past orders found"
        emptyDescription="You haven't placed any orders yet. Start ordering to see your history here!"
        onGoHome={() => router.push("/")}
        styles={styles}
        renderAfterCard={(order) =>
          allowedReview ? (
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
                      await userApi.post(`/api/reviews/order/${order._id}`,
                        { rating, comment }
                      );
                      toast.success('Review submitted');
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
          ) : null
        }
      />
    </OrderPageLayout>
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
