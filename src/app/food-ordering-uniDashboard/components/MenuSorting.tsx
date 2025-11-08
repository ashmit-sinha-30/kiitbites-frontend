"use client";

import React, { useEffect, useState, useCallback } from "react";
import styles from "../styles/MenuSorting.module.scss";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ChevronUp, ChevronDown, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface MenuSortingProps {
  universityId: string;
  vendorId?: string; // Optional: if provided, sort order is vendor-specific
}

interface Item {
  _id: string;
  itemId: string;
  name: string;
  type: string;
  subtype?: string;
  category: "retail" | "produce";
  price: number;
  image?: string;
}

interface SortOrderItem {
  itemId: string;
  category: "retail" | "produce";
  type: string;
  subtype?: string | null;
  sortIndex: number;
}

interface TypeOrderItem {
  category: "retail" | "produce";
  type: string;
  sortIndex: number;
}

interface SubtypeOrderItem {
  category: "retail" | "produce";
  type: string;
  subtype: string;
  sortIndex: number;
}

type SortTab = "types" | "subtypes" | "items";

interface Vendor {
  _id: string;
  fullName: string;
}

const MenuSorting: React.FC<MenuSortingProps> = ({ universityId, vendorId: initialVendorId }) => {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SortTab>("types");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "retail" | "produce">("all");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [, setCurrentSortOrder] = useState<SortOrderItem[]>([]);
  const [currentTypeOrder, setCurrentTypeOrder] = useState<TypeOrderItem[]>([]);
  const [currentSubtypeOrder, setCurrentSubtypeOrder] = useState<SubtypeOrderItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(initialVendorId || null);
  const [loadingVendors, setLoadingVendors] = useState(false);

  // Fetch vendors
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoadingVendors(true);
        const response = await fetch(`${BACKEND_URL}/api/vendor/list/uni/${universityId}`);
        if (response.ok) {
          const vendorsData = await response.json();
          setVendors(vendorsData || []);
        }
      } catch (error) {
        console.error("Error fetching vendors:", error);
      } finally {
        setLoadingVendors(false);
      }
    };

    if (universityId) {
      fetchVendors();
    }
  }, [universityId]);

  // Fetch items (vendor-specific if vendor selected, otherwise all university items)
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        let retailItems: Item[] = [];
        let produceItems: Item[] = [];

        if (selectedVendorId && selectedVendorId !== "null") {
          // Fetch vendor-specific items
          const vendorResponse = await fetch(`${BACKEND_URL}/api/item/getvendors/${selectedVendorId}`);
          if (vendorResponse.ok) {
            const vendorData = await vendorResponse.json();
            if (vendorData.success && vendorData.data) {
              // Map vendor retail items
              retailItems = (vendorData.data.retailItems || []).map((item: { itemId: string; name: string; type: string; subtype?: string; price: number; image?: string }) => ({
                _id: item.itemId,
                itemId: item.itemId,
                name: item.name,
                type: item.type,
                subtype: item.subtype,
                category: "retail" as const,
                price: item.price,
                image: item.image,
              }));

              // Map vendor produce items
              produceItems = (vendorData.data.produceItems || []).map((item: { itemId: string; name: string; type: string; subtype?: string; price: number; image?: string }) => ({
                _id: item.itemId,
                itemId: item.itemId,
                name: item.name,
                type: item.type,
                subtype: item.subtype,
                category: "produce" as const,
                price: item.price,
                image: item.image,
              }));
            }
          }
        } else {
          // Fetch all university items (university-wide)
          const [retailRes, produceRes] = await Promise.all([
            fetch(`${BACKEND_URL}/api/item/retail/uni/${universityId}?limit=1000`),
            fetch(`${BACKEND_URL}/api/item/produce/uni/${universityId}?limit=1000`),
          ]);

          const retailData = await retailRes.json();
          const produceData = await produceRes.json();

          retailItems = (retailData.items || []).map((item: { _id: string; name: string; type: string; subtype?: string; price: number; image?: string }) => ({
            _id: item._id,
            itemId: item._id,
            name: item.name,
            type: item.type,
            subtype: item.subtype,
            category: "retail" as const,
            price: item.price,
            image: item.image,
          }));

          produceItems = (produceData.items || []).map((item: { _id: string; name: string; type: string; subtype?: string; price: number; image?: string }) => ({
            _id: item._id,
            itemId: item._id,
            name: item.name,
            type: item.type,
            subtype: item.subtype,
            category: "produce" as const,
            price: item.price,
            image: item.image,
          }));
        }

        const allItems = [...retailItems, ...produceItems];
        setItems(allItems);

        // Fetch and apply sort order after items are loaded
        // This will filter sort orders to only include items/types/subtypes that exist
        if (allItems.length > 0) {
          // Use the fetchSortOrder function defined below
          // We'll trigger it via useEffect after items are set
        }
      } catch (error) {
        console.error("Error fetching items:", error);
        toast.error("Failed to load items");
      } finally {
        setLoading(false);
      }
    };

    if (universityId) {
      fetchItems();
    }
  }, [universityId, selectedVendorId]);

  // Fetch current sort order
  const fetchSortOrder = useCallback(async (itemsToFilter?: Item[]) => {
    if (!universityId) return;
    
    try {
      const params = new URLSearchParams({
        uniId: universityId,
        ...(selectedVendorId && selectedVendorId !== "null" ? { vendorId: selectedVendorId } : { vendorId: "null" }),
      });

      const response = await fetch(`${BACKEND_URL}/api/menu-sort/order?${params}`);
      const data = await response.json();

      if (data.success && data.data) {
        // Use itemsToFilter if provided, otherwise use current items state
        const currentItems = itemsToFilter && itemsToFilter.length > 0 ? itemsToFilter : items;
        
        // Only filter if we have items to filter against
        if (currentItems.length > 0) {
          // Create sets of available itemIds, types, and subtypes for filtering
          const availableItemIds = new Set(currentItems.map(item => item.itemId));
          const availableTypeKeys = new Set<string>();
          const availableSubtypeKeys = new Set<string>();
          
          currentItems.forEach(item => {
            if (item.type) {
              availableTypeKeys.add(`${item.category}-${item.type}`);
            }
            if (item.type && item.subtype) {
              availableSubtypeKeys.add(`${item.category}-${item.type}-${item.subtype}`);
            }
          });
          
          if (data.data.itemOrder && data.data.itemOrder.length > 0) {
            // Filter itemOrder to only include items that exist in current items
            const filteredItemOrder = data.data.itemOrder.filter((item: SortOrderItem) => 
              availableItemIds.has(item.itemId)
            );
            setCurrentSortOrder(filteredItemOrder);
            
            // Apply sort order to items (only if itemsToFilter was provided, meaning we're updating)
            if (itemsToFilter) {
              const sortedItems = applySortOrder(itemsToFilter, filteredItemOrder);
              setItems(sortedItems);
            } else {
              // Update items in place
              setItems((prevItems) => {
                if (prevItems.length === 0) return prevItems;
                return applySortOrder(prevItems, filteredItemOrder);
              });
            }
          } else {
            setCurrentSortOrder([]);
          }
          
          if (data.data.typeOrder) {
            // Filter typeOrder to only include types that exist in current items
            const filteredTypeOrder = data.data.typeOrder.filter((item: TypeOrderItem) => 
              availableTypeKeys.has(`${item.category}-${item.type}`)
            );
            setCurrentTypeOrder(filteredTypeOrder);
          } else {
            setCurrentTypeOrder([]);
          }
          
          if (data.data.subtypeOrder) {
            // Filter subtypeOrder to only include subtypes that exist in current items
            const filteredSubtypeOrder = data.data.subtypeOrder.filter((item: SubtypeOrderItem) => 
              availableSubtypeKeys.has(`${item.category}-${item.type}-${item.subtype}`)
            );
            setCurrentSubtypeOrder(filteredSubtypeOrder);
          } else {
            setCurrentSubtypeOrder([]);
          }
        } else {
          // No items available yet, just set the sort orders (will be filtered later)
          if (data.data.itemOrder) {
            setCurrentSortOrder(data.data.itemOrder);
          } else {
            setCurrentSortOrder([]);
          }
          if (data.data.typeOrder) {
            setCurrentTypeOrder(data.data.typeOrder);
          } else {
            setCurrentTypeOrder([]);
          }
          if (data.data.subtypeOrder) {
            setCurrentSubtypeOrder(data.data.subtypeOrder);
          } else {
            setCurrentSubtypeOrder([]);
          }
        }
      } else {
        // No sort order found, reset to empty
        setCurrentSortOrder([]);
        setCurrentTypeOrder([]);
        setCurrentSubtypeOrder([]);
      }
    } catch (error) {
      console.error("Error fetching sort order:", error);
      // On error, reset to empty
      setCurrentSortOrder([]);
      setCurrentTypeOrder([]);
      setCurrentSubtypeOrder([]);
    }
  }, [universityId, selectedVendorId, items]);

  // Reload sort order when vendor changes or items are loaded
  useEffect(() => {
    if (universityId && items.length > 0) {
      // Pass items to filter the sort order
      fetchSortOrder(items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVendorId, universityId, items.length, fetchSortOrder]);

  // Apply sort order to items
  const applySortOrder = (itemsList: Item[], sortOrder: SortOrderItem[]): Item[] => {
    const sortMap = new Map<string, number>();
    sortOrder.forEach((item) => {
      sortMap.set(item.itemId, item.sortIndex);
    });

    return [...itemsList].sort((a, b) => {
      const aIndex = sortMap.get(a.itemId);
      const bIndex = sortMap.get(b.itemId);

      if (aIndex !== undefined && bIndex !== undefined) {
        return aIndex - bIndex;
      }
      if (aIndex !== undefined) return -1;
      if (bIndex !== undefined) return 1;
      return a.name.localeCompare(b.name);
    });
  };

  // Handle move up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    
    const filtered = getFilteredItems();
    const newItems = [...items];
    const itemToMove = filtered[index];
    const itemAbove = filtered[index - 1];
    
    // Find indices in full items array
    const itemIndex = newItems.findIndex((i) => i.itemId === itemToMove.itemId);
    const aboveIndex = newItems.findIndex((i) => i.itemId === itemAbove.itemId);
    
    if (itemIndex !== -1 && aboveIndex !== -1) {
      // Swap items
      [newItems[itemIndex], newItems[aboveIndex]] = [newItems[aboveIndex], newItems[itemIndex]];
      setItems(newItems);
    }
  };

  // Handle move down
  const handleMoveDown = (index: number) => {
    const filtered = getFilteredItems();
    if (index >= filtered.length - 1) return;
    
    const newItems = [...items];
    const itemToMove = filtered[index];
    const itemBelow = filtered[index + 1];
    
    // Find indices in full items array
    const itemIndex = newItems.findIndex((i) => i.itemId === itemToMove.itemId);
    const belowIndex = newItems.findIndex((i) => i.itemId === itemBelow.itemId);
    
    if (itemIndex !== -1 && belowIndex !== -1) {
      // Swap items
      [newItems[itemIndex], newItems[belowIndex]] = [newItems[belowIndex], newItems[itemIndex]];
      setItems(newItems);
    }
  };

  // Handle drag and drop (native HTML5)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const filtered = getFilteredItems();
    const newItems = [...items];
    const draggedItem = filtered[draggedIndex];
    const targetItem = filtered[index];

    if (draggedIndex !== index) {
      const draggedItemIndex = newItems.findIndex((i) => i.itemId === draggedItem.itemId);
      const targetItemIndex = newItems.findIndex((i) => i.itemId === targetItem.itemId);

      if (draggedItemIndex !== -1 && targetItemIndex !== -1) {
        newItems.splice(draggedItemIndex, 1);
        newItems.splice(targetItemIndex, 0, draggedItem);
        setItems(newItems);
        setDraggedIndex(index);
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Get filtered items
  const getFilteredItems = (): Item[] => {
    return items.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (typeFilter && item.type !== typeFilter) return false;
      return true;
    });
  };

  // Get unique types grouped by category
  const getTypesByCategory = (): { category: "retail" | "produce"; types: string[] }[] => {
    const typesMap = new Map<"retail" | "produce", Set<string>>();
    items.forEach((item) => {
      if (!typesMap.has(item.category)) {
        typesMap.set(item.category, new Set());
      }
      typesMap.get(item.category)!.add(item.type);
    });

    const result: { category: "retail" | "produce"; types: string[] }[] = [];
    typesMap.forEach((types, category) => {
      result.push({ category, types: Array.from(types).sort() });
    });

    // Apply type order if available
    if (currentTypeOrder.length > 0) {
      const typeOrderMap = new Map<string, number>();
      currentTypeOrder.forEach((item) => {
        typeOrderMap.set(`${item.category}-${item.type}`, item.sortIndex);
      });

      result.forEach(({ category, types }) => {
        types.sort((a, b) => {
          const aKey = `${category}-${a}`;
          const bKey = `${category}-${b}`;
          const aIndex = typeOrderMap.get(aKey);
          const bIndex = typeOrderMap.get(bKey);
          if (aIndex !== undefined && bIndex !== undefined) {
            return aIndex - bIndex;
          }
          if (aIndex !== undefined) return -1;
          if (bIndex !== undefined) return 1;
          return a.localeCompare(b);
        });
      });
    }

    return result;
  };

  // Get subtypes for a specific type (only subtypes that exist in current items)
  const getSubtypesForType = (category: "retail" | "produce", type: string): string[] => {
    const subtypes = new Set<string>();
    // Only include subtypes from items that are currently available
    items.forEach((item) => {
      if (item.category === category && item.type === type && item.subtype) {
        subtypes.add(item.subtype);
      }
    });

    const subtypeArray = Array.from(subtypes).sort();

    // Apply subtype order if available (only for subtypes that exist in current items)
    if (currentSubtypeOrder.length > 0) {
      const subtypeOrderMap = new Map<string, number>();
      // Create a set of available subtype keys
      const availableSubtypeKeys = new Set<string>();
      items.forEach(item => {
        if (item.category === category && item.type === type && item.subtype) {
          availableSubtypeKeys.add(`${item.category}-${item.type}-${item.subtype}`);
        }
      });
      
      // Only add subtype order entries for subtypes that exist
      currentSubtypeOrder
        .filter((item) => {
          const key = `${item.category}-${item.type}-${item.subtype}`;
          return item.category === category && 
                 item.type === type && 
                 availableSubtypeKeys.has(key);
        })
        .forEach((item) => {
          subtypeOrderMap.set(item.subtype, item.sortIndex);
        });

      if (subtypeOrderMap.size > 0) {
        subtypeArray.sort((a, b) => {
          const aIndex = subtypeOrderMap.get(a);
          const bIndex = subtypeOrderMap.get(b);
          if (aIndex !== undefined && bIndex !== undefined) {
            return aIndex - bIndex;
          }
          if (aIndex !== undefined) return -1;
          if (bIndex !== undefined) return 1;
          return a.localeCompare(b);
        });
      }
    }

    return subtypeArray;
  };

  // Handle type reordering
  const handleTypeMove = (category: "retail" | "produce", type: string, direction: "up" | "down") => {
    const typesByCategory = getTypesByCategory();
    const categoryData = typesByCategory.find((t) => t.category === category);
    if (!categoryData) return;

    const currentIndex = categoryData.types.indexOf(type);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= categoryData.types.length) return;

    const newTypes = [...categoryData.types];
    [newTypes[currentIndex], newTypes[newIndex]] = [newTypes[newIndex], newTypes[currentIndex]];

    // Update type order
    const newTypeOrder: TypeOrderItem[] = newTypes.map((t, index) => ({
      category,
      type: t,
      sortIndex: index,
    }));

    // Merge with existing type order for other categories
    const mergedTypeOrder = [
      ...currentTypeOrder.filter((item) => item.category !== category),
      ...newTypeOrder,
    ];

    setCurrentTypeOrder(mergedTypeOrder);
  };

  // Handle subtype reordering
  const handleSubtypeMove = (
    category: "retail" | "produce",
    type: string,
    subtype: string,
    direction: "up" | "down"
  ) => {
    const subtypes = getSubtypesForType(category, type);
    const currentIndex = subtypes.indexOf(subtype);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= subtypes.length) return;

    const newSubtypes = [...subtypes];
    [newSubtypes[currentIndex], newSubtypes[newIndex]] = [newSubtypes[newIndex], newSubtypes[currentIndex]];

    // Update subtype order
    const newSubtypeOrder: SubtypeOrderItem[] = newSubtypes.map((s, index) => ({
      category,
      type,
      subtype: s,
      sortIndex: index,
    }));

    // Merge with existing subtype order for other types
    const mergedSubtypeOrder = [
      ...currentSubtypeOrder.filter(
        (item) => !(item.category === category && item.type === type)
      ),
      ...newSubtypeOrder,
    ];

    setCurrentSubtypeOrder(mergedSubtypeOrder);
  };

  // Save sort order
  const handleSave = async () => {
    try {
      setSaving(true);

      // Build item sort order from current items (only items that are available)
      const sortOrder: SortOrderItem[] = items.map((item, index) => ({
        itemId: item.itemId,
        category: item.category,
        type: item.type,
        subtype: item.subtype || null,
        sortIndex: index,
      }));

      // Filter typeOrder to only include types that exist in current items
      const availableTypeKeys = new Set<string>();
      items.forEach(item => {
        if (item.type) {
          availableTypeKeys.add(`${item.category}-${item.type}`);
        }
      });
      const filteredTypeOrder = currentTypeOrder.filter((item: TypeOrderItem) => 
        availableTypeKeys.has(`${item.category}-${item.type}`)
      );

      // Filter subtypeOrder to only include subtypes that exist in current items
      const availableSubtypeKeys = new Set<string>();
      items.forEach(item => {
        if (item.type && item.subtype) {
          availableSubtypeKeys.add(`${item.category}-${item.type}-${item.subtype}`);
        }
      });
      const filteredSubtypeOrder = currentSubtypeOrder.filter((item: SubtypeOrderItem) => 
        availableSubtypeKeys.has(`${item.category}-${item.type}-${item.subtype}`)
      );

      const response = await fetch(`${BACKEND_URL}/api/menu-sort/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uniId: universityId,
          vendorId: selectedVendorId || null,
          itemOrder: sortOrder,
          typeOrder: filteredTypeOrder,
          subtypeOrder: filteredSubtypeOrder,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Menu sort order saved successfully!");
        setCurrentSortOrder(sortOrder);
        setCurrentTypeOrder(filteredTypeOrder);
        setCurrentSubtypeOrder(filteredSubtypeOrder);
      } else {
        toast.error(data.error || "Failed to save sort order");
      }
    } catch (error) {
      console.error("Error saving sort order:", error);
      toast.error("Failed to save sort order");
    } finally {
      setSaving(false);
    }
  };

  // Reset sort order
  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset the sort order? This will remove all custom sorting.")) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${BACKEND_URL}/api/menu-sort/order`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uniId: universityId,
          vendorId: selectedVendorId || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Sort order reset successfully!");
        setCurrentSortOrder([]);
        // Reload items to reset order
        window.location.reload();
      } else {
        toast.error(data.error || "Failed to reset sort order");
      }
    } catch (error) {
      console.error("Error resetting sort order:", error);
      toast.error("Failed to reset sort order");
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = getFilteredItems();
  const uniqueTypes = Array.from(new Set(items.map((item) => item.type))).sort();

  if (loading) {
    return <div className={styles.container}>Loading items...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            onClick={() => {
              // Clear URL params and go back
              const url = new URL(window.location.href);
              url.searchParams.delete("menuSorting");
              url.searchParams.delete("vendorId");
              router.push(url.pathname);
            }}
            className={styles.backButton}
            title="Go back to dashboard"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h2 className={styles.title}>Menu Sorting</h2>
        </div>
        <div className={styles.actions}>
          <button onClick={handleReset} className={styles.resetButton} disabled={saving}>
            Reset
          </button>
          <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
            {saving ? "Saving..." : "Save Sort Order"}
          </button>
        </div>
      </div>

      <div className={styles.vendorSelector}>
        <label htmlFor="vendor-select" className={styles.vendorLabel}>
          Sort Order For:
        </label>
        <select
          id="vendor-select"
          className={styles.vendorSelect}
          value={selectedVendorId || "university"}
          onChange={(e) => {
            const newVendorId = e.target.value === "university" ? null : e.target.value;
            setSelectedVendorId(newVendorId);
            // Sort orders will be reloaded by useEffect when selectedVendorId changes
          }}
          disabled={loadingVendors}
        >
          <option value="university">University Wide (All Vendors)</option>
          {vendors.map((vendor) => (
            <option key={vendor._id} value={vendor._id}>
              {vendor.fullName}
            </option>
          ))}
        </select>
        {selectedVendorId && (
          <span className={styles.vendorNote}>
            Editing sort order for: {vendors.find((v) => v._id === selectedVendorId)?.fullName || "Vendor"}
          </span>
        )}
      </div>

      <div className={styles.filters}>
        <select
          className={styles.select}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as "all" | "retail" | "produce")}
        >
          <option value="all">All Categories</option>
          <option value="retail">Retail</option>
          <option value="produce">Produce</option>
        </select>

        <select
          className={styles.select}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          {uniqueTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "types" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("types")}
        >
          Type Order
        </button>
        <button
          className={`${styles.tab} ${activeTab === "subtypes" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("subtypes")}
        >
          Subtype Order
        </button>
        <button
          className={`${styles.tab} ${activeTab === "items" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("items")}
        >
          Item Order
        </button>
      </div>

      <div className={styles.info}>
        <p>
          {activeTab === "types" && "Reorder types to control which categories appear first on the menu."}
          {activeTab === "subtypes" && "Reorder subtypes to control which subtypes appear first within each type."}
          {activeTab === "items" && "Drag and drop items to reorder them. Items will appear in this order on the menu."}
        </p>
        {activeTab === "items" && <p>Total items: {filteredItems.length}</p>}
      </div>

      {activeTab === "types" && (
        <div className={styles.typesList}>
          {getTypesByCategory().map(({ category, types }) => (
            <div key={category} className={styles.categorySection}>
              <h3 className={styles.categoryTitle}>{category.toUpperCase()}</h3>
              {types.map((type, index) => (
                <div key={`${category}-${type}`} className={styles.typeCard}>
                  <div className={styles.typeIndex}>{index + 1}</div>
                  <div className={styles.typeName}>{type}</div>
                  <div className={styles.moveButtons}>
                    <button
                      onClick={() => handleTypeMove(category, type, "up")}
                      disabled={index === 0}
                      className={styles.moveButton}
                      title="Move up"
                    >
                      <ChevronUp size={20} />
                    </button>
                    <button
                      onClick={() => handleTypeMove(category, type, "down")}
                      disabled={index === types.length - 1}
                      className={styles.moveButton}
                      title="Move down"
                    >
                      <ChevronDown size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {activeTab === "subtypes" && (
        <div className={styles.subtypesList}>
          {getTypesByCategory().map(({ category, types }) => (
            <div key={category} className={styles.categorySection}>
              <h3 className={styles.categoryTitle}>{category.toUpperCase()}</h3>
              {types.map((type) => {
                const subtypes = getSubtypesForType(category, type);
                if (subtypes.length === 0) return null;
                return (
                  <div key={`${category}-${type}`} className={styles.typeSection}>
                    <h4 className={styles.typeTitle}>{type}</h4>
                    {subtypes.map((subtype, index) => (
                      <div key={`${category}-${type}-${subtype}`} className={styles.subtypeCard}>
                        <div className={styles.subtypeIndex}>{index + 1}</div>
                        <div className={styles.subtypeName}>{subtype}</div>
                        <div className={styles.moveButtons}>
                          <button
                            onClick={() => handleSubtypeMove(category, type, subtype, "up")}
                            disabled={index === 0}
                            className={styles.moveButton}
                            title="Move up"
                          >
                            <ChevronUp size={20} />
                          </button>
                          <button
                            onClick={() => handleSubtypeMove(category, type, subtype, "down")}
                            disabled={index === subtypes.length - 1}
                            className={styles.moveButton}
                            title="Move down"
                          >
                            <ChevronDown size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {activeTab === "items" && (
        <div className={styles.itemsList}>
          {filteredItems.map((item, index) => (
          <div
            key={item.itemId}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`${styles.itemCard} ${draggedIndex === index ? styles.dragging : ""}`}
          >
            <div className={styles.itemIndex}>{index + 1}</div>
            <div className={styles.itemImage}>
              {item.image ? (
                <img src={item.image} alt={item.name} />
              ) : (
                <div className={styles.placeholderImage}>No Image</div>
              )}
            </div>
            <div className={styles.itemDetails}>
              <div className={styles.itemName}>{item.name}</div>
              <div className={styles.itemMeta}>
                <span className={styles.badge}>{item.category}</span>
                <span className={styles.badge}>{item.type}</span>
                {item.subtype && <span className={styles.badge}>{item.subtype}</span>}
              </div>
              <div className={styles.itemPrice}>₹{item.price}</div>
            </div>
            <div className={styles.moveButtons}>
              <button
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className={styles.moveButton}
                title="Move up"
              >
                <ChevronUp size={20} />
              </button>
              <button
                onClick={() => handleMoveDown(index)}
                disabled={index === filteredItems.length - 1}
                className={styles.moveButton}
                title="Move down"
              >
                <ChevronDown size={20} />
              </button>
            </div>
            <div className={styles.dragHandle} title="Drag to reorder">☰</div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
};

export default MenuSorting;

