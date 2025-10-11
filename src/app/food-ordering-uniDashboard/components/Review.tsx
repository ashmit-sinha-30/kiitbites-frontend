"use client";

import React, { useEffect, useState } from "react";
import { ENV_CONFIG } from "@/config/environment";
import styles from "../styles/Review.module.scss";

interface Props {
  universityId: string;
}

interface UniReview {
  rating: number;
  comment: string;
  createdAt: string;
  orderNumber: string;
  vendorName: string;
  orderSummary: {
    total: number;
    orderType: string;
    createdAt: string;
  };
  items?: { itemId: string; kind: string; quantity: number; name?: string; unit?: string; price?: number }[];
}

export default function Review({ universityId }: Props) {
  const [reviews, setReviews] = useState<UniReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!universityId) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${ENV_CONFIG.BACKEND.URL}/api/reviews/university/${universityId}`);
        const json = await res.json();
        if (json.success) setReviews(json.data);
        else setError(json.message || "Failed to load reviews");
      } catch (e) {
        setError("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [universityId]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>Reviews</div>
      {loading && <div className={styles.info}>Loading…</div>}
      {error && <div className={styles.error}>{error}</div>}
      {!loading && !error && reviews.length === 0 && (
        <div className={styles.info}>No reviews yet.</div>
      )}
      <div className={styles.grid}>
        {reviews.map((r, idx) => (
          <div className={styles.card} key={idx}>
            <div className={styles.row}>
              <div>
                <div className={styles.order}>Bill #{r.orderNumber}</div>
                <div className={styles.meta}>{new Date(r.orderSummary.createdAt).toLocaleString()}</div>
              </div>
              <div className={styles.rating}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
            </div>
            <div className={styles.vendor}>Vendor: {r.vendorName}</div>
            <div className={styles.meta}>Type: {r.orderSummary.orderType} • Total: ₹{r.orderSummary.total}</div>
            {!!r.items?.length && (
              <div className={styles.items}>
                {r.items.map((it, i) => (
                  <div key={i} className={styles.itemRow}>
                    <span className={styles.itemName}>{it.name || it.kind}</span>
                    <span className={styles.itemMeta}>×{it.quantity}{it.unit ? ` ${it.unit}` : ""}</span>
                  </div>
                ))}
              </div>
            )}
            {r.comment && <div className={styles.comment}>{r.comment}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}


