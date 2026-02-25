"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles/ForgotPassword.module.scss";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

export default function ForgotPassword() {
  // Redirect if user is already authenticated
  useAuthRedirect();

  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!identifier) {
      toast.error("Please enter your email or phone number.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/forgotpassword`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier }),
        }
      );

      let data;
      try {
        data = await response.json();
      } catch (err) {
        console.error("Invalid JSON response:", err);
        throw new Error("Unexpected server response.");
      }

      if (response.ok) {
        toast.success("OTP sent successfully! Check your registered email.");
        setTimeout(
          () => router.push(`/otpverification?email=${encodeURIComponent(data.email)}&from=forgotpassword`),
          2000
        );
      } else {
        toast.error(data?.message || "Failed to send reset email.");
      }
    } catch (error) {
      console.error("Forgot Password Error:", error);
      toast.error("Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authWrapper}>
        <div className={styles.msg}>Reset your password</div>
        <div className={styles.box}>
          <h1>Forgot Password</h1>
          <form onSubmit={handleForgotPassword}>
            <div className={styles.fieldGroup}>
              <label htmlFor="identifier">Your email or phone</label>
              <input
                id="identifier"
                type="text"
                placeholder="Enter your email or phone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Sending OTP..." : "Send OTP"}
              {!isLoading && <span className={styles.buttonArrow}>→</span>}
            </button>
          </form>
        </div>

        <div className={styles.infoPanel}>
          <div className={styles.badge}>Reset your password</div>
          <h2 className={styles.heading}>
            Get back to{" "}
            <span className={styles.highlight}>your account</span>
          </h2>
          <p className={styles.subtext}>
            Enter your registered email or phone number and we&apos;ll send you a
            verification code to reset your password securely.
          </p>
          <div className={styles.infoList}>
            <p className={styles.infoItem}>• Quick password recovery</p>
            <p className={styles.infoItem}>• Secure OTP verification</p>
            <p className={styles.infoItem}>• Get back in minutes</p>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}
