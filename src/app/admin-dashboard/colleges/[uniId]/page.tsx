import React from 'react';
import CollegeDetails from './collegeDetails';
import styles from '../styles/collegeDetails.module.scss';

interface CollegeDetailsPageProps {
  params: Promise<{
    uniId: string;
  }>;
}

const CollegeDetailsPage: React.FC<CollegeDetailsPageProps> = async ({ params }) => {
  const { uniId } = await params;
  
  return (
    <div className={styles.collegeDetailsPageContainer}>
      <CollegeDetails uniId={uniId} />
    </div>
  );
};

export default CollegeDetailsPage;
