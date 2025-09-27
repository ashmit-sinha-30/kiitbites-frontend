'use client';

import React from 'react';
import VendorAvailabilityToggle from './VendorAvailabilityToggle';
import DashboardAnalytics from './DashboardAnalytics';
import styles from '../styles/VendorDashboard.module.scss';

interface VendorDashboardProps {
  vendorName?: string;
  vendorId?: string;
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({ 
  vendorName = "Vendor", 
  vendorId = "—" 
}) => {
  return (
    <div className={styles.dashboardContainer}>
      {/* Welcome Message Section */}
      <div className={styles.header}>
        <h1>Welcome, {vendorName}!</h1>
        <p>Manage your inventory, orders, and business operations</p>
      </div>

      {/* Vendor Availability Toggle Section */}
      <div className={styles.availabilitySection}>
        <h2>Vendor Status</h2>
        <div className={styles.availabilityContainer}>
          <VendorAvailabilityToggle 
            vendorId={vendorId} 
            onAvailabilityChange={(isAvailable) => {
              console.log(`Vendor ${vendorName} availability changed to: ${isAvailable ? 'Available' : 'Unavailable'}`);
            }}
          />
        </div>
      </div>

      {/* Sales Analytics Section */}
      <div className={styles.analyticsSection}>
        <h2>Sales Analytics</h2>
        <DashboardAnalytics />
      </div>
    </div>
  );
};

export default VendorDashboard;
