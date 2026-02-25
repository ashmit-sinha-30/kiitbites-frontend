"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation"; // ✅ Removed useRouter (not used here)
import { useRouter } from "next/navigation"; // ✅ Only used in OtpForm
import { ToastContainer, toast } from "react-toastify";
import styles from "./styles/OtpVerification.module.scss";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

export default function OtpVerificationClient() {
  // Redirect if user is already authenticated
  useAuthRedirect();
  const [email, setEmail] = useState<string | null>(null);
  const [fromPage, setFromPage] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const fromParam = searchParams.get("from");

    console.log("Extracted email:", emailParam);
    console.log("Extracted fromPage:", fromParam);
    console.log(
      "All search params:",
      Object.fromEntries(searchParams.entries())
    );

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
  const router = useRouter(); // ✅ Correctly using router here

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

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
      const res = await fetch(`${BACKEND_URL}/api/user/auth/otpverification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await res.json();

      if (res.ok) {
        const token = data.token;

        if (token) {
          localStorage.setItem("token", token);
        } else {
          localStorage.removeItem("token");
        }

        // If the flow originated from forgot password, skip session lookups.
        if (
          fromPage === "forgotpassword" ||
          fromPage === "/forgotpassword"
        ) {
          toast.success("OTP verified successfully!");
          router.push(`/resetpassword?email=${encodeURIComponent(email)}`);
          return;
        }

        if (!token) {
          toast.error("Verification succeeded but login session is missing. Please log in manually.");
          router.push("/login");
          return;
        }

        // After successful OTP verification, get user data
        const userRes = await fetch(`${BACKEND_URL}/api/user/auth/user`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          // Store user data
          localStorage.setItem("user", JSON.stringify(userData));

          toast.success("OTP verified successfully!");
          console.log("Redirecting based on fromPage:", fromPage);

          // Handle different redirection cases
          if (fromPage === "forgotpassword" || fromPage === "/forgotpassword") {
            console.log("Redirecting to resetpassword");
            router.push(`/resetpassword?email=${encodeURIComponent(email)}`);
          } else {
            // For both signup and login, redirect to user's university home page
            const uniId = userData?.uniID || userData?.college?._id;

            if (uniId) {
              try {
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
                    const redirectUrl = `/home/${collegeSlug}?cid=${uniId}`;
                    console.log(`Redirecting to ${redirectUrl} after ${fromPage}`);
                    router.push(redirectUrl);
                    // Force a page reload after a short delay
                    setTimeout(() => {
                      window.location.href = redirectUrl;
                    }, 100);
                    return;
                  }
                }
              } catch (error) {
                console.error("Error fetching college data for redirect:", error);
              }
            }

            // Fallback to generic home page
            console.log("Redirecting to home");
            router.push("/home");
            // Force a page reload after a short delay
            setTimeout(() => {
              window.location.href = "/home";
            }, 100);
          }
        } else {
          const errorData = await userRes.json();
          console.error("User data fetch error:", errorData);
          toast.error(
            errorData.message || "Failed to fetch user data after verification."
          );
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
      const res = await fetch(`${BACKEND_URL}/api/user/auth/resendotp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
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
            We&apos;ve sent a 6-digit code to your registered email. Enter it
            below to verify your identity and continue.
          </p>
          <div className={styles.infoList}>
            <p className={styles.infoItem}>• Check your email inbox</p>
            <p className={styles.infoItem}>• Code expires in 10 minutes</p>
            <p className={styles.infoItem}>• Can resend if needed</p>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}
