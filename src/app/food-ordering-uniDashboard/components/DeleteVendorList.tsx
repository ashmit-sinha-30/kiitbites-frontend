import React, { useEffect, useState } from "react";
import styles from "../styles/VendorManagement.module.scss";

interface Vendor {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  location?: string;
  isAvailable: "Y" | "N";
}

interface DeleteVendorListProps {
  universityId: string;
}

export const DeleteVendorList: React.FC<DeleteVendorListProps> = ({ universityId }) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");

  const fetchVendors = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_URL + `/api/vendor/availability/uni/${universityId}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch vendors");
      setVendors(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [universityId]);

  const handleDelete = async (vendorId: string) => {
    setDeletingId(vendorId);
    setSuccess("");
    setError("");
    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_URL + `/api/vendor/delete/uni/${universityId}/vendor/${vendorId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete vendor");
      setSuccess("Vendor deleted successfully.");
      setVendors(vendors.filter(v => v._id !== vendorId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete vendor");
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  if (loading) return <div className={styles.loading}>Loading vendors...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <h2 style={{ marginBottom: "1rem" }}>Delete Vendor</h2>
      {success && <div style={{ color: "green", marginBottom: 8 }}>{success}</div>}
      {vendors.length === 0 ? (
        <div className={styles.noVendors}>No vendors found.</div>
      ) : (
        <div className={styles.vendorsGrid}>
          {vendors.map((vendor) => (
            <div key={vendor._id} className={styles.vendorCard}>
              <div className={styles.vendorInfo}>
                <h4 className={styles.vendorName}>{vendor.fullName}</h4>
                <p className={styles.vendorEmail}>{vendor.email}</p>
                <p className={styles.vendorPhone}>{vendor.phone}</p>
                {vendor.location && <p className={styles.vendorLocation}>{vendor.location}</p>}
              </div>
              <div style={{ marginTop: 12 }}>
                <button
                  className={styles.toggleButton + " " + styles.turnOff}
                  onClick={() => setConfirmId(vendor._id)}
                  disabled={deletingId === vendor._id}
                >
                  Delete
                </button>
                {confirmId === vendor._id && (
                  <div style={{ marginTop: 8, background: "#fff3cd", padding: 8, borderRadius: 4 }}>
                    Are you sure you want to delete this vendor?<br />
                    <button
                      className={styles.toggleButton + " " + styles.turnOff}
                      onClick={() => handleDelete(vendor._id)}
                      disabled={deletingId === vendor._id}
                      style={{ marginRight: 8 }}
                    >
                      {deletingId === vendor._id ? "Deleting..." : "Yes, Delete"}
                    </button>
                    <button
                      className={styles.toggleButton}
                      onClick={() => setConfirmId(null)}
                      disabled={deletingId === vendor._id}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 