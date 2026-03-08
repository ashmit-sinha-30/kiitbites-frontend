"use client";

import React, { useState, useEffect } from "react";
import api from "@/utils/apiUtils";

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

  // Auto-trigger Razorpay on mount — skip the summary screen
  useEffect(() => {
    // Small delay to ensure Razorpay script is loaded
    const timer = setTimeout(() => {
      handleUPIPayment();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const response = await api.post(`/vendor-payment/create-order`, {
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
      });

      if (response.status !== 200) {
        throw new Error("Failed to create Razorpay order");
      }

      const razorpayOrder = response.data;
      console.log("💳 Razorpay order created:", razorpayOrder);

      // Get Razorpay key
      const keyResponse = await api.get(`/vendor-payment/key`);
      if (keyResponse.status !== 200) {
        throw new Error("Failed to get Razorpay key");
      }
      const { key: razorpayKey } = keyResponse.data;

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

      const verifyResponse = await api.post(`/vendor-payment/verify`, {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });

      if (verifyResponse.status !== 200) {
        throw new Error("Payment verification failed");
      }

      const verifyResult = verifyResponse.data;
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
        <h3>{isProcessing ? "Opening Payment Gateway..." : "Initializing Payment..."}</h3>
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Please wait while we set up your payment...</p>
        </div>
        <div className="payment-actions">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="cancel-button"
          >
            Cancel
          </button>
        </div>
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

        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 30px 0;
          gap: 16px;
        }

        .loading-indicator p {
          color: #666;
          font-size: 14px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e0e0e0;
          border-top: 4px solid #01796f;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .payment-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 16px;
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