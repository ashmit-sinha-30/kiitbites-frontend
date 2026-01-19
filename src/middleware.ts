import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const url = request.nextUrl;
  const pathname = url.pathname;
  const lowercasePath = pathname.toLowerCase();

  // Skip middleware for Next.js internals, API routes, and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Handle admin subdomain routing
  if (hostname.startsWith("admin.")) {
    // Only prepend /admin-dashboard if the path doesn't already start with it
    if (!pathname.startsWith("/admin-dashboard")) {
      return NextResponse.rewrite(
        new URL("/admin-dashboard" + pathname, request.url)
      );
    }
  }

  // Skip lowercase redirect for dashboard routes that use camelCase
  const camelCaseRoutes = [
    "/uniDashboard",
    "/vendorDashboard",
    "/food-ordering-uniDashboard",
  ];
  
  const isCamelCaseRoute = camelCaseRoutes.some(route => 
    pathname.startsWith(route)
  );

  // If the current path is not already in lowercase, redirect to the lowercase version
  // BUT skip this for camelCase routes
  if (!isCamelCaseRoute && pathname !== lowercasePath) {
    return NextResponse.redirect(new URL(lowercasePath, request.url));
  }

  return NextResponse.next(); // Allow request to proceed normally if already correct
}

export const config = {
  matcher: "/:path*", // Apply this middleware to all paths
};

