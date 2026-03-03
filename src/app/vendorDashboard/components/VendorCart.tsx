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
  packable?: boolean;
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
  const [vendorServices, setVendorServices] = useState<{ _id: string; name: string }[]>([]);

  const hasPendingOrderService = vendorServices.some(s => s.name?.toLowerCase().includes("pending order"));

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

  // Fetch vendor assignments (services)
  const fetchVendorServices = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/vendor/${vendorId}/assignments`);
      const data = await response.json();
      if (data.success && data.data?.services) {
        setVendorServices(data.data.services);
      }
    } catch (err) {
      console.error("❌ Error fetching vendor services:", err);
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
            setRetailItems(retailData.data.retailItems.map((item: ApiItem & { packable?: boolean }) => ({
              ...item,
              kind: "Retail" as const,
              packable: item.packable ?? false,
            })));
          }
        }

        if (produceRes.ok) {
          const produceData = await produceRes.json();
          if (produceData.success && produceData.data.produceItems) {
            setProduceItems(produceData.data.produceItems.map((item: ApiItem & { packable?: boolean }) => ({
              ...item,
              kind: "Produce" as const,
              packable: item.packable ?? true,
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
    fetchVendorServices();
  }, [vendorId, onLoaded]);

  // Reset payment method if UPI becomes unavailable
  useEffect(() => {
    if (hasPendingOrderService && billingForm.paymentMethod === "upi") {
      setBillingForm(prev => ({ ...prev, paymentMethod: "cash" }));
    }
  }, [hasPendingOrderService, billingForm.paymentMethod]);

  // Auto-switch to dine-in if non-packable produce items are in cart
  useEffect(() => {
    const nonPackableProduce = cart.items.some(
      (item) => item.kind === "Produce" && item.packable === false
    );
    if (nonPackableProduce && billingForm.orderType !== "dinein") {
      setBillingForm(prev => ({ ...prev, orderType: "dinein" }));
    }
  }, [cart.items, billingForm.orderType]);

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
            packable: item.packable ?? (item.kind === "Produce"),
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

  const calculateFinalTotal = () => {
    const itemTotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const isTakeaway = billingForm.orderType === "takeaway";
    const packableItems = isTakeaway ? cart.items.filter(item => item.kind === "Produce") : [];
    const packingCharge = universityCharges?.packingCharge || 5;
    const packingTotal = packableItems.reduce((sum, item) => sum + (packingCharge * item.quantity), 0);
    return {
      itemTotal,
      packingTotal,
      packableCount: packableItems.length,
      finalTotal: itemTotal + packingTotal,
      packingRate: packingCharge
    };
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!billingForm.userName.trim() || !billingForm.phoneNumber.trim()) {
      setError("Please provide customer contact details");
      return;
    }

    if (cart.items.length === 0) {
      setError("Cart is empty");
      return;
    }

    const { finalTotal } = calculateFinalTotal();

    // If payment method is UPI, show Razorpay payment component
    if (billingForm.paymentMethod === "upi") {
      setShowRazorpayPayment(true);
      return;
    }

    // For cash payment - Place order immediately (streamlined)
    try {
      const response = await fetch(`${BACKEND_URL}/order/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          items: cart.items,
          total: finalTotal,
          collectorName: billingForm.userName,
          collectorPhone: billingForm.phoneNumber,
          orderType: billingForm.orderType,
          paymentMethod: billingForm.paymentMethod,
          isGuest: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Save billing info
        await fetch(`${BACKEND_URL}/billinginfo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorId,
            customerName: billingForm.userName,
            phoneNumber: billingForm.phoneNumber,
            paymentMethod: billingForm.paymentMethod,
            totalAmount: finalTotal,
            orderNumber: result.orderNumber,
            orderId: result.orderId,
            items: cart.items,
            isGuest: true
          }),
        }).catch(err => console.error("Error saving billing info:", err));

        // Clear cart
        await fetch(`${BACKEND_URL}/vendorcart/${vendorId}`, { method: 'DELETE' }).catch(err => console.error("Error clearing cart:", err));

        setCart({ items: [], total: 0 });
        setBillingForm({ userName: "", phoneNumber: "", orderType: "takeaway", paymentMethod: "cash" });
        setShowBilling(false);

        setSuccessOrderDetails({
          orderNumber: result.orderNumber,
          customerName: billingForm.userName,
          phoneNumber: billingForm.phoneNumber,
          items: cart.items.map(item => ({ ...item })),
          total: finalTotal,
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
      const { finalTotal } = calculateFinalTotal();

      // Save billing info
      await fetch(`${BACKEND_URL}/billinginfo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          customerName: billingForm.userName,
          phoneNumber: billingForm.phoneNumber,
          paymentMethod: "upi",
          totalAmount: finalTotal,
          orderNumber: orderNumber,
          orderId: orderId,
          items: cart.items,
          isGuest: true
        }),
      }).catch(err => console.error("Error saving billing info:", err));

      // Clear cart
      await fetch(`${BACKEND_URL}/vendorcart/${vendorId}`, { method: 'DELETE' }).catch(err => console.error("Error clearing cart:", err));

      setCart({ items: [], total: 0 });
      setBillingForm({ userName: "", phoneNumber: "", orderType: "takeaway", paymentMethod: "cash" });
      setShowBilling(false);
      setShowRazorpayPayment(false);

      setSuccessOrderDetails({
        orderNumber: orderNumber,
        customerName: billingForm.userName,
        phoneNumber: billingForm.phoneNumber,
        items: cart.items.map(item => ({ ...item })),
        total: finalTotal,
        orderType: billingForm.orderType,
      });
      setShowSuccessPopup(true);
    } catch (err) {
      console.error("Error in post-payment processing:", err);
      setError("Payment successful but failed to complete order processing.");
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
  const filteredItems = allItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const stats = calculateFinalTotal();

  // Check if any Produce item in the cart is non-packable
  const hasNonPackableProduce = cart.items.some(
    (item) => item.kind === "Produce" && item.packable === false
  );

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <h3>Menu Items</h3>

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search for dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className={styles.clearSearch}>×</button>
          )}
        </div>

        {loading ? (
          <div className={styles.loading}>Loading catalog...</div>
        ) : error && !showBilling ? (
          <p className={styles.error}>{error}</p>
        ) : filteredItems.length === 0 ? (
          <div className={styles.noResults}>No items found for &ldquo;{searchQuery}&rdquo;</div>
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
                      <button onClick={() => addToCart(item)} className={styles.addButton}>Add</button>
                    ) : (
                      <div className={styles.quantityControls}>
                        <button onClick={() => updateQuantity(item.itemId, cartQuantity - 1)} className={styles.quantityButton}>-</button>
                        <span className={styles.quantity}>{cartQuantity}</span>
                        <button onClick={() => updateQuantity(item.itemId, cartQuantity + 1)} className={styles.quantityButton}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.mainContent}>
        {!showBilling ? (
          <div className={styles.cartSection}>
            <h3>
              Your Cart
              {cart.items.length > 0 && <span className={styles.cartCount}>{cart.items.length} items</span>}
            </h3>

            {cartLoading ? (
              <p>Refreshing cart...</p>
            ) : cart.items.length === 0 ? (
              <div className={styles.emptyCart}>
                <p>Your basket is currently empty.</p>
                <span>Add some items from the menu to get started.</span>
              </div>
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
                        <span className={styles.cartItemTotal}>₹{(item.price * item.quantity).toFixed(2)}</span>
                        <button onClick={() => removeFromCart(item.itemId)} className={styles.removeButton}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.cartTotal}>
                  <div className={styles.breakdownRow}>
                    <span>Subtotal</span>
                    <span>₹{cart.total.toFixed(2)}</span>
                  </div>
                  <div className={styles.breakdownRow}>
                    <span>Estimated Total</span>
                    <span>₹{cart.total.toFixed(2)}</span>
                  </div>
                  <button onClick={() => setShowBilling(true)} className={styles.proceedButton}>
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className={styles.billingSection}>
            <h3>Checkout Details</h3>

            <form onSubmit={handlePlaceOrder} className={styles.billingForm}>
              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.formGroup}>
                <label>Customer Name</label>
                <input
                  type="text"
                  placeholder="Enter name"
                  value={billingForm.userName}
                  onChange={(e) => setBillingForm(prev => ({ ...prev, userName: e.target.value }))}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Phone Number</label>
                <input
                  type="tel"
                  placeholder="Enter 10-digit phone"
                  value={billingForm.phoneNumber}
                  onChange={(e) => setBillingForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  required
                  className={styles.input}
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Order Type</label>
                <div className={styles.cardSelector}>
                  <div
                    className={`${styles.selectableCard} ${billingForm.orderType === "takeaway" ? styles.active : ""} ${hasNonPackableProduce ? styles.disabled : ""}`}
                    onClick={() => !hasNonPackableProduce && setBillingForm(prev => ({ ...prev, orderType: "takeaway" }))}
                    style={hasNonPackableProduce ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                  >
                    <div className={styles.cardIcon}>🥡</div>
                    <span>Takeaway</span>
                  </div>
                  <div
                    className={`${styles.selectableCard} ${billingForm.orderType === "dinein" ? styles.active : ""}`}
                    onClick={() => setBillingForm(prev => ({ ...prev, orderType: "dinein" }))}
                  >
                    <div className={styles.cardIcon}>🍽️</div>
                    <span>Dine In</span>
                  </div>
                </div>
                {hasNonPackableProduce && (
                  <p style={{ color: "#e67e22", fontSize: "0.82rem", marginTop: "0.35rem" }}>
                    ⚠️ Dine In only — your cart contains non-packable items
                  </p>
                )}
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Payment Method</label>
                <div className={styles.cardSelector}>
                  <div
                    className={`${styles.selectableCard} ${billingForm.paymentMethod === "cash" ? styles.active : ""}`}
                    onClick={() => setBillingForm(prev => ({ ...prev, paymentMethod: "cash" }))}
                  >
                    <div className={styles.cardIcon}>💵</div>
                    <span>Cash Payment</span>
                  </div>
                  {!hasPendingOrderService && (
                    <div
                      className={`${styles.selectableCard} ${billingForm.paymentMethod === "upi" ? styles.active : ""}`}
                      onClick={() => setBillingForm(prev => ({ ...prev, paymentMethod: "upi" }))}
                    >
                      <div className={styles.cardIcon}>📱</div>
                      <span>UPI Payment</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={`${styles.checkoutSummary} ${styles.fullWidth}`}>
                <h4>Order Summary</h4>
                <div className={styles.breakdownRow}>
                  <span>Items Total ({cart.items.length} items)</span>
                  <span>₹{stats.itemTotal.toFixed(2)}</span>
                </div>
                {stats.packableCount > 0 && billingForm.orderType === "takeaway" && (
                  <div className={styles.breakdownRow}>
                    <span>Packing Charges</span>
                    <span>₹{stats.packingTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className={styles.breakdownRow}>
                  <span>Final Amount</span>
                  <span>₹{stats.finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" onClick={() => setShowBilling(false)} className={styles.cancelButton}>Back to Cart</button>
                <button type="submit" className={styles.submitButton}>
                  {billingForm.paymentMethod === "upi" ? "Complete Payment" : "Confirm & Place Order"}
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
              total={stats.finalTotal}
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
