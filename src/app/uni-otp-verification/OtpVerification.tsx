"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import styles from "./styles/OtpVerification.module.scss";
import api from '@/utils/apiUtils';

export default function UniOtpVerificationClient() {
  const [email, setEmail] = useState<string | null>(null);
  const [fromPage, setFromPage] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const fromParam = searchParams.get("from");

    if (emailParam) setEmail(emailParam);
    if (fromParam) setFromPage(fromParam);
  }, [searchParams]);

  return email ? (
    <OtpForm email={email} fromPage={fromPage} />
  ) : (
    <div className={styles.container}>
      <h1 style={{
        marginBottom: '20px',
        background: 'linear-gradient(90deg, #4ea199, #6fc3bd)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontSize: '3rem',
        fontWeight: 500
      }}>Loading...</h1>
    </div>
  );
}

function OtpForm({
  email,
  fromPage,
}: {
  email: string;
  fromPage: string | null;
}) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const router = useRouter();


  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData("text").slice(0, 6);
    if (!/^\d{6}$/.test(pastedData)) return;

    const newOtp = pastedData.split("");
    setOtp(newOtp);

    newOtp.forEach((num, idx) => {
      if (inputRefs.current[idx]) {
        inputRefs.current[idx]!.value = num;
      }
    });
    inputRefs.current[5]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (!otpString || otpString.length !== 6) {
      toast.error("Please enter a 6-digit OTP.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post("/api/uni/auth/otpverification", { email, otp: otpString });

      const data = res.data;

      if (res.status === 200) {
        // Store token first
        localStorage.setItem("token", data.token);

        toast.success("OTP verified successfully!");

        // Handle different redirection cases
        if (fromPage === "forgotpassword" || fromPage === "/forgotpassword") {
          // Redirect to uni reset password page
          router.push(`/uni-reset-password?email=${encodeURIComponent(email)}`);
        } else {
          // For signup/login, redirect to uni dashboard
          router.push("/uniDashboard");
        }
      } else {
        toast.error(data.message || "Failed to verify OTP.");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email || countdown > 0) return;
    setResendLoading(true);
    try {
      const res = await api.post("/api/uni/auth/resendotp", { email });

      const data = res.data;

      if (res.status === 200) {
        setCountdown(60);
        toast.success("OTP resent successfully!");
      } else {
        toast.error(data.message || "Failed to resend OTP.");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authWrapper}>
        <div className={styles.msg}>Verify your identity</div>
        <div className={styles.box}>
          <h1>OTP Verification</h1>
          <p className={styles.subtext}>Enter the OTP sent to {email}</p>
          <form onSubmit={handleVerifyOtp}>
            <div className={styles.otpContainer}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onPaste={handlePaste}
                  className={styles.otpInput}
                  required
                  aria-label={`OTP Digit ${index + 1}`}
                  title={`OTP Digit ${index + 1}`}
                  placeholder=" "
                />
              ))}
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify OTP"}
              {!isLoading && <span className={styles.buttonArrow}>→</span>}
            </button>
          </form>
          <div className={styles.footer}>
            <p>Didn&apos;t receive the code?</p>
            <button
              type="button"
              onClick={handleResendOtp}
              className={styles.resendButton}
              disabled={resendLoading || countdown > 0}
            >
              {resendLoading
                ? "Sending..."
                : countdown > 0
                  ? `Resend in ${countdown}s`
                  : "Resend OTP"}
            </button>
          </div>
        </div>

        <div className={styles.infoPanel}>
          <div className={styles.badge}>Verify your identity</div>
          <h2 className={styles.heading}>
            Secure{" "}
            <span className={styles.highlight}>verification</span>
          </h2>
          <p className={styles.subtext}>
            We&apos;ve sent a 6-digit code to your registered university email. Enter it
            below to verify your identity and continue.
          </p>
          <div className={styles.infoList}>
            <p className={styles.infoItem}>• Check your email inbox</p>
            <p className={styles.infoItem}>• Secure identity check</p>
            <p className={styles.infoItem}>• Swift dashboard access</p>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}

