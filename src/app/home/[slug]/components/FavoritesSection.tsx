import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import styles from "../styles/CollegePage.module.scss";
import { FavoriteItem, FoodItem } from "../types";
import DishListItem from "@/app/components/food/DishListItem/DishListItemV2";

interface FavoritesSectionProps {
  favoriteItems: FavoriteItem[];
  convertFavoriteToFoodItem: (item: FavoriteItem) => FoodItem;
  userId?: string | null;
  categories?: { retail: string[]; produce: string[] };
  onAdd: (item: FoodItem) => void;
  onIncrease: (item: FoodItem) => void;
  onDecrease: (item: FoodItem) => void;
  getCartItemQuantity: (itemId: string) => number;
  loadingItemId: string | null;
}

const FavoritesSection = ({
  favoriteItems,
  convertFavoriteToFoodItem,
  onAdd,
  onIncrease,
  onDecrease,
  getCartItemQuantity,
  loadingItemId,
}: FavoritesSectionProps) => {
  const [showAll, setShowAll] = useState(false);

  if (!favoriteItems || favoriteItems.length === 0) return null;

  const displayedItems = showAll ? favoriteItems : favoriteItems.slice(0, 6);
  const hasMore = favoriteItems.length > 6;

  return (
    <section className={styles.favoritesSectionTransparent}>
      <div className={styles.categoryHeader}>
        <div className={styles.categoryTitleWithIcon}>
          <h2 className={styles.sectionTitle}>Your Favorites</h2>
        </div>
      </div>

      <div className={styles.favoritesItemsList}>
        <div className={styles.itemsGrid}>
          {displayedItems.map((item) => {
            const foodItem = convertFavoriteToFoodItem(item);
            return (
              <DishListItem
                key={item._id}
                item={foodItem}
                quantity={getCartItemQuantity(foodItem.id)}
                isLoading={loadingItemId === foodItem.id}
                onAdd={onAdd}
                onIncrease={onIncrease}
                onDecrease={onDecrease}
              />
            );
          })}
        </div>

        {hasMore && (
          <div className={styles.showMoreContainer}>
            <button
              className={styles.showMoreBtn}
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>
                  Show Less <ChevronUp size={20} />
                </>
              ) : (
                <>
                  Show More <ChevronDown size={20} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default FavoritesSection;
