'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './styles/vendorLogin.module.scss';
import { checkBackendHealth, getBackendUrl } from '@/utils/backendCheck';

const VendorLoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  const router = useRouter();

  // Check backend health on component mount
  useEffect(() => {
    const checkBackend = async () => {
      const backendUrl = getBackendUrl();
      console.log('Checking backend health at:', backendUrl);
      
      const health = await checkBackendHealth(backendUrl);
      setBackendStatus(health.isHealthy ? 'healthy' : 'unhealthy');
      
      if (!health.isHealthy) {
        setError(`Backend connection failed: ${health.error}`);
      }
    };

    checkBackend();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
        setError('Server returned invalid response. Please check if backend is running.');
        return;
      }

      const data = await response.json();

      if (response.ok) {
        // Store token and redirect to vendor dashboard
        localStorage.setItem('token', data.token);
        localStorage.setItem('vendorRole', 'seller'); // Default role, can be updated later
        router.push('/vendorDashboard');
      } else {
        if (data.redirectTo) {
          // User not verified, redirect to OTP verification
          // Extract email from redirectTo URL or use the identifier
          const email = data.email || formData.identifier.toLowerCase();
          router.push(`/vendor-otp-verification?email=${encodeURIComponent(email)}&from=login`);
        } else {
          setError(data.message || 'Login failed');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <h1>Vendor Login</h1>
          <p>Sign in to your vendor account</p>
          {backendStatus === 'checking' && (
            <div className={styles.status}>Checking backend connection...</div>
          )}
          {backendStatus === 'unhealthy' && (
            <div className={styles.statusError}>⚠️ Backend connection failed</div>
          )}
          {backendStatus === 'healthy' && (
            <div className={styles.statusSuccess}>✅ Backend connected</div>
          )}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="identifier">Email or Phone</label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="Enter email or phone number"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            Don&apos;t have an account?{' '}
            <a href="/vendor-signup" className={styles.link}>
              Sign up here
            </a>
          </p>
          <p>
            <a href="/vendor-forgot-password" className={styles.link}>
              Forgot Password?
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorLoginPage;
