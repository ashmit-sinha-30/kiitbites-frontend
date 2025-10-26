"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import styles from "../styles/UniversityRecipes.module.scss";

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

interface Instruction {
  step: number;
  description: string;
  duration?: number;
  temperature?: string;
  notes?: string;
}

interface Recipe {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  category: string;
  cuisine: string;
  difficulty: string;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: Instruction[];
  images?: Array<{
    url: string;
    alt?: string;
    isPrimary?: boolean;
  }>;
  tags?: string[];
  tips?: string[];
  variations?: string[];
  allergens?: string[];
  dietaryRestrictions?: string[];
  estimatedCost?: number;
  costPerServing?: number;
  status: 'draft' | 'published' | 'archived';
  views: number;
  likes: number;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  vendorId: {
    _id: string;
    fullName: string;
    vendorName?: string;
  };
  uniId: {
    _id: string;
    fullName: string;
  };
}

interface UniversityRecipesProps {
  universityId?: string;
}

const CATEGORIES = [
  'appetizer', 'main_course', 'dessert', 'beverage', 'snack',
  'breakfast', 'lunch', 'dinner', 'soup', 'salad', 'side_dish',
  'sauce', 'condiment', 'bread', 'pasta', 'rice', 'other'
];

const CUISINES = [
  'indian', 'chinese', 'italian', 'mexican', 'thai', 'japanese',
  'korean', 'american', 'mediterranean', 'french', 'german',
  'spanish', 'middle_eastern', 'continental', 'fusion', 'other'
];

const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];

export default function UniversityRecipes({ }: UniversityRecipesProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [vendors, setVendors] = useState<Array<{_id: string, fullName: string, vendorName?: string}>>([]);
  const [sortBy, setSortBy] = useState("newest");
  const { toast } = useToast();

  const fetchRecipes = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      
      let url = `${backendUrl}/api/recipes/university`;
      const params = new URLSearchParams();
      params.append("status", "published"); // Only show published recipes
      if (categoryFilter) params.append("category", categoryFilter);
      if (cuisineFilter) params.append("cuisine", cuisineFilter);
      if (vendorFilter) params.append("vendorId", vendorFilter);
      if (searchTerm) params.append("search", searchTerm);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success) {
          let filteredRecipes = json.data;
          
          // Apply difficulty filter
          if (difficultyFilter) {
            filteredRecipes = filteredRecipes.filter((recipe: Recipe) => 
              recipe.difficulty === difficultyFilter
            );
          }
          
          // Apply sorting
          switch (sortBy) {
            case "newest":
              filteredRecipes.sort((a: Recipe, b: Recipe) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              break;
            case "oldest":
              filteredRecipes.sort((a: Recipe, b: Recipe) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );
              break;
            case "most_viewed":
              filteredRecipes.sort((a: Recipe, b: Recipe) => b.views - a.views);
              break;
            case "most_liked":
              filteredRecipes.sort((a: Recipe, b: Recipe) => b.likes - a.likes);
              break;
            case "highest_rated":
              filteredRecipes.sort((a: Recipe, b: Recipe) => b.averageRating - a.averageRating);
              break;
            case "prep_time":
              filteredRecipes.sort((a: Recipe, b: Recipe) => a.prepTime - b.prepTime);
              break;
            case "cook_time":
              filteredRecipes.sort((a: Recipe, b: Recipe) => a.cookTime - b.cookTime);
              break;
          }
          
          setRecipes(filteredRecipes);
        }
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch recipes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, cuisineFilter, difficultyFilter, vendorFilter, searchTerm, sortBy, toast]);

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem("token");
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      
      const response = await fetch(`${backendUrl}/api/recipes/university?vendorId=all`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success) {
          // Extract unique vendors from recipes
          const vendorMap = new Map();
          json.data.forEach((recipe: Recipe) => {
            if (!vendorMap.has(recipe.vendorId._id)) {
              vendorMap.set(recipe.vendorId._id, recipe.vendorId);
            }
          });
          setVendors(Array.from(vendorMap.values()));
        }
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  useEffect(() => {
    fetchRecipes();
    fetchVendors();
  }, [fetchRecipes]);

  const handleLikeRecipe = async (recipeId: string) => {
    try {
      const token = localStorage.getItem("token");
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

      const response = await fetch(`${backendUrl}/api/recipes/public/${recipeId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "like" })
      });

      const json = await response.json();

      if (json.success) {
        // Update the recipe in the list
        setRecipes(prev => prev.map(recipe => 
          recipe._id === recipeId 
            ? { ...recipe, likes: recipe.likes + 1 }
            : recipe
        ));
        
        // Update the viewing recipe if it's the same one
        if (viewingRecipe && viewingRecipe._id === recipeId) {
          setViewingRecipe(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
        }
      }
    } catch (error) {
      console.error("Error liking recipe:", error);
      toast({
        title: "Error",
        description: "Failed to like recipe",
        variant: "destructive"
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "#10b981";
      case "medium": return "#f59e0b";
      case "hard": return "#ef4444";
      case "expert": return "#dc2626";
      default: return "#6b7280";
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setCuisineFilter("");
    setDifficultyFilter("");
    setVendorFilter("");
    setSortBy("newest");
  };

  if (loading) {
    return <div className={styles.loading}>Loading recipes...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Recipe Collection</h2>
        <p>Discover delicious recipes from our vendors</p>
      </div>

      {/* Filters and Search */}
      <div className={styles.filtersSection}>
        <div className={styles.searchRow}>
          <input
            type="text"
            placeholder="Search recipes by name, description, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <button onClick={clearFilters} className={styles.clearButton}>
            Clear Filters
          </button>
        </div>
        
        <div className={styles.filtersRow}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
          
          <select
            value={cuisineFilter}
            onChange={(e) => setCuisineFilter(e.target.value)}
          >
            <option value="">All Cuisines</option>
            {CUISINES.map(cuisine => (
              <option key={cuisine} value={cuisine}>{cuisine.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
          
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            <option value="">All Difficulties</option>
            {DIFFICULTIES.map(diff => (
              <option key={diff} value={diff}>{diff.toUpperCase()}</option>
            ))}
          </select>
          
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
          >
            <option value="">All Vendors</option>
            {vendors.map(vendor => (
              <option key={vendor._id} value={vendor._id}>
                {vendor.vendorName || vendor.fullName}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="most_viewed">Most Viewed</option>
            <option value="most_liked">Most Liked</option>
            <option value="highest_rated">Highest Rated</option>
            <option value="prep_time">Prep Time (Low to High)</option>
            <option value="cook_time">Cook Time (Low to High)</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className={styles.resultsSummary}>
        <p>Found {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Recipes Grid */}
      {recipes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No recipes found matching your criteria.</p>
          <button onClick={clearFilters} className={styles.clearFiltersButton}>
            Clear all filters
          </button>
        </div>
      ) : (
        <div className={styles.recipesGrid}>
          {recipes.map((recipe) => (
            <div key={recipe._id} className={styles.recipeCard}>
              <div className={styles.cardHeader}>
                <h3>{recipe.title}</h3>
                <div className={styles.badges}>
                  <span 
                    className={styles.badge}
                    style={{ backgroundColor: getDifficultyColor(recipe.difficulty) }}
                  >
                    {recipe.difficulty.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className={styles.vendorInfo}>
                <span className={styles.vendorName}>
                  By: {recipe.vendorId.vendorName || recipe.vendorId.fullName}
                </span>
              </div>
              
              <p className={styles.description}>
                {recipe.shortDescription || recipe.description}
              </p>
              
              <div className={styles.meta}>
                <div className={styles.timeInfo}>
                  <span>Prep: {formatTime(recipe.prepTime)}</span>
                  <span>Cook: {formatTime(recipe.cookTime)}</span>
                  <span>Serves: {recipe.servings}</span>
                </div>
                <div className={styles.stats}>
                  <span>👁️ {recipe.views}</span>
                  <span>❤️ {recipe.likes}</span>
                  <span>⭐ {recipe.averageRating.toFixed(1)}</span>
                </div>
              </div>
              
              <div className={styles.tags}>
                <span className={styles.categoryTag}>
                  {recipe.category.replace('_', ' ').toUpperCase()}
                </span>
                <span className={styles.cuisineTag}>
                  {recipe.cuisine.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              <div className={styles.actions}>
                <button 
                  onClick={() => setViewingRecipe(recipe)}
                  className={styles.viewButton}
                >
                  View Recipe
                </button>
                <button 
                  onClick={() => handleLikeRecipe(recipe._id)}
                  className={styles.likeButton}
                >
                  ❤️ {recipe.likes}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Recipe Modal */}
      {viewingRecipe && (
        <div className={styles.modal} onClick={() => setViewingRecipe(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{viewingRecipe.title}</h3>
              <button 
                onClick={() => setViewingRecipe(null)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.recipeDetails}>
              <div className={styles.recipeMeta}>
                <div className={styles.metaRow}>
                  <span><strong>Vendor:</strong> {viewingRecipe.vendorId.vendorName || viewingRecipe.vendorId.fullName}</span>
                  <span><strong>Category:</strong> {viewingRecipe.category.replace('_', ' ').toUpperCase()}</span>
                  <span><strong>Cuisine:</strong> {viewingRecipe.cuisine.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div className={styles.metaRow}>
                  <span><strong>Difficulty:</strong> {viewingRecipe.difficulty.toUpperCase()}</span>
                  <span><strong>Prep Time:</strong> {formatTime(viewingRecipe.prepTime)}</span>
                  <span><strong>Cook Time:</strong> {formatTime(viewingRecipe.cookTime)}</span>
                  <span><strong>Total Time:</strong> {formatTime(viewingRecipe.totalTime)}</span>
                </div>
                <div className={styles.metaRow}>
                  <span><strong>Servings:</strong> {viewingRecipe.servings}</span>
                  <span><strong>Views:</strong> {viewingRecipe.views}</span>
                  <span><strong>Likes:</strong> {viewingRecipe.likes}</span>
                  <span><strong>Rating:</strong> {viewingRecipe.averageRating.toFixed(1)}/5</span>
                </div>
              </div>

              <div className={styles.recipeDescription}>
                <h4>Description</h4>
                <p>{viewingRecipe.description}</p>
              </div>

              <div className={styles.ingredientsList}>
                <h4>Ingredients</h4>
                <div className={styles.ingredientsGrid}>
                  {viewingRecipe.ingredients.map((ingredient, index) => (
                    <div key={index} className={styles.ingredientItem}>
                      <span className={styles.quantity}>{ingredient.quantity} {ingredient.unit}</span>
                      <span className={styles.name}>{ingredient.name}</span>
                      {ingredient.notes && <span className={styles.notes}>{ingredient.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.instructionsList}>
                <h4>Instructions</h4>
                <div className={styles.instructionsSteps}>
                  {viewingRecipe.instructions.map((instruction, index) => (
                    <div key={index} className={styles.instructionStep}>
                      <div className={styles.stepNumber}>Step {instruction.step}</div>
                      <div className={styles.stepContent}>
                        <p>{instruction.description}</p>
                        {(instruction.duration || instruction.temperature || instruction.notes) && (
                          <div className={styles.instructionMeta}>
                            {instruction.duration && <span>⏱️ {instruction.duration} minutes</span>}
                            {instruction.temperature && <span>🌡️ {instruction.temperature}</span>}
                            {instruction.notes && <span>📝 {instruction.notes}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {viewingRecipe.tags && viewingRecipe.tags.length > 0 && (
                <div className={styles.tags}>
                  <h4>Tags</h4>
                  <div className={styles.tagList}>
                    {viewingRecipe.tags.map((tag, index) => (
                      <span key={index} className={styles.tag}>#{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {viewingRecipe.tips && viewingRecipe.tips.length > 0 && (
                <div className={styles.tips}>
                  <h4>💡 Tips</h4>
                  <ul>
                    {viewingRecipe.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {viewingRecipe.variations && viewingRecipe.variations.length > 0 && (
                <div className={styles.variations}>
                  <h4>🔄 Variations</h4>
                  <ul>
                    {viewingRecipe.variations.map((variation, index) => (
                      <li key={index}>{variation}</li>
                    ))}
                  </ul>
                </div>
              )}

              {viewingRecipe.allergens && viewingRecipe.allergens.length > 0 && (
                <div className={styles.allergens}>
                  <h4>⚠️ Allergens</h4>
                  <div className={styles.allergenList}>
                    {viewingRecipe.allergens.map((allergen, index) => (
                      <span key={index} className={styles.allergen}>{allergen}</span>
                    ))}
                  </div>
                </div>
              )}

              {viewingRecipe.dietaryRestrictions && viewingRecipe.dietaryRestrictions.length > 0 && (
                <div className={styles.dietary}>
                  <h4>🥗 Dietary</h4>
                  <div className={styles.dietaryList}>
                    {viewingRecipe.dietaryRestrictions.map((restriction, index) => (
                      <span key={index} className={styles.dietaryTag}>{restriction}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                onClick={() => handleLikeRecipe(viewingRecipe._id)}
                className={styles.likeButton}
              >
                ❤️ Like Recipe
              </button>
              <button
                onClick={() => setViewingRecipe(null)}
                className={styles.closeButton}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
