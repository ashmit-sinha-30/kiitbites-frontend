"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/apiUtils";

/**
 * Custom hook to redirect authenticated users away from auth pages
 * If user is logged in, redirects them to /food/{collegeSlug}
 */
export function useAuthRedirect() {
  const router = useRouter();
  const hasChecked = useRef(false);
  // const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || ""; // Handled by apiUtils

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkAndRedirect = async () => {
      try {
        // We call the user endpoint with credentials to check if we are already logged in.
        const userResponse = await api.get("/api/user/auth/user");

        const userData = userResponse.data;
        const uniId = userData?.uniID || userData?.college?._id;

        if (uniId) {
          // Fetch college data to get the slug
          const collegeResponse = await api.get("/api/user/auth/list");
          if (collegeResponse.status === 200) {
            const colleges = collegeResponse.data;
            const userCollege = colleges.find(
              (college: { _id: string; fullName: string }) => college._id === uniId
            );

            if (userCollege) {
              // Generate slug from college name
              const generateSlug = (name: string): string => {
                return name
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-+|-+$/g, "");
              };
              const collegeSlug = generateSlug(userCollege.fullName);
              router.push(`/food/${collegeSlug}`);
              return;
            }
          }
        }

        // Fallback to generic home page
        router.push("/food");
      } catch (error) {
        console.error("Error checking authentication:", error);
        // On error, allow user to stay on auth page
      }
    };

    // Schedule after the next paint to avoid blocking initial render.
    const rafId = window.requestAnimationFrame(() => {
      void checkAndRedirect();
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [router]);
}

