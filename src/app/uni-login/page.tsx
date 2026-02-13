'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import { ENV_CONFIG } from '@/config/environment';
import styles from "./styles/login.module.scss";

// Lazy load ToastContainer to reduce initial bundle size
const ToastContainer = dynamic(
  () => import("react-toastify").then((mod) => mod.ToastContainer),
  { ssr: false }
);

// Import toast function separately (lightweight)
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function UniLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${ENV_CONFIG.BACKEND.URL}/api/uni/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || 'Login failed');
        return;
      }
      if (json.token) {
        localStorage.setItem('token', json.token);
        toast.success('Login successful!');
      }
      window.dispatchEvent(new Event('authChanged'));
      router.push('/uniDashboard');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authWrapper}>
        <div className={styles.box}>
          <h1>University Login</h1>
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
              <Link href="/uni-forgot-password">Forgot Password?</Link>
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
              {!isLoading && <span className={styles.buttonArrow}>→</span>}
            </button>
          </form>
          <div className={styles.register}>
            <p className={styles["text-black"]}>
              Don&apos;t have an account? <a href="/uni-signup">Sign Up</a>
            </p>
          </div>
        </div>

        <div className={styles.infoPanel}>
          <div className={styles.badge}>Welcome back</div>
          <h2 className={styles.heading}>
            Login to{" "}
            <span className={styles.highlight}>your university dashboard</span>
          </h2>
          <p className={styles.subtext}>
            Access your university account, manage vendors, monitor campus activity, and oversee your food ordering platform in just a few taps.
          </p>
          <div className={styles.infoList}>
            <p className={styles.infoItem}>• Manage vendors and colleges</p>
            <p className={styles.infoItem}>• Monitor orders and analytics</p>
            <p className={styles.infoItem}>• Configure platform settings</p>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}


