"use client";

import React from "react";

interface OrderSuccessPopupProps {
  orderNumber: string;
  customerName: string;
  phoneNumber: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    kind?: "Retail" | "Produce";
  }>;
  total: number;
  orderType: "dinein" | "takeaway";
  packingCharge?: number;
  onClose: () => void;
}

export const OrderSuccessPopup: React.FC<OrderSuccessPopupProps> = ({
  orderNumber,
  customerName,
  phoneNumber,
  items,
  total,
  orderType,
  packingCharge = 5,
  onClose,
}) => {
  return (
    <div className="order-success-overlay">
      <div className="order-success-popup">
        <div className="success-header">
          <div className="success-icon">✅</div>
          <h2>Order Placed Successfully!</h2>
        </div>

        <div className="order-details">
          <div className="detail-section">
            <h3>Order Information</h3>
            <div className="detail-row">
              <span className="label">Order Number:</span>
              <span className="value">{orderNumber}</span>
            </div>
            <div className="detail-row">
              <span className="label">Customer Name:</span>
              <span className="value">{customerName}</span>
            </div>
            <div className="detail-row">
              <span className="label">Phone Number:</span>
              <span className="value">{phoneNumber}</span>
            </div>
            <div className="detail-row">
              <span className="label">Order Type:</span>
              <span className="value">{orderType === "dinein" ? "Dine In" : "Takeaway"}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>Order Items</h3>
            <div className="items-list">
              {items.map((item, index) => (
                <div key={index} className="item-row">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">× {item.quantity}</span>
                  <span className="item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="total-section">
            {(() => {
              const itemTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              const packableItems = items.filter(item => item.kind === "Produce");
              const packingTotal = packableItems.reduce((sum, item) => sum + (packingCharge * item.quantity), 0);
              
              return (
                <>
                  <div className="breakdown-row">
                    <span className="breakdown-label">Items Total:</span>
                    <span className="breakdown-value">₹{itemTotal.toFixed(2)}</span>
                  </div>
                  {packableItems.length > 0 && (
                    <div className="breakdown-row">
                      <span className="breakdown-label">Packing Charge ({packableItems.length} produce items @ ₹{packingCharge} each):</span>
                      <span className="breakdown-value">₹{packingTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="total-row">
                    <span className="total-label">Total Amount:</span>
                    <span className="total-value">₹{total.toFixed(2)}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        <div className="popup-actions">
          <button onClick={onClose} className="close-button">
            Close
          </button>
        </div>

        <style jsx>{`
          .order-success-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }

          .order-success-popup {
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          }

          .success-header {
            text-align: center;
            margin-bottom: 25px;
          }

          .success-icon {
            font-size: 48px;
            margin-bottom: 10px;
          }

          .success-header h2 {
            color: #01796f;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }

          .order-details {
            margin-bottom: 25px;
          }

          .detail-section {
            margin-bottom: 20px;
          }

          .detail-section h3 {
            color: #333;
            margin-bottom: 12px;
            font-size: 18px;
            font-weight: 600;
            border-bottom: 2px solid #01796f;
            padding-bottom: 5px;
          }

          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 8px 0;
          }

          .label {
            font-weight: 500;
            color: #555;
          }

          .value {
            font-weight: 600;
            color: #333;
          }

          .items-list {
            max-height: 200px;
            overflow-y: auto;
          }

          .item-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }

          .item-row:last-child {
            border-bottom: none;
          }

          .item-name {
            flex: 1;
            font-weight: 500;
            color: #333;
          }

          .item-quantity {
            margin: 0 15px;
            color: #666;
            font-weight: 500;
          }

          .item-price {
            font-weight: 600;
            color: #01796f;
            min-width: 80px;
            text-align: right;
          }

          .total-section {
            border-top: 2px solid #01796f;
            padding-top: 15px;
            margin-top: 15px;
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

          .breakdown-label {
            font-size: 14px;
            font-weight: 500;
            color: #555;
          }

          .breakdown-value {
            font-size: 14px;
            font-weight: 600;
            color: #333;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #01796f;
          }

          .total-label {
            font-size: 18px;
            font-weight: 600;
            color: #333;
          }

          .total-value {
            font-size: 20px;
            font-weight: 700;
            color: #01796f;
          }

          .popup-actions {
            text-align: center;
          }

          .close-button {
            background: linear-gradient(90deg, #4ea199, #6fc3bd);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 16px;
            transition: background 0.3s;
          }

          .close-button:hover {
            background: linear-gradient(90deg, #4ea199, #6fc3bd);
            opacity: 0.9;
          }

          @media (max-width: 600px) {
            .order-success-popup {
              padding: 20px;
              margin: 20px;
            }

            .success-header h2 {
              font-size: 20px;
            }

            .detail-section h3 {
              font-size: 16px;
            }

            .item-row {
              flex-direction: column;
              align-items: flex-start;
              gap: 5px;
            }

            .item-quantity {
              margin: 0;
            }

            .item-price {
              text-align: left;
            }
          }
        `}</style>
      </div>
    </div>
  );
}; 