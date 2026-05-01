"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "../vendor-reset-password/styles/ResetPassword.module.scss";
import api from "@/utils/apiUtils";

function GuestHouseResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Invalid reset link");
    if (password.length < 8) return toast.error("Password must be at least 8 characters long");
    if (password !== confirmPassword) return toast.error("Passwords do not match");
    setIsLoading(true);
    try {
      const res = await api.post("/api/guest-house/auth/resetpassword", { email, password });
      if (res.status === 200) {
        toast.success("Password reset successfully");
        setTimeout(() => router.push("/guest-house-login"), 1000);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authWrapper}>
        <div className={styles.msg}>Create new password</div>
        <div className={styles.box}>
          <h1>Reset Password</h1>
          <form onSubmit={submit}>
            <div className={styles.passwordField}>
              <label htmlFor="password">New password</label>
              <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
              <span className={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
            <div className={styles.passwordField}>
              <label htmlFor="confirmPassword">Confirm password</label>
              <input id="confirmPassword" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              <span className={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default function GuestHouseResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GuestHouseResetPasswordContent />
    </Suspense>
  );
}

