"use client";

import React, { useEffect, useState } from "react";
import { VendorCartItem, VendorCart as VendorCartType, BillingFormData } from "../types";
import styles from "../styles/VendorCart.module.scss";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface VendorCartProps {
  vendorId: string;
  onLoaded?: (vendorName: string, vendorId: string) => void;
}

interface VendorItem {
  itemId: string;
  name: string;
  price: number;
  quantity?: number;
  isAvailable?: "Y" | "N";
  type: string;
  isSpecial?: "Y" | "N";
  kind: "Retail" | "Produce";
}

interface ApiItem {
  itemId: string;
  name: string;
  price: number;
  quantity?: number;
  isAvailable?: "Y" | "N";
  type: string;
  isSpecial?: "Y" | "N";
}

export const VendorCartComponent: React.FC<VendorCartProps> = ({
  vendorId,
  onLoaded,
}) => {
  const [retailItems, setRetailItems] = useState<VendorItem[]>([]);
  const [produceItems, setProduceItems] = useState<VendorItem[]>([]);
  const [cart, setCart] = useState<VendorCartType>({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBilling, setShowBilling] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [billingForm, setBillingForm] = useState<BillingFormData>({
    userName: "",
    phoneNumber: "",
  });

  // Fetch vendor items
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const [retailRes, produceRes] = await Promise.all([
          fetch(`${BACKEND_URL}/items/getvendors/${vendorId}/retail`),
          fetch(`${BACKEND_URL}/items/getvendors/${vendorId}/produce`)
        ]);

        if (retailRes.ok) {
          const retailData = await retailRes.json();
          if (retailData.success && retailData.data.retailItems) {
            setRetailItems(retailData.data.retailItems.map((item: ApiItem) => ({
              ...item,
              kind: "Retail" as const,
            })));
          }
        }

        if (produceRes.ok) {
          const produceData = await produceRes.json();
          if (produceData.success && produceData.data.produceItems) {
            setProduceItems(produceData.data.produceItems.map((item: ApiItem) => ({
              ...item,
              kind: "Produce" as const,
            })));
          }
        }

        if (onLoaded) {
          const vendorName = "Vendor";
          onLoaded(vendorName, vendorId);
        }
      } catch (err) {
        console.error("Error fetching items:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch items");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [vendorId, onLoaded]);

  const addToCart = (item: VendorItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.items.find(cartItem => cartItem.itemId === item.itemId);
      
      if (existingItem) {
        const updatedItems = prevCart.items.map(cartItem =>
          cartItem.itemId === item.itemId
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
        const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return { items: updatedItems, total };
      } else {
        const newItem: VendorCartItem = {
          itemId: item.itemId,
          name: item.name,
          price: item.price,
          quantity: 1,
          kind: item.kind,
          type: item.type,
          isSpecial: item.isSpecial,
          isAvailable: item.isAvailable,
        };
        const updatedItems = [...prevCart.items, newItem];
        const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return { items: updatedItems, total };
      }
    });
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(prevCart => {
      const updatedItems = prevCart.items.map(item =>
        item.itemId === itemId ? { ...item, quantity: newQuantity } : item
      );
      const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return { items: updatedItems, total };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => {
      const updatedItems = prevCart.items.filter(item => item.itemId !== itemId);
      const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return { items: updatedItems, total };
    });
  };

  const getCartQuantity = (itemId: string) => {
    const cartItem = cart.items.find(item => item.itemId === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const handleBillingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!billingForm.userName.trim() || !billingForm.phoneNumber.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    if (cart.items.length === 0) {
      setError("Cart is empty");
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/order/guest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId,
          items: cart.items,
          total: cart.total,
          collectorName: billingForm.userName,
          collectorPhone: billingForm.phoneNumber,
          orderType: "cash",
          isGuest: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCart({ items: [], total: 0 });
        setBillingForm({ userName: "", phoneNumber: "" });
        setShowBilling(false);
        alert(`Order placed successfully! Order Number: ${result.orderNumber}`);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error("Error placing order:", err);
      setError("Failed to place order. Please try again.");
    }
  };

  const allItems = [...retailItems, ...produceItems];
  
  // Filter items based on search query
  const filteredItems = allItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.itemsSection}>
          <h3>Available Items</h3>
          
          {/* Search Bar */}
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className={styles.clearSearch}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {loading ? (
            <p>Loading items...</p>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : allItems.length === 0 ? (
            <p>No items available</p>
          ) : filteredItems.length === 0 ? (
            <div className={styles.noResults}>
              <p>No items found for &quot;{searchQuery}&quot;</p>
              <button
                onClick={() => setSearchQuery("")}
                className={styles.clearSearchButton}
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className={styles.itemsList}>
              {filteredItems.map((item) => {
                const cartQuantity = getCartQuantity(item.itemId);
                const isInCart = cartQuantity > 0;

                return (
                  <div key={item.itemId} className={styles.itemCard}>
                    <div className={styles.itemInfo}>
                      <h4>{item.name}</h4>
                      <p className={styles.itemPrice}>₹{item.price.toFixed(2)}</p>
                    </div>
                    
                    <div className={styles.itemActions}>
                      {!isInCart ? (
                        <button
                          onClick={() => addToCart(item)}
                          className={styles.addButton}
                        >
                          Add to Cart
                        </button>
                      ) : (
                        <div className={styles.quantityControls}>
                          <button
                            onClick={() => updateQuantity(item.itemId, cartQuantity - 1)}
                            className={styles.quantityButton}
                          >
                            -
                          </button>
                          <span className={styles.quantity}>{cartQuantity}</span>
                          <button
                            onClick={() => updateQuantity(item.itemId, cartQuantity + 1)}
                            className={styles.quantityButton}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Search Results Summary */}
          {searchQuery && filteredItems.length > 0 && (
            <div className={styles.searchSummary}>
              <p>Showing {filteredItems.length} of {allItems.length} items</p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.cartSection}>
          <h3>Cart ({cart.items.length} items)</h3>
          
          {cart.items.length === 0 ? (
            <p>Your cart is empty</p>
          ) : (
            <>
              <div className={styles.cartItems}>
                {cart.items.map((item) => (
                  <div key={item.itemId} className={styles.cartItem}>
                    <div className={styles.cartItemInfo}>
                      <h4>{item.name}</h4>
                      <p>₹{item.price.toFixed(2)} × {item.quantity}</p>
                    </div>
                    <div className={styles.cartItemActions}>
                      <span className={styles.cartItemTotal}>
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.itemId)}
                        className={styles.removeButton}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={styles.cartTotal}>
                <h4>Total: ₹{cart.total.toFixed(2)}</h4>
                <button
                  onClick={() => setShowBilling(true)}
                  className={styles.proceedButton}
                >
                  Proceed to Billing
                </button>
              </div>
            </>
          )}
        </div>

        {showBilling && (
          <div className={styles.billingSection}>
            <h3>Billing Information</h3>
            <form onSubmit={handleBillingSubmit} className={styles.billingForm}>
              <div className={styles.formGroup}>
                <label htmlFor="userName">Customer Name *</label>
                <input
                  type="text"
                  id="userName"
                  value={billingForm.userName}
                  onChange={(e) => setBillingForm(prev => ({ ...prev, userName: e.target.value }))}
                  required
                  className={styles.input}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="phoneNumber">Phone Number *</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={billingForm.phoneNumber}
                  onChange={(e) => setBillingForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  required
                  className={styles.input}
                />
              </div>
              
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setShowBilling(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                >
                  Place Order
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}; 