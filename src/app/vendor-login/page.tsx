'use client';


import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './styles/vendorLogin.module.scss';
import { getBackendUrl } from '@/utils/backendCheck';

const VendorLoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      <div className={styles.box}>
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="identifier"
            placeholder="Email or Phone"
            value={formData.identifier}
            onChange={handleChange}
            required
            style={{ color: "black" }}
          />
          <div className={styles.passwordField}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
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
            <Link href="/vendor-forgot-password">Forgot Password?</Link>
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
};

export default VendorLoginPage;
