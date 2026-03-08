import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

/**
 * Get authentication headers including the Bearer token from localStorage.
 */
export const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
        Authorization: token ? `Bearer ${token}` : '',
    };
};

/**
 * Get standard axios configuration with credentials and auth headers.
 */
export const getAuthConfig = () => {
    return {
        headers: getAuthHeaders(),
        withCredentials: true,
    };
};

/**
 * Standard axios instance with base URL and default config.
 * Used for authenticated dashboard requests.
 */
export const api = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to always include the latest token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            const adminToken = localStorage.getItem('adminToken');

            if (adminToken) {
                config.headers.Authorization = `Bearer ${adminToken}`;
            } else if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            } else {
                // If no token is found, ensure no stale Authorization header is sent
                delete config.headers.Authorization;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle specialized errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (typeof window !== 'undefined' && error.response && error.response.status === 401) {
            // Check if we are in a dashboard area that requires authentication
            const pathname = window.location.pathname;
            const isDashboardArea = pathname.includes('Dashboard') ||
                pathname.includes('dashboard') ||
                pathname.includes('admin');

            if (isDashboardArea) {
                console.warn('Unauthorized access detected in dashboard. Redirecting to login.');

                // Determine which login to go to and which token to clear
                if (pathname.includes('admin')) {
                    localStorage.removeItem('adminToken');
                    window.location.href = '/admin-login';
                } else if (pathname.includes('uni')) {
                    localStorage.removeItem('token');
                    window.location.href = '/uni-login';
                } else if (pathname.includes('vendor')) {
                    localStorage.removeItem('token');
                    window.location.href = '/vendor-login';
                } else {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

/**
 * User-side axios instance with credentials but NO Authorization header.
 * Used for user-specific features like cart, orders, and favorites.
 */
export const userApi = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
