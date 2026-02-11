import Slider, { Settings } from "react-slick";
import { Sparkles } from "lucide-react";
import styles from "../styles/CollegePage.module.scss";
import ProductCard from "./ProductCard";
import { useEffect, useState } from 'react';
import { FoodItem } from '../types';

interface SpecialOffersSectionProps {
  allItems: FoodItem[];
  sliderSettings: Settings;
  userId?: string | null;
  categories?: { retail: string[]; produce: string[] };
}

const SpecialOffersSection = ({ allItems, sliderSettings, userId, categories }: SpecialOffersSectionProps) => {
  const [specials, setSpecials] = useState<FoodItem[]>([]);

  useEffect(() => {
    if (!allItems) return;
    // Filter for specials
    const filtered = allItems.filter(item => item.isSpecial === 'Y');
    setSpecials(filtered);
  }, [allItems]);

  if (!specials || specials.length === 0) return null;

  return (
    <section className={styles.categorySection}>
      <div className={styles.categoryHeader}>
        <div className={styles.categoryTitleWithIcon}>
          <Sparkles className={styles.categoryIcon} size={24} fill="#4ea199" color="#4ea199" />
          <h3 className={styles.categoryTitle}>Special Offers</h3>
        </div>
      </div>
      <div className={styles.carouselContainer}>
        <Slider {...sliderSettings} className={styles.slider}>
          {specials.filter(item => item.isSpecial && item.isSpecial === 'Y').map((item) => (
            <div key={item.id + '-' + (item.vendorId || '')}>
              <ProductCard
                item={item}
                categories={categories}
                userId={userId}
              />
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default SpecialOffersSection; 