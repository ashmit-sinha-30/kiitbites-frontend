'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './styles/vendorOtpVerification.module.scss';
import api from '@/utils/apiUtils';

const VendorOtpVerificationContent: React.FC = () => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get('email')?.toLowerCase(); // Ensure lowercase consistency
  const fromPage = searchParams.get('from');

  useEffect(() => {
    if (!email) {
      router.push('/vendor-login');
    }
  }, [email, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (!otpString || otpString.length !== 6) {
      toast.error('Please enter a 6-digit OTP.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/api/vendor/auth/otpverification", { email, otp: otpString });

      const data = response.data;

      if (response.status === 200) {
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        window.dispatchEvent(new Event("authChanged"));
        localStorage.setItem('vendorRole', 'seller'); // Default role
        toast.success('OTP verified successfully!');

        if (fromPage === 'forgotpassword' || fromPage === '/forgotpassword') {
          router.push(`/vendor-reset-password?email=${encodeURIComponent(email || '')}`);
        } else {
          router.push('/vendorDashboard');
        }
      } else {
        toast.error(data.message || 'OTP verification failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setResendLoading(true);

    try {
      const response = await api.post("/api/vendor/auth/forgotpassword", { identifier: email });

      const data = response.data;

      if (response.status === 200) {
        setCountdown(60); // 60 seconds cooldown
        toast.success('OTP resent successfully!');
      } else {
        toast.error(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return null; // Will redirect
  }

  return (
    <div className={styles.container}>
      <div className={styles.authWrapper}>
        <div className={styles.msg}>Verify identity</div>
        <div className={styles.box}>
          <h1>OTP Verification</h1>
          <p className={styles.subtext}>Enter the OTP sent to {email}</p>
          <form onSubmit={handleSubmit}>
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
            <button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
              {!loading && <span className={styles.buttonArrow}>→</span>}
            </button>
          </form>
          <div className={styles.footer}>
            <p>Didn&apos;t receive the code?</p>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendLoading || countdown > 0}
              className={styles.resendButton}
            >
              {resendLoading
                ? "Sending..."
                : countdown > 0
                  ? `Resend in ${countdown}s`
                  : "Resend OTP"}
            </button>
            <p className={styles.backLink}>
              <a href="/vendor-login">Back to Login</a>
            </p>
          </div>
        </div>

        <div className={styles.infoPanel}>
          <div className={styles.badge}>Verify identity</div>
          <h2 className={styles.heading}>
            Secure{" "}
            <span className={styles.highlight}>identity check</span>
          </h2>
          <p className={styles.subtext}>
            We&apos;ve sent a 6-digit code to your registered vendor email. Enter it
            below to verify your identity and continue.
          </p>
          <div className={styles.infoList}>
            <p className={styles.infoItem}>• Secure your sales account</p>
            <p className={styles.infoItem}>• Instant identity verification</p>
            <p className={styles.infoItem}>• Fast dashboard access</p>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}

const VendorOtpVerificationPage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VendorOtpVerificationContent />
    </Suspense>
  );
};

export default VendorOtpVerificationPage;
