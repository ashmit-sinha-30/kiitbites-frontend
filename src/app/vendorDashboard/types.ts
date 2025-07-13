// /types/inventory.ts

export interface ApiEntry {
  item: { _id: string; name: string };
  openingQty: number;
  soldQty: number;
  closingQty: number;
  receivedQty: number;
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
}

export interface InventoryItem {
  name: string;
  opening: number;
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
  soldToday: number;
  receivedToday: number;
}

export function transformApiReport(r: ApiReport) {
  // guard against missing arrays
  const retailEntries = r.retailEntries ?? [];
  const produceEntries = r.produceEntries ?? [];
  const rawEntries = r.rawEntries ?? [];

  const retailItems: InventoryItem[] = retailEntries.map((e) => ({
    name: e.item.name,
    opening: e.openingQty,
    sold: e.soldQty,
    closing: e.closingQty,
    received: e.receivedQty !== undefined ? e.receivedQty : (e.closingQty - e.openingQty + e.soldQty),
    itemType: "Retail",
  }));

  const produceItems: InventoryItem[] = produceEntries.map((e) => ({
    name: e.item.name,
    opening: 0,
    sold: e.soldQty,
    closing: 0,
    received: 0,
    itemType: "Produce",
  }));

  const rawItems: InventoryItem[] = rawEntries.map((e) => ({
    name: e.item.name,
    opening: e.openingQty,
    sold: 0,
    closing: e.closingQty,
    received: 0,
    itemType: "Raw",
    unit: e.item.unit,
  }));

  const items = [...retailItems, ...produceItems, ...rawItems];

  const stats: InventoryStats = {
    totalTracked: items.length,
    soldToday: items.reduce((sum, i) => sum + i.sold, 0),
    receivedToday: items.reduce((sum, i) => sum + i.received, 0),
  };

  return {
    items,
    stats,
    reportDate: r.date,
    vendorName: r.vendor.fullName,
    vendorId: r.vendor._id,
  };
}

export interface InventoryReport {
  items: InventoryItem[];
  stats: InventoryStats;
  reportDate: string;
  vendorName: string;
  vendorId: string;
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
