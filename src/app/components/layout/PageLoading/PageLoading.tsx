"use client";

import React from "react";
import styles from "../GlobalLoading/GlobalLoading.module.scss";

interface PageLoadingProps {
  message?: string;
}

const PageLoading: React.FC<PageLoadingProps> = ({ message }) => {
  return (
    <div className={styles.overlay} aria-busy="true" aria-live="polite">
      <div className={styles.content}>
        <div className={styles.spinner} />
        <div className={styles.title}>Loading your experience…</div>
        <p className={styles.subtitle}>
          {message ?? "Fetching the latest data from KAMPYN. This won&apos;t take long."}
        </p>
      </div>
    </div>
  );
};

export default PageLoading;


