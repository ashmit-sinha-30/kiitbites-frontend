"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // For App Router (Next.js 13+)
import { FaEye, FaEyeSlash } from "react-icons/fa";
import dynamic from "next/dynamic";
import styles from "./styles/Login.module.scss";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
// import GoogleLogin from "./GoogleLogin";

// Lazy load ToastContainer to reduce initial bundle size
const ToastContainer = dynamic(
  () => import("react-toastify").then((mod) => mod.ToastContainer),
  { ssr: false }
);

// Import toast function separately (lightweight)
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginForm() {
  // Redirect if user is already authenticated
  useAuthRedirect();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const router = useRouter();

  const BACKEND_URL: string = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const notify = (message: string, type: "success" | "error") => {
    toast[type](message, { position: "bottom-right", autoClose: 3000 });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.identifier || !formData.password) {
      notify("Please fill all the fields.", "error");
      return;
    }

    if (!BACKEND_URL) {
      notify("Server configuration error. Please contact support.", "error");
      return;
    }

    try {
      setIsLoading(true);

      const res = await fetch(`${BACKEND_URL}/api/user/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.status === 400 && data.redirectTo) {
        // If user is unverified, redirect them to /otpverification
        notify("Account not verified. OTP sent to email.", "error");
        setTimeout(() => {
          router.push(
            `/otpverification?email=${encodeURIComponent(
              formData.identifier
            )}&from=login`
          );
        }, 2000);
        return;
      }

      if (!res.ok) {
        notify(data.message || "Login failed. Please try again.", "error");
        return;
      }

      localStorage.setItem("token", data.token);

      // Notify header to update
      window.dispatchEvent(new Event("authChanged"));

      // Optionally, call refresh API immediately after login
      try {
        await fetch(`${BACKEND_URL}/api/user/auth/refresh`, {
          method: "GET",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        });
      } catch {
        // Ignore refresh errors here
      }

      notify("Login successful!", "success");

      // Get user data to determine university slug for redirect
      try {
        const userResponse = await fetch(`${BACKEND_URL}/api/user/auth/user`, {
          method: "GET",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${data.token}`,
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
              const userCollege = colleges.find((college: { _id: string; fullName: string }) => college._id === uniId);

              if (userCollege) {
                // Generate slug from college name
                const generateSlug = (name: string): string => {
                  return name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "");
                };
                const collegeSlug = generateSlug(userCollege.fullName);
                // Redirect with college ID (cid) parameter
                setTimeout(() => router.push(`/home/${collegeSlug}?cid=${uniId}`), 2000);
                return;
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data for redirect:", error);
      }

      // Fallback to generic home page
      setTimeout(() => router.push("/home"), 2000);
      // setTimeout(() => {
      //   window.location.reload();
      // }, 3000);
    } catch (error) {
      console.error("Login error:", error);
      notify("An unexpected error occurred. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh token on visit
  const checkSession = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/user/auth/refresh`, {
        method: "GET",
        credentials: "include",
        headers: token
          ? {
            Authorization: `Bearer ${token}`,
          }
          : {},
      });

      if (res.ok) {
        console.log("✅ Session refreshed successfully");
        const data = await res.json();
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
      } else if (res.status === 401 || res.status === 403) {
        console.log("🔴 Session expired, redirecting to login...");
        localStorage.removeItem("token"); // Clear stored token (if any)
        router.push("/login"); // Redirect to login page
      } else {
        console.log("⚠️ Unexpected response from server");
      }
    } catch (error) {
      console.error("❌ Error refreshing session:", error);
    }
  }, [BACKEND_URL, router]);

  // Refresh session on component mount - deferred to not block initial render
  useEffect(() => {
    // Simulate slow internet by showing skeleton for 1-2 seconds
    const minDelay = 800;
    const maxDelay = 1500;
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;

    const loadingTimeout = setTimeout(() => {
      setIsPageLoading(false);
    }, delay);

    // Defer session check to after initial render (keeps logic identical, just timing)
    const timeoutId = setTimeout(() => {
      checkSession(); // Refresh on page load
    }, 0);

    const interval = setInterval(() => {
      checkSession();
    }, 60 * 60 * 1000); // Refresh every 1 hour

    return () => {
      clearTimeout(loadingTimeout);
      clearTimeout(timeoutId);
      clearInterval(interval); // Cleanup on unmount
    };
  }, [checkSession]);

  if (isPageLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.box}>
          <div className={styles.skeletonTitle}></div>
          <form>
            <div className={styles.skeletonInput}></div>
            <div className={styles.skeletonInput}></div>
            <div className={styles.skeletonLink}></div>
            <div className={styles.skeletonButton}></div>
            <div className={styles.skeletonText}></div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.authWrapper}>
        <div className={styles.box}>
          <h1>Login</h1>
          <form onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label htmlFor="identifier">Your email or phone</label>
              <input
                id="identifier"
                type="text"
                name="identifier"
                placeholder="Enter your email or phone"
                value={formData.identifier}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className={styles.passwordField}>
              <label htmlFor="password">Enter password</label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <span
                className={styles.eyeIcon}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
            <div className={styles.forgotPassword}>
              <Link href="/forgotpassword">Forgot Password?</Link>
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
              {!isLoading && <span className={styles.buttonArrow}>→</span>}
            </button>
          </form>
          <div className={styles.register}>
            <p className={styles["text-black"]}>
              Don&apos;t have an account? <a href="/signup">Sign Up</a>
            </p>
          </div>
        </div>

        <div className={styles.infoPanel}>
          <div className={styles.badge}>Welcome back</div>
          <h2 className={styles.heading}>
            Login to{" "}
            <span className={styles.highlight}>your campus food hub</span>
          </h2>
          <p className={styles.subtext}>
            Access your saved favourites, track your active orders, and reorder
            from your go-to campus vendors in just a few taps.
          </p>
          <div className={styles.infoList}>
            <p className={styles.infoItem}>• View active and past orders</p>
            <p className={styles.infoItem}>• Keep favourites synced</p>
            <p className={styles.infoItem}>• Faster checkout for every order</p>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
