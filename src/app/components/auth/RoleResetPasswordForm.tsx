"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import api from "@/utils/apiUtils";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

interface RoleResetPasswordFormProps {
  styles: Record<string, string>;
  resetApiPath: string;
  loginPath: string;
  enableAuthRedirect?: boolean;
}

const validatePassword = (password: string): boolean =>
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /\d/.test(password) &&
  /[@$!%*?&]/.test(password) &&
  !/\s/.test(password);

export default function RoleResetPasswordForm({
  styles,
  resetApiPath,
  loginPath,
  enableAuthRedirect = false,
}: RoleResetPasswordFormProps) {
  useAuthRedirect({ enabled: enableAuthRedirect });

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Invalid reset link. Please try again.");
      return;
    }

    if (!password || !confirmPassword) {
      toast.error("Please fill all fields.");
      return;
    }

    if (!validatePassword(password)) {
      toast.error(
        "Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character.",
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post(resetApiPath, { email, password });
      const data = res.data;

      if (res.status === 200) {
        toast.success("Password reset successfully!");
        setTimeout(() => router.push(loginPath), 2000);
      } else {
        toast.error(data.message || "Failed to reset password.");
      }
    } catch (error) {
      console.error("Reset Password Error:", error);
      toast.error("An error occurred. Please try again.");
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
          <form onSubmit={handleResetPassword}>
            <div className={styles.passwordField}>
              <label htmlFor="password">Enter password</label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>

            <div className={styles.passwordField}>
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <span className={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>

            <button type="submit" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
              {!isLoading && <span className={styles.buttonArrow}>→</span>}
            </button>
          </form>
        </div>

        <div className={styles.infoPanel}>
          <div className={styles.badge}>Create new password</div>
          <h2 className={styles.heading}>
            Set a <span className={styles.highlight}>strong password</span>
          </h2>
          <p className={styles.subtext}>
            Choose a secure password that you haven&apos;t used before. Make sure it includes uppercase,
            lowercase, numbers, and special characters.
          </p>
          <div className={styles.infoList}>
            <p className={styles.infoItem}>• At least 8 characters long</p>
            <p className={styles.infoItem}>• Mix of letters, numbers, and symbols</p>
            <p className={styles.infoItem}>• Keep it unique and memorable</p>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}
