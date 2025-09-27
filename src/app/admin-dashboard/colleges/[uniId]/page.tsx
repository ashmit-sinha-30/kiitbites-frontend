'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import CollegeDetails from './collegeDetails';

const CollegeDetailsPage: React.FC = () => {
  const params = useParams();
  const uniId = Array.isArray(params?.uniId) ? params.uniId[0] : (params?.uniId as string);
  if (!uniId) return null;
  return <CollegeDetails uniId={uniId} />;
};

export default CollegeDetailsPage;
