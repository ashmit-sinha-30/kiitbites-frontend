'use client';

import React from 'react';
import CollegesManagement from './collegesManagement';
import styles from './styles/collegesManagement.module.scss';

const CollegesPage: React.FC = () => {
  return (
    <div className={styles.collegesPageContainer}>
      <CollegesManagement />
    </div>
  );
};

export default CollegesPage;
