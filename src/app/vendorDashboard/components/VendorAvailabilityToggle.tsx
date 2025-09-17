import React, { useState, useEffect } from 'react';
import { AiOutlinePoweroff, AiOutlineCheckCircle } from 'react-icons/ai';
import styles from '../styles/VendorAvailabilityToggle.module.scss';

interface VendorAvailabilityToggleProps {
  vendorId: string;
  uniId: string;
  onAvailabilityChange?: (isAvailable: boolean) => void;
}

const VendorAvailabilityToggle: React.FC<VendorAvailabilityToggleProps> = ({
  vendorId,
  uniId,
  onAvailabilityChange
}) => {
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

  // Fetch current availability status
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/vendor/${vendorId}/availability`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setIsAvailable(data.data.isAvailable);
          }
        }
      } catch (err) {
        console.error('Error fetching vendor availability:', err);
      }
    };

    if (vendorId) {
      fetchAvailability();
    }
  }, [vendorId]);

  const toggleAvailability = async () => {
    setLoading(true);
    setError(null);

    try {
      const newAvailability = !isAvailable;
      const response = await fetch(
        `${BACKEND_URL}/api/vendor/${vendorId}/toggle-availability`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isAvailable: newAvailability ? 'Y' : 'N'
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsAvailable(newAvailability);
          onAvailabilityChange?.(newAvailability);
        } else {
          setError(data.message || 'Failed to update availability');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update availability');
      }
    } catch (err) {
      console.error('Error updating vendor availability:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.availabilityToggle}>
      <div className={styles.toggleContainer}>
        <button
          className={`${styles.toggleSwitch} ${isAvailable ? styles.available : styles.unavailable}`}
          onClick={toggleAvailability}
          disabled={loading}
          aria-label={`Toggle availability - currently ${isAvailable ? 'available' : 'unavailable'}`}
        >
          <div className={styles.toggleSlider}>
            <div className={styles.toggleKnob}>
              {isAvailable ? (
                <AiOutlineCheckCircle className={styles.icon} />
              ) : (
                <AiOutlinePoweroff className={styles.icon} />
              )}
            </div>
          </div>
          <span className={styles.toggleLabel}>
            {isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </button>
        
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
          </div>
        )}
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
    </div>
  );
};

export default VendorAvailabilityToggle;
