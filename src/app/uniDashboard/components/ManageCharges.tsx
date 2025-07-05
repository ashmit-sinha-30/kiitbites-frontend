import React, { useState, useEffect } from "react";
import styles from "../styles/ManageCharges.module.scss";

interface ManageChargesProps {
  universityId: string;
}

interface UniversityCharges {
  packingCharge: number;
  deliveryCharge: number;
  universityName: string;
}

const ManageCharges: React.FC<ManageChargesProps> = ({ universityId }) => {
  const [charges, setCharges] = useState<UniversityCharges | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    packingCharge: 0,
    deliveryCharge: 0,
  });

  useEffect(() => {
    fetchCharges();
  }, [universityId]);

  const fetchCharges = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/university/charges/${universityId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch charges");
      }

      const data = await response.json();
      setCharges(data);
      setFormData({
        packingCharge: data.packingCharge,
        deliveryCharge: data.deliveryCharge,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch charges");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/university/charges/${universityId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update charges");
      }

      const data = await response.json();
      setCharges(data);
      setSuccess("Charges updated successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update charges");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;
    
    setFormData(prev => ({
      ...prev,
      [name]: numValue,
    }));
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading charges...</div>
      </div>
    );
  }

  if (error && !charges) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Error: {error}</p>
          <button onClick={fetchCharges} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Manage Charges</h2>
        {charges && (
          <p className={styles.universityName}>{charges.universityName}</p>
        )}
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {success && (
        <div className={styles.successMessage}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="packingCharge">
            Packing Charge (₹ per produce item)
          </label>
          <input
            type="number"
            id="packingCharge"
            name="packingCharge"
            value={formData.packingCharge}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            required
            className={styles.input}
            placeholder="Enter packing charge"
          />
          <p className={styles.helpText}>
            Applied to takeaway and delivery orders for each produce item
          </p>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="deliveryCharge">
            Delivery Charge (₹ per delivery)
          </label>
          <input
            type="number"
            id="deliveryCharge"
            name="deliveryCharge"
            value={formData.deliveryCharge}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            required
            className={styles.input}
            placeholder="Enter delivery charge"
          />
          <p className={styles.helpText}>
            Applied only to delivery orders
          </p>
        </div>

        <div className={styles.summary}>
          <h3>Charge Summary</h3>
          <div className={styles.summaryItem}>
            <span>Takeaway Order:</span>
            <span>Base amount + (Packing charge × Produce items)</span>
          </div>
          <div className={styles.summaryItem}>
            <span>Delivery Order:</span>
            <span>Base amount + (Packing charge × Produce items) + Delivery charge</span>
          </div>
          <div className={styles.summaryItem}>
            <span>Dine-in Order:</span>
            <span>Base amount only (no additional charges)</span>
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={fetchCharges}
            className={styles.cancelButton}
            disabled={saving}
          >
            Reset
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManageCharges; 