"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DishCard from "@/app/components/DishCard";
import SearchBar from "@/app/components/SearchBar";
import styles from "./styles/VendorPage.module.scss";
import { FaRegHeart } from "react-icons/fa";
import { FaHeart } from "react-icons/fa";
import { addToCart, increaseQuantity, decreaseQuantity } from "./utils/cartUtils";
import { toast } from "react-toastify";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface VendorItem {
  itemId: string;
  name: string;
  description?: string;
  type?: string;
  subtype?: string;
  price: number;
  image?: string;
  quantity?: number;
  isAvailable?: string;
  vendorId?: string;
  isVeg?: boolean;
  category?: "retail" | "produce";
}

interface VendorData {
  success: boolean;
  foodCourtName: string;
  data: {
    retailItems: VendorItem[];
    produceItems: VendorItem[];
  };
  uniID?: string;
}

interface UserData {
  _id: string;
  cart: Array<{
    itemId: string;
    kind: string;
    quantity: number;
  }>;
  favourites?: Array<{
    itemId: string;
    vendorId: string;
    kind: string;
  }>;
}

interface Favourite {
  itemId: string;
  vendorId: string;
  kind: string;
}

const VendorPage = () => {
  const { id } = useParams();
  console.log('[DEBUG] useParams id:', id, 'type:', typeof id);
  const router = useRouter();
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [universityId, setUniversityId] = useState<string>("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<VendorItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Filter states
  const [vegFilter, setVegFilter] = useState<"all" | "veg" | "non-veg">("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "retail" | "produce">("all");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<string | null>(null);

  // Helper to get the real vendorId from the item or fallback to route id
  const getRealVendorId = (item: VendorItem) => {
    return item.vendorId ? String(item.vendorId).trim() : String(id).trim();
  };

  // Get the current vendor's ObjectId from the first item (retail or produce)
  const currentVendorId = vendorData?.data?.retailItems?.[0]?.vendorId || vendorData?.data?.produceItems?.[0]?.vendorId || id;

  // Helper to check if an item is favourited by the user for this vendor
  const isItemFavourited = (item: VendorItem) => {
    if (!userData?.favourites) return false;
    return userData.favourites.some(
      (fav: Favourite) =>
        String(fav.itemId) === String(item.itemId) &&
        String(fav.vendorId) === String(currentVendorId) &&
        fav.kind === (item.category === "retail" ? "Retail" : "Produce")
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch vendor data
        const vendorResponse = await fetch(`${BACKEND_URL}/api/item/getvendors/${id}`);
        const vendorData = await vendorResponse.json();
        if (vendorData.success) {
          // Add category information to items (preserve original type field)
          const retailItems = vendorData.data.retailItems.map((item: VendorItem) => ({
            ...item,
            category: "retail" as const
          }));
          const produceItems = vendorData.data.produceItems.map((item: VendorItem) => ({
            ...item,
            category: "produce" as const
          }));
          
          setVendorData({
            ...vendorData,
            data: {
              retailItems,
              produceItems
            }
          });
          
          if (vendorData.uniID) {
            setUniversityId(vendorData.uniID);
          }
        }

        // Fetch user data
        const token = localStorage.getItem("token");
        if (token) {
          const userResponse = await fetch(`${BACKEND_URL}/api/user/auth/user`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUserData(userData);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const toggleFavourite = async (item: VendorItem) => {
    if (!userData) {
      toast.error("Please login to favourite items");
      return;
    }
    const kind = item.category === "retail" ? "Retail" : "Produce";
    try {
      const res = await fetch(`${BACKEND_URL}/fav/${userData._id}/${item.itemId}/${kind}/${getRealVendorId(item)}`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update favourites");
      } else {
        toast.success(data.message || "Favourites updated.");
        // Optionally, you can refresh userData here to get updated favourites
        const token = localStorage.getItem("token");
        if (token) {
          const userResponse = await fetch(`${BACKEND_URL}/api/user/auth/user`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (userResponse.ok) {
            const updatedUserData = await userResponse.json();
            setUserData(updatedUserData);
          }
        }
      }
    } catch (err) {
      console.error("Favourite toggle error:", err);
      toast.error("Error updating favourites");
    }
  };
  

  const allItems = [
    ...(vendorData?.data.retailItems || []),
    ...(vendorData?.data.produceItems || [])
  ];

  // Get unique types and subtypes for filters
  const uniqueTypes = Array.from(
    new Set(
      allItems
        .map(item => item.type)
        .filter((type): type is string => Boolean(type))
    )
  ).sort();

  // Get unique subtypes for the selected type
  const uniqueSubtypes = selectedType
    ? Array.from(
        new Set(
          allItems
            .filter(item => item.type === selectedType && item.subtype)
            .map(item => item.subtype)
            .filter((subtype): subtype is string => Boolean(subtype))
        )
      ).sort()
    : [];

  // Comprehensive filtering logic
  const filteredItems = searchResults.length > 0 ? searchResults : allItems.filter(item => {
    // Veg/Non-veg filter
    const matchesVeg = vegFilter === "all" || 
      (vegFilter === "veg" && item.isVeg !== false) ||
      (vegFilter === "non-veg" && item.isVeg === false);
    
    // Category filter (retail/produce)
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    // Type filter
    const matchesType = !selectedType || item.type === selectedType;
    
    // Subtype filter (only applies when a type is selected)
    const matchesSubtype = !selectedType || !selectedSubtype || item.subtype === selectedSubtype;
    
    return matchesVeg && matchesCategory && matchesType && matchesSubtype;
  });

  // Group items by type and subtype for organized display
  // Only group when not searching (search results should be flat)
  const groupedItems = isSearching ? {} : filteredItems.reduce((acc, item) => {
    const type = item.type || "Uncategorized";
    const subtype = item.subtype || "Other";
    
    if (!acc[type]) {
      acc[type] = {};
    }
    if (!acc[type][subtype]) {
      acc[type][subtype] = [];
    }
    acc[type][subtype].push(item);
    
    return acc;
  }, {} as Record<string, Record<string, VendorItem[]>>);

  // Sort types and subtypes (only when grouping)
  const sortedTypes = isSearching ? [] : Object.keys(groupedItems).sort();
  if (!isSearching) {
    sortedTypes.forEach(type => {
      const subtypes = groupedItems[type];
      // Sort subtypes, but put "Other" (items without subtype) at the end
      const sortedSubtypes = Object.keys(subtypes).sort((a, b) => {
        if (a === "Other") return 1;
        if (b === "Other") return -1;
        return a.localeCompare(b);
      });
      const sortedSubtypeObj: Record<string, VendorItem[]> = {};
      sortedSubtypes.forEach(subtype => {
        sortedSubtypeObj[subtype] = subtypes[subtype];
      });
      groupedItems[type] = sortedSubtypeObj;
    });
  }

  // Reset subtype when type is cleared or changed
  useEffect(() => {
    setSelectedSubtype(null);
  }, [selectedType]);

  const getItemQuantity = (itemId: string, category?: string) => {
    if (!userData?.cart) return 0;
    const kind = category === "retail" ? "Retail" : "Produce";
    const cartItem = userData.cart.find(
      item => item.itemId === itemId && item.kind === kind
    );
    return cartItem?.quantity || 0;
  };

  const handleAddToCart = async (item: VendorItem) => {
    if (!userData) {
      toast.error("Please login to add items to cart");
      return;
    }

    console.log('DEBUG: Adding item to cart:', {
      itemId: item.itemId,
      name: item.name,
      category: item.category,
      vendorId: id
    });

    const quantity = getItemQuantity(item.itemId, item.category);
    if (quantity === 0) {
      await addToCart(userData._id, item, id as string);
    } else {
      await increaseQuantity(userData._id, item, id as string);
    }

    // Refresh user data to update cart
    const token = localStorage.getItem("token");
    if (token) {
      const userResponse = await fetch(`${BACKEND_URL}/api/user/auth/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (userResponse.ok) {
        const updatedUserData = await userResponse.json();
        setUserData(updatedUserData);
      }
    }
  };

  const handleDecreaseQuantity = async (item: VendorItem) => {
    if (!userData) return;
    await decreaseQuantity(userData._id, item, id as string);

    // Refresh user data to update cart
    const token = localStorage.getItem("token");
    if (token) {
      const userResponse = await fetch(`${BACKEND_URL}/api/user/auth/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (userResponse.ok) {
        const updatedUserData = await userResponse.json();
        setUserData(updatedUserData);
      }
    }
  };

  const handleItemClick = async (item: VendorItem) => {
    try {
      // Log the search in the backend
      await fetch(`${BACKEND_URL}/api/increase-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodName: item.name }),
      });

      // Navigate to the item details page
      router.push(`/item/${item.itemId}`);
    } catch (error) {
      console.error("Error handling item click:", error);
    }
  };

  const handleSearch = (results: VendorItem[]) => {
    console.log('DEBUG: Vendor page received search results:', results.map(item => ({
      itemId: item.itemId,
      name: item.name,
      type: item.type
    })));
    setIsSearching(true);
    setSearchResults(results);
  };

  const handleClearSearch = () => {
    setIsSearching(false);
    setSearchResults([]);
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.vendorName}>{vendorData?.foodCourtName}</h1>
        <div className={styles.searchContainer}>
          <div className={styles.searchBar}>
            <SearchBar 
              hideUniversityDropdown={true} 
              placeholder="Search food items..." 
              vendorId={id as string}
              universityId={universityId}
              clearSearch={handleClearSearch}
              onSearchResults={handleSearch}
            />
          </div>
          {/* {isSearching && (
            <button 
              className={styles.clearSearchButton}
              onClick={handleClearSearch}
            >
              Clear Search
            </button>
          )} */}
        </div>
      </div>

      {!isSearching && (
        <div className={styles.filtersContainer}>
          {/* Veg/Non-veg Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Diet:</label>
            <div className={styles.filterButtons}>
              <button
                className={`${styles.filterButton} ${vegFilter === "all" ? styles.active : ''}`}
                onClick={() => setVegFilter("all")}
              >
                All
              </button>
              <button
                className={`${styles.filterButton} ${vegFilter === "veg" ? styles.active : ''}`}
                onClick={() => setVegFilter("veg")}
              >
                🟢 Veg
              </button>
              <button
                className={`${styles.filterButton} ${vegFilter === "non-veg" ? styles.active : ''}`}
                onClick={() => setVegFilter("non-veg")}
              >
                🔴 Non-Veg
              </button>
            </div>
          </div>

          {/* Category Filter (Retail/Produce) */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Category:</label>
            <div className={styles.filterButtons}>
              <button
                className={`${styles.filterButton} ${categoryFilter === "all" ? styles.active : ''}`}
                onClick={() => setCategoryFilter("all")}
              >
                All
              </button>
              <button
                className={`${styles.filterButton} ${categoryFilter === "retail" ? styles.active : ''}`}
                onClick={() => setCategoryFilter("retail")}
              >
                Retail
              </button>
              <button
                className={`${styles.filterButton} ${categoryFilter === "produce" ? styles.active : ''}`}
                onClick={() => setCategoryFilter("produce")}
              >
                Produce
              </button>
            </div>
          </div>

          {/* Type Filter */}
          {uniqueTypes.length > 0 && (
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Type:</label>
              <div className={styles.filterButtons}>
                <button
                  className={`${styles.filterButton} ${!selectedType ? styles.active : ''}`}
                  onClick={() => {
                    setSelectedType(null);
                    setSelectedSubtype(null);
                  }}
                >
                  All
                </button>
                {uniqueTypes.map(type => (
                  <button
                    key={type}
                    className={`${styles.filterButton} ${selectedType === type ? styles.active : ''}`}
                    onClick={() => setSelectedType(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subtype Filter (only shown when a type is selected) */}
          {selectedType && uniqueSubtypes.length > 0 && (
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Subtype:</label>
              <div className={styles.filterButtons}>
                <button
                  className={`${styles.filterButton} ${!selectedSubtype ? styles.active : ''}`}
                  onClick={() => setSelectedSubtype(null)}
                >
                  All
                </button>
                {uniqueSubtypes.map(subtype => (
                  <button
                    key={subtype}
                    className={`${styles.filterButton} ${selectedSubtype === subtype ? styles.active : ''}`}
                    onClick={() => setSelectedSubtype(subtype)}
                  >
                    {subtype.charAt(0).toUpperCase() + subtype.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className={styles.itemsContainer}>
        {filteredItems.length === 0 ? (
          <div className={styles.noResults}>
            {isSearching ? "No items found matching your search" : "No items available"}
          </div>
        ) : isSearching ? (
          // When searching, show items in a flat grid without grouping
          <div className={styles.itemsGrid}>
            {filteredItems.map(item => {
              const quantity = getItemQuantity(item.itemId, item.category);
              const isFav = isItemFavourited(item);
              return (
                <div 
                  key={item.itemId} 
                  className={styles.itemCard}
                >
                  <div className={styles.itemCardContent} onClick={() => handleItemClick(item)}>
                    <DishCard
                      dishName={item.name}
                      price={item.price}
                      image={item.image || '/images/coffee.jpeg'}
                      variant="list"
                    />
                    <div className={styles.itemDetails}>
                      {(item.type || item.subtype) && (
                        <p className={styles.itemMeta}>
                          {item.type}
                          {item.subtype ? ` • ${item.subtype}` : ''}
                        </p>
                      )}
                      <p className={styles.itemVeg} style={{ 
                        color: (item.isVeg !== false) ? '#22c55e' : '#ef4444',
                      }}>
                        {(item.isVeg !== false) ? '🟢 Veg' : '🔴 Non-Veg'}
                      </p>
                      <p className={styles.itemDescription}>
                        {item.description || '\u00A0'}
                      </p>
                      <div className={styles.belowdish}>
                        <div>
                          {item.quantity !== undefined && (
                            <p className={styles.quantity}>Available: {item.quantity}</p>
                          )}
                        </div>
                        {userData && (
                          <button 
                            className={styles.heart} 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavourite(item);
                            }}
                          >
                            {isFav ? <FaHeart color="#4ea199" /> : <FaRegHeart color="#4ea199" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {userData && (
                    <div className={styles.cartControls}>
                      {quantity > 0 ? (
                        <>
                          <button 
                            className={styles.quantityButton}
                            onClick={() => handleDecreaseQuantity(item)}
                          >
                            -
                          </button>
                          <span className={styles.quantity}>{quantity}</span>
                          <button 
                            className={styles.quantityButton}
                            onClick={() => handleAddToCart(item)}
                          >
                            +
                          </button>
                        </>
                      ) : (
                        <button 
                          className={styles.addToCartButton}
                          onClick={() => handleAddToCart(item)}
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // When not searching, show items organized by type and subtype
          sortedTypes.map(type => {
            const subtypes = groupedItems[type];
            return (
              <div key={type} className={styles.typeSection}>
                <h2 className={styles.typeHeader}>{type}</h2>
                {Object.entries(subtypes).map(([subtype, items]) => (
                  <div key={`${type}-${subtype}`} className={styles.subtypeSection}>
                    {subtype !== "Other" && (
                      <h3 className={styles.subtypeHeader}>{subtype}</h3>
                    )}
                    <div className={styles.itemsGrid}>
                      {items.map(item => {
                        const quantity = getItemQuantity(item.itemId, item.category);
                        const isFav = isItemFavourited(item);
                        console.log('[DEBUG] UI itemId:', item.itemId, 'UI vendorId:', getRealVendorId(item), 'isFav:', isFav);
                        return (
                          <div 
                            key={item.itemId} 
                            className={styles.itemCard}
                          >
                            <div className={styles.itemCardContent} onClick={() => handleItemClick(item)}>
                              <DishCard
                                dishName={item.name}
                                price={item.price}
                                image={item.image || '/images/coffee.jpeg'}
                                variant="list"
                              />
                              <div className={styles.itemDetails}>
                                <p className={styles.itemVeg} style={{ 
                                  color: (item.isVeg !== false) ? '#22c55e' : '#ef4444',
                                }}>
                                  {(item.isVeg !== false) ? '🟢 Veg' : '🔴 Non-Veg'}
                                </p>
                                <p className={styles.itemDescription}>
                                  {item.description || '\u00A0'}
                                </p>
                                <div className={styles.belowdish}>
                                  <div>
                                    {item.quantity !== undefined && (
                                      <p className={styles.quantity}>Available: {item.quantity}</p>
                                    )}
                                  </div>
                                  {userData && (
                                    <button 
                                      className={styles.heart} 
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevents navigating to item detail
                                        toggleFavourite(item);
                                      }}
                                    >
                                      {isFav ? <FaHeart color="#4ea199" /> : <FaRegHeart color="#4ea199" />}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            {userData && (
                              <div className={styles.cartControls}>
                                {quantity > 0 ? (
                                  <>
                                    <button 
                                      className={styles.quantityButton}
                                      onClick={() => handleDecreaseQuantity(item)}
                                    >
                                      -
                                    </button>
                                    <span className={styles.quantity}>{quantity}</span>
                                    <button 
                                      className={styles.quantityButton}
                                      onClick={() => handleAddToCart(item)}
                                    >
                                      +
                                    </button>
                                  </>
                                ) : (
                                  <button 
                                    className={styles.addToCartButton}
                                    onClick={() => handleAddToCart(item)}
                                  >
                                    Add to Cart
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VendorPage; 