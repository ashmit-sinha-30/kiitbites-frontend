"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles/ForgotPassword.module.scss";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "@/utils/apiUtils";

export default function UniForgotPassword() {
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
      const response = await api.post("/api/uni/auth/forgotpassword", { identifier });

      const data = response.data;

      if (response.status === 200) {
        toast.success("OTP sent successfully! Check your registered email.");
        setTimeout(
          () => router.push(`/uni-otp-verification?email=${encodeURIComponent(data.email)}&from=forgotpassword`),
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
        <div className={styles.msg}>Reset university password</div>
        <div className={styles.box}>
          <h1>Forgot Password</h1>
          <form onSubmit={handleForgotPassword}>
            <div className={styles.fieldGroup}>
              <label htmlFor="identifier">University email or phone</label>
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
            <span className={styles.highlight}>your dashboard</span>
          </h2>
          <p className={styles.subtext}>
            Enter your registered university email or phone number and we&apos;ll send you a
            verification code to reset your password securely.
          </p>
          <div className={styles.infoList}>
            <p className={styles.infoItem}>• Secure password recovery</p>
            <p className={styles.infoItem}>• Instant OTP verification</p>
            <p className={styles.infoItem}>• Fast dashboard access</p>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}

