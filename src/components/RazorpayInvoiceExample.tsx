import React, { useState, useEffect } from 'react';
import { 
  fetchRazorpayInvoice, 
  createRazorpayInvoice, 
  getRazorpayInvoicePdf 
} from '../utils/razorpayInvoiceApi';
import { 
  autoInitializeRazorpay, 
  getRazorpayStatus,
  getEnvironmentSummary
} from '../utils/razorpaySetup';

// Define proper types for the component state
interface RazorpayStatus {
  initialized: boolean;
  message: string;
  apiBase: string;
  environment: "development" | "production" | "test";
  keyId: string;
  hasSecret: boolean;
  warnings: string[];
  errors: string[];
}

interface EnvironmentSummary {
  razorpay: {
    keyId: string;
    hasSecret: boolean;
    apiBase: string;
  };
  backend: {
    url: string | undefined;
  };
  app: {
    name: string;
    version: string;
    environment: string;
  };
  features: {
    directRazorpayApi: boolean;
    razorpayFallback: boolean;
  };
}

interface RazorpayInvoiceData {
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

const RazorpayInvoiceExample: React.FC = () => {
  const [status, setStatus] = useState<RazorpayStatus | null>(null);
  const [envSummary, setEnvSummary] = useState<EnvironmentSummary | null>(null);
  const [invoiceId, setInvoiceId] = useState('');
  const [invoiceData, setInvoiceData] = useState<RazorpayInvoiceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-initialize Razorpay from environment variables
    console.log('🚀 Auto-initializing Razorpay from environment...');
    const initResult = autoInitializeRazorpay();
    
    console.log('📊 Initialization result:', initResult);
    
    // Get status and environment summary
    setStatus(getRazorpayStatus());
    setEnvSummary(getEnvironmentSummary());
  }, []);

  const handleFetchInvoice = async () => {
    if (!invoiceId.trim()) {
      setError('Please enter an invoice ID');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching invoice:', invoiceId);
      const invoice = await fetchRazorpayInvoice(invoiceId);
      setInvoiceData(invoice);
      console.log('✅ Invoice fetched successfully:', invoice);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to fetch invoice: ${errorMessage}`);
      console.error('❌ Error fetching invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const sampleInvoiceData = {
        type: 'invoice',
        currency: 'INR',
        amount: 100000, // ₹1000 in paise
        description: 'Sample food order invoice',
        customer: {
          name: 'John Doe',
          contact: '+919876543210',
          email: 'john@example.com'
        },
        line_items: [
          {
            name: 'Burger',
            description: 'Delicious chicken burger',
            amount: 50000, // ₹500 in paise
            quantity: 2
          }
        ],
        notes: {
          order_id: 'ORD_' + Date.now()
        }
      };

      console.log('📄 Creating invoice with data:', sampleInvoiceData);
      const invoice = await createRazorpayInvoice(sampleInvoiceData);
      setInvoiceData(invoice);
      setInvoiceId(invoice.id);
      console.log('✅ Invoice created successfully:', invoice);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to create invoice: ${errorMessage}`);
      console.error('❌ Error creating invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceId.trim()) {
      setError('Please enter an invoice ID');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('📄 Getting PDF for invoice:', invoiceId);
      const pdfUrl = await getRazorpayInvoicePdf(invoiceId);
      console.log('✅ PDF URL generated:', pdfUrl);
      
      // Open PDF in new tab
      window.open(pdfUrl, '_blank');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to get PDF: ${errorMessage}`);
      console.error('❌ Error getting PDF:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Razorpay Invoice API Example</h1>
      
      {/* Environment Summary */}
      <div className="mb-6 p-4 bg-blue-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Environment Configuration</h2>
        {envSummary && (
          <div className="space-y-2 text-sm">
            <p><strong>App:</strong> {envSummary.app.name} v{envSummary.app.version} ({envSummary.app.environment})</p>
            <p><strong>Backend:</strong> {envSummary.backend.url}</p>
            <p><strong>Razorpay Key ID:</strong> {envSummary.razorpay.keyId}</p>
            <p><strong>Razorpay Secret:</strong> {envSummary.razorpay.hasSecret ? '✅ Set' : '❌ Not Set'}</p>
            <p><strong>API Base:</strong> {envSummary.razorpay.apiBase}</p>
          </div>
        )}
      </div>

      {/* Status Display */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Razorpay Status</h2>
        {status && (
          <div className="space-y-2">
            <p><strong>Initialized:</strong> {status.initialized ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Message:</strong> {status.message}</p>
            <p><strong>API Base:</strong> {status.apiBase}</p>
            <p><strong>Environment:</strong> {status.environment}</p>
            {status.warnings && status.warnings.length > 0 && (
              <div className="mt-2">
                <strong>Warnings:</strong>
                <ul className="list-disc list-inside ml-4">
                  {status.warnings.map((warning: string, index: number) => (
                    <li key={index} className="text-yellow-700">{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            {status.errors && status.errors.length > 0 && (
              <div className="mt-2">
                <strong>Errors:</strong>
                <ul className="list-disc list-inside ml-4">
                  {status.errors.map((error: string, index: number) => (
                    <li key={index} className="text-red-700">{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invoice ID Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Invoice ID:</label>
        <input
          type="text"
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
          placeholder="Enter Razorpay invoice ID (e.g., inv_1234567890)"
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* Action Buttons */}
      <div className="mb-6 space-x-4">
        <button
          onClick={handleFetchInvoice}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Fetching...' : 'Fetch Invoice'}
        </button>
        
        <button
          onClick={handleCreateInvoice}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Sample Invoice'}
        </button>
        
        <button
          onClick={handleDownloadPDF}
          disabled={loading || !invoiceId.trim()}
          className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Getting PDF...' : 'Download PDF'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Invoice Data Display */}
      {invoiceData && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-md">
          <h2 className="text-xl font-semibold mb-2">Invoice Data:</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(invoiceData, null, 2)}
          </pre>
        </div>
      )}

      {/* Console Instructions */}
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-md">
        <h3 className="font-semibold mb-2">💡 Check Console for API Calls</h3>
        <p className="text-sm">
          Open your browser&apos;s developer console to see the exact Razorpay API endpoints being hit:
        </p>
        <ul className="text-sm mt-2 space-y-1">
          <li>• <code>https://api.razorpay.com/v1/invoices/{'{inv_id}'}</code></li>
          <li>• <code>https://api.razorpay.com/v1/invoices</code></li>
          <li>• <code>https://api.razorpay.com/v1/invoices/{'{inv_id}'}/pdf</code></li>
        </ul>
        <p className="text-sm mt-2 text-blue-700">
          <strong>Note:</strong> The system will automatically use environment variables if available, 
          or fall back to backend proxy if not configured.
        </p>
      </div>
    </div>
  );
};

export default RazorpayInvoiceExample;
