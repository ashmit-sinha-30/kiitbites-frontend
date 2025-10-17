"use client";

import React, { useState, useEffect } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface VendorRazorpayPaymentProps {
  vendorId: string;
  items: Array<{
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    kind: "Retail" | "Produce";
    type: string;
  }>;
  total: number;
  collectorName: string;
  collectorPhone: string;
  orderType: "dinein" | "takeaway";
  packingCharge?: number;
  onPaymentSuccess: (orderId: string, orderNumber: string) => void;
  onPaymentFailure: (error: string) => void;
  onCancel: () => void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    contact: string;
    email: string;
  };
  theme: {
    color: string;
  };
  config: {
    display: {
      blocks: {
        banks: {
          name: string;
          instruments: Array<{ method: string }>;
        };
        cards: {
          name: string;
          instruments: Array<{ method: string }>;
        };
        netbanking: {
          name: string;
          instruments: Array<{ method: string }>;
        };
        other: {
          name: string;
          instruments: Array<{ method: string }>;
        };
      };
      sequence: string[];
      preferences: {
        show_default_blocks: boolean;
      };
    };
  };
  handler: (response: RazorpayResponse) => void;
  modal: {
    ondismiss: () => void;
  };
  notes: {
    address: string;
    merchant_order_id: string;
  };
  retry: {
    enabled: boolean;
    max_count: number;
  };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}



export const VendorRazorpayPayment: React.FC<VendorRazorpayPaymentProps> = ({
  vendorId,
  items,
  total,
  collectorName,
  collectorPhone,
  orderType,
  packingCharge = 5,
  onPaymentSuccess,
  onPaymentFailure,
  onCancel,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleUPIPayment = async () => {
    setIsProcessing(true);

    try {
      console.log("💳 Starting UPI payment for vendor order:", {
        vendorId,
        total,
        collectorName,
        collectorPhone,
        orderType,
        itemsCount: items.length
      });

      // Create Razorpay order for vendor guest order
      const createOrderResponse = await fetch(`${BACKEND_URL}/vendor-payment/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId,
          items,
          total: (() => {
            const itemTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const packableItems = items.filter(item => item.kind === "Produce");
            const packingTotal = packableItems.reduce((sum, item) => sum + (packingCharge * item.quantity), 0);
            return itemTotal + packingTotal;
          })(),
          collectorName,
          collectorPhone,
          orderType,
        }),
      });

      if (!createOrderResponse.ok) {
        throw new Error("Failed to create Razorpay order");
      }

      const razorpayOrder = await createOrderResponse.json();
      console.log("💳 Razorpay order created:", razorpayOrder);

      // Get Razorpay key
      const keyResponse = await fetch(`${BACKEND_URL}/vendor-payment/key`);
      if (!keyResponse.ok) {
        throw new Error("Failed to get Razorpay key");
      }
      const { key: razorpayKey } = await keyResponse.json();

      // Create Razorpay options
      const options: RazorpayOptions = {
        key: razorpayKey,
        amount: Math.round((() => {
          const itemTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const packableItems = items.filter(item => item.kind === "Produce");
          const packingTotal = packableItems.reduce((sum, item) => sum + (packingCharge * item.quantity), 0);
          return (itemTotal + packingTotal) * 100;
        })()),
        currency: "INR",
        order_id: razorpayOrder.id,
        name: "KAMPYN",
        description: "Complete your payment",
        prefill: {
          name: collectorName,
          contact: collectorPhone,
          email: "customer@kiitbites.com",
        },
        theme: {
          color: "#01796f",
        },
        config: {
          display: {
            blocks: {
              banks: {
                name: "Pay using UPI",
                instruments: [{ method: "upi" }],
              },
              cards: {
                name: "Pay using Card",
                instruments: [{ method: "card" }],
              },
              netbanking: {
                name: "Pay using Netbanking",
                instruments: [{ method: "netbanking" }],
              },
              other: {
                name: "Other Payment Methods",
                instruments: [
                  { method: "wallet" },
                  { method: "paylater" },
                ],
              },
            },
            sequence: ["block.banks", "block.cards", "block.netbanking", "block.other"],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
        handler: async (response: RazorpayResponse) => {
          console.log("💳 Razorpay payment success:", response);
          await handlePaymentSuccess(response);
        },
        modal: {
          ondismiss: () => {
            console.log("❌ Razorpay modal dismissed");
            onCancel();
          },
        },
        notes: {
          address: "KAMPYN Food Order",
          merchant_order_id: `vendor-${Date.now()}`,
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
      };

      // Initialize Razorpay
      if (typeof window !== "undefined" && window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        throw new Error("Razorpay SDK not loaded");
      }
    } catch (error) {
      console.error("❌ Error in UPI payment:", error);
      onPaymentFailure(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (response: RazorpayResponse) => {
    try {
      console.log("📨 Verifying payment:", response);

      const verifyResponse = await fetch(`${BACKEND_URL}/vendor-payment/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Payment verification failed");
      }

      const verifyResult = await verifyResponse.json();
      console.log("✅ Payment verified:", verifyResult);

      if (verifyResult.success) {
        onPaymentSuccess(verifyResult.orderId, verifyResult.orderNumber);
      } else {
        throw new Error(verifyResult.message || "Payment verification failed");
      }
    } catch (error) {
      console.error("❌ Payment verification error:", error);
      onPaymentFailure(error instanceof Error ? error.message : "Payment verification failed");
    }
  };

  return (
    <div className="vendor-razorpay-payment">
      <div className="payment-summary">
        <h3>Payment Summary</h3>
        <div className="order-details">
          <p><strong>Customer:</strong> {collectorName}</p>
          <p><strong>Phone:</strong> {collectorPhone}</p>
          <p><strong>Order Type:</strong> {orderType}</p>
        </div>
        
        <div className="items-list">
          <h4>Items:</h4>
          {items.map((item, index) => (
            <div key={index} className="item">
              <span>{item.name}</span>
              <span>₹{item.price.toFixed(2)} × {item.quantity}</span>
            </div>
          ))}
        </div>

        <div className="payment-breakdown">
          <h4>Payment Breakdown:</h4>
          {(() => {
            const itemTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const packableItems = items.filter(item => item.kind === "Produce");
            const packingTotal = packableItems.reduce((sum, item) => sum + (packingCharge * item.quantity), 0);
            const totalWithPacking = itemTotal + packingTotal;
            
            return (
              <>
                <div className="breakdown-row">
                  <span>Items Total:</span>
                  <span>₹{itemTotal.toFixed(2)}</span>
                </div>
                {packableItems.length > 0 && (
                  <div className="breakdown-row">
                    <span>Packing Charge ({packableItems.length} produce items @ ₹{packingCharge} each):</span>
                    <span>₹{packingTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="breakdown-row">
                  <strong>Total Amount:</strong>
                  <strong>₹{totalWithPacking.toFixed(2)}</strong>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      <div className="payment-actions">
        <button
          onClick={handleUPIPayment}
          disabled={isProcessing}
          className="pay-button"
        >
          {isProcessing ? "Processing..." : "Pay with UPI"}
        </button>
        
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="cancel-button"
        >
          Cancel
        </button>
      </div>

      <style jsx>{`
        .vendor-razorpay-payment {
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          margin: 0 auto;
        }

        .payment-summary h3 {
          margin-bottom: 20px;
          color: #333;
          text-align: center;
        }

        .order-details {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .order-details p {
          margin: 8px 0;
          color: #555;
        }

        .items-list {
          margin-bottom: 20px;
        }

        .items-list h4 {
          margin-bottom: 10px;
          color: #333;
        }

        .item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }

        .item:last-child {
          border-bottom: none;
        }

        .payment-breakdown {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .payment-breakdown h4 {
          margin-bottom: 10px;
          color: #333;
        }

        .breakdown-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }

        .breakdown-row:last-child {
          border-bottom: none;
        }

        .breakdown-row.total {
          font-size: 1.1em;
          color: #01796f;
          border-top: 2px solid #01796f;
          margin-top: 8px;
          padding-top: 12px;
        }

        .payment-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .pay-button {
          background: linear-gradient(90deg, #4ea199, #6fc3bd);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.3s;
        }

        .pay-button:hover:not(:disabled) {
          background: linear-gradient(90deg, #4ea199, #6fc3bd);
          opacity: 0.9;
        }

        .pay-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .cancel-button {
          background: #6c757d;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.3s;
        }

        .cancel-button:hover:not(:disabled) {
          background: #5a6268;
        }

        .cancel-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}; 