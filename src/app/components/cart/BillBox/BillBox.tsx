import React from "react";
import { userApi } from "@/utils/apiUtils";
import { toast } from "react-toastify";
import { CartItem, OrderData } from "../../../cart/types";
import styles from "./BillBox.module.scss";
import axios from "axios";
import BillBoxForm from "../shared/BillBoxForm";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  description: string;
  prefill: {
    name: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal: {
    ondismiss: () => void;
  };
}

interface OrderResponse {
  orderId: string;
  razorpayOptions: {
    key: string;
    amount: number;
    currency: string;
    order_id: string;
  };
}

interface RazorpayConstructor {
  new(options: RazorpayOptions): {
    open: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

interface Props {
  userId: string;
  items: CartItem[];
  onOrder: (orderId: string) => void;
}

const BillBox: React.FC<Props> = ({ userId, items, onOrder }) => {
  const handleSubmit = async (payload: OrderData) => {
    let orderResp;
    try {
      orderResp = await userApi.post<OrderResponse>(`/order/${userId}`, payload);

      console.log("🧾 Order response:", orderResp.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("❌ Order request failed:", error.response?.data);
        toast.error(error.response?.data?.message || "Failed to place order.");
      } else {
        console.error("❌ Order request failed:", error);
        toast.error("Failed to place order.");
      }
      return;
    }

    const { orderId, razorpayOptions } = orderResp.data;

    console.log("💳 Frontend Razorpay options:", {
      orderId,
      razorpayOptions,
      orderType: payload.orderType,
    });

    const options: RazorpayOptions = {
      ...razorpayOptions,
      description: "Complete your payment",
      prefill: { name: payload.collectorName, contact: payload.collectorPhone },
      theme: { color: "#01796f" },
      handler: async (rzRes: RazorpayResponse) => {
        console.log("💳 Razorpay payment success:", rzRes);

        try {
          const verifyPayload = {
            razorpay_order_id: rzRes.razorpay_order_id,
            razorpay_payment_id: rzRes.razorpay_payment_id,
            razorpay_signature: rzRes.razorpay_signature,
            orderId,
          };

          console.log("📨 Sending for verification:", verifyPayload);

          const verifyResponse = await userApi.post('/payment/verify', verifyPayload);

          console.log("✅ Payment verified successfully:", verifyResponse.data);
          toast.success("Payment successful!");

          // Use the actual orderId from the verification response
          const actualOrderId = verifyResponse.data.orderId;
          onOrder(actualOrderId);

          // 🔁 Redirect to payment confirmation page with the real orderId
          window.location.href = `/payment?orderId=${actualOrderId}`;
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error("❌ Payment verification failed:", error.response?.data);
          } else {
            console.error("❌ Payment verification failed:", error);
          }
          toast.error("Payment verification failed.");
        }
      },
      modal: {
        ondismiss: async () => {
          console.warn("⚠️ Razorpay payment cancelled by user.");

          // Only cancel order if orderId exists
          if (orderId) {
            try {
              // Cancel the order and release locks
              await userApi.post(`/order/${orderId}/cancel`, {});

              console.log("✅ Order cancelled successfully");
              toast.success("Payment cancelled. You can try ordering again.");
            } catch (error) {
              console.error("❌ Failed to cancel order:", error);
              toast.error("Payment cancelled, but there was an issue. Please try again in a few minutes.");
            }
          } else {
            console.warn("⚠️ No orderId available to cancel");
            toast.success("Payment cancelled. You can try ordering again.");
          }
        },
      },
    };

    try {
      console.log("🚀 Launching Razorpay with options:", options);
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("❌ Could not open Razorpay:", error);
      toast.error("Could not open payment gateway.");
    }
  };

  return (
    <BillBoxForm
      userId={userId}
      items={items}
      styles={styles}
      submitLabel="Proceed to Payment"
      fetchData={async (url) => {
        const response = await userApi.get(url);
        return response.data;
      }}
      onSubmitOrder={handleSubmit}
    />
  );
};

export default BillBox;
