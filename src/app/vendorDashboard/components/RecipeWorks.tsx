"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/utils/apiUtils";
import { useToast } from "@/hooks/use-toast";
import styles from "../styles/RecipeWorks.module.scss";

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

interface Recipe {
  _id: string;
  title: string;
  description: string;
  servings: number;
  ingredients: Ingredient[];
  outputType: 'retail' | 'produce';
  outputItemId: string;
  outputName?: string;
}

interface RawMaterial {
  itemId: string;
  name: string;
  openingAmount?: number;
  closingAmount: number;
  unit: string;
}

interface CalculatedIngredient extends Ingredient {
  requiredQty: number;
  available: number;
  sufficient: boolean;
  unit: string;
}

interface ApiRawItem {
  itemId?: string;
  _id?: string;
  name: string;
  openingAmount?: number;
  closingAmount: number;
  unit: string;
}


const RecipeWorks: React.FC = () => {
  const { toast } = useToast();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [mode, setMode] = useState<'quantity' | 'amount'>('quantity');
  const [loading, setLoading] = useState(false);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [calculatedIngredients, setCalculatedIngredients] = useState<CalculatedIngredient[]>([]);




  const fetchRecipes = useCallback(async () => {
    try {
      const response = await api.get(`/inventory/recipe-works/recipes`);

      if (response.status === 200) {
        const json = response.data;
        if (json.success) {
          // Combine retail and produce recipes
          const allRecipes = [...(json.data.retail || []), ...(json.data.produce || [])];
          setRecipes(allRecipes);
        }
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch recipes",
        variant: "destructive"
      });
    }
  }, [toast]);

  const fetchRawMaterials = useCallback(async () => {
    try {
      if (!vendorId) return;

      const response = await api.get(`/api/item/getvendors/${vendorId}/raw`);

      if (response.status === 200) {
        const json = response.data;
        if (json.success && json.data) {
          const rawItems = (json.data.rawItems || []).map((item: ApiRawItem) => ({
            itemId: item.itemId || item._id,
            name: item.name,
            openingAmount: item.openingAmount,
            closingAmount: item.closingAmount,
            unit: item.unit
          }));
          setRawMaterials(rawItems);
        }
      }
    } catch (error) {
      console.error("Error fetching raw materials:", error);
    }
  }, [vendorId]);

  useEffect(() => {
    // Get vendorId from localStorage
    const storedVendorId = localStorage.getItem("vendorId");
    if (storedVendorId) {
      setVendorId(storedVendorId);
    } else {
      // Try to get from token
      api.get(`/api/vendor/auth/user`)
        .then(response => {
          const user = response.data;
          const id = user._id || user.id;
          setVendorId(id);
          localStorage.setItem("vendorId", id);
        })
        .catch(err => console.error("Error fetching user:", err));
    }
  }, []);

  useEffect(() => {
    if (vendorId) {
      fetchRecipes();
      fetchRawMaterials();
    }
  }, [vendorId, fetchRecipes, fetchRawMaterials]);

  const calculateIngredients = useCallback(() => {
    if (!selectedRecipe) return;

    const multiplier = quantity / selectedRecipe.servings;
    const normalizeUnit = (unit: string) => unit.trim().toLowerCase();
    const unitAliasToCanonical: Record<string, string> = {
      // Mass
      g: "g", gram: "g", grams: "g",
      kg: "kg", kilogram: "kg", kilograms: "kg",
      oz: "oz", ounce: "oz", ounces: "oz",
      lb: "lb", lbs: "lb", pound: "lb", pounds: "lb",
      // Volume
      ml: "ml", milliliter: "ml", milliliters: "ml",
      l: "l", liter: "l", liters: "l",
      cup: "cup", cups: "cup",
      tbsp: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp",
      tsp: "tsp", teaspoon: "tsp", teaspoons: "tsp",
      // Count-based (no cross-conversion)
      piece: "piece", pieces: "piece",
      slice: "slice", slices: "slice",
      clove: "clove", cloves: "clove",
      pinch: "pinch", dashes: "dash", dash: "dash",
      handful: "handful", handfuls: "handful",
      bunch: "bunch", bunches: "bunch",
      packet: "packet", packets: "packet",
      can: "can", cans: "can",
      bottle: "bottle", bottles: "bottle",
    };
    const canonicalize = (unit: string) => unitAliasToCanonical[normalizeUnit(unit)] || normalizeUnit(unit);
    const unitCategory: Record<string, 'mass' | 'volume' | 'count' | 'unknown'> = {
      // mass
      g: 'mass', kg: 'mass', oz: 'mass', lb: 'mass',
      // volume
      ml: 'volume', l: 'volume', cup: 'volume', tbsp: 'volume', tsp: 'volume',
      // count
      piece: 'count', slice: 'count', clove: 'count', pinch: 'count', dash: 'count', handful: 'count', bunch: 'count', packet: 'count', can: 'count', bottle: 'count',
    };
    const massToGrams: Record<string, number> = { g: 1, kg: 1000, oz: 28.3495, lb: 453.59237 };
    const volumeToMilli: Record<string, number> = { ml: 1, l: 1000, cup: 240, tbsp: 15, tsp: 5 };

    const canConvert = (fromU: string, toU: string) => {
      const f = canonicalize(fromU);
      const t = canonicalize(toU);
      const fCat = unitCategory[f] || 'unknown';
      const tCat = unitCategory[t] || 'unknown';
      if (fCat !== tCat) return false;
      if (fCat === 'mass' || fCat === 'volume') return true;
      // For count, only allow if exactly the same unit
      if (fCat === 'count') return f === t;
      return false;
    };

    const convertQuantity = (qty: number, fromUnit: string, toUnit: string) => {
      const f = canonicalize(fromUnit);
      const t = canonicalize(toUnit);
      if (f === t) return qty;
      const fCat = unitCategory[f] || 'unknown';
      const tCat = unitCategory[t] || 'unknown';
      if (fCat !== tCat) return qty; // cannot convert across categories
      if (fCat === 'mass') {
        const grams = qty * (massToGrams[f] || 1);
        return grams / (massToGrams[t] || 1);
      }
      if (fCat === 'volume') {
        const ml = qty * (volumeToMilli[f] || 1);
        return ml / (volumeToMilli[t] || 1);
      }
      // count or unknown: no conversion
      return qty;
    };

    const normalizeName = (name: string) => name.trim().toLowerCase();
    const calculated: CalculatedIngredient[] = selectedRecipe.ingredients.map(ing => {
      const baseRequiredQty = ing.quantity * multiplier;
      const rawMat = rawMaterials.find(rm => normalizeName(rm.name) === normalizeName(ing.name));
      const targetUnit = rawMat?.unit || ing.unit;
      const canConv = rawMat ? canConvert(ing.unit, targetUnit) : false;
      const requiredInTargetUnit = canConv ? convertQuantity(baseRequiredQty, ing.unit, targetUnit) : baseRequiredQty;
      // Prefer closingAmount when > 0, otherwise fall back to openingAmount if present
      const rawAvailable = rawMat ? (rawMat.closingAmount > 0 ? rawMat.closingAmount : (rawMat.openingAmount ?? 0)) : 0;
      const availableInTargetUnit = rawAvailable;

      return {
        ...ing,
        requiredQty: requiredInTargetUnit,
        available: availableInTargetUnit,
        unit: canConv ? targetUnit : ing.unit,
        sufficient: rawMat ? (canConv ? availableInTargetUnit >= requiredInTargetUnit : false) : false
      };
    });

    setCalculatedIngredients(calculated);
  }, [selectedRecipe, quantity, rawMaterials]);

  useEffect(() => {
    if (selectedRecipe && quantity > 0) {
      calculateIngredients();
    }
  }, [selectedRecipe, quantity, calculateIngredients]);

  // Recalculate when raw materials load/update
  useEffect(() => {
    if (selectedRecipe && quantity > 0) {
      calculateIngredients();
    }
  }, [rawMaterials, calculateIngredients, selectedRecipe, quantity]);

  const handleCreateItems = async () => {
    if (!selectedRecipe) {
      toast({
        title: "Error",
        description: "Please select a recipe first",
        variant: "destructive"
      });
      return;
    }

    if (quantity <= 0) {
      toast({
        title: "Error",
        description: "Quantity must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    // Check if all ingredients are sufficient
    const insufficientIngredients = calculatedIngredients.filter(ing => !ing.sufficient);
    if (insufficientIngredients.length > 0) {
      toast({
        title: "Insufficient Raw Materials",
        description: `Cannot create items. Missing: ${insufficientIngredients.map(i => i.name).join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    if (!vendorId) {
      toast({
        title: "Error",
        description: "Vendor ID not found",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      let response;
      const normalizeName = (name: string) => name.trim().toLowerCase();
      const rawUsages = calculatedIngredients.map(ing => {
        const rm = rawMaterials.find(r => normalizeName(r.name) === normalizeName(ing.name));
        return rm ? { rawItemId: rm.itemId, quantity: ing.requiredQty, unit: rm.unit } : null;
      }).filter(Boolean);

      if (selectedRecipe.outputType === 'retail') {
        response = await api.post(`/inventory/produce-retail-simple`, {
          vendorId,
          quantity,
          outputRetailItemId: selectedRecipe.outputItemId,
          outputName: selectedRecipe.title,
          rawUsages
        });
      } else {
        // Produce: only deduct raw, do not change produce inventory
        response = await api.post(`/inventory/produce-produce-simple`, {
          vendorId,
          rawUsages,
          outputProduceItemId: selectedRecipe.outputItemId,
          outputName: selectedRecipe.title
        });
      }

      const json = response.data;

      if (response.status === 200 && json?.success) {
        toast({
          title: "Success",
          description: json.message || "Items created successfully"
        });
        setQuantity(1);
        setSelectedRecipe(null);
        setCalculatedIngredients([]);
        fetchRawMaterials(); // Refresh raw materials
      } else {
        toast({
          title: "Error",
          description: (json && json.message) ? json.message : `Failed to create items (${response.status})`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating items:", error);
      toast({
        title: "Error",
        description: "Failed to create items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const retailRecipes = recipes.filter(r => r.outputType === 'retail');
  const produceRecipes = recipes.filter(r => r.outputType === 'produce');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Recipe Works</h2>
        <p>Create retail/produce items from your recipes</p>
      </div>

      <div className={styles.content}>
        {/* Recipe Selection */}
        <div className={styles.section}>
          <h3>Select Recipe</h3>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${mode === 'quantity' ? styles.active : ''}`}
              onClick={() => {
                setMode('quantity');
                setQuantity(1);
              }}
            >
              By Quantity
            </button>
            <button
              className={`${styles.tab} ${mode === 'amount' ? styles.active : ''}`}
              onClick={() => {
                setMode('amount');
                setQuantity(1);
              }}
              disabled={selectedRecipe?.outputType === 'produce'}
            >
              By Amount
            </button>
          </div>

          {/* Retail Recipes */}
          <div className={styles.recipeGroup}>
            <h4>Retail Items</h4>
            <div className={styles.recipeGrid}>
              {retailRecipes.map(recipe => (
                <div
                  key={recipe._id}
                  className={`${styles.recipeCard} ${selectedRecipe?._id === recipe._id ? styles.selected : ''}`}
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <h5>{recipe.title}</h5>
                  <p>{recipe.description}</p>
                  <div className={styles.recipeMeta}>
                    <span>Serves: {recipe.servings}</span>
                    <span>Ingredients: {recipe.ingredients.length}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Produce Recipes */}
          <div className={styles.recipeGroup}>
            <h4>Produce Items</h4>
            <div className={styles.recipeGrid}>
              {produceRecipes.map(recipe => (
                <div
                  key={recipe._id}
                  className={`${styles.recipeCard} ${selectedRecipe?._id === recipe._id ? styles.selected : ''}`}
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <h5>{recipe.title}</h5>
                  <p>{recipe.description}</p>
                  <div className={styles.recipeMeta}>
                    <span>Serves: {recipe.servings}</span>
                    <span>Ingredients: {recipe.ingredients.length}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quantity Input */}
        {selectedRecipe && mode === 'quantity' && (
          <div className={styles.section}>
            <h3>Production Details</h3>
            <div className={styles.inputGroup}>
              <label>
                {selectedRecipe.outputType === 'retail' ? 'Items to Produce' : 'Servings to Prepare'}
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className={styles.input}
              />
            </div>
          </div>
        )}

        {/* Ingredients Required */}
        {selectedRecipe && calculatedIngredients.length > 0 && (
          <div className={styles.section}>
            <h3>Ingredients Required</h3>
            <div className={styles.ingredientsList}>
              {calculatedIngredients.map((ing, index) => (
                <div key={index} className={`${styles.ingredientItem} ${ing.sufficient ? '' : styles.insufficient}`}>
                  <div className={styles.ingredientInfo}>
                    <span className={styles.ingredientName}>{ing.name}</span>
                    <span className={styles.ingredientQuantity}>
                      Required: {ing.requiredQty.toFixed(2)} {ing.unit}
                    </span>
                  </div>
                  <div className={styles.availability}>
                    Available: {ing.available.toFixed(2)} {ing.unit}
                    {ing.sufficient ? ' ✓' : ' ✗'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Button */}
        {selectedRecipe && (
          <div className={styles.actions}>
            <button
              onClick={handleCreateItems}
              disabled={loading || calculatedIngredients.some(ing => !ing.sufficient)}
              className={styles.createButton}
            >
              {loading ? 'Creating...' : `Create ${quantity} ${selectedRecipe.outputType === 'retail' ? 'Item(s)' : 'Serving(s)'}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeWorks;
