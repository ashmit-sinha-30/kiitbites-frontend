import { RAZORPAY_CONFIG, getRazorpayCredentials, hasRazorpayCredentials } from '../config/razorpay';

interface RazorpayInvoiceResponse {
  id: string;
  entity: string;
  invoice_number: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: string;
  description: string;
  notes: Record<string, unknown>;
  customer: {
    name: string;
    contact: string;
    email: string;
  };
  billing_address: Record<string, unknown>;
  shipping_address: Record<string, unknown>;
  order_id: string;
  line_items: Array<{
    name: string;
    description: string;
    amount: number;
    quantity: number;
  }>;
  payment_terms: Record<string, unknown>;
  partial_payment: boolean;
  date: number;
  due_date: number;
  issued_date: number;
  paid_at: number;
  cancelled_at: number;
  expired_at: number;
  sms_status: string;
  email_status: string;
  short_url: string;
  view_less: boolean;
  type: string;
  group_taxes_discounts: boolean;
  created_at: number;
  updated_at: number;
}

interface RazorpayInvoiceCreateData {
  type: string;
  currency: string;
  amount: number;
  description: string;
  customer: {
    name: string;
    contact: string;
    email: string;
  };
  line_items: Array<{
    name: string;
    description: string;
    amount: number;
    quantity: number;
  }>;
  notes?: Record<string, unknown>;
}

/**
 * Create Basic Auth header for Razorpay API
 */
const createAuthHeader = (keyId: string, keySecret: string) => {
  const credentials = btoa(`${keyId}:${keySecret}`);
  return `Basic ${credentials}`;
};

/**
 * Fetch invoice details directly from Razorpay API
 * @param invoiceId - The Razorpay invoice ID
 * @returns Promise with invoice data
 */
export const fetchRazorpayInvoice = async (invoiceId: string): Promise<RazorpayInvoiceResponse> => {
  try {
    if (hasRazorpayCredentials()) {
      // Direct API call to Razorpay - This will hit https://api.razorpay.com/v1/invoices/{inv_id}
      const credentials = getRazorpayCredentials()!;
      const apiUrl = `${RAZORPAY_CONFIG.API_BASE}${RAZORPAY_CONFIG.ENDPOINTS.INVOICE_BY_ID(invoiceId)}`;
      
      console.log('🔗 Calling Razorpay API directly:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': createAuthHeader(credentials.keyId, credentials.keySecret),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Razorpay API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Razorpay API response:', data);
      return data;
    } else {
      // Fallback to backend proxy
      console.log('🔄 Using backend proxy for Razorpay API call');
      const response = await fetch(`/razorpay/invoices/${invoiceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Backend proxy error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    }
  } catch (error) {
    console.error('Error fetching Razorpay invoice:', error);
    throw error;
  }
};

/**
 * Get invoice PDF URL directly from Razorpay
 * @param invoiceId - The Razorpay invoice ID
 * @returns Promise with PDF URL
 */
export const getRazorpayInvoicePdf = async (invoiceId: string): Promise<string> => {
  try {
    if (hasRazorpayCredentials()) {
      // Direct API call to Razorpay - This will hit https://api.razorpay.com/v1/invoices/{inv_id}/pdf
      const credentials = getRazorpayCredentials()!;
      const apiUrl = `${RAZORPAY_CONFIG.API_BASE}${RAZORPAY_CONFIG.ENDPOINTS.INVOICE_PDF(invoiceId)}`;
      
      console.log('🔗 Calling Razorpay PDF API directly:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': createAuthHeader(credentials.keyId, credentials.keySecret),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Razorpay PDF API error: ${response.status} ${response.statusText}`);
      }

      // Razorpay returns the PDF directly, so we construct the URL
      const pdfUrl = apiUrl;
      console.log('✅ Razorpay PDF URL generated:', pdfUrl);
      return pdfUrl;
    } else {
      // Fallback to backend proxy
      console.log('🔄 Using backend proxy for Razorpay PDF API call');
      const response = await fetch(`/razorpay/invoices/${invoiceId}/pdf`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Backend proxy error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.pdfUrl;
    }
  } catch (error) {
    console.error('Error getting invoice PDF:', error);
    throw error;
  }
};

/**
 * Create a new invoice directly on Razorpay
 * @param invoiceData - Invoice data to create
 * @returns Promise with created invoice data
 */
export const createRazorpayInvoice = async (invoiceData: RazorpayInvoiceCreateData): Promise<RazorpayInvoiceResponse> => {
  try {
    if (hasRazorpayCredentials()) {
      // Direct API call to Razorpay - This will hit https://api.razorpay.com/v1/invoices
      const credentials = getRazorpayCredentials()!;
      const apiUrl = `${RAZORPAY_CONFIG.API_BASE}${RAZORPAY_CONFIG.ENDPOINTS.INVOICES}`;
      
      console.log('🔗 Creating invoice directly on Razorpay:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': createAuthHeader(credentials.keyId, credentials.keySecret),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        throw new Error(`Razorpay create invoice error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Invoice created on Razorpay:', data);
      return data;
    } else {
      // Fallback to backend proxy
      console.log('🔄 Using backend proxy to create invoice');
      const response = await fetch(`/razorpay/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        throw new Error(`Backend proxy error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    }
  } catch (error) {
    console.error('Error creating Razorpay invoice:', error);
    throw error;
  }
};
