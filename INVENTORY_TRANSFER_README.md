# Inventory Transfer Feature

This feature allows vendors to send inventory items to other vendors and receive/confirm transfers.

## Features

### Send Inventory
- Select a receiver vendor from the dropdown
- Choose items from your available inventory
- Specify quantities for each item
- Send transfer request

### Receive Inventory
- View pending transfer orders
- Confirm receipt of transferred items
- Track transfer status (pending, confirmed, rejected)

## API Endpoints Used

The component integrates with the following backend APIs:

- `POST /api/transfer` - Send inventory transfer request
- `POST /api/confirm-transfer` - Confirm receipt of transfer
- `GET /api/transfer-orders/{vendorId}` - Get transfer orders for a vendor
- `GET /vendor/all` - Get list of all vendors
- `GET /inventory/vendor/{vendorId}` - Get vendor's available inventory

## Data Format

### Transfer Request
```json
{
  "senderId": "6834621e10d75a5ba7b773fa",
  "receiverId": "6834622e10d75a5ba7b7740d",
  "items": [
    {
      "itemId": "6835fee645fcd906a8fff1b0",
      "quantity": 2
    }
  ]
}
```

### Confirm Transfer
```json
{
  "orderId": "6899792c11e9305bf0b1e634",
  "receiverVendorId": "6834622e10d75a5ba7b7740d"
}
```

## Implementation Details

### Components Created
- `InventoryTransfer.tsx` - Main component with send/receive tabs
- `InventoryTransfer.module.scss` - Styling for the component

### Integration Points
- Added to both `vendorDashboard` and `vendorDashboard2`
- New sidebar menu item with swap icon
- Integrated into main dashboard routing

### State Management
- Local state for form inputs and selections
- API calls for vendor list, inventory, and transfers
- Real-time updates after successful operations

## Usage

1. Navigate to the vendor dashboard
2. Click on "Inventory Transfer" in the sidebar
3. Use the "Send Inventory" tab to transfer items to other vendors
4. Use the "Receive Inventory" tab to view and confirm incoming transfers

## Notes

- Vendor IDs are currently hardcoded and should be replaced with authentication context
- The component handles loading states and error messages
- Responsive design for mobile devices
- Modern UI with smooth animations and transitions
