# Vendor Dashboard - Dynamic Service-Based Sidebar

## Overview

The vendor dashboard has been updated to work like the `food-ordering-uniDashboard`, with a dynamic sidebar that only shows services assigned to the logged-in vendor. This provides a personalized experience where vendors only see the features they have access to.

## Key Features

### 1. Dynamic Sidebar Based on Vendor Services
- The sidebar automatically adapts to show only the services assigned to the current vendor
- Services are fetched from the backend based on the vendor's ID
- Each service maps to specific dashboard components

### 2. Service-to-Component Mapping
The system intelligently maps service names to appropriate dashboard components:

| Service Name | Component |
|-------------|-----------|
| "Dashboard" | VendorDashboard |
| "Retail Inventory" | RetailInventory |
| "Produce Inventory" | ProduceInventory |
| "Raw Materials" | RawMaterialInventory |
| "Inventory Transfer" | InventoryTransfer |
| "Active Orders" | OrderList |
| "Delivery Orders" | DeliveryOrdersList |
| "Past Orders" | PastOrdersList |
| "Vendor Cart" | VendorCartComponent |
| "Delivery Settings" | DeliverySettings |
| "Invoices" | VendorInvoices |

### 3. Backend API Integration
- **New Endpoint**: `GET /api/vendor/:vendorId/assignments`
- Returns vendor information and assigned services
- Services are populated with their associated features

## File Changes

### Backend Changes
- **`bitesbay-backend/routes/vendorRoutes.js`**: Added new endpoint for fetching vendor assignments

### Frontend Changes
- **`bitesbay-frontend/src/app/vendorDashboard/vendorDashboardNew.tsx`**: New main dashboard component
- **`bitesbay-frontend/src/app/vendorDashboard/components/Sidebar.tsx`**: Updated to support dynamic segments
- **`bitesbay-frontend/src/app/vendorDashboard/page.tsx`**: Updated to use new dashboard component

## How It Works

### 1. Authentication & Initialization
```typescript
// Get vendor user info
const userRes = await fetch(`${ENV_CONFIG.BACKEND.URL}/api/vendor/auth/user`);
const user = await userRes.json();

// Get vendor assignments (services)
const assignRes = await fetch(`${ENV_CONFIG.BACKEND.URL}/api/vendor/${vendorId}/assignments`);
const assignJson = await assignRes.json();
```

### 2. Dynamic Sidebar Generation
```typescript
const sidebarSegments = useMemo(() => {
  const serviceSegments = services.map((s) => ({ 
    key: s._id, 
    label: s.name, 
    icon: <></>,
    featureKey: `service.${s.feature.name.toLowerCase().replace(/\s+/g, '_')}.${s.name.toLowerCase().replace(/\s+/g, '_')}`
  }));
  return [
    { key: "dashboard", label: "Dashboard", icon: <></>, featureKey: "service.dashboard" },
    ...serviceSegments,
    { key: "logout", label: "Logout", icon: <></>, featureKey: null },
  ];
}, [services]);
```

### 3. Service-to-Component Mapping
```typescript
{(() => {
  const currentService = services.find((s) => s._id === activeSegment);
  const name = currentService?.name?.toLowerCase() || "";
  
  if (name === "retail inventory" || name.includes("retail inventory")) {
    return <RetailInventory vendorId={vendorId || ""} onLoaded={handleOnLoaded} />;
  }
  // ... other mappings
})()}
```

## Benefits

1. **Personalized Experience**: Vendors only see features they have access to
2. **Scalable**: Easy to add new services and components
3. **Consistent**: Follows the same pattern as the university dashboard
4. **Secure**: Service access is controlled at the backend level
5. **User-Friendly**: No clutter from inaccessible features

## Testing

A test script has been created at `bitesbay-backend/test-vendor-assignments.js` to verify the new API endpoint:

```bash
cd bitesbay-backend
node test-vendor-assignments.js
```

## Future Enhancements

1. **Service Icons**: Add specific icons for each service type
2. **Service Categories**: Group related services in the sidebar
3. **Service Permissions**: Fine-grained permissions within services
4. **Service Customization**: Allow vendors to customize their dashboard layout

## Migration Notes

- The old vendorDashboard.tsx remains as `vendorDashboard.tsx` (renamed from original)
- The new implementation is in `vendorDashboardNew.tsx`
- The page.tsx now points to the new implementation
- All existing components are reused without modification

## Database Schema

The vendor services are stored in the `Vendor` model:
```javascript
services: [
  { type: mongoose.Schema.Types.ObjectId, ref: "Service" }
]
```

Services reference features through the `Service` model:
```javascript
feature: { type: mongoose.Schema.Types.ObjectId, ref: "Feature", required: true }
```
