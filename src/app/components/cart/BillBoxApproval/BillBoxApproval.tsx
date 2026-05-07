import React from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { CartItem, OrderData } from "../../../cart/types";
import styles from "../BillBox/BillBox.module.scss";
import BillBoxForm from "../shared/BillBoxForm";

interface Props {
  userId: string;
  items: CartItem[];
  onOrderSubmitted: (orderId: string) => void;
}

const BillBoxApproval: React.FC<Props> = ({ userId, items, onOrderSubmitted }) => {
  const handleSubmit = async (payload: OrderData) => {
    try {
      const orderResp = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/order-approval/submit/${userId}`,
        payload,
        {
          withCredentials: true,
        }
      );

      console.log("🧾 Order approval submission response:", orderResp.data);

      if (orderResp.data.success && orderResp.data.orderId) {
        toast.success("Order submitted for vendor approval!");
        // Call the callback with orderId - this will show the waiting screen
        onOrderSubmitted(orderResp.data.orderId);
      } else {
        toast.error("Failed to submit order for approval.");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("❌ Order approval submission failed:", error.response?.data);
        toast.error(error.response?.data?.message || "Failed to submit order for approval.");
      } else {
        console.error("❌ Order approval submission failed:", error);
        toast.error("Failed to submit order for approval.");
      }
    }
  };

  return (
    <BillBoxForm
      userId={userId}
      items={items}
      styles={styles}
      submitLabel="Submit Order"
      fetchData={async (url) => {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}${url}`, {
          withCredentials: true,
        });
        return response.data;
      }}
      onSubmitOrder={handleSubmit}
    />
  );
};

export default BillBoxApproval;

