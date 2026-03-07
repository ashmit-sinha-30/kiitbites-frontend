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

export const OrderSkeleton = () => (
    <div className={styles.orderSkeletonGrid}>
        {[1, 2, 3].map((i) => (
            <div key={i} className={styles.orderSkeletonCard}>
                <div className={styles.orderCardLeft}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <Skeleton type="text-line" style={{ width: '50%', height: '1.25rem', marginBottom: '0' }} />
                        <Skeleton type="text-line" style={{ width: '30%', height: '0.95rem', marginBottom: '0' }} />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Skeleton type="rect" style={{ width: '80px', height: '1.5rem', borderRadius: '6px' }} />
                            <Skeleton type="rect" style={{ width: '80px', height: '1.5rem', borderRadius: '6px' }} />
                        </div>
                    </div>

                    <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.6)', marginTop: '1.5rem' }}>
                        <Skeleton type="text-line" style={{ width: '60%', height: '0.9rem', marginBottom: '0.25rem' }} />
                        <Skeleton type="text-line" style={{ width: '40%', height: '0.9rem', marginBottom: '0' }} />
                    </div>

                    <div style={{ padding: '1rem', background: 'rgba(241, 245, 249, 0.8)', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.5)', marginTop: '1.5rem' }}>
                        <Skeleton type="text-line" style={{ width: '70%', height: '1.1rem', marginBottom: '0.25rem' }} />
                        <Skeleton type="text-line" style={{ width: '50%', height: '0.9rem', marginBottom: '0' }} />
                        <div style={{ borderTop: '1px dashed rgba(226, 232, 240, 0.8)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                            <Skeleton type="text-line" style={{ width: '80%', height: '0.9rem', marginBottom: '0' }} />
                        </div>
                    </div>
                </div>

                <div className={styles.orderCardRight}>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem', background: '#fdfdfd' }}>
                        {[1, 2].map(j => (
                            <div key={j} style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: j === 1 ? '0.75rem' : 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(226, 232, 240, 0.5)' }}>
                                <div style={{ flex: 1 }}>
                                    <Skeleton type="text-line" style={{ width: '60%', height: '1rem', marginBottom: '0.15rem' }} />
                                    <Skeleton type="text-line" style={{ width: '40%', height: '0.85rem', marginBottom: '0' }} />
                                </div>
                                <Skeleton type="rect" style={{ width: '20px', height: '1rem', marginLeft: '0.5rem' }} />
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '2px solid #f1f5f9', marginTop: '1.5rem' }}>
                        <Skeleton type="text-line" style={{ width: '120px', height: '1.5rem', marginBottom: '0' }} />
                    </div>
                </div>
            </div>
        ))}
    </div>
);
