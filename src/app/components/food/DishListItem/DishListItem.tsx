import React, { useState } from 'react';
import Image from 'next/image';
import styles from './DishListItemV2.module.scss';
import { FoodItem } from '@/app/home/[slug]/types'; // Assuming types are exported here or similar path

interface DishListItemProps {
    item: FoodItem;
    quantity: number;
    isLoading?: boolean;
    onAdd: (item: FoodItem) => void;
    onIncrease: (item: FoodItem) => void;
    onDecrease: (item: FoodItem) => void;
}

const DishListItem: React.FC<DishListItemProps> = ({
    item,
    quantity,
    isLoading = false,
    onAdd,
    onIncrease,
    onDecrease,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Truncate description logic
    const description = item.description || "";
    const MAX_LENGTH = 100;
    const shouldTruncate = description.length > MAX_LENGTH;
    const displayDescription = isExpanded || !shouldTruncate
        ? description
        : `${description.slice(0, MAX_LENGTH)}...`;

    // Stock logic
    // If retail, check item.quantity. If produce, check item.isAvailable.
    // Actually the data structure for availability might vary, using what I saw in code.
    // Retail: quantity > 0. Produce: isAvailable === 'Y'.
    const inStock = item.type === 'retail'
        ? (item.quantity !== undefined ? item.quantity > 0 : true)
        : (item.isAvailable && item.isAvailable.toUpperCase() === 'Y');

    return (
        <div className={styles.dishListItem}>
            <div className={styles.leftSection}>
                <div className={styles.imageContainer}>
                    <Image
                        src={item.image || '/images/placeholder_food.jpg'}
                        alt={item.title}
                        fill
                        style={{ objectFit: 'cover' }}
                    />
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.header}>
                    <div className={styles.titleRow}>
                        <div className={`${styles.vegIndicator} ${item.isVeg ? styles.veg : styles.nonVeg}`}>
                            <div className={styles.dot}></div>
                        </div>
                        <h3 className={styles.title}>{item.title}</h3>
                    </div>
                    {inStock ? (
                        <span className={styles.stockBadge}>In Stock</span>
                    ) : (
                        <span className={`${styles.stockBadge} ${styles.outOfStock}`}>Out of Stock</span>
                    )}
                </div>
                <div className={styles.price}>₹ {item.price}</div>

                <p className={styles.description}>
                    {displayDescription}
                    {shouldTruncate && (
                        <button
                            className={styles.readMoreBtn}
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        >
                            {isExpanded ? "Read Less" : "Read More"}
                        </button>
                    )}
                </p>

                <div className={styles.footer}>
                    <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                        {isLoading ? (
                            <div className={styles.loader}></div>
                        ) : quantity > 0 ? (
                            <div className={styles.quantityControls}>
                                <button className={`${styles.qtyBtn} ${styles.decrease}`} onClick={() => onDecrease(item)}>-</button>
                                <span className={styles.qtyValue}>{quantity}</span>
                                <button className={`${styles.qtyBtn} ${styles.increase}`} onClick={() => onIncrease(item)}>+</button>
                            </div>
                        ) : (
                            <button
                                className={styles.addBtn}
                                onClick={() => onAdd(item)}
                                disabled={!inStock}
                                style={{ opacity: inStock ? 1 : 0.5, cursor: inStock ? 'pointer' : 'not-allowed' }}
                            >
                                Add +
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DishListItem;
