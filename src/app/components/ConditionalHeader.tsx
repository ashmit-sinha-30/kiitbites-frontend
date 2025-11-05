"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

const ConditionalHeader = () => {
  const pathname = usePathname();

  // Define paths that should NOT show the header
  const hideHeaderPaths = [
    '/vendorDashboard',
    '/vendor-login',
    '/vendor-otp-verification',
    '/uniDashboard',
    '/uni-login',
    '/admin-dashboard',
    '/food-ordering-uniDashboard'
  ];

  // Check if current path starts with any of the hide header paths
  const shouldHideHeader = hideHeaderPaths.some(path => 
    pathname.startsWith(path)
  );

  // Don't render header for vendor, university, or admin pages
  if (shouldHideHeader) {
    return null;
  }

  // Render header for all other pages
  return <Header />;
};

export default ConditionalHeader;
