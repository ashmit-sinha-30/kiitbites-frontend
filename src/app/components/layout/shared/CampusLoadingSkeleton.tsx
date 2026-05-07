"use client";

import React from "react";
import { GraduationCap } from "lucide-react";
import styles from "../../../food/styles/Home.module.scss";

interface CampusLoadingSkeletonProps {
  message: string;
  overlay?: boolean;
}

const CampusLoadingSkeleton: React.FC<CampusLoadingSkeletonProps> = ({ message, overlay = false }) => {
  const rootStyle = overlay ? { position: "fixed" as const, inset: 0, zIndex: 9999 } : undefined;

  return (
    <div style={rootStyle} className={styles.container} aria-busy="true" aria-live="polite">
      <div className={styles.content}>
        <div className={styles.headerSection}>
          <div className={styles.iconWrapper}>
            <GraduationCap className={styles.headerIcon} size={48} />
          </div>
          <h1 className={styles.heading}>Discover Your Campus</h1>
          <p className={styles.subtitle}>{message}</p>
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
  );
};

export default CampusLoadingSkeleton;
