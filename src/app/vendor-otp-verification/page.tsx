'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './styles/vendorOtpVerification.module.scss';

const VendorOtpVerificationPage: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const email = searchParams.get('email')?.toLowerCase(); // Ensure lowercase consistency

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

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Submitting OTP verification:', { email, otp });
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const response = await fetch(`${backendUrl}/api/vendor/auth/otpverification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, otp }),
      });

      console.log('Response status:', response.status);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        setError('Server returned invalid response. Please check if backend is running.');
        return;
      }

      const data = await response.json();
      console.log('OTP verification response:', data);

      if (response.ok) {
        // Store token and redirect to vendor dashboard
        localStorage.setItem('token', data.token);
        localStorage.setItem('vendorRole', 'seller'); // Default role
        router.push('/vendorDashboard');
      } else {
        setError(data.message || 'OTP verification failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    setError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const response = await fetch(`${backendUrl}/api/vendor/auth/forgotpassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ identifier: email }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response for resend OTP:', text);
        setError('Server returned invalid response. Please check if backend is running.');
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setCountdown(60); // 60 seconds cooldown
        setError('');
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return null; // Will redirect
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Verify Your Account</h1>
          <p>We&apos;ve sent a 6-digit verification code to</p>
          <p className={styles.email}>{email}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="otp">Enter Verification Code</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={handleOtpChange}
              placeholder="000000"
              maxLength={6}
              className={styles.otpInput}
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading || otp.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify Account'}
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
              ? 'Sending...' 
              : countdown > 0 
                ? `Resend in ${countdown}s` 
                : 'Resend OTP'
            }
          </button>
          
          <p className={styles.backLink}>
            <a href="/vendor-login">Back to Login</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorOtpVerificationPage;
