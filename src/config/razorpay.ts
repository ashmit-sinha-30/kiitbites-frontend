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
    (window as any).RAZORPAY_KEY_ID = keyId;
    (window as any).RAZORPAY_KEY_SECRET = keySecret;
    console.log('🔑 Razorpay credentials set for direct API calls');
  }
};

// Function to get Razorpay credentials
export const getRazorpayCredentials = () => {
  if (typeof window !== 'undefined') {
    return {
      keyId: (window as any).RAZORPAY_KEY_ID,
      keySecret: (window as any).RAZORPAY_KEY_SECRET
    };
  }
  return null;
};

// Function to check if credentials are available
export const hasRazorpayCredentials = () => {
  const credentials = getRazorpayCredentials();
  return credentials && credentials.keyId && credentials.keySecret;
};

// Function to get credentials from environment or config
export const getRazorpayCredentialsFromEnv = () => {
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
