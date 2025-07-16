"use client";

import React, { useEffect, useState } from "react";
import { VendorCart as VendorCartType, BillingFormData } from "../types";
import styles from "../styles/VendorCart.module.scss";
import { VendorRazorpayPayment } from "./VendorRazorpayPayment";
import { OrderSuccessPopup } from "./OrderSuccessPopup";

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
  const [showCashConfirmation, setShowCashConfirmation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [billingForm, setBillingForm] = useState<BillingFormData>({
    userName: "",
    phoneNumber: "",
    orderType: "takeaway",
    paymentMethod: "cash",
  });
  const [cartLoading, setCartLoading] = useState(false);
  const [showRazorpayPayment, setShowRazorpayPayment] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successOrderDetails, setSuccessOrderDetails] = useState<{
    orderNumber: string;
    customerName: string;
    phoneNumber: string;
    items: Array<{ name: string; price: number; quantity: number; kind?: "Retail" | "Produce" }>;
    total: number;
    orderType: "dinein" | "takeaway";
  } | null>(null);
  const [universityCharges, setUniversityCharges] = useState<{
    packingCharge: number;
    deliveryCharge: number;
    universityName: string;
  } | null>(null);

  // Fetch vendor cart from backend
  const fetchVendorCart = async () => {
    setCartLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/vendorcart/${vendorId}`);
      const data = await response.json();
      
      if (data.success) {
        console.log("🛒 Cart data from backend:", data.data);
        // Ensure all items have a 'kind' property
        const itemsWithKind = (data.data.items || []).map((item: { itemId: string; name: string; price: number; quantity: number; type: string; kind?: "Retail" | "Produce" }) => {
          if (item.kind) return item;
          // Infer kind from type or default to 'Retail'
          if (item.type && item.type.toLowerCase().includes('produce')) return { ...item, kind: 'Produce' };
          return { ...item, kind: 'Retail' };
        });
        // Calculate total WITHOUT packing charges for cart view
        const itemTotal = itemsWithKind.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0);
        
        setCart({
          items: itemsWithKind,
          total: itemTotal
        });
      }
    } catch (err) {
      console.error("Error fetching vendor cart:", err);
    } finally {
      setCartLoading(false);
    }
  };

  // Fetch university charges for the vendor
  const fetchUniversityCharges = async () => {
    try {
      console.log("🔍 Fetching university charges for vendor:", vendorId);
      const response = await fetch(`${BACKEND_URL}/api/vendor/${vendorId}/university-charges`);
      const data = await response.json();
      
      if (data.success) {
        console.log("✅ University charges fetched:", data.data);
        setUniversityCharges(data.data);
      } else {
        console.error("❌ Failed to fetch university charges:", data.message);
        // Use default charges if fetch fails
        setUniversityCharges({
          packingCharge: 5,
          deliveryCharge: 50,
          universityName: "University"
        });
      }
    } catch (err) {
      console.error("❌ Error fetching university charges:", err);
      // Use default charges if fetch fails
      setUniversityCharges({
        packingCharge: 5,
        deliveryCharge: 50,
        universityName: "University"
      });
    }
  };

  // Fetch vendor items and cart
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const [retailRes, produceRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/item/getvendors/${vendorId}/retail`),
          fetch(`${BACKEND_URL}/api/item/getvendors/${vendorId}/produce`)
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
    fetchVendorCart();
    fetchUniversityCharges();
  }, [vendorId, onLoaded]);

  const addToCart = async (item: VendorItem) => {
    try {
      console.log("➕ Adding item to cart:", item);
      const response = await fetch(`${BACKEND_URL}/vendorcart/${vendorId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item: {
            itemId: item.itemId,
            name: item.name,
            price: item.price,
            quantity: 1,
            kind: item.kind,
            type: item.type,
            isSpecial: item.isSpecial,
            isAvailable: item.isAvailable,
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log("✅ Item added to cart:", data.data);
        // Calculate total WITHOUT packing charges for cart view
        const items = data.data.items || [];
        const itemTotal = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0);
        
        setCart({
          items: items,
          total: itemTotal
        });
      }
    } catch (err) {
      console.error("Error adding item to cart:", err);
      setError("Failed to add item to cart");
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/vendorcart/${vendorId}/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Calculate total WITHOUT packing charges for cart view
        const items = data.data.items || [];
        const itemTotal = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0);
        setCart({
          items: items,
          total: itemTotal
        });
      }
    } catch (err) {
      console.error("Error updating item quantity:", err);
      setError("Failed to update item quantity");
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/vendorcart/${vendorId}/items/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        // Calculate total WITHOUT packing charges for cart view
        const items = data.data.items || [];
        const itemTotal = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0);
        setCart({
          items: items,
          total: itemTotal
        });
      }
    } catch (err) {
      console.error("Error removing item from cart:", err);
      setError("Failed to remove item from cart");
    }
  };

  const getCartQuantity = (itemId: string) => {
    const cartItem = cart.items.find(item => item.itemId === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const handleBillingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!billingForm.userName.trim() || !billingForm.phoneNumber.trim() || !billingForm.paymentMethod) {
      setError("Please fill in all required fields and select a payment method");
      return;
    }

    if (cart.items.length === 0) {
      setError("Cart is empty");
      return;
    }

    // If payment method is UPI, show Razorpay payment component
    if (billingForm.paymentMethod === "upi") {
      setShowRazorpayPayment(true);
      return;
    }

    // For cash payment, show confirmation with order summary
    if (billingForm.paymentMethod === "cash") {
      setShowCashConfirmation(true);
      return;
    }
  };

  const handleCashConfirmation = async () => {
    try {
      // Calculate total with packing charges
      const itemTotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const packableItems = cart.items.filter(item => item.kind === "Produce");
      const packingCharge = universityCharges?.packingCharge || 5;
      const packingTotal = packableItems.reduce((sum, item) => sum + (packingCharge * item.quantity), 0);
      const totalWithPacking = itemTotal + packingTotal;

      const response = await fetch(`${BACKEND_URL}/order/guest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId,
          items: cart.items,
          total: totalWithPacking, // Use total with packing charges
          collectorName: billingForm.userName,
          collectorPhone: billingForm.phoneNumber,
          orderType: billingForm.orderType,
          paymentMethod: billingForm.paymentMethod,
          isGuest: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Save billing information
        try {
          await fetch(`${BACKEND_URL}/billinginfo`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              vendorId,
              customerName: billingForm.userName,
              phoneNumber: billingForm.phoneNumber,
              paymentMethod: billingForm.paymentMethod,
              totalAmount: totalWithPacking, // Use total with packing charges
              orderNumber: result.orderNumber,
              orderId: result.orderId,
              items: cart.items,
              isGuest: true
            }),
          });
        } catch (err) {
          console.error("Error saving billing info:", err);
        }

        // Clear cart in backend
        try {
          await fetch(`${BACKEND_URL}/vendorcart/${vendorId}`, {
            method: 'DELETE',
          });
        } catch (err) {
          console.error("Error clearing cart:", err);
        }
        
        setCart({ items: [], total: 0 });
        setBillingForm({ userName: "", phoneNumber: "", orderType: "takeaway", paymentMethod: "cash" });
        setShowBilling(false);
        setShowCashConfirmation(false);
        
        // Show success popup
        setSuccessOrderDetails({
          orderNumber: result.orderNumber,
          customerName: billingForm.userName,
          phoneNumber: billingForm.phoneNumber,
          items: cart.items.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            kind: item.kind
          })),
          total: totalWithPacking, // Use total with packing charges
          orderType: billingForm.orderType,
        });
        setShowSuccessPopup(true);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error("Error placing order:", err);
      setError("Failed to place order. Please try again.");
    }
  };

  const handleRazorpayPaymentSuccess = async (orderId: string, orderNumber: string) => {
    try {
      // Save billing information
      await fetch(`${BACKEND_URL}/billinginfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId,
          customerName: billingForm.userName,
          phoneNumber: billingForm.phoneNumber,
          paymentMethod: "upi",
          totalAmount: (() => {
            const itemTotal = cart.items.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0);
            const packableItems = cart.items.filter((item: { kind?: "Retail" | "Produce" }) => item.kind === "Produce");
            const packingCharge = universityCharges?.packingCharge || 5;
            const packingTotal = packableItems.reduce((sum: number, item: { quantity: number }) => sum + (packingCharge * item.quantity), 0);
            return itemTotal + packingTotal;
          })(),
          orderNumber: orderNumber,
          orderId: orderId,
          items: cart.items,
          isGuest: true
        }),
      });

      // Clear cart in backend
      await fetch(`${BACKEND_URL}/vendorcart/${vendorId}`, {
        method: 'DELETE',
      });
      
      setCart({ items: [], total: 0 });
      setBillingForm({ userName: "", phoneNumber: "", orderType: "takeaway", paymentMethod: "cash" });
      setShowBilling(false);
      setShowRazorpayPayment(false);
      
      // Show success popup
              setSuccessOrderDetails({
          orderNumber: orderNumber,
          customerName: billingForm.userName,
          phoneNumber: billingForm.phoneNumber,
          items: cart.items.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            kind: item.kind
          })),
          total: (() => {
            const itemTotal = cart.items.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0);
            const packableItems = cart.items.filter((item: { kind?: "Retail" | "Produce" }) => item.kind === "Produce");
            const packingCharge = universityCharges?.packingCharge || 5;
            const packingTotal = packableItems.reduce((sum: number, item: { quantity: number }) => sum + (packingCharge * item.quantity), 0);
            return itemTotal + packingTotal;
          })(),
          orderType: billingForm.orderType,
        });
      setShowSuccessPopup(true);
    } catch (err) {
      console.error("Error saving billing info:", err);
      setError("Order placed but failed to save billing information");
    }
  };

  const handleRazorpayPaymentFailure = (error: string) => {
    setError(`Payment failed: ${error}`);
    setShowRazorpayPayment(false);
  };

  const handleRazorpayPaymentCancel = () => {
    setShowRazorpayPayment(false);
  };

  const handleSuccessPopupClose = () => {
    setShowSuccessPopup(false);
    setSuccessOrderDetails(null);
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
          
          {cartLoading ? (
            <p>Loading cart...</p>
          ) : cart.items.length === 0 ? (
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
                <div className={styles.cartBreakdown}>
                  <div className={styles.breakdownRow}>
                    <strong>Total:</strong>
                    <strong>₹{cart.total.toFixed(2)}</strong>
                  </div>
                </div>
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

        {showBilling && !showRazorpayPayment && (
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
              
              <div className={styles.formGroup}>
                <label>Order Type *</label>
                <div className={styles.orderTypeOptions}>
                  <label className={styles.orderTypeOption}>
                    <input
                      type="radio"
                      name="orderType"
                      value="takeaway"
                      checked={billingForm.orderType === "takeaway"}
                      onChange={(e) => setBillingForm(prev => ({ ...prev, orderType: e.target.value as "dinein" | "takeaway" }))}
                      required
                    />
                    <span>Takeaway</span>
                  </label>
                  <label className={styles.orderTypeOption}>
                    <input
                      type="radio"
                      name="orderType"
                      value="dinein"
                      checked={billingForm.orderType === "dinein"}
                      onChange={(e) => setBillingForm(prev => ({ ...prev, orderType: e.target.value as "dinein" | "takeaway" }))}
                      required
                    />
                    <span>Dine In</span>
                  </label>
                </div>
              </div>
              
              
              <div className={styles.formGroup}>
                <label>Payment Method *</label>
                <div className={styles.paymentOptions}>
                  <label className={styles.paymentOption}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={billingForm.paymentMethod === "cash"}
                      onChange={(e) => setBillingForm(prev => ({ ...prev, paymentMethod: e.target.value as "cash" | "upi" }))}
                      required
                    />
                    <span>Cash</span>
                  </label>
                  <label className={styles.paymentOption}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={billingForm.paymentMethod === "upi"}
                      onChange={(e) => setBillingForm(prev => ({ ...prev, paymentMethod: e.target.value as "cash" | "upi" }))}
                      required
                    />
                    <span>UPI</span>
                  </label>
                </div>
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

        {showRazorpayPayment && (
          <div className={styles.billingSection}>
            <VendorRazorpayPayment
              vendorId={vendorId}
              items={cart.items}
              total={cart.total}
              collectorName={billingForm.userName}
              collectorPhone={billingForm.phoneNumber}
              orderType={billingForm.orderType}
              packingCharge={universityCharges?.packingCharge || 5}
              onPaymentSuccess={handleRazorpayPaymentSuccess}
              onPaymentFailure={handleRazorpayPaymentFailure}
              onCancel={handleRazorpayPaymentCancel}
            />
          </div>
        )}

        {showCashConfirmation && (
          <div className={styles.billingSection}>
            <h3>Order Confirmation</h3>
            
            <div className={styles.orderSummary}>
              <h4>Order Summary</h4>
              {(() => {
                const itemTotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const packableItems = cart.items.filter(item => item.kind === "Produce");
                const packingCharge = universityCharges?.packingCharge || 5;
                const packingTotal = packableItems.reduce((sum, item) => sum + (packingCharge * item.quantity), 0);
                const totalWithPacking = itemTotal + packingTotal;
                
                return (
                  <div className={styles.summaryBreakdown}>
                    <div className={styles.summaryRow}>
                      <span>Items Total:</span>
                      <span>₹{itemTotal.toFixed(2)}</span>
                    </div>
                    {packableItems.length > 0 && (
                      <div className={styles.summaryRow}>
                        <span>Packing Charge ({packableItems.length} produce items @ ₹{packingCharge} each):</span>
                        <span>₹{packingTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div className={styles.summaryRow}>
                      <strong>Total Amount:</strong>
                      <strong>₹{totalWithPacking.toFixed(2)}</strong>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className={styles.customerInfo}>
              <h4>Customer Information</h4>
              <p><strong>Name:</strong> {billingForm.userName}</p>
              <p><strong>Phone:</strong> {billingForm.phoneNumber}</p>
              <p><strong>Order Type:</strong> {billingForm.orderType === "takeaway" ? "Takeaway" : "Dine In"}</p>
              <p><strong>Payment Method:</strong> Cash</p>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => setShowCashConfirmation(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCashConfirmation}
                className={styles.submitButton}
              >
                Confirm Order
              </button>
            </div>
          </div>
        )}
      </div>

      {showSuccessPopup && successOrderDetails && (
        <OrderSuccessPopup
          orderNumber={successOrderDetails.orderNumber}
          customerName={successOrderDetails.customerName}
          phoneNumber={successOrderDetails.phoneNumber}
          items={successOrderDetails.items}
          total={successOrderDetails.total}
          orderType={successOrderDetails.orderType}
          packingCharge={universityCharges?.packingCharge || 5}
          onClose={handleSuccessPopupClose}
        />
      )}
    </div>
  );
}; 