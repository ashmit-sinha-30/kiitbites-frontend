"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/apiUtils";
import axios from "axios";

export type UseAuthRedirectOptions = {
  /** When false, skip the redirect check (still call this hook unconditionally at the top of a component). */
  enabled?: boolean;
};

/**
 * Custom hook to redirect authenticated users away from auth pages
 * If user is logged in, redirects them to /home
 */
export function useAuthRedirect(options?: UseAuthRedirectOptions) {
  const enabled = options?.enabled !== false;
  const router = useRouter();
  const hasChecked = useRef(false);
  // const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || ""; // Handled by apiUtils

  useEffect(() => {
    if (!enabled) return;

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
          router.push("/home");
          return;
        }

        // Fallback to generic home page
        router.push("/home");
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          return;
        }
        console.error("Error checking authentication:", error);
        // On error, allow user to stay on auth page
      }
    };

    // Schedule after the next paint to avoid blocking initial render.
    const rafId = window.requestAnimationFrame(() => {
      void checkAndRedirect();
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [router, enabled]);
}

