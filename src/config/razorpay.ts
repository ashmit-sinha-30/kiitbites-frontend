// Razorpay Configuration
// Note: In production, these should be securely managed and not exposed in client-side code

export const RAZORPAY_CONFIG = {
  // API Base URL - This will hit Razorpay directly
  API_BASE: 'https://api.razorpay.com/v1',
  
  // API Endpoints
  ENDPOINTS: {
    INVOICES: '/invoices',
    INVOICE_BY_ID: (id: string) => `/invoices/${id}`,
    INVOICE_PDF: (id: string) => `/invoices/${id}/pdf`,
  },
  
  // Currency
  CURRENCY: 'INR',
  
  // Default invoice settings
  DEFAULT_INVOICE_SETTINGS: {
    currency: 'INR',
    type: 'invoice',
    partial_payment: false,
    sms_notify: 0,
    email_notify: 0,
  }
};

// Function to set Razorpay credentials globally
// This should be called from your app initialization
export const setRazorpayCredentials = (keyId: string, keySecret: string) => {
  if (typeof window !== 'undefined') {
    (window as { RAZORPAY_KEY_ID?: string; RAZORPAY_KEY_SECRET?: string }).RAZORPAY_KEY_ID = keyId;
    (window as { RAZORPAY_KEY_ID?: string; RAZORPAY_KEY_SECRET?: string }).RAZORPAY_KEY_SECRET = keySecret;
    console.log('🔑 Razorpay credentials set for direct API calls');
  }
};

// Function to get Razorpay credentials
export const getRazorpayCredentials = (): { keyId: string; keySecret: string } | null => {
  if (typeof window !== 'undefined') {
    const keyId = (window as { RAZORPAY_KEY_ID?: string; RAZORPAY_KEY_SECRET?: string }).RAZORPAY_KEY_ID;
    const keySecret = (window as { RAZORPAY_KEY_ID?: string; RAZORPAY_KEY_SECRET?: string }).RAZORPAY_KEY_SECRET;
    
    if (keyId && keySecret) {
      return { keyId, keySecret };
    }
  }
  return null;
};

// Function to check if credentials are available
export const hasRazorpayCredentials = (): boolean => {
  const credentials = getRazorpayCredentials();
  return credentials !== null;
};

// Function to get credentials from environment or config
export const getRazorpayCredentialsFromEnv = (): { keyId: string; keySecret: string } | null => {
  // Try to get from environment variables first
  if (typeof process !== 'undefined' && process.env) {
    const envKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const envKeySecret = process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET;
    
    if (envKeyId && envKeySecret) {
      return { keyId: envKeyId, keySecret: envKeySecret };
    }
  }
  
  // Fallback to window variables
  return getRazorpayCredentials();
};

// Function to check if environment credentials are available
export const hasRazorpayEnvCredentials = () => {
  const credentials = getRazorpayCredentialsFromEnv();
  return credentials && credentials.keyId && credentials.keySecret;
};
