import { createPortal } from 'react-dom';
import { Store, CheckCircle2, X } from 'lucide-react';
import styles from "../styles/CollegePage.module.scss";
import { Vendor } from "../types";

interface VendorModalProps {
  show: boolean;
  availableVendors: Vendor[];
  selectedVendor: Vendor | null;
  onVendorSelect: (vendor: Vendor) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const VendorModal = ({
  show,
  availableVendors,
  selectedVendor,
  onVendorSelect,
  onConfirm,
  onCancel,
}: VendorModalProps) => {
  if (!show) return null;

  return createPortal(
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.vendorModalHeader}>
          <div className={styles.vendorModalTitleWrapper}>
            <Store className={styles.vendorModalIcon} size={28} />
            <h2 className={styles.vendorModalTitle}>Select Vendor</h2>
          </div>
          <button
            className={styles.vendorModalCloseButton}
            onClick={onCancel}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {availableVendors.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading vendors...</p>
          </div>
        ) : (
          <div className={styles.vendorList}>
            {availableVendors.map((vendor) => (
              <div
                key={vendor._id}
                className={`${styles.vendorCard} ${selectedVendor?._id === vendor._id ? styles.vendorCardSelected : ""
                  }`}
                onClick={() => onVendorSelect(vendor)}
              >
                <div className={styles.vendorCardContent}>
                  <div className={styles.vendorCardInfo}>
                    <div className={styles.vendorCardIconWrapper}>
                      <Store className={styles.vendorCardIcon} size={24} />
                    </div>
                    <div className={styles.vendorCardDetails}>
                      <h3 className={styles.vendorCardName}>{vendor.name}</h3>
                      <div className={styles.vendorCardPriceWrapper}>
                        <span className={styles.vendorCardPriceLabel}>Price:</span>
                        <span className={styles.vendorCardPrice}>₹{vendor.price}</span>
                      </div>
                      {vendor.quantity !== undefined && (
                        <p className={styles.vendorCardQuantity}>
                          Available: {vendor.quantity}
                        </p>
                      )}
                    </div>
                  </div>
                  {selectedVendor?._id === vendor._id && (
                    <div className={styles.vendorCardCheck}>
                      <CheckCircle2 size={24} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.modalButtons}>
          <button className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
          <button
            className={styles.confirmButton}
            onClick={onConfirm}
            disabled={!selectedVendor}
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VendorModal; 