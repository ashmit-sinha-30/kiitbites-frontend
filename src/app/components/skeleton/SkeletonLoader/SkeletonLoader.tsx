import React from 'react';
import styles from './SkeletonLoader.module.scss';

interface SkeletonProps {
    type?: 'rect' | 'circle' | 'text-line';
    className?: string;
    style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ type = 'rect', className = '', style }) => {
    const typeClass = type === 'circle' ? styles.circle : type === 'text-line' ? styles.textLine : styles.rect;
    return (
        <div
            className={`${styles.skeleton} ${typeClass} ${className}`}
            style={style}
        />
    );
};

export const VendorSkeleton = () => (
    <div className={styles.vendorSkeletonGrid}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={styles.responsiveCard}>
                <Skeleton className={styles.imageArea} />
                <div className={styles.contentArea}>
                    <Skeleton type="text-line" style={{ width: '80%', height: '1.5rem' }} />
                    <Skeleton type="text-line" style={{ width: '100%', height: '2.5rem', borderRadius: '12px', marginTop: 'auto' }} />
                </div>
            </div>
        ))}
    </div>
);

export const CategorySkeleton = () => (
    <div className={styles.categorySkeletonGrid}>
        {[1, 2].map((i) => (
            <div key={i} className={styles.categorySkeletonCard}>
                <Skeleton className={styles.rect} />
            </div>
        ))}
    </div>
);

export const FavoriteSkeleton = () => (
    <div className={styles.vendorSkeletonGrid}>
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.responsiveCard}>
                <Skeleton className={styles.imageArea} />
                <div className={styles.contentArea}>
                    <Skeleton type="text-line" style={{ width: '80%', height: '1.25rem' }} />
                    <Skeleton type="text-line" style={{ width: '100%', height: '0.875rem' }} />
                    <Skeleton type="text-line" style={{ width: '40%', height: '1.5rem', marginTop: 'auto' }} />
                </div>
            </div>
        ))}
    </div>
);
