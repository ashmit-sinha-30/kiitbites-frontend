import { toast } from "react-toastify";
import { FoodItem, CartItem, Vendor } from "../types";
import { SearchResult } from '@/app/components/SearchBar';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export const checkItemAvailability = async (
  item: FoodItem,
  currentVendorId: string | null,
  categories: { retail: string[]; produce: string[] }
): Promise<{ isAvailable: boolean; vendors: Vendor[] | undefined }> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/item/vendors/${item.id}`, {
      credentials: "include",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      return { isAvailable: false, vendors: undefined };
    }

    const vendors = await response.json();

    if (!vendors || vendors.length === 0) {
      return { isAvailable: false, vendors: undefined };
    }

    // Filter out vendors where the item is not available
    const availableVendors = vendors.filter((vendor: Vendor) => {
      if (!vendor.inventoryValue) {
        return false;
      }

      // Check if the item is retail based on its category
      const isRetail = categories.retail.includes(item.category);

      if (isRetail) {
        // For retail items, check quantity from inventoryValue
        const quantity = vendor.inventoryValue.quantity;
        // Check if quantity exists and is greater than 0
        const isAvailable = typeof quantity === "number" && quantity > 0;
        return isAvailable;
      } else {
        // For produce items, check isAvailable from inventoryValue
        const isAvailable = vendor.inventoryValue.isAvailable === "Y";
        return isAvailable;
      }
    });

    // If currentVendorId is provided, check if that vendor is available
    if (currentVendorId) {
      const currentVendor = availableVendors.find(
        (v: Vendor) => v._id === currentVendorId
      );
      return {
        isAvailable: !!currentVendor,
        vendors: currentVendor ? [currentVendor] : undefined,
      };
    }

    // Return all available vendors if no currentVendorId is provided
    return { isAvailable: true, vendors: availableVendors };
  } catch (error) {
    return { isAvailable: false, vendors: undefined };
  }
};

export const addToCart = async (
  userId: string,
  item: FoodItem | SearchResult,
  vendorId: string
): Promise<boolean> => {
  try {
    const kind = item.type === "retail" ? "Retail" : "Produce";
    const response = await fetch(`${BACKEND_URL}/cart/add/${userId}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        itemId: item.id,
        kind: kind,
        quantity: 1,
        vendorId: vendorId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();

    toast.success(`${item.title} added to cart!`);
    return true;
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Failed to add item to cart"
    );
    return false;
  }
};

export const increaseQuantity = async (
  userId: string,
  item: FoodItem | SearchResult
): Promise<boolean> => {
  try {
    const kind = item.type === "retail" ? "Retail" : "Produce";
    const response = await fetch(`${BACKEND_URL}/cart/add-one/${userId}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        itemId: item.id,
        kind: kind,
        vendorId: item.vendorId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();

    toast.success(`Increased quantity of ${item.title}`);
    return true;
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Failed to increase quantity"
    );
    return false;
  }
};

export const decreaseQuantity = async (
  userId: string,
  item: FoodItem | SearchResult
): Promise<boolean> => {
  try {
    const kind = item.type === "retail" ? "Retail" : "Produce";
    const response = await fetch(`${BACKEND_URL}/cart/remove-one/${userId}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        itemId: item.id,
        kind: kind,
        vendorId: item.vendorId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();

    toast.info(`Decreased quantity of ${item.title}`);
    return true;
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Failed to decrease quantity"
    );
    return false;
  }
};

export const fetchCartItems = async (userId: string): Promise<CartItem[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/cart/${userId}`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();

    const cartItems = data.cart || [];

    return cartItems;
  } catch (error) {
    return [];
  }
}; 