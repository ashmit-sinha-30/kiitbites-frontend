"use client";

import React, { useEffect, useState, useCallback } from "react";
import api from "@/utils/apiUtils";
import styles from "../styles/DeliverySettings.module.scss";
// Direct fetch was used previously, now I'm using api which has base URL.
// env.NEXT_PUBLIC_BACKEND_URL || "<UNDEFINED>";

interface DeliverySettings {
  offersDelivery: boolean;
  deliveryPreparationTime: number;
}

interface Props {
  vendorId: string;
  onLoaded?: (vendorName: string, vendorId: string) => void;
}

export function DeliverySettings({ vendorId }: Props) {
  const [settings, setSettings] = useState<DeliverySettings>({
    offersDelivery: false,
    deliveryPreparationTime: 30
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);


  const fetchDeliverySettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/vendor/${vendorId}/delivery-settings`);

      const data = response.data;
      // Direct fetch used previously. Standardizing to use the `api` utility.
      if (data.success) {
        setSettings(data.data);
      } else {
        console.error('Failed to fetch delivery settings:', data.message);
      }
    } catch (error) {
      console.error('Error fetching delivery settings:', error);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchDeliverySettings();
  }, [vendorId, fetchDeliverySettings]);

  const saveSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await api.put(`/api/vendor/${vendorId}/delivery-settings`, settings);

      const data = response.data;
      // Direct fetch used previously. Standardizing to use the `api` utility.
      if (data.success) {
        setMessage({ type: 'success', text: 'Delivery settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving delivery settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof DeliverySettings, value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return <div className={styles.loading}>Loading delivery settings...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Delivery Settings</h2>
        <p>Toggle delivery service on/off and configure delivery preferences</p>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.settingsGrid}>
        {/* Delivery Toggle */}
        <div className={styles.settingCard}>
          <h3>Delivery Service</h3>
          <div className={styles.toggleContainer}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={settings.offersDelivery}
                onChange={(e) => handleInputChange('offersDelivery', e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
            <span className={styles.toggleLabel}>
              {settings.offersDelivery ? 'Delivery Enabled' : 'Delivery Disabled'}
            </span>
          </div>
          <p className={styles.settingDescription}>
            Toggle this switch to enable or disable delivery service for your customers.
            When enabled, customers can place delivery orders.
          </p>
        </div>

        {/* Preparation Time */}
        <div className={styles.settingCard}>
          <h3>Preparation Time</h3>
          <div className={styles.timeInput}>
            <input
              type="number"
              min="0"
              max="180"
              value={settings.deliveryPreparationTime}
              onChange={(e) => handleInputChange('deliveryPreparationTime', parseInt(e.target.value) || 0)}
              disabled={!settings.offersDelivery}
            />
            <span className={styles.unit}>minutes</span>
          </div>
          <p className={styles.settingDescription}>
            Set the estimated time needed to prepare orders for delivery. This helps customers know when to expect their order.
          </p>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.saveButton}
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
} 