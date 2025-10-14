"use client";

import FoodOrderingUniDashboardPage from "./foodorderingdashboard";
import { Suspense } from "react";

export default function UniDashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FoodOrderingUniDashboardPage />
    </Suspense>
  );
} 