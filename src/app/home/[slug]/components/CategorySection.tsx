import { useRef, useState } from "react";
import Slider, { Settings } from "react-slick";
import styles from "../styles/CollegePage.module.scss";
import { FoodItem } from "../types";
import ProductCard from "./ProductCard";

interface CategorySectionProps {
  categoryItems: FoodItem[];
  categoryTitle: string;
  sliderSettings: Settings;
  userId?: string | null;
  categories?: { retail: string[]; produce: string[] };
  hideTitle?: boolean;
}

const CategorySection = ({
  categoryItems,
  categoryTitle,
  sliderSettings,
  userId,
  categories,
  hideTitle = false,
}: CategorySectionProps) => {
  const sliderRef = useRef<Slider>(null);
  const [isPaused, setIsPaused] = useState(false);

  if (!categoryItems || categoryItems.length === 0) return null;

  const handleModalOpen = () => {
    setIsPaused(true);
    if (sliderRef.current) {
      sliderRef.current.slickPause();
    }
  };

  const handleModalClose = () => {
    setIsPaused(false);
    if (sliderRef.current) {
      sliderRef.current.slickPlay();
    }
  };

  // Update slider settings to include ref and pause state
  const updatedSliderSettings = {
    ...sliderSettings,
    autoplay: !isPaused && sliderSettings.autoplay,
  };

  return (
    <section className={styles.categorySection}>
      {!hideTitle && (
        <div className={styles.categoryHeader}>
          <h3 className={styles.categoryTitle}>
            {categoryTitle
              .replace(/-/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
          </h3>
          <span className={styles.itemCount}>({categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'})</span>
        </div>
      )}
      <div className={styles.carouselContainer}>
        <Slider ref={sliderRef} {...updatedSliderSettings} className={styles.slider}>
          {categoryItems.map((item) => (
            <ProductCard 
              key={item.id} 
              item={item} 
              categories={categories} 
              userId={userId}
              onModalOpen={handleModalOpen}
              onModalClose={handleModalClose}
            />
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default CategorySection; 