"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "../vendor-forgot-password/styles/ForgotPassword.module.scss";
import api from "@/utils/apiUtils";

export default function GuestHouseForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post("/api/guest-house/auth/forgotpassword", { identifier });
      const data = response.data;
      if (response.status === 200) {
        toast.success("OTP sent successfully!");
        setTimeout(() => {
          router.push(`/guest-house-otp-verification?email=${encodeURIComponent(data.email)}&from=forgotpassword`);
        }, 1000);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authWrapper}>
        <div className={styles.msg}>Reset guest house password</div>
        <div className={styles.box}>
          <h1>Forgot Password</h1>
          <form onSubmit={submit}>
            <div className={styles.fieldGroup}>
              <label htmlFor="identifier">Email or contact number</label>
              <input id="identifier" type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

