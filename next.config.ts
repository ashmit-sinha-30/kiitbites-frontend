import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // Enables React Strict Mode
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kiitbites-backend.onrender.com",
        pathname: "/team/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.NODE_ENV === "development"
          ? "http://localhost:5001/api/:path*"
          : "https://kiitbites-backend.onrender.com/api/:path*", // Production API
      },
    ];
  },
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    // Content Security Policy directives
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com https://checkout.razorpay.com https://*.razorpay.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com https://api.cloudinary.com https://res.cloudinary.com ${backendUrl}` + (isProduction ? "" : " http://localhost:* ws://localhost:*"),
      "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
      "media-src 'self' https://res.cloudinary.com blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      isProduction ? "upgrade-insecure-requests" : "",
    ].filter(Boolean).join("; ");

    return [
      {
        // Apply headers to all routes
        source: "/:path*",
        headers: [
          // Strict-Transport-Security (HSTS) - Production only
          ...(isProduction ? [{
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          }] : []),

          // Content-Security-Policy - Prevent XSS attacks
          {
            key: "Content-Security-Policy",
            value: cspDirectives,
          },

          // X-Frame-Options - Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },

          // X-Content-Type-Options - Prevent MIME sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },

          // Referrer-Policy - Control referrer information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },

          // Permissions-Policy - Restrict browser features
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=(self \"https://api.razorpay.com\" \"https://checkout.razorpay.com\"), interest-cohort=()",
          },

          // Additional security headers
          {
            key: "X-DNS-Prefetch-Control",
            value: "off",
          },
          {
            key: "X-Download-Options",
            value: "noopen",
          },
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
        ],
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: false, // Strict TypeScript mode
  },
};

export default nextConfig;
