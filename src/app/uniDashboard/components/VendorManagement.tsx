import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Vendor } from "../types";
import styles from "../styles/VendorManagement.module.scss";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface Props {
  universityId: string;
}

export function VendorManagement({ universityId }: Props) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingVendor, setUpdatingVendor] = useState<string | null>(null);
  const router = useRouter();

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${BACKEND_URL}/api/vendor/availability/uni/${universityId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch vendors: ${response.statusText}`);
      }
      
      const data = await response.json();
      setVendors(data);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  const toggleVendorAvailability = async (vendorId: string, currentStatus: "Y" | "N") => {
    try {
      setUpdatingVendor(vendorId);
      const newStatus = currentStatus === "Y" ? "N" : "Y";
      
      const response = await fetch(
        `${BACKEND_URL}/api/vendor/availability/uni/${universityId}/vendor/${vendorId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isAvailable: newStatus }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to update vendor: ${response.statusText}`);
      }
      
      // Update the local state
      setVendors(prev => 
        prev.map(vendor => 
          vendor._id === vendorId 
            ? { ...vendor, isAvailable: newStatus }
            : vendor
        )
      );
      
    } catch (err) {
      console.error("Error updating vendor availability:", err);
      alert(`Failed to update vendor: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setUpdatingVendor(null);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [universityId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading vendors...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Error: {error}</p>
          <button onClick={fetchVendors} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const availableVendors = vendors.filter(v => v.isAvailable === "Y");
  const unavailableVendors = vendors.filter(v => v.isAvailable === "N");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Vendor Management</h2>
        <p>Manage vendor availability for your university</p>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{availableVendors.length}</span>
          <span className={styles.statLabel}>Available Vendors</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{unavailableVendors.length}</span>
          <span className={styles.statLabel}>Unavailable Vendors</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{vendors.length}</span>
          <span className={styles.statLabel}>Total Vendors</span>
        </div>
      </div>

      <div className={styles.vendorsList}>
        <h3>All Vendors</h3>
        {vendors.length === 0 ? (
          <p className={styles.noVendors}>No vendors found for this university.</p>
        ) : (
          <div className={styles.vendorsGrid}>
            {vendors.map((vendor) => {
              const isActive = vendor.isAvailable === "Y";
              return (
                <div
                  key={vendor._id}
                  className={`${styles.vendorCard} ${!isActive ? styles.unavailable : styles.active}`}
                  style={isActive ? { cursor: "pointer" } : {}}
                  onClick={() => {
                    if (isActive) router.push(`/uniDashboard/vendor/${vendor._id}`);
                  }}
                >
                  <div className={styles.vendorInfo}>
                    <h4 className={styles.vendorName}>{vendor.fullName}</h4>
                    <p className={styles.vendorEmail}>{vendor.email}</p>
                    <p className={styles.vendorPhone}>{vendor.phone}</p>
                    {vendor.location && (
                      <p className={styles.vendorLocation}>{vendor.location}</p>
                    )}
                  </div>
                  <div className={styles.vendorStatus}>
                    <span className={`${styles.statusBadge} ${vendor.isAvailable === "Y" ? styles.available : styles.unavailable}`}>
                      {vendor.isAvailable === "Y" ? "Available" : "Unavailable"}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleVendorAvailability(vendor._id, vendor.isAvailable);
                      }}
                      disabled={updatingVendor === vendor._id}
                      className={`${styles.toggleButton} ${vendor.isAvailable === "Y" ? styles.turnOff : styles.turnOn}`}
                    >
                      {updatingVendor === vendor._id ? (
                        "Updating..."
                      ) : (
                        vendor.isAvailable === "Y" ? "Turn Off" : "Turn On"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 