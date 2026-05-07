"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "@/utils/apiUtils";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

interface RoleForgotPasswordFormProps {
  styles: Record<string, string>;
  forgotApiPath: string;
  otpPagePath: string;
  headingText?: string;
  labelText?: string;
  placeholderText?: string;
  bannerText?: string;
  infoBadge?: string;
  infoHeadingLead?: string;
  infoHeadingHighlight?: string;
  infoSubtext?: string;
  infoItems?: string[];
  enableAuthRedirect?: boolean;
}

export default function RoleForgotPasswordForm({
  styles,
  forgotApiPath,
  otpPagePath,
  headingText = "Forgot Password",
  labelText = "Your email or phone",
  placeholderText = "Enter your email or phone",
  bannerText = "Reset your password",
  infoBadge = "Reset your password",
  infoHeadingLead = "Get back to",
  infoHeadingHighlight = "your account",
  infoSubtext = "Enter your registered email or phone number and we'll send you a verification code to reset your password securely.",
  infoItems = ["Quick password recovery", "Secure OTP verification", "Get back in minutes"],
  enableAuthRedirect = false,
}: RoleForgotPasswordFormProps) {
  useAuthRedirect({ enabled: enableAuthRedirect });

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
      const response = await api.post(forgotApiPath, { identifier });
      const data = response.data;

      if (response.status === 200) {
        toast.success("OTP sent successfully! Check your registered email.");
        setTimeout(() => {
          router.push(`${otpPagePath}?email=${encodeURIComponent(data.email)}&from=forgotpassword`);
        }, 2000);
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
        <div className={styles.msg}>{bannerText}</div>
        <div className={styles.box}>
          <h1>{headingText}</h1>
          <form onSubmit={handleForgotPassword}>
            <div className={styles.fieldGroup}>
              <label htmlFor="identifier">{labelText}</label>
              <input
                id="identifier"
                type="text"
                placeholder={placeholderText}
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
          <div className={styles.badge}>{infoBadge}</div>
          <h2 className={styles.heading}>
            {infoHeadingLead} <span className={styles.highlight}>{infoHeadingHighlight}</span>
          </h2>
          <p className={styles.subtext}>{infoSubtext}</p>
          <div className={styles.infoList}>
            {infoItems.map((item) => (
              <p key={item} className={styles.infoItem}>
                • {item}
              </p>
            ))}
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}
