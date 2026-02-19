"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../Header/Header";

const ConditionalHeader = () => {
  const pathname = usePathname();
  const [isAdminSubdomain, setIsAdminSubdomain] = useState(false);

  useEffect(() => {
    // Check if we're on the admin subdomain
    if (typeof window !== "undefined") {
      setIsAdminSubdomain(window.location.hostname.startsWith("admin."));
    }
  }, []);

  // Define paths that should NOT show the header
  const hideHeaderPaths = [
    '/vendorDashboard',
    '/vendor-login',
    '/vendor-otp-verification',
    '/uniDashboard',
    '/uni-login',
    '/admin-dashboard',
    '/food-ordering-uniDashboard',
    '/unidashboard'
  ];

  // Check if current path starts with any of the hide header paths
  const shouldHideHeader = hideHeaderPaths.some(path => 
    pathname.startsWith(path)
  ) || isAdminSubdomain;

  // Don't render header for vendor, university, or admin pages
  if (shouldHideHeader) {
    return null;
  }

  // Render header for all other pages
  return <Header />;
};

export default ConditionalHeader;
