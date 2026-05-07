import React from "react";
import styles from "../styles/InventoryReport.module.scss";
import { AnalyticsSkeleton } from "./DashboardSkeleton";
import VendorAnalyticsDashboard from "@/app/components/analytics/VendorAnalyticsDashboard";

interface DashboardAnalyticsProps {
  vendorId?: string;
}

const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ vendorId }) => (
  <VendorAnalyticsDashboard
    vendorId={vendorId}
    styles={styles}
    rootClassName={styles.analyticsDashboard}
    renderLoading={() => <AnalyticsSkeleton />}
  />
);

export default DashboardAnalytics; 