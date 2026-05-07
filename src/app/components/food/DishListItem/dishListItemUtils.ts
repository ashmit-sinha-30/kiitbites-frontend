import { FoodItem } from "@/app/food/[slug]/types";

const DESCRIPTION_MAX_LENGTH = 100;

export const getDishDescription = (item: FoodItem) => {
  const description = item.description || "";
  const shouldTruncate = description.length > DESCRIPTION_MAX_LENGTH;

  return {
    description,
    shouldTruncate,
    truncatedDescription: shouldTruncate
      ? `${description.slice(0, DESCRIPTION_MAX_LENGTH)}...`
      : description,
  };
};

export const isDishInStock = (item: FoodItem) => {
  if (item.type === "retail") {
    return item.quantity !== undefined ? item.quantity > 0 : true;
  }

  return Boolean(item.isAvailable && item.isAvailable.toUpperCase() === "Y");
};
