import React from 'react';
import { Skeleton } from '@/app/components/skeleton/SkeletonLoader/SkeletonLoader';
import styles from '../styles/DashboardSkeleton.module.scss';
import dashboardStyles from '../styles/VendorDashboard.module.scss';

export const DashboardHomeSkeleton = () => (
    <div className={dashboardStyles.dashboardContainer}>
        <div className={dashboardStyles.header}>
            <div className={dashboardStyles.headerContent}>
                <div className={dashboardStyles.headerText}>
                    <Skeleton type="text-line" style={{ width: '40%', height: '3rem', marginBottom: '1rem' }} />
                    <Skeleton type="text-line" style={{ width: '60%', height: '1.5rem' }} />
                </div>
            </div>
        </div>

        <div className={dashboardStyles.analyticsSection}>
            <Skeleton type="text-line" style={{ width: '200px', height: '2rem', marginBottom: '2rem' }} />
            <div className={dashboardStyles.statsGrid}>
                {[1, 2, 3].map((i) => (
                    <div key={i} className={dashboardStyles.statCard}>
                        <Skeleton type="rect" style={{ width: '70px', height: '70px', borderRadius: '20px' }} />
                        <div className={dashboardStyles.statContent}>
                            <Skeleton type="text-line" style={{ width: '100px', height: '2rem', marginBottom: '0.5rem' }} />
                            <Skeleton type="text-line" style={{ width: '80px', height: '1rem' }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className={dashboardStyles.infoSection}>
            <Skeleton type="text-line" style={{ width: '200px', height: '2rem', marginBottom: '2rem' }} />
            <div className={dashboardStyles.actionGrid}>
                {[1, 2, 3].map((i) => (
                    <div key={i} className={dashboardStyles.actionCard}>
                        <Skeleton type="text-line" style={{ width: '60%', height: '1.5rem', marginBottom: '1rem' }} />
                        <Skeleton type="text-line" style={{ width: '100%', height: '1rem', marginBottom: '0.5rem' }} />
                        <Skeleton type="text-line" style={{ width: '90%', height: '1rem' }} />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export const InventorySkeleton = () => (
    <div className={styles.inventorySkeleton}>
        <Skeleton type="text-line" style={{ width: '40%', height: '2rem', marginBottom: '1rem' }} />
        <Skeleton type="text-line" style={{ width: '60%', height: '1.2rem', marginBottom: '2rem' }} />

        {[1, 2].map((section) => (
            <div key={section} className={styles.sectionSkeleton}>
                <Skeleton type="text-line" style={{ width: '200px', height: '1.5rem', marginBottom: '1.5rem' }} />
                <div className={styles.tableSkeleton}>
                    <div className={styles.tableHeaderSkeleton}>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} type="text-line" style={{ width: '15%', height: '1rem' }} />
                        ))}
                    </div>
                    {[1, 2, 3].map((row) => (
                        <div key={row} className={styles.tableRowSkeleton}>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} type="text-line" style={{ width: '15%', height: '1rem' }} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

export const AnalyticsSkeleton = () => (
    <div className={styles.analyticsSkeleton}>
        <div className={styles.datePickerRow}>
            <Skeleton type="text-line" style={{ width: '100px', height: '1.5rem' }} />
            <Skeleton type="rect" style={{ width: '150px', height: '2.5rem', borderRadius: '8px' }} />
        </div>

        <div className={styles.summaryGrid}>
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className={styles.summaryCard}>
                    <Skeleton type="text-line" style={{ width: '60%', height: '1.2rem', marginBottom: '1rem' }} />
                    <Skeleton type="text-line" style={{ width: '80%', height: '1rem', marginBottom: '0.5rem' }} />
                    <Skeleton type="text-line" style={{ width: '70%', height: '1rem', marginBottom: '0.5rem' }} />
                    <Skeleton type="text-line" style={{ width: '75%', height: '1rem' }} />
                </div>
            ))}
        </div>

        <div className={styles.detailsGrid}>
            <div className={styles.smallSection}>
                <Skeleton type="text-line" style={{ width: '150px', height: '1.5rem', marginBottom: '1rem' }} />
                <Skeleton type="text-line" style={{ width: '90%', height: '1rem', marginBottom: '0.5rem' }} />
                <Skeleton type="text-line" style={{ width: '85%', height: '1rem', marginBottom: '0.5rem' }} />
            </div>
            <div className={styles.largeSection}>
                <Skeleton type="text-line" style={{ width: '200px', height: '1.5rem', marginBottom: '1rem' }} />
                <Skeleton type="rect" style={{ width: '100%', height: '300px', borderRadius: '16px' }} />
            </div>
        </div>
    </div>
);
