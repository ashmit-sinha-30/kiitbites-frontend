// NEW FILE: BillBox component for order approval workflow (without payment)
// Changed import location: This replaces the payment flow with approval flow

import React, { FormEvent, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { CartItem, OrderType, OrderData } from "../../app/cart/types";
import styles from "./styles/BillBox.module.scss";

interface Props {
  userId: string;
  items: CartItem[];
  onOrderSubmitted: (orderId: string) => void; // Changed from onOrder to onOrderSubmitted
}

const BillBoxApproval: React.FC<Props> = ({ userId, items, onOrderSubmitted }) => {
  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [charges, setCharges] = useState<{ packingCharge: number | null; deliveryCharge: number | null; platformFee: number | null }>({ packingCharge: null, deliveryCharge: null, platformFee: null });
  const [vendorDeliverySettings, setVendorDeliverySettings] = useState<{ offersDelivery: boolean; deliveryPreparationTime: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch university charges and vendor delivery settings when component mounts
  useEffect(() => {
    const fetchChargesAndDeliverySettings = async () => {
      setLoading(true);
      try {
        console.log("🔄 Fetching charges and delivery settings for userId:", userId);
        
        // Get user's cart to find vendorId
        const cartResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/cart/${userId}`,
          { withCredentials: true }
        );
        
        console.log("📦 Cart response:", cartResponse.data);
        
        if (cartResponse.data.vendorId) {
          const vendorId = cartResponse.data.vendorId;
          
          // Fetch vendor delivery settings
          try {
            const deliverySettingsResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/${vendorId}/delivery-settings`,
              { withCredentials: true }
            );
            
            console.log("🚚 Delivery settings response:", deliverySettingsResponse.data);
            
            if (deliverySettingsResponse.data.success) {
              setVendorDeliverySettings(deliverySettingsResponse.data.data);
            }
          } catch (error) {
            console.error("❌ Failed to fetch delivery settings:", error);
            setVendorDeliverySettings({ offersDelivery: true, deliveryPreparationTime: 30 });
          }
          
          // Get vendor to find university
          const vendorResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/item/getvendors/${vendorId}`,
            { withCredentials: true }
          );
          
          console.log("🏪 Vendor response:", vendorResponse.data);
          
          if (vendorResponse.data.uniID) {
            // Get university charges
            const chargesResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/university/charges/${vendorResponse.data.uniID}`,
              { withCredentials: true }
            );
            
            console.log("💰 Charges response:", chargesResponse.data);
            
            setCharges({
              packingCharge: chargesResponse.data.packingCharge,
              deliveryCharge: chargesResponse.data.deliveryCharge,
              platformFee: chargesResponse.data.platformFee,
            });
          } else {
            setCharges({ packingCharge: null, deliveryCharge: null, platformFee: null });
          }
        } else {
          setCharges({ packingCharge: null, deliveryCharge: null, platformFee: null });
        }
      } catch (error) {
        console.error("Failed to fetch charges and delivery settings:", error);
        setCharges({ packingCharge: 5, deliveryCharge: 50, platformFee: 2 });
      } finally {
        setLoading(false);
      }
    };

    fetchChargesAndDeliverySettings();
  }, [userId]);

  // Auto-switch to takeaway if delivery is disabled
  useEffect(() => {
    if (vendorDeliverySettings && !vendorDeliverySettings.offersDelivery && orderType === "delivery") {
      console.log("🔄 Web: Delivery disabled by vendor, switching to takeaway");
      setOrderType("takeaway");
    }
  }, [vendorDeliverySettings, orderType]);

  // More robust packable item detection
  const packableItems = items.filter((i) => {
    if (i.category === "Produce") return true;
    return i.packable === true;
  });

  const packingCharge = charges.packingCharge ?? 5;
  const deliveryCharge = charges.deliveryCharge ?? 50;
  const platformFee = charges.platformFee ?? 2;
  
  const itemTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const packaging = orderType !== "dinein" 
    ? packableItems.reduce((sum, i) => sum + packingCharge * i.quantity, 0)
    : 0;
  const delivery = orderType === "delivery" ? deliveryCharge : 0;
  const grandTotal = itemTotal + packaging + delivery + platformFee;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <span>Loading bill details...</span>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (
      !name.trim() ||
      !phone.trim() ||
      (orderType === "delivery" && !address.trim())
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const payload: OrderData = {
      orderType,
      collectorName: name,
      collectorPhone: phone,
      ...(orderType === "delivery" ? { address } : {}),
    };

    console.log("📦 Order approval payload:", payload);

    try {
      // Submit order for vendor approval (NEW API endpoint)
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
    <form className={styles.container} onSubmit={handleSubmit}>
      {/* Estimated Preparation Time at the top */}
      {vendorDeliverySettings && (
        <div className={styles.preparationTime} style={{ marginBottom: '0.5rem' }}>
          <span>Estimated preparation time</span> 
          <span>{vendorDeliverySettings.deliveryPreparationTime} minutes</span>
        </div>
      )}
      <div className={styles.segmentedControl}>
        {(["takeaway", "delivery", "dinein"] as OrderType[])
          .filter((t) => {
            if (t === "delivery" && vendorDeliverySettings && !vendorDeliverySettings.offersDelivery) {
              return false;
            }
            return true;
          })
          .map((t) => (
            <button
              key={t}
              type="button"
              className={orderType === t ? styles.active : styles.segment}
              onClick={() => setOrderType(t)}
            >
              {t === "takeaway"
                ? "Takeaway"
                : t === "delivery"
                ? "Delivery"
                : "Dine In"}
            </button>
          ))}
      </div>

      <input
        className={styles.input}
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        className={styles.input}
        placeholder="Phone"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
      />

      {orderType === "delivery" && (
        <textarea
          className={styles.textarea}
          placeholder="Delivery Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
      )}

      <div className={styles.bill}>
        <div className={styles.items}>
        {items.map((i) => (
          <div key={i._id} className={styles.line}>
            <span>
              {i.name} ×{i.quantity}
            </span>
            <span>₹{i.price * i.quantity}</span>
          </div>
        ))}
        </div>
        
      <div className={styles.totalPack}>
        {orderType !== "dinein" && packableItems.length > 0 && (
          <>
            {packableItems.map((item) => (
              <div key={item._id} className={styles.extra}>
                <span>Packaging - {item.name}</span>
                <span>₹{packingCharge * item.quantity}</span>
              </div>
            ))}
            <div className={styles.extra}>
              <span>Total Packaging ({packableItems.length} item{packableItems.length > 1 ? 's' : ''})</span>
              <span>₹{packaging}</span>
            </div>
          </>
        )}
        
        {orderType === "delivery" && (
          <div className={styles.extra}>
            <span>Delivery Charge</span>
            <span>₹{delivery}</span>
          </div>
        )}

        <div className={styles.extra}>
          <span>Platform Fee</span>
          <span>₹{platformFee}</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.total}>
          <strong>Total</strong>
          <strong>₹{grandTotal}</strong>
        </div>
      </div>
      </div>

      <button type="submit" className={styles.button}>
        Submit Order
      </button>
    </form>
  );
};

export default BillBoxApproval;

