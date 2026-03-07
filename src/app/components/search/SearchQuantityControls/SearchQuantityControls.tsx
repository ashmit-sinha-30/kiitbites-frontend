"use client";
import { useState } from "react";
import { Plus, Minus, Loader2 } from 'lucide-react';
import { useSearchCart } from '../../context/SearchCartContext';
import styles from './SearchQuantityControls.module.scss';
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";

interface SearchQuantityControlsProps {
  item: {
    id: string;
    name: string;
    type: string;
    vendorId?: string;
  };
  quantity: number;
  onAddToCart: () => void;
}

const SearchQuantityControls: React.FC<SearchQuantityControlsProps> = ({
  item,
  quantity,
  onAddToCart,
}) => {
  const { increaseSearchCartQuantity, decreaseSearchCartQuantity } = useSearchCart();
  const [loading, setLoading] = useState(false);


  const handleIncrease = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.vendorId) {
      toast.error('Please select a vendor first');
      return;
    }
    try {
      setLoading(true);
      await increaseSearchCartQuantity(item.id);
    } catch (error) {
      console.error('Error increasing quantity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrease = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.vendorId) {
      toast.error('Please select a vendor first');
      return;
    }
    try {
      setLoading(true);
      await decreaseSearchCartQuantity(item.id);
    } catch (error) {
      console.error('Error decreasing quantity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (quantity > 0) {
    return (
      <div className={styles.quantityControls}>
        <button
          className={styles.quantityButton}
          onClick={handleDecrease}
          disabled={loading}
        >
          <Minus size={16} />
        </button>
        <span className={styles.quantity}>{quantity}</span>
        <button
          className={styles.quantityButton}
          onClick={handleIncrease}
          disabled={loading}
        >
          <Plus size={16} />
        </button>
      </div>
    );
  }

  return (
    <button
      className={`${styles.addToCartButton} ${loading ? styles.loading : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onAddToCart();
      }}
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
  );
};

export default SearchQuantityControls; 