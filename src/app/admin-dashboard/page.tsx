'use client';

import React from 'react';
import AdminDashboard from './adminDashboard';
import styles from './styles/adminDashboard.module.scss';

const AdminDashboardPage: React.FC = () => {
  return (
    <div className={styles.adminDashboardContainer}>
      <AdminDashboard />
    </div>
  );
};

export default AdminDashboardPage;
