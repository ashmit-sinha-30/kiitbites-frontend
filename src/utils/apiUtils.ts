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

// CSRF Token state
let csrfToken: string | null = null;

/**
 * Initialize CSRF token from backend.
 * Should be called on app startup.
 */
export const initCSRF = async () => {
    try {
        const response = await axios.get(`${BACKEND_URL}/api/csrf/token`, { withCredentials: true });
        csrfToken = response.data.csrfToken;
        return csrfToken;
    } catch (error) {
        console.error('Failed to initialize CSRF token:', error);
        return null;
    }
};

// Add a request interceptor to handle CSRF and cleanup Authorization
api.interceptors.request.use(
    (config) => {
        // Attach CSRF token if available for state-changing methods
        if (csrfToken && ['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '')) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }

        // We no longer manually attach Authorization headers as we rely on HTTP-only cookies
        // If your backend still requires them during migration, they can be added back here
        // but the goal is to move purely to withCredentials: true

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
 * User-side axios instance with credentials and CSRF support.
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
    if (csrfToken && ['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '')) {
        config.headers['X-CSRF-Token'] = csrfToken;
    }
    return config;
});

export default api;
