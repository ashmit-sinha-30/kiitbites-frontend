import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Minus, Loader2, Sparkles, Circle } from 'lucide-react';
import { toast } from 'react-toastify';
import styles from '../styles/CollegePage.module.scss';
import { FoodItem, Vendor } from '../types';
import { useCart } from '../context/CartContext';
import { checkItemAvailability } from '../utils/cartUtils';
import VendorModal from './VendorModal';

interface ItemDetailModalProps {
  show: boolean;
  item: FoodItem | null;
  categories?: { retail: string[]; produce: string[] };
  userId?: string | null;
  onClose: () => void;
}

const ItemDetailModal = ({
  show,
  item,
  categories,
  userId,
  onClose,
}: ItemDetailModalProps) => {
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [availableVendors, setAvailableVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollYRef = useRef<number>(0);
  const { cartItems, addItemToCart, increaseItemQuantity, decreaseItemQuantity } = useCart();

  const cartItem = item ? cartItems.find((cartItem) => cartItem.itemId === item.id) : null;
  const quantity = cartItem?.quantity || 0;

  const handleAddToCart = async () => {
    if (!userId || !item) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      setLoading(true);
      const { vendors } = await checkItemAvailability(item, null, categories);
      let filteredVendors = vendors || [];
      if (item.isSpecial === 'Y') {
        filteredVendors = filteredVendors.filter(vendor => vendor.inventoryValue?.isSpecial === 'Y');
      }
      if (!filteredVendors || filteredVendors.length === 0) {
        toast.error('No vendors have this item available');
        return;
      }
      setAvailableVendors(filteredVendors);
      setSelectedVendor(null);
      setShowVendorModal(true);
    } catch (error) {
      console.error('Error checking item availability:', error);
      toast.error('Failed to check item availability');
    } finally {
      setLoading(false);
    }
  };

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
  };

  const handleVendorConfirm = async () => {
    if (!selectedVendor || !item) {
      toast.error('Please select a vendor');
      return;
    }

    try {
      setLoading(true);
      const itemWithVendor = {
        ...item,
        vendorId: selectedVendor._id
      };
      await addItemToCart(itemWithVendor, selectedVendor);
      setShowVendorModal(false);
      setSelectedVendor(null);
      setAvailableVendors([]);
      toast.success('Item added to cart!');
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast.error('Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  };

  const handleVendorCancel = () => {
    setShowVendorModal(false);
    setSelectedVendor(null);
    setAvailableVendors([]);
  };

  const handleIncreaseQuantity = async () => {
    if (!userId || !item) {
      toast.error('Please login to modify cart');
      return;
    }

    if (!cartItem) {
      handleAddToCart();
      return;
    }
    
    try {
      setLoading(true);
      const itemWithVendor = {
        ...item,
        vendorId: cartItem.vendorId
      };
      await increaseItemQuantity(itemWithVendor);
    } catch (error) {
      console.error('Error increasing quantity:', error);
      if (error instanceof Error) {
        if (error.message.includes("max quantity")) {
          toast.warning(`Maximum limit reached for ${item.title}`);
        } else if (error.message.includes("Only")) {
          toast.warning(`Only ${error.message.split("Only ")[1]} available for ${item.title}`);
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Failed to increase quantity');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDecreaseQuantity = async () => {
    if (!userId || !item || !cartItem) return;
    
    try {
      setLoading(true);
      const itemWithVendor = {
        ...item,
        vendorId: cartItem.vendorId
      };
      await decreaseItemQuantity(itemWithVendor);
    } catch (error) {
      console.error('Error decreasing quantity:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to decrease quantity');
      }
    } finally {
      setLoading(false);
    }
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (show) {
      // Save current scroll position
      scrollYRef.current = window.scrollY;
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Unlock body scroll when modal closes
        const scrollY = scrollYRef.current;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [show]);

  if (!show || !item) return null;

  return createPortal(
    <>
      <div 
        className={styles.itemDetailModalOverlay} 
        onClick={onClose}
        style={{ pointerEvents: showVendorModal ? 'none' : 'auto' }}
      >
        <div 
          className={styles.itemDetailModal} 
          onClick={(e) => e.stopPropagation()}
          style={{ pointerEvents: showVendorModal ? 'none' : 'auto' }}
        >
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <X size={20} />
          </button>
          
          <div className={styles.itemDetailImageContainer}>
            {item.image ? (
              <img src={item.image} alt={item.title} className={styles.itemDetailImage} />
            ) : null}
            {item.isSpecial === 'Y' && (
              <div className={styles.specialBadge}>
                <Sparkles size={16} />
                <span>Special Offer</span>
              </div>
            )}
            {item.isVeg !== undefined && (
              <div className={styles.vegIndicator}>
                <div className={item.isVeg ? styles.veg : styles.nonVeg}>
                  <Circle 
                    size={14} 
                    fill="currentColor" 
                    className={styles.vegIcon}
                  />
                  <span>{item.isVeg ? 'Veg' : 'Non-Veg'}</span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.itemDetailContent}>
            <h2 className={styles.itemDetailTitle}>{item.title}</h2>
            
            {/* Veg/Non-Veg Indicator - below the name */}
            {item.isVeg !== undefined && (
              <div className={styles.vegIndicatorBelowName}>
                <div className={item.isVeg ? styles.veg : styles.nonVeg}>
                  <Circle 
                    size={12} 
                    fill="currentColor" 
                    className={styles.vegIcon}
                  />
                  <span>{item.isVeg ? 'Veg' : 'Non-Veg'}</span>
                </div>
              </div>
            )}
            
            {(item.category || item.subtype) && (
              <p className={styles.itemDetailSubtitle}>
                {item.category}
                {item.subtype ? ` • ${item.subtype}` : ''}
              </p>
            )}

            {item.description && (
              <div className={styles.itemDetailDescription}>
                <p>{item.description}</p>
              </div>
            )}

            <div className={styles.itemDetailPrice}>
              <span className={styles.priceLabel}>Price:</span>
              <span className={styles.priceValue}>₹{item.price}</span>
            </div>

            {userId && (
              <div className={styles.itemDetailActions}>
                <div className={styles.quantityControls}>
                  <button
                    className={`${styles.quantityButton} ${quantity === 0 ? styles.disabled : ''}`}
                    onClick={handleDecreaseQuantity}
                    disabled={loading || quantity === 0}
                  >
                    <Minus size={16} />
                  </button>
                  <span className={styles.quantity}>{quantity}</span>
                  <button
                    className={styles.quantityButton}
                    onClick={handleIncreaseQuantity}
                    disabled={loading}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {quantity === 0 && (
                  <button
                    className={`${styles.addToCartButton} ${loading ? styles.loading : ''}`}
                    onClick={handleAddToCart}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className={styles.spinner} size={16} />
                        Adding...
                      </>
                    ) : (
                      'Add to Cart'
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <VendorModal
        show={showVendorModal}
        availableVendors={availableVendors}
        selectedVendor={selectedVendor}
        onVendorSelect={handleVendorSelect}
        onConfirm={handleVendorConfirm}
        onCancel={handleVendorCancel}
      />
    </>,
    document.body
  );
};

export default ItemDetailModal;

