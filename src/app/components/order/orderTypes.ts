export interface OrderItem {
  name: string;
  price: number;
  unit: string;
  type: string;
  quantity: number;
}

export interface OrderVendor {
  _id: string;
  fullName: string;
  uniID?: string;
  college?: {
    _id: string;
    fullName: string;
  };
}

export interface BaseOrder {
  _id: string;
  orderId: string;
  orderNumber: string;
  orderType: string;
  status: string;
  createdAt: string;
  collectorName: string;
  collectorPhone: string;
  address?: string;
  total: number;
  vendorId: OrderVendor;
  items: OrderItem[];
  isReviewed?: boolean;
}

export interface College {
  _id: string;
  fullName: string;
  shortName: string;
}

export interface User {
  _id: string;
  name: string;
}
