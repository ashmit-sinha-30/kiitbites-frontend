# Razorpay Invoice API Integration

This document explains how to use the new Razorpay Invoice API integration that calls Razorpay directly using the exact API endpoints you specified.

## Overview

The system now supports **direct integration** with Razorpay's Invoice API:
- **Create Invoice**: `https://api.razorpay.com/v1/invoices`
- **Get Invoice**: `https://api.razorpay.com/v1/invoices/{inv_id}`
- **Get PDF**: `https://api.razorpay.com/v1/invoices/{inv_id}/pdf`

## 🚀 Direct API Calls

When properly configured, the system will call Razorpay API directly from the frontend, hitting the exact URLs you specified:

```
✅ Direct API Call: https://api.razorpay.com/v1/invoices/{inv_id}
✅ Direct API Call: https://api.razorpay.com/v1/invoices
✅ Direct API Call: https://api.razorpay.com/v1/invoices/{inv_id}/pdf
```

## Setup for Direct API Calls

### 1. Initialize Razorpay in Your App

```typescript
import { initializeRazorpay } from '@/utils/razorpaySetup';

// In your app initialization (e.g., _app.tsx, layout.tsx)
useEffect(() => {
  initializeRazorpay(
    'your_razorpay_key_id',      // Replace with your actual key
    'your_razorpay_key_secret'   // Replace with your actual secret
  );
}, []);
```

### 2. Check Initialization Status

```typescript
import { getRazorpayStatus } from '@/utils/razorpaySetup';

const status = getRazorpayStatus();
console.log(status);
// Output: { initialized: true, message: 'Razorpay ready for direct API calls', apiBase: 'https://api.razorpay.com/v1' }
```

## API Endpoints

### Frontend Utility Functions (Direct to Razorpay)

1. **`fetchRazorpayInvoice(invoiceId: string)`**
   - **Direct API**: `GET https://api.razorpay.com/v1/invoices/{inv_id}`
   - **Fallback**: Backend proxy `/razorpay/invoices/{id}`

2. **`getRazorpayInvoicePdf(invoiceId: string)`**
   - **Direct API**: `GET https://api.razorpay.com/v1/invoices/{inv_id}/pdf`
   - **Fallback**: Backend proxy `/razorpay/invoices/{id}/pdf`

3. **`createRazorpayInvoice(invoiceData: any)`**
   - **Direct API**: `POST https://api.razorpay.com/v1/invoices`
   - **Fallback**: Backend proxy `/razorpay/invoices`

### Backend Routes (Proxy - Fallback)

- `GET /razorpay/invoices/:invoiceId`
- `GET /razorpay/invoices/:invoiceId/pdf`
- `POST /razorpay/invoices`

## Usage Examples

### Fetching Invoice Details (Direct to Razorpay)

```typescript
import { fetchRazorpayInvoice } from '@/utils/razorpayInvoiceApi';

try {
  // This will call https://api.razorpay.com/v1/invoices/{inv_id} directly
  const invoice = await fetchRazorpayInvoice('inv_1234567890');
  console.log('Invoice amount:', invoice.amount);
  console.log('Invoice status:', invoice.status);
  console.log('Customer name:', invoice.customer.name);
} catch (error) {
  console.error('Failed to fetch invoice:', error);
}
```

### Creating Invoice (Direct to Razorpay)

```typescript
import { createRazorpayInvoice } from '@/utils/razorpayInvoiceApi';

const invoiceData = {
  type: 'invoice',
  currency: 'INR',
  amount: 100000, // Amount in paise
  description: 'Food order invoice',
  customer: {
    name: 'John Doe',
    contact: '+919876543210',
    email: 'john@example.com'
  },
  line_items: [
    {
      name: 'Burger',
      description: 'Delicious burger',
      amount: 50000,
      quantity: 2
    }
  ]
};

try {
  // This will call https://api.razorpay.com/v1/invoices directly
  const invoice = await createRazorpayInvoice(invoiceData);
  console.log('Invoice created:', invoice.id);
} catch (error) {
  console.error('Failed to create invoice:', error);
}
```

### Downloading Invoice PDF (Direct to Razorpay)

```typescript
import { getRazorpayInvoicePdf } from '@/utils/razorpayInvoiceApi';

try {
  // This will call https://api.razorpay.com/v1/invoices/{inv_id}/pdf directly
  const pdfUrl = await getRazorpayInvoicePdf('inv_1234567890');
  window.open(pdfUrl, '_blank');
} catch (error) {
  console.error('Failed to get PDF:', error);
}
```

## How It Works

### 1. **Direct API Mode** (When credentials are set)
```
Frontend → https://api.razorpay.com/v1/invoices/{inv_id}
Frontend → https://api.razorpay.com/v1/invoices
Frontend → https://api.razorpay.com/v1/invoices/{inv_id}/pdf
```

### 2. **Fallback Mode** (When credentials are not set)
```
Frontend → Backend → https://api.razorpay.com/v1/invoices/{inv_id}
Frontend → Backend → https://api.razorpay.com/v1/invoices
Frontend → Backend → https://api.razorpay.com/v1/invoices/{inv_id}/pdf
```

## Console Logging

The system provides detailed logging to show which API endpoints are being hit:

```
🔗 Calling Razorpay API directly: https://api.razorpay.com/v1/invoices/inv_1234567890
✅ Razorpay API response: { id: 'inv_1234567890', amount: 100000, ... }
```

## Security Considerations

⚠️ **Important**: Direct API calls expose your Razorpay credentials to the frontend. Consider:

1. **Development/Testing**: Use direct API calls for faster development
2. **Production**: Use backend proxy for security
3. **Hybrid Approach**: Use direct calls for read operations, backend for write operations

## Environment Variables

For backend proxy fallback, ensure these are set in your backend `.env`:

```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
```

## Migration Notes

- **New**: Direct API calls to `https://api.razorpay.com/v1/invoices`
- **Existing**: Backend proxy routes continue to work
- **Automatic**: System detects credentials and chooses appropriate method
- **No Breaking Changes**: All existing functionality preserved

## Benefits

1. **Direct Integration**: Hits Razorpay API endpoints exactly as specified
2. **Real-time Data**: Direct access to Razorpay's live data
3. **Performance**: No backend proxy overhead when using direct calls
4. **Flexibility**: Can switch between direct and proxy modes
5. **Fallback Support**: Graceful degradation to backend proxy
6. **Type Safety**: Full TypeScript support for all operations
