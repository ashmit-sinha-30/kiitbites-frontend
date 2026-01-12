import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const url = request.nextUrl;
  const pathname = url.pathname;
  const lowercasePath = pathname.toLowerCase();

  // Skip middleware for Next.js internals and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")
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

  // If the current path is not already in lowercase, redirect to the lowercase version
  if (pathname !== lowercasePath) {
    return NextResponse.redirect(new URL(lowercasePath, request.url));
  }

  return NextResponse.next(); // Allow request to proceed normally if already correct
}

export const config = {
  matcher: "/:path*", // Apply this middleware to all paths
};

