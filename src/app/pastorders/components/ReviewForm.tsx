"use client";

import React, { useState } from "react";
import { FaStar, FaRegStar } from "react-icons/fa";

interface Props {
  disabled?: boolean;
  onSubmit: (rating: number, comment: string) => Promise<void> | void;
}

export default function ReviewForm({ disabled, onSubmit }: Props) {
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [comment, setComment] = useState<string>("");

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = (hover || rating) >= star;
            const Icon = isFilled ? FaStar : FaRegStar;
            return (
              <Icon
                key={star}
                size={24}
                style={{
                  cursor: disabled ? 'default' : 'pointer',
                  color: '#4ea199',
                  transition: 'transform 200ms',
                  transform: hover === star ? 'scale(1.2)' : 'scale(1)'
                }}
                onClick={() => !disabled && setRating(star)}
                onMouseEnter={() => !disabled && setHover(star)}
                onMouseLeave={() => !disabled && setHover(0)}
              />
            );
          })}
        </div>
        <input
          type="text"
          placeholder="Write a comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={disabled}
          style={{
            flex: 1,
            minWidth: 250,
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: '0.95rem',
            outlineColor: '#4ea199'
          }}
        />
        <button
          onClick={() => rating > 0 && onSubmit(rating, comment)}
          disabled={disabled || rating === 0}
          style={{
            backgroundColor: (disabled || rating === 0) ? '#f1f5f9' : '#111827',
            color: (disabled || rating === 0) ? '#94a3b8' : 'white',
            borderRadius: 8,
            padding: '8px 16px',
            border: 'none',
            fontWeight: 600,
            cursor: (disabled || rating === 0) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Submit Review
        </button>
      </div>
    </div>
  );
}


