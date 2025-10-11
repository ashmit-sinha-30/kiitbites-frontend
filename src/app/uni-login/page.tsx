'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ENV_CONFIG } from '@/config/environment';
import styles from "./styles/login.module.scss";

export default function UniLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'identifier') {
      setIdentifier(value);
    } else if (name === 'password') {
      setPassword(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${ENV_CONFIG.BACKEND.URL}/api/uni/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier, password })
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
      <div className={styles.box}>
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="identifier"
            placeholder="Email or Phone"
            value={identifier}
            onChange={handleInputChange}
            required
            style={{ color: "black" }}
          />
          <div className={styles.passwordField}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={password}
              onChange={handleInputChange}
              required
              style={{ color: "black" }}
            />
            <span
              className={styles.eyeIcon}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </span>
          </div>
          <div className={styles.forgotPassword}>
            <Link href="/forgotpassword">Forgot Password?</Link>
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        {/* <div className={styles.divider}>
          <span>OR</span>
        </div>
        <div
          style={{
            backgroundColor: "#1e90fc",
            color: "black",
            padding: "12px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "1em",
            textAlign: "center",
            margin: "10px 0",
          }}
          className={styles.googleSignUp}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#01796f")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#1e90fc")
          }
        >
          <GoogleLogin />
        </div> */}
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}


