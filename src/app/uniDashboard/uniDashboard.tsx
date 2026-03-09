"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles/UniDashboard.module.scss";
import api from "@/utils/apiUtils";
import axios from "axios";

export default function UniDashboardPage() {
  const router = useRouter();
  const [features, setFeatures] = useState<{ _id: string; name: string }[]>([]);
  const [activeSegment, setActiveSegment] = useState<string>("dashboard");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Always land on dashboard for this page
    localStorage.removeItem("activeSegment");
    setActiveSegment("dashboard");
  }, []);

  useEffect(() => {
    localStorage.setItem("activeSegment", activeSegment);
  }, [activeSegment]);

  // Load university identity and assignments
  useEffect(() => {
    const init = async () => {
      try {
        // Token is now in HTTP-only cookies
        /* REMOVED:
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/uni-login");
          return;
        }
        */

        // Use standardized api utility
        const userRes = await api.get("/api/uni/auth/user");

        if (userRes.status === 200) {
          const user = userRes.data;
          const uniId = user._id || user.id;

          // Store uniId in localStorage
          localStorage.setItem("uniId", uniId);

          const assignRes = await api.get(`/api/university/universities/${uniId}/assignments`);
          const assignJson = assignRes.data;
          if (assignJson.success) {
            setFeatures(assignJson.data.features);
          }
        } else {
          // Failure to get user info, redirect
          router.push("/uni-login");
          return;
        }
      } catch (e) {
        console.error("Failed to init uni dashboard", e);
        // On 401, the apiUtils interceptor will handle redirect
        // For other errors, we might still want to clear/redirect if it's a critical failure
        if (axios.isAxiosError(e) && e.response?.status === 401) {
          return; // Interceptor already handled it
        }
        router.push("/uni-login");
        return;
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);


  // Helper function to get appropriate icon for each feature
  const getFeatureIcon = (featureName: string) => {
    const name = featureName.toLowerCase();
    if (name.includes('food') || name.includes('ordering')) return '🍽️';
    if (name.includes('vendor') || name.includes('merchant')) return '🏪';
    if (name.includes('inventory') || name.includes('stock')) return '📦';
    if (name.includes('analytics') || name.includes('report')) return '📊';
    if (name.includes('payment') || name.includes('billing')) return '💳';
    if (name.includes('user') || name.includes('customer')) return '👥';
    if (name.includes('notification') || name.includes('alert')) return '🔔';
    if (name.includes('setting') || name.includes('config')) return '⚙️';
    return '📋'; // Default icon
  };

  return (
    <div className={styles.dashboardContainer}>
      <main className={styles.main}>


        {/* Loading State */}
        {loading && (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingContent}>
              <div className={styles.spinner}></div>
              <p>Loading your available features...</p>
            </div>
          </div>
        )}

        {/* Dashboard Segment: Feature selection */}
        {activeSegment === "dashboard" && !loading && (
          <div className={styles.featuresSection}>
            <h2 className={styles.sectionTitle}>Available Features</h2>

            <div className={styles.featuresGrid}>
              {features.map((feature) => {
                const slug = `${feature.name}`
                  .toLowerCase()
                  .replace(/[^a-z0-9\s-]/g, "")
                  .trim()
                  .replace(/\s+/g, "-");

                return (
                  <div
                    key={feature._id}
                    className={`${styles.featureCard} ${styles.fadeInUp}`}
                    onClick={() => {
                      localStorage.removeItem("activeSegment");
                      router.push(`/${slug}-uniDashboard`);
                    }}
                  >
                    <div className={styles.cardContent}>
                      <div className={styles.featureIcon}>
                        {getFeatureIcon(feature.name)}
                      </div>
                      <h3 className={styles.featureTitle}>{feature.name}</h3>
                      <p className={styles.featureDescription}>
                        Access and manage your {feature.name.toLowerCase()} dashboard
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {features.length === 0 && (
              <div className={styles.emptyState}>
                <p className={styles.emptyDescription}>
                  No features assigned. Please contact your administrator.
                </p>
              </div>
            )}
          </div>
        )}



      </main>
    </div>
  );
} 