"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import styles from "../styles/VendorRecipes.module.scss";

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
  outputType?: 'retail' | 'produce' | null;
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

interface VendorRecipesProps {
  vendorId?: string;
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

const UNITS = [
  'grams', 'kg', 'ml', 'liters', 'cups', 'tablespoons', 'teaspoons',
  'pieces', 'slices', 'cloves', 'pinch', 'dash', 'handful', 'bunch',
  'packet', 'can', 'bottle', 'tbsp', 'tsp', 'oz', 'lb', 'pound'
];

export default function VendorRecipes({ }: VendorRecipesProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("");
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    shortDescription: "",
    category: "",
    cuisine: "",
    difficulty: "",
    prepTime: 0,
    cookTime: 0,
    servings: 1,
    ingredients: [] as Ingredient[],
    instructions: [] as Instruction[],
    tags: [] as string[],
    tips: [] as string[],
    variations: [] as string[],
    allergens: [] as string[],
    dietaryRestrictions: [] as string[],
    estimatedCost: 0,
    costPerServing: 0,
    status: "draft" as 'draft' | 'published' | 'archived',
    outputType: null as 'retail' | 'produce' | null
  });

  const fetchRecipes = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      
      let url = `${backendUrl}/api/recipes/vendor`;
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (categoryFilter) params.append("category", categoryFilter);
      if (cuisineFilter) params.append("cuisine", cuisineFilter);
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
          setRecipes(json.data);
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
  }, [statusFilter, categoryFilter, cuisineFilter, searchTerm, toast]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const handleCreateRecipe = async () => {
    try {
      const token = localStorage.getItem("token");
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

      const response = await fetch(`${backendUrl}/api/recipes/vendor`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const json = await response.json();

      if (json.success) {
        toast({
          title: "Success",
          description: "Recipe created successfully"
        });
        setShowCreateForm(false);
        resetForm();
        fetchRecipes();
      } else {
        toast({
          title: "Error",
          description: json.message || "Failed to create recipe",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating recipe:", error);
      toast({
        title: "Error",
        description: "Failed to create recipe",
        variant: "destructive"
      });
    }
  };

  const handleUpdateRecipe = async () => {
    if (!editingRecipe) return;

    try {
      const token = localStorage.getItem("token");
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

      const response = await fetch(`${backendUrl}/api/recipes/vendor/${editingRecipe._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const json = await response.json();

      if (json.success) {
        toast({
          title: "Success",
          description: "Recipe updated successfully"
        });
        setEditingRecipe(null);
        resetForm();
        fetchRecipes();
      } else {
        toast({
          title: "Error",
          description: json.message || "Failed to update recipe",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating recipe:", error);
      toast({
        title: "Error",
        description: "Failed to update recipe",
        variant: "destructive"
      });
    }
  };

  // Vendors can no longer delete recipes or change status
  // Only universities can manage recipe status

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      shortDescription: "",
      category: "",
      cuisine: "",
      difficulty: "",
      prepTime: 0,
      cookTime: 0,
      servings: 1,
      ingredients: [],
      instructions: [],
      tags: [],
      tips: [],
      variations: [],
      allergens: [],
      dietaryRestrictions: [],
      estimatedCost: 0,
      costPerServing: 0,
      status: "draft",
      outputType: null
    });
  };

  const startEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setFormData({
      title: recipe.title,
      description: recipe.description,
      shortDescription: recipe.shortDescription || "",
      category: recipe.category,
      cuisine: recipe.cuisine,
      difficulty: recipe.difficulty,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      tags: recipe.tags || [],
      tips: recipe.tips || [],
      variations: recipe.variations || [],
      allergens: recipe.allergens || [],
      dietaryRestrictions: recipe.dietaryRestrictions || [],
      estimatedCost: recipe.estimatedCost || 0,
      costPerServing: recipe.costPerServing || 0,
      status: recipe.status,
      outputType: recipe.outputType || null
    });
    setShowCreateForm(true);
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: "", quantity: 0, unit: "grams", notes: "" }]
    }));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === index ? { ...ing, [field]: value } : ing
      )
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, { 
        step: prev.instructions.length + 1, 
        description: "", 
        duration: 0, 
        temperature: "", 
        notes: "" 
      }]
    }));
  };

  const updateInstruction = (index: number, field: keyof Instruction, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => 
        i === index ? { ...inst, [field]: value } : inst
      )
    }));
  };

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "#f59e0b";
      case "published": return "#10b981";
      case "archived": return "#6b7280";
      default: return "#6b7280";
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

  if (loading) {
    return <div className={styles.loading}>Loading recipes...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Recipe Management</h2>
        <button 
          className={styles.createButton}
          onClick={() => {
            resetForm();
            setEditingRecipe(null);
            setShowCreateForm(true);
          }}
        >
          Create New Recipe
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search recipes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
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
      </div>

      {/* Recipes List */}
      {recipes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No recipes found.</p>
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
                    style={{ backgroundColor: getStatusColor(recipe.status) }}
                  >
                    {recipe.status.toUpperCase()}
                  </span>
                  <span 
                    className={styles.badge}
                    style={{ backgroundColor: getDifficultyColor(recipe.difficulty) }}
                  >
                    {recipe.difficulty.toUpperCase()}
                  </span>
                  {recipe.outputType && (
                    <span 
                      className={styles.badge}
                      style={{ backgroundColor: '#10b981' }}
                    >
                      {recipe.outputType.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <p className={styles.description}>{recipe.description}</p>
              <div className={styles.meta}>
                <span>Prep: {recipe.prepTime}m</span>
                <span>Cook: {recipe.cookTime}m</span>
                <span>Serves: {recipe.servings}</span>
                
              </div>
              <div className={styles.actions}>
                <button 
                  onClick={() => setViewingRecipe(recipe)}
                  className={styles.viewButton}
                >
                  View
                </button>
                <button 
                  onClick={() => startEdit(recipe)}
                  className={styles.editButton}
                >
                  Edit
                </button>
                <span className={`${styles.statusBadge} ${styles[recipe.status]}`}>
                  {recipe.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className={styles.modal} onClick={() => setShowCreateForm(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>{editingRecipe ? "Edit Recipe" : "Create New Recipe"}</h3>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Recipe title"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Recipe description"
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Short Description</label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder="Brief description"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Cuisine</label>
                <select
                  value={formData.cuisine}
                  onChange={(e) => setFormData(prev => ({ ...prev, cuisine: e.target.value }))}
                >
                  <option value="">Select Cuisine</option>
                  {CUISINES.map(cuisine => (
                    <option key={cuisine} value={cuisine}>{cuisine.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                >
                  <option value="">Select Difficulty</option>
                  {DIFFICULTIES.map(diff => (
                    <option key={diff} value={diff}>{diff.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Prep Time (minutes) *</label>
                <input
                  type="number"
                  value={formData.prepTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, prepTime: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Cook Time (minutes) *</label>
                <input
                  type="number"
                  value={formData.cookTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, cookTime: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Servings *</label>
                <input
                  type="number"
                  value={formData.servings}
                  onChange={(e) => setFormData(prev => ({ ...prev, servings: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Recipe Output Type</label>
                <select
                  value={formData.outputType || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const outputType: 'retail' | 'produce' | null = value === '' ? null : (value === 'retail' ? 'retail' : value === 'produce' ? 'produce' : null);
                    setFormData(prev => ({ 
                      ...prev, 
                      outputType
                    }));
                  }}
                >
                  <option value="">Select Output Type (Optional)</option>
                  <option value="retail">Retail</option>
                  <option value="produce">Produce</option>
                </select>
                <small style={{ color: '#666', fontSize: '0.875rem' }}>
                  Select this if you want to use this recipe in Recipe Works to create items
                </small>
              </div>

            </div>

            {/* Ingredients Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h4>Ingredients *</h4>
                <button type="button" onClick={addIngredient} className={styles.addButton}>
                  Add Ingredient
                </button>
              </div>
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className={styles.ingredientRow}>
                  <input
                    type="text"
                    placeholder="Ingredient name"
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={ingredient.quantity}
                    onChange={(e) => updateIngredient(index, 'quantity', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                  <select
                    value={ingredient.unit}
                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                  >
                    {UNITS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Notes (optional)"
                    value={ingredient.notes || ""}
                    onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
                  />
                  <button 
                    type="button" 
                    onClick={() => removeIngredient(index)}
                    className={styles.removeButton}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Instructions Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h4>Instructions *</h4>
                <button type="button" onClick={addInstruction} className={styles.addButton}>
                  Add Instruction
                </button>
              </div>
              {formData.instructions.map((instruction, index) => (
                <div key={index} className={styles.instructionRow}>
                  <div className={styles.stepNumber}>Step {instruction.step}</div>
                  <textarea
                    placeholder="Instruction description"
                    value={instruction.description}
                    onChange={(e) => updateInstruction(index, 'description', e.target.value)}
                    rows={2}
                  />
                  <input
                    type="number"
                    placeholder="Duration (minutes)"
                    value={instruction.duration || ""}
                    onChange={(e) => updateInstruction(index, 'duration', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                  <input
                    type="text"
                    placeholder="Temperature (optional)"
                    value={instruction.temperature || ""}
                    onChange={(e) => updateInstruction(index, 'temperature', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Notes (optional)"
                    value={instruction.notes || ""}
                    onChange={(e) => updateInstruction(index, 'notes', e.target.value)}
                  />
                  <button 
                    type="button" 
                    onClick={() => removeInstruction(index)}
                    className={styles.removeButton}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.modalActions}>
              <button
                onClick={() => setShowCreateForm(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={editingRecipe ? handleUpdateRecipe : handleCreateRecipe}
                className={styles.saveButton}
                disabled={!formData.title || !formData.description || formData.ingredients.length === 0 || formData.instructions.length === 0}
              >
                {editingRecipe ? "Update Recipe" : "Create Recipe"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Recipe Modal */}
      {viewingRecipe && (
        <div className={styles.modal} onClick={() => setViewingRecipe(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>{viewingRecipe.title}</h3>
            
            <div className={styles.recipeDetails}>
              <div className={styles.recipeMeta}>
                <p><strong>Category:</strong> {viewingRecipe.category.replace('_', ' ').toUpperCase()}</p>
                <p><strong>Cuisine:</strong> {viewingRecipe.cuisine.replace('_', ' ').toUpperCase()}</p>
                <p><strong>Difficulty:</strong> {viewingRecipe.difficulty.toUpperCase()}</p>
                <p><strong>Prep Time:</strong> {viewingRecipe.prepTime} minutes</p>
                <p><strong>Cook Time:</strong> {viewingRecipe.cookTime} minutes</p>
                <p><strong>Total Time:</strong> {viewingRecipe.totalTime} minutes</p>
                <p><strong>Servings:</strong> {viewingRecipe.servings}</p>
                {viewingRecipe.outputType && (
                  <p><strong>Output Type:</strong> {viewingRecipe.outputType.toUpperCase()}</p>
                )}
                <p><strong>Status:</strong> {viewingRecipe.status.toUpperCase()}</p>
                <p><strong>Views:</strong> {viewingRecipe.views}</p>
                <p><strong>Likes:</strong> {viewingRecipe.likes}</p>
                <p><strong>Rating:</strong> {viewingRecipe.averageRating}/5</p>
              </div>

              <div className={styles.recipeDescription}>
                <h4>Description</h4>
                <p>{viewingRecipe.description}</p>
              </div>

              <div className={styles.ingredientsList}>
                <h4>Ingredients</h4>
                <ul>
                  {viewingRecipe.ingredients.map((ingredient, index) => (
                    <li key={index}>
                      {ingredient.quantity} {ingredient.unit} {ingredient.name}
                      {ingredient.notes && <span className={styles.notes}> - {ingredient.notes}</span>}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.instructionsList}>
                <h4>Instructions</h4>
                <ol>
                  {viewingRecipe.instructions.map((instruction, index) => (
                    <li key={index}>
                      <p>{instruction.description}</p>
                      {(instruction.duration || instruction.temperature || instruction.notes) && (
                        <div className={styles.instructionMeta}>
                          {instruction.duration && <span>Duration: {instruction.duration}m</span>}
                          {instruction.temperature && <span>Temperature: {instruction.temperature}</span>}
                          {instruction.notes && <span>Notes: {instruction.notes}</span>}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>

              {viewingRecipe.tags && viewingRecipe.tags.length > 0 && (
                <div className={styles.tags}>
                  <h4>Tags</h4>
                  <div className={styles.tagList}>
                    {viewingRecipe.tags.map((tag, index) => (
                      <span key={index} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {viewingRecipe.tips && viewingRecipe.tips.length > 0 && (
                <div className={styles.tips}>
                  <h4>Tips</h4>
                  <ul>
                    {viewingRecipe.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
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
