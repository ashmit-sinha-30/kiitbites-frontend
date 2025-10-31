// /types/inventory.ts

export interface ApiEntry {
  item: { _id: string; name: string };
  openingQty: number;
  soldQty: number;
  closingQty: number;
  receivedQty: number;
  producedQty?: number;
}

export interface RawApiEntry {
  item: { _id: string; name: string; unit?: string };
  openingQty: number;
  closingQty: number;
}

export interface ApiReport {
  vendor: { _id: string; fullName: string };
  date: string;
  // entries may be missing when no report exists
  retailEntries?: ApiEntry[];
  produceEntries?: ApiEntry[];
  rawEntries?: RawApiEntry[];
  receivedFrom?: Array<{ item: { _id: string; name: string }; quantity: number; from: { _id: string; name: string } | null }>;
  sent?: Array<{ item: { _id: string; name: string }; quantity: number }>;
  sentTo?: Array<{ item: { _id: string; name: string }; quantity: number; to: { _id: string; name: string } | null }>;
}

export interface InventoryItem {
  name: string;
  itemId?: string;
  opening: number;
  produced: number;
  received: number;
  sold: number;
  closing: number;
  itemType: "Retail" | "Produce" | "Raw";
  unit?: string;
}

export interface RawMaterialItem {
  name: string;
  openingAmount: number;
  closingAmount: number;
  unit: string;
}

export interface InventoryStats {
  totalTracked: number;
  producedToday: number;
  receivedToday: number;
  soldToday: number;
  sentToday: number;
}

export function transformApiReport(r: ApiReport) {
  // guard against missing arrays
  const retailEntries = r.retailEntries ?? [];
  const produceEntries = r.produceEntries ?? [];
  const rawEntries = r.rawEntries ?? [];

  const retailItems: InventoryItem[] = retailEntries.map((e) => ({
    name: e.item.name,
    itemId: e.item._id,
    opening: e.openingQty,
    sold: e.soldQty,
    closing: e.closingQty,
    // Received as provided by API or derived from conservation equation
    received: e.receivedQty !== undefined ? e.receivedQty : (e.closingQty - e.openingQty + e.soldQty),
    // Prefer backend-provided producedQty; fall back to derived equation
    produced: e.producedQty !== undefined
      ? e.producedQty
      : Math.max(0, (e.closingQty - e.openingQty + e.soldQty) - (e.receivedQty !== undefined ? e.receivedQty : (e.closingQty - e.openingQty + e.soldQty))),
    itemType: "Retail",
  }));

  const produceItems: InventoryItem[] = produceEntries.map((e) => ({
    name: e.item.name,
    opening: 0,
    produced: 0,
    sold: e.soldQty,
    closing: 0,
    received: 0,
    itemType: "Produce",
  }));

  const rawItems: InventoryItem[] = rawEntries.map((e) => ({
    name: e.item.name,
    opening: e.openingQty,
    produced: 0,
    sold: 0,
    closing: e.closingQty,
    received: 0,
    itemType: "Raw",
    unit: e.item.unit,
  }));

  const items = [...retailItems, ...produceItems, ...rawItems];

  const stats: InventoryStats = {
    totalTracked: items.length,
    producedToday: items.reduce((sum, i) => sum + i.produced, 0),
    receivedToday: items.reduce((sum, i) => sum + i.received, 0),
    soldToday: items.reduce((sum, i) => sum + i.sold, 0),
    sentToday: 0, // Will be calculated from sent array if available
  };

  // Add sentToday from sent array if available
  if (r.sent) {
    stats.sentToday = r.sent.reduce((sum, s) => sum + s.quantity, 0);
  }

  return {
    items,
    stats,
    reportDate: r.date,
    vendorName: r.vendor.fullName,
    vendorId: r.vendor._id,
    receivedFrom: r.receivedFrom,
    sent: r.sent,
    sentTo: r.sentTo,
  };
}

export interface InventoryReport {
  items: InventoryItem[];
  stats: InventoryStats;
  reportDate: string;
  vendorName: string;
  vendorId: string;
  receivedFrom?: Array<{ item: { _id: string; name: string }; quantity: number; from: { _id: string; name: string } | null }>;
  sent?: Array<{ item: { _id: string; name: string }; quantity: number }>;
  sentTo?: Array<{ item: { _id: string; name: string }; quantity: number; to: { _id: string; name: string } | null }>;
}
export type OrderType = "delivery" | "takeaway" | "dinein" | "cash";

export type Status =
  | "pendingPayment"
  | "inProgress"
  | "onTheWay"
  | "delivered"
  | "failed";

export interface Item {
  itemId: string;
  kind: "Retail" | "Produce";
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  collectorName: string;
  collectorPhone: string;
  orderType: OrderType;
  address?: string;
  status: Status;
  items: Item[];
  total: number;
}

// Vendor Cart Types
export interface VendorCartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  kind: "Retail" | "Produce";
  type: string;
  isSpecial?: "Y" | "N";
  isAvailable?: "Y" | "N";
}

export interface VendorCart {
  items: VendorCartItem[];
  total: number;
}

export interface BillingFormData {
  userName: string;
  phoneNumber: string;
  orderType: "dinein" | "takeaway";
  paymentMethod: "cash" | "upi";
}

export interface GuestOrderRequest {
  vendorId: string;
  items: VendorCartItem[];
  total: number;
  collectorName: string;
  collectorPhone: string;
  orderType: "cash" | "upi";
  isGuest: boolean;
}

export interface GuestOrderResponse {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  message: string;
  isNewUser?: boolean;
}

// Invoice interface based on backend model
export interface Invoice {
  _id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  invoiceType: 'vendor' | 'platform';
  recipientType: 'vendor' | 'admin';
  recipientId: string;
  recipientModel: 'Vendor' | 'Admin';
  vendorId: string;
  vendorName: string;
  vendorLocation: string;
  uniId: string;
  uniName: string;
  gstNumber: string;
  gstNumberType: 'vendor' | 'university';
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  subtotal: number;
  subtotalBeforeGst: number;
  platformFee: number;
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    priceBeforeGst: number;
    totalPrice: number;
    hsnCode: string;
    gstPercentage: number;
    cgstPercentage: number;
    sgstPercentage: number;
    cgstAmount: number;
    sgstAmount: number;
    gstAmount: number;
    totalAfterGst: number;
    kind: 'Retail' | 'Produce';
  }>;
  packagingCharge: number;
  deliveryCharge: number;
  razorpayInvoiceId?: string;
  razorpayInvoiceUrl?: string;
  pdfUrl?: string;
  cloudinaryPublicId?: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}
