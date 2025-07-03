// /types/uni-dashboard.ts

// Basic types for university dashboard
export interface University {
  _id: string;
  fullName: string;
}

// Navigation segment types
export type SegmentKey = 
  | "dashboard"
  | "inventory-reports"
  | "retail-inventory"
  | "produce-inventory"
  | "delivery-orders"
  | "past-orders"
  | "uni-cart"
  | "settings";

// Vendor management types
export interface Vendor {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  location?: string;
  isAvailable: "Y" | "N";
}

export interface VendorAvailabilityUpdate {
  vendorId: string;
  isAvailable: "Y" | "N";
} 