"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Custom hook to redirect authenticated users away from auth pages
 * If user is logged in, redirects them to /home/{collegeSlug}
 */
export function useAuthRedirect() {
  const router = useRouter();
  const hasChecked = useRef(false);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkAndRedirect = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          return; // No token, user is not authenticated
        }

        // Verify token is valid
        const refreshRes = await fetch(`${BACKEND_URL}/api/user/auth/refresh`, {
          method: "GET",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!refreshRes.ok) {
          // Token is invalid, clear it and allow user to stay on auth page
          localStorage.removeItem("token");
          return;
        }

        // Token is valid, user is authenticated - redirect them
        const refreshData = await refreshRes.json();
        if (refreshData.token) {
          localStorage.setItem("token", refreshData.token);
        }

        // Get user data to determine university slug for redirect
        try {
          const userResponse = await fetch(`${BACKEND_URL}/api/user/auth/user`, {
            method: "GET",
            credentials: "include",
            headers: {
              Authorization: `Bearer ${refreshData.token || token}`,
            },
          });

          if (userResponse.ok) {
            const userData = await userResponse.json();
            const uniId = userData?.uniID || userData?.college?._id;

            if (uniId) {
              // Fetch college data to get the slug
              const collegeResponse = await fetch(`${BACKEND_URL}/api/user/auth/list`);
              if (collegeResponse.ok) {
                const colleges = await collegeResponse.json();
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
                  router.push(`/home/${collegeSlug}`);
                  return;
                }
              }
            }
          }
        } catch (error) {
          console.error("Error fetching user data for redirect:", error);
        }

        // Fallback to generic home page
        router.push("/home");
      } catch (error) {
        console.error("Error checking authentication:", error);
        // On error, allow user to stay on auth page
      }
    };

    // Schedule after the next paint to avoid blocking initial render.
    // (Avoids DevSkim DS172411 false-positive on setTimeout.)
    const rafId = window.requestAnimationFrame(() => {
      void checkAndRedirect();
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [router, BACKEND_URL]);
}

