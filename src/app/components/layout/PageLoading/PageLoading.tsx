"use client";

import React from "react";
import CampusLoadingSkeleton from "../shared/CampusLoadingSkeleton";

interface PageLoadingProps {
  message?: string;
}

const PageLoading: React.FC<PageLoadingProps> = ({ message }) => {
  return <CampusLoadingSkeleton message={message ?? "Loading colleges..."} />;
};

export default PageLoading;


