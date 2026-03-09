import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

/**
 * Get authentication headers. 
 * Note: Tokens are now handled via HTTP-only cookies.
 * This is kept for backward compatibility if any custom headers are needed.
 */
export const getAuthHeaders = () => {
    return {};
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

// Add a request interceptor to handle Authorization
api.interceptors.request.use(
    (config) => {
        // Attach Bearer token for cross-origin requests (cookies may be blocked by browsers)
        if (typeof window !== 'undefined') {
            const url = config.url || '';
            const isAdminRoute = url.includes('/api/admin/') ||
                url.includes('/api/invoices/admin') ||
                url.includes('/api/invoices/stats') ||
                url.includes('/api/invoices/bulk');
            const token = isAdminRoute ? localStorage.getItem('adminToken') : localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
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
            // Restrict auto-redirects to admin and vendor dashboards only.
            // Uni dashboards and user pages handle 401s themselves.
            const isDashboardArea =
                pathname.includes('admin-dashboard') ||
                pathname.includes('vendordashboard');

            if (isDashboardArea) {
                console.warn('Unauthorized access detected in dashboard. Redirecting to login.');

                // Redirect to appropriate login page based on context
                if (pathname.includes('admin')) {
                    window.location.href = '/admin-login';
                } else if (pathname.includes('uni')) {
                    window.location.href = '/uni-login';
                } else if (pathname.includes('vendor')) {
                    window.location.href = '/vendor-login';
                } else {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

/**
 * User-side axios instance with credentials and auth.
 * Used for user-specific features like cart, orders, and favorites.
 */
export const userApi = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

userApi.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const url = config.url || '';
        const isAdminRoute = url.includes('/api/admin/') ||
            url.includes('/api/invoices/admin') ||
            url.includes('/api/invoices/stats') ||
            url.includes('/api/invoices/bulk');
        const token = isAdminRoute ? localStorage.getItem('adminToken') : localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export default api;
