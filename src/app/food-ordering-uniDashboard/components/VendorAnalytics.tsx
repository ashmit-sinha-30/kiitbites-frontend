import React from "react";
import styles from "../styles/VendorManagement.module.scss";
import VendorAnalyticsDashboard from "@/app/components/analytics/VendorAnalyticsDashboard";

interface VendorAnalyticsProps {
  vendorId: string;
  vendorName?: string;
}

const VendorAnalytics: React.FC<VendorAnalyticsProps> = ({ vendorId, vendorName }) => (
  <VendorAnalyticsDashboard
    vendorId={vendorId}
    vendorName={vendorName}
    styles={styles}
    rootClassName={styles.vendorAnalytics}
    titlePrefix="Sales Analytics"
  />
);

export default VendorAnalytics; 