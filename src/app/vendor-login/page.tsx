'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import styles from './styles/vendorLogin.module.scss';
import { getBackendUrl } from '@/utils/backendCheck';

// Lazy load ToastContainer to reduce initial bundle size
const ToastContainer = dynamic(
  () => import("react-toastify").then((mod) => mod.ToastContainer),
  { ssr: false }
);

// Import toast function separately (lightweight)
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const VendorLoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const backendUrl = getBackendUrl();
      console.log('Backend URL:', backendUrl);
      
      const response = await fetch(`${backendUrl}/api/vendor/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        toast.error('Server returned invalid response. Please check if backend is running.');
        return;
      }

      const data = await response.json();

      if (response.ok) {
        // Store token and redirect to vendor dashboard
        localStorage.setItem('token', data.token);
        localStorage.setItem('vendorRole', 'seller'); // Default role, can be updated later
        toast.success('Login successful!');
        router.push('/vendorDashboard');
      } else {
        if (data.redirectTo) {
          // User not verified, redirect to OTP verification
          toast.info('Please verify your account');
          const email = data.email || formData.identifier.toLowerCase();
          router.push(`/vendor-otp-verification?email=${encodeURIComponent(email)}&from=login`);
        } else {
          toast.error(data.message || 'Login failed');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authWrapper}>
        <div className={styles.box}>
          <h1>Vendor Login</h1>
          <form onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label htmlFor="identifier">Your email or phone</label>
              <input
                id="identifier"
                type="text"
                name="identifier"
                placeholder="Enter your email or phone"
                value={formData.identifier}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className={styles.passwordField}>
              <label htmlFor="password">Enter password</label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <span
                className={styles.eyeIcon}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
            <div className={styles.forgotPassword}>
              <Link href="/vendor-forgot-password">Forgot Password?</Link>
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
              {!isLoading && <span className={styles.buttonArrow}>→</span>}
            </button>
          </form>
          <div className={styles.register}>
            <p className={styles["text-black"]}>
              Don&apos;t have an account? <a href="/vendor-signup">Sign Up</a>
            </p>
          </div>
        </div>

        <div className={styles.infoPanel}>
          <div className={styles.badge}>Welcome back</div>
          <h2 className={styles.heading}>
            Login to{" "}
            <span className={styles.highlight}>your vendor dashboard</span>
          </h2>
          <p className={styles.subtext}>
            Access your vendor account, manage your menu, track orders, and grow your campus business in just a few taps.
          </p>
          <div className={styles.infoList}>
            <p className={styles.infoItem}>• Manage your menu and items</p>
            <p className={styles.infoItem}>• Track active and past orders</p>
            <p className={styles.infoItem}>• View analytics and insights</p>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default VendorLoginPage;
