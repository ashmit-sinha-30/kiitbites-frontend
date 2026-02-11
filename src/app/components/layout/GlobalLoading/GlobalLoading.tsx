 "use client";

import React, { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import styles from "../../../home/styles/Home.module.scss";

interface GlobalLoadingProps {
  children: React.ReactNode;
}

/**
 * Global loading overlay that tracks all in-flight `window.fetch` calls.
 * It shows a full-screen loader while there are any pending client-side requests.
 */
const GlobalLoading: React.FC<GlobalLoadingProps> = ({ children }) => {
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.fetch === "undefined") {
      return;
    }

    // Create a typed window reference so we don't need `any`
    const typedWindow = window as typeof window;
    const originalFetch = typedWindow.fetch.bind(typedWindow);

    // Wrap window.fetch to keep a simple in-flight counter
    typedWindow.fetch = async (...args: Parameters<typeof fetch>) => {
      setPendingRequests((prev) => prev + 1);
      try {
        const response = await originalFetch(...args);
        return response;
      } finally {
        setPendingRequests((prev) => Math.max(0, prev - 1));
      }
    };

    return () => {
      // Restore original fetch on unmount to avoid side effects
      typedWindow.fetch = originalFetch;
    };
  }, []);

  // Optional: small delay to avoid flicker on very fast requests
  const isLoading = pendingRequests > 0;

  return (
    <>
      {isLoading && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }} className={styles.container} aria-busy="true" aria-live="polite">
          <div className={styles.content}>
            <div className={styles.headerSection}>
              <div className={styles.iconWrapper}>
                <GraduationCap className={styles.headerIcon} size={48} />
              </div>
              <h1 className={styles.heading}>Discover Your Campus</h1>
              <p className={styles.subtitle}>
                Fetching the latest data from KAMPYN. This won&apos;t take long.
              </p>
            </div>
            <div className={styles.collegeGrid}>
              {[...Array(6)].map((_, index) => (
                <div key={index} className={styles.skeletonCard}>
                  <div className={styles.skeletonShimmer}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
};

export default GlobalLoading;


