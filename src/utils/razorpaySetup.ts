import { setRazorpayCredentials, hasRazorpayCredentials } from '../config/razorpay';
import { ENV_CONFIG, validateEnvironment } from '../config/environment';

/**
 * Initialize Razorpay for direct API calls
 * This should be called from your app initialization (e.g., _app.tsx or layout.tsx)
 * 
 * @param keyId - Your Razorpay Key ID (optional, will use env if not provided)
 * @param keySecret - Your Razorpay Key Secret (optional, will use env if not provided)
 */
export const initializeRazorpay = (keyId?: string, keySecret?: string) => {
  try {
    // Validate environment first
    const envStatus = validateEnvironment();
    
    // Use provided credentials or fall back to environment
    const finalKeyId = keyId || ENV_CONFIG.RAZORPAY.KEY_ID;
    const finalKeySecret = keySecret || ENV_CONFIG.RAZORPAY.KEY_SECRET;
    
    if (finalKeyId && finalKeySecret) {
      setRazorpayCredentials(finalKeyId, finalKeySecret);
      
      if (hasRazorpayCredentials()) {
        console.log('✅ Razorpay initialized successfully for direct API calls');
        console.log('🔗 API calls will now hit:', ENV_CONFIG.RAZORPAY.API_BASE);
        console.log('🔑 Using key ID:', finalKeyId);
        console.log('🌍 Environment:', ENV_CONFIG.APP.ENVIRONMENT);
      } else {
        console.warn('⚠️ Razorpay credentials not set properly');
      }
    } else {
      console.warn('⚠️ Razorpay credentials not available - will use backend proxy');
      console.warn('💡 Set NEXT_PUBLIC_RAZORPAY_KEY_ID and NEXT_PUBLIC_RAZORPAY_KEY_SECRET in .env.local');
    }
    
    return {
      success: hasRazorpayCredentials(),
      environment: ENV_CONFIG.APP.ENVIRONMENT,
      apiBase: ENV_CONFIG.RAZORPAY.API_BASE,
      warnings: envStatus.warnings,
      errors: envStatus.errors
    };
  } catch (error) {
    console.error('❌ Failed to initialize Razorpay:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Auto-initialize Razorpay from environment variables
 * Call this in your app initialization for automatic setup
 */
export const autoInitializeRazorpay = () => {
  return initializeRazorpay();
};

/**
 * Check if Razorpay is properly initialized
 */
export const isRazorpayInitialized = () => {
  return hasRazorpayCredentials();
};

/**
 * Get Razorpay initialization status
 */
export const getRazorpayStatus = () => {
  const initialized = Boolean(isRazorpayInitialized());
  const envStatus = validateEnvironment();
  
  return {
    initialized,
    message: initialized 
      ? 'Razorpay ready for direct API calls' 
      : 'Razorpay not initialized - will use backend proxy',
    apiBase: initialized ? ENV_CONFIG.RAZORPAY.API_BASE : 'Backend proxy',
    environment: ENV_CONFIG.APP.ENVIRONMENT || 'development',
    keyId: ENV_CONFIG.RAZORPAY.KEY_ID || '',
    hasSecret: !!ENV_CONFIG.RAZORPAY.KEY_SECRET,
    warnings: envStatus.warnings,
    errors: envStatus.errors
  };
};

/**
 * Get environment configuration summary
 */
export const getEnvironmentSummary = () => {
  return {
    razorpay: {
      keyId: ENV_CONFIG.RAZORPAY.KEY_ID,
      hasSecret: !!ENV_CONFIG.RAZORPAY.KEY_SECRET,
      apiBase: ENV_CONFIG.RAZORPAY.API_BASE
    },
    backend: {
      url: ENV_CONFIG.BACKEND.URL
    },
    app: {
      name: ENV_CONFIG.APP.NAME,
      version: ENV_CONFIG.APP.VERSION,
      environment: ENV_CONFIG.APP.ENVIRONMENT
    },
    features: {
      directRazorpayApi: ENV_CONFIG.FEATURES.DIRECT_RAZORPAY_API,
      razorpayFallback: ENV_CONFIG.FEATURES.RAZORPAY_FALLBACK
    }
  };
};
