"use client";

import React, { useState } from "react";

interface Props {
  orderId: string;
  orderNumber: string;
  disabled?: boolean;
  onSubmit: (rating: number, comment: string) => Promise<void> | void;
}

export default function ReviewForm({ orderId, orderNumber, disabled, onSubmit }: Props) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: '#6b7280' }}>Review bill #{orderNumber}</span>
      <select
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        disabled={disabled}
        style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 8px' }}
      >
        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} ⭐</option>)}
      </select>
      <input
        type="text"
        placeholder="Write a comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        disabled={disabled}
        style={{ flex: 1, minWidth: 220, border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 10px' }}
      />
      <button
        onClick={() => onSubmit(rating, comment)}
        disabled={disabled}
        style={{ border: '1px solid #111827', color: '#111827', borderRadius: 6, padding: '6px 10px', background: disabled ? '#f3f4f6' : 'transparent' }}
      >
        Submit
      </button>
    </div>
  );
}


