import React, { useState } from 'react';
import Image from 'next/image';
import styles from './DishListItem.module.scss';
import { FoodItem } from '@/app/food/[slug]/types'; // Assuming types are exported here or similar path
import { getDishDescription, isDishInStock } from './dishListItemUtils';
import DishQuantityControls from './DishQuantityControls';

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

    const { description, shouldTruncate, truncatedDescription } = getDishDescription(item);
    const displayDescription = isExpanded || !shouldTruncate ? description : truncatedDescription;
    const inStock = isDishInStock(item);

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
                        <DishQuantityControls
                            item={item}
                            quantity={quantity}
                            isLoading={isLoading}
                            inStock={inStock}
                            onAdd={onAdd}
                            onIncrease={onIncrease}
                            onDecrease={onDecrease}
                        />
                    </div>
                </div>
            </div>
        </div >
    );
};

export default DishListItem;
