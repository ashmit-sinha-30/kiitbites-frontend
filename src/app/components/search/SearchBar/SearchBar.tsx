"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaSearch, FaArrowLeft } from "react-icons/fa";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DishListItemV2 from "../../food/DishListItem/DishListItemV2";
import { Store, X, CheckCircle2 } from "lucide-react";
import styles from "./SearchBar.module.scss";
import { useSearchCart } from '../../context/SearchCartContext';
import { FoodItem as SharedFoodItem } from "@/app/home/[slug]/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface University {
  _id: string;
  fullName: string;
}

interface FoodItem {
  _id: string;
  name: string;
  type: string;
  subtype?: string;
  price: number;
  image: string;
  isSpecial: string;
  vendorId?: {
    location?: string;
  };
}

interface VendorItem {
  itemId: string;
  name: string;
  price: number;
  image?: string;
  type?: string;
  subtype?: string;
  quantity?: number;
  isAvailable?: string;
  _id?: string;
  id?: string;
}

interface VendorData {
  success: boolean;
  foodCourtName: string;
  message?: string;
  data: {
    retailItems: VendorItem[];
    produceItems: VendorItem[];
  };
}

export interface SearchResult {
  _id?: string;
  id: string;
  itemId?: string;
  name: string;
  title: string;
  price: number;
  image: string;
  type: string;
  subtype?: string;
  category: string;
  isSpecial: boolean;
  vendorId?: string;
  isVendor?: boolean;
  kind: string;
  quantity: number;
  source?: string;
}

interface SearchResponse {
  message?: string;
  youMayAlsoLike?: SearchResult[];
}

interface SearchBarProps {
  hideUniversityDropdown?: boolean;
  placeholder?: string;
  vendorId?: string;
  universityId?: string;
  clearSearch?: () => void;
  onSearchResults?: (results: VendorItem[]) => void;
}

interface Vendor {
  _id: string;
  name: string;
  price: number;
  inventoryValue?: {
    price: number;
    quantity?: number;
    isAvailable?: string;
  };
}

const SearchBar: React.FC<SearchBarProps> = ({
  hideUniversityDropdown = false,
  placeholder = "Search for food or vendors...",
  vendorId,
  universityId,
  clearSearch,
  onSearchResults
}) => {
  const [query, setQuery] = useState<string>("");
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [popularFoods, setPopularFoods] = useState<FoodItem[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [suggestedItems, setSuggestedItems] = useState<SearchResult[]>([]);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [availableVendors, setAvailableVendors] = useState<Vendor[]>([]);
  // const [selectedUniversityInternal, setSelectedUniversityInternal] = useState<string>("");

  // Normalize name for matching
  const normalizeName = (name: string) =>
    name
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "";

  const handleBack = () => {
    if (vendorId) {
      // Use the local query if the user has typed something, 
      // otherwise fall back to the search param from the URL
      const backQuery = query || searchParams.get("search") || "";
      router.push(`/search?search=${encodeURIComponent(backQuery)}`);
      return;
    }

    if (isAuthenticated && (selectedUniversity || universityId)) {
      const targetUniId = selectedUniversity || universityId;
      const uni = universities.find(u => u._id === targetUniId);
      if (uni) {
        const slug = normalizeName(uni.fullName);
        router.push(`/home/${slug}?cid=${uni._id}`);
        return;
      }
    }
    router.push("/");
  };
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { searchCartItems, addToSearchCart } = useSearchCart();
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const lastSearchedQuery = useRef<string>("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
    };
    checkAuth();
    // Add event listener for storage changes
    window.addEventListener('storage', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (universityId) {
      setSelectedUniversity(universityId);
    }
  }, [universityId]);

  useEffect(() => {
    // Sync query from URL - only if NOT on vendor page
    // This provides a "clear view" initially when entering a vendor
    if (!vendorId) {
      const q = searchParams.get("search") || "";
      setQuery(q);
    }
  }, [searchParams, vendorId]); // Stable dependency count

  // Search foods and vendors
  const fetchSearchResults = useCallback(async (searchText: string) => {
    // If we're in a vendor page, we don't need university ID
    if (vendorId) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/item/getvendors/${vendorId}`);

        if (!response.ok) {
          console.error("Vendor search failed:", response.status);
          setSearchResults([]);
          setSuggestedItems([]);
          if (onSearchResults) onSearchResults([]);
          return;
        }

        let data: VendorData;
        try {
          data = await response.json();
        } catch (e) {
          console.error("Failed to parse vendor data:", e);
          setSearchResults([]);
          setSuggestedItems([]);
          if (onSearchResults) onSearchResults([]);
          return;
        }

        if (!data.success) {
          console.error("Vendor data fetch failed:", data.message);
          setSearchResults([]);
          setSuggestedItems([]);
          if (onSearchResults) onSearchResults([]);
          return;
        }

        const allVendorItems = [
          ...(data.data.retailItems || []).map((item: VendorItem) => ({
            ...item,
            type: 'retail',
            itemId: item.itemId || item._id || item.id || ''
          })),
          ...(data.data.produceItems || []).map((item: VendorItem) => ({
            ...item,
            type: 'produce',
            itemId: item.itemId || item._id || item.id || ''
          }))
        ].filter(item => item.itemId && item.itemId !== '');

        console.log('DEBUG: Raw vendor data:', data.data);
        console.log('DEBUG: allVendorItems structure:', allVendorItems.map(item => ({
          itemId: item.itemId,
          name: item.name,
          type: item.type,
          _id: item._id,
          id: item.id
        })));

        if (!searchText.trim()) {
          const results = allVendorItems
            .map(item => ({
              id: item.itemId,
              name: item.name,
              title: item.name,
              price: item.price || 0,
              image: item.image || '/images/coffee.jpeg',
              type: item.type || 'retail',
              subtype: item.subtype,
              category: item.type || 'retail',
              isSpecial: false,
              isVendor: false,
              kind: item.type === 'retail' ? 'Retail' : 'Produce',
              quantity: 1,
              vendorId: vendorId
            }));
          setSearchResults(results);
          setSuggestedItems([]);
          // Ensure items have the correct structure for vendor page
          const vendorItems = allVendorItems
            .filter(item => item.itemId && item.itemId !== '') // Filter out items without valid itemId
            .map(item => ({
              itemId: item.itemId,
              name: item.name,
              type: item.type,
              price: item.price,
              image: item.image,
              quantity: item.quantity,
              isAvailable: item.isAvailable
              // vendorId intentionally omitted
            }));
          console.log('DEBUG: Filtered vendor items:', vendorItems.map(item => ({
            itemId: item.itemId,
            name: item.name,
            type: item.type
          })));
          if (onSearchResults) onSearchResults(vendorItems);
          return;
        }

        const searchLower = searchText.toLowerCase();
        const exactMatches = allVendorItems.filter(item =>
          item.name.toLowerCase().includes(searchLower)
        );

        const matchedTypes = new Set(exactMatches.map(item => item.type));
        const suggestions = allVendorItems.filter(item =>
          matchedTypes.has(item.type) && !exactMatches.some(match => match.itemId === item.itemId)
        );

        const results = exactMatches
          .map(item => ({
            id: item.itemId,
            name: item.name,
            title: item.name,
            price: item.price || 0,
            image: item.image || '/images/coffee.jpeg',
            type: item.type || 'retail',
            subtype: item.subtype,
            category: item.type || 'retail',
            isSpecial: false,
            isVendor: false,
            kind: item.type === 'retail' ? 'Retail' : 'Produce',
            quantity: 1,
            vendorId: vendorId
          }));
        setSearchResults(results);

        const suggestedResults = suggestions
          .map(item => ({
            id: item.itemId,
            name: item.name,
            title: item.name,
            price: item.price || 0,
            image: item.image || '/images/coffee.jpeg',
            type: item.type || 'retail',
            subtype: item.subtype,
            category: item.type || 'retail',
            isSpecial: false,
            isVendor: false,
            kind: item.type === 'retail' ? 'Retail' : 'Produce',
            quantity: 1,
            vendorId: vendorId
          }));
        setSuggestedItems(suggestedResults);

        console.log('DEBUG: Passing to vendor page:', exactMatches.map(item => ({
          itemId: item.itemId,
          name: item.name,
          type: item.type
        })));
        // Ensure items have the correct structure for vendor page
        const vendorItems = exactMatches
          .filter(item => item.itemId && item.itemId !== '') // Filter out items without valid itemId
          .map(item => ({
            itemId: item.itemId,
            name: item.name,
            type: item.type,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            isAvailable: item.isAvailable
            // vendorId intentionally omitted
          }));
        console.log('DEBUG: Filtered vendor items (search):', vendorItems.map(item => ({
          itemId: item.itemId,
          name: item.name,
          type: item.type
        })));
        if (onSearchResults) onSearchResults(vendorItems);
      } catch (error) {
        console.error("Error fetching vendor search results:", error);
        setSearchResults([]);
        setSuggestedItems([]);
        if (onSearchResults) onSearchResults([]);
      }
      return;
    }

    // For normal search, we need a university ID
    if (!selectedUniversity && !hideUniversityDropdown) {
      console.log("No university selected, skipping search");
      return;
    }

    try {
      const [itemsRes, vendorsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/item/search/items?query=${encodeURIComponent(searchText)}&uniID=${selectedUniversity}&searchByType=true`),
        fetch(`${BACKEND_URL}/api/item/search/vendors?query=${encodeURIComponent(searchText)}&uniID=${selectedUniversity}`)
      ]);

      if (!itemsRes.ok || !vendorsRes.ok) {
        throw new Error(`HTTP error! status: ${itemsRes.status} ${vendorsRes.status}`);
      }

      const [itemsData, vendorsData] = await Promise.all([
        itemsRes.json(),
        vendorsRes.json()
      ]);

      let items: SearchResult[] = [];
      let suggestions: SearchResult[] = [];

      if ('message' in itemsData && itemsData.youMayAlsoLike) {
        suggestions = (itemsData as SearchResponse).youMayAlsoLike || [];
      } else if (Array.isArray(itemsData)) {
        items = itemsData.filter(item => !item.isTypeMatch);
        suggestions = itemsData.filter(item => item.isTypeMatch);
      }

      const vendors = Array.isArray(vendorsData) ? vendorsData.map(vendor => ({
        ...vendor,
        isVendor: true
      })) : [];

      setSearchResults([...items, ...vendors]);
      setSuggestedItems(suggestions);
    } catch (error) {
      console.error("Error fetching search results:", error);
      setSearchResults([]);
      setSuggestedItems([]);
      if (onSearchResults) onSearchResults([]);
    }
  }, [vendorId, selectedUniversity, hideUniversityDropdown, onSearchResults]);

  // Trigger search when query is set from URL params (e.g., on page refresh)
  useEffect(() => {
    const searchQuery = searchParams.get("search") || "";

    // Skip if this is the same query we just searched (prevents duplicate searches)
    if (searchQuery === lastSearchedQuery.current) {
      return;
    }

    if (searchQuery.trim()) {
      // For vendor pages, we DON'T trigger search automatically from URL params
      // unless the user has actually typed something (which is handled by handleInputChange)
      // This ensures they see the full menu initially
      if (vendorId) {
        // Just clear results to be safe, or do nothing
        return;
      }
      // For normal search, wait until university is selected
      else if (selectedUniversity || hideUniversityDropdown) {
        lastSearchedQuery.current = searchQuery;
        fetchSearchResults(searchQuery);
      }
    } else {
      // Clear results if no search query
      lastSearchedQuery.current = "";
      setSearchResults([]);
      setSuggestedItems([]);
      if (onSearchResults) onSearchResults([]);
    }
  }, [
    searchParams,
    selectedUniversity,
    vendorId,
    hideUniversityDropdown,
    fetchSearchResults,
    onSearchResults
  ]);

  // Load universities and user data
  useEffect(() => {
    if (hideUniversityDropdown) return;

    const fetchUniversities = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/user/auth/list`);
        const data = await res.json();
        setUniversities(data);

        // If user is not authenticated, select the first college
        if (!isAuthenticated && data.length > 0) {
          setSelectedUniversity(data[0]._id);
        }
      } catch (err) {
        console.error("Failed to load universities:", err);
      }
    };

    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
      try {
        const res = await fetch(`${BACKEND_URL}/api/user/auth/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const user = await res.json();
        if (user?.uniID) {
          setSelectedUniversity(user.uniID);
          setIsAuthenticated(true);
        } else {
          console.warn("No uniID found in user object");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setIsAuthenticated(false);
      }
    };

    fetchUniversities();
    fetchUser();
  }, [hideUniversityDropdown, isAuthenticated]);

  // Load popular foods
  useEffect(() => {
    if (!selectedUniversity || hideUniversityDropdown) return;

    const fetchPopularFoods = async () => {
      try {
        const [retailRes, produceRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/item/retail/uni/${selectedUniversity}`),
          fetch(`${BACKEND_URL}/api/item/produce/uni/${selectedUniversity}`),
        ]);

        const [retailData, produceData] = await Promise.all([
          retailRes.json(),
          produceRes.json(),
        ]);

        const combined = [...retailData.items, ...produceData.items];
        setPopularFoods(combined.slice(0, 24));
      } catch (error) {
        console.error("Error fetching popular foods:", error);
      }
    };

    fetchPopularFoods();
  }, [selectedUniversity, hideUniversityDropdown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    lastSearchedQuery.current = value;
    router.push(`?search=${value}`, undefined);

    // Debounce search
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      fetchSearchResults(value);
    }, 300); // 300ms debounce
  };

  const handleSelectSuggestion = async (foodName: string) => {
    // 1. Update UI state immediately
    setQuery(foodName);
    lastSearchedQuery.current = foodName;

    // 2. Clear any pending debounced searches
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // 3. Trigger search and navigation
    router.push(`?search=${foodName}`, undefined);
    fetchSearchResults(foodName);

    // Track analytics in background without blocking UI
    fetch(`${BACKEND_URL}/api/increase-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foodName }),
    }).catch(err => console.error("Failed to track search:", err));
  };

  const handleUniversityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUniversity(e.target.value);
  };

  const handleVendorClick = (vendorId: string) => {
    const url = query
      ? `/vendor/${vendorId}?search=${encodeURIComponent(query)}`
      : `/vendor/${vendorId}`;
    router.push(url);
  };

  const handleAddToCart = async (item: SearchResult) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    setSelectedItem(item);
    console.log('Selected item:', item);

    const itemId = item.id || item._id || item.itemId;
    if (!itemId) {
      console.error('Item missing ID:', item);
      toast.error('Invalid item ID');
      return;
    }

    // If in vendor mode, add directly to cart with vendorId and skip modal
    if (vendorId) {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error('Please login to add items to cart');
        return;
      }
      try {
        // Get user info
        const response = await fetch(`${BACKEND_URL}/api/user/auth/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          toast.error('Failed to get user info');
          return;
        }
        const user = await response.json();
        if (!user._id) {
          toast.error('Invalid user data');
          return;
        }
        // Add to cart directly
        await addToSearchCart(user._id, item, vendorId);
      } catch (error) {
        console.error('Error adding to cart:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to add item to cart');
      }
      return;
    }

    // If not in vendor mode, show vendor selection modal or check existing cart vendor
    try {
      // Fetch vendors for the selected item
      const response = await fetch(`${BACKEND_URL}/api/item/vendors/${item.id || item._id || item.itemId}`);
      if (!response.ok) {
        toast.error('Failed to fetch vendors for this item');
        return;
      }
      const fetchedVendors: Vendor[] = await response.json();

      // Check if cart has items from another vendor
      const confirmedVendorId = searchCartItems.length > 0 ? searchCartItems[0].vendorId : null;

      if (confirmedVendorId) {
        const vendor = fetchedVendors.find(v => v._id === confirmedVendorId);
        if (vendor) {
          // Item available in current vendor -> Add directly
          const token = localStorage.getItem("token");
          if (!token) {
            toast.error('Please login to add items to cart');
            return;
          }
          const userRes = await fetch(`${BACKEND_URL}/api/user/auth/user`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!userRes.ok) {
            toast.error('Failed to get user info');
            return;
          }
          const user = await userRes.json();
          await addToSearchCart(user._id, item, confirmedVendorId);
          return;
        } else {
          // Item NOT available in current vendor -> Show error "Item not available in {vendorName}"
          try {
            const vRes = await fetch(`${BACKEND_URL}/api/vendor/${confirmedVendorId}`);
            if (vRes.ok) {
              const vData = await vRes.json();
              toast.error(`Item not available in ${vData.fullName || vData.name || 'your current vendor'}`);
            } else {
              toast.error('Item not available in your current vendor');
            }
          } catch {
            toast.error('Item not available in your current vendor');
          }
          return;
        }
      }

      // No confirmed vendor -> Show selection modal
      setAvailableVendors(fetchedVendors);
      setSelectedVendor(null); // Ensure no auto-selection
      setShowVendorModal(true);
    } catch (error) {
      console.error('Error in handleAddToCart:', error);
      toast.error('Failed to process request');
    }
  };

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
  };

  const handleVendorConfirm = async () => {
    if (!selectedVendor || !selectedItem) {
      toast.error('Please select a vendor and item');
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error('Please login to add items to cart');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/user/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        toast.error('Failed to get user info');
        return;
      }
      const user = await response.json();

      if (!user._id) {
        toast.error('Invalid user data');
        return;
      }

      if (!selectedItem._id && !selectedItem.id) {
        toast.error('Invalid item data');
        return;
      }

      console.log('Adding to cart:', {
        user: user._id,
        item: selectedItem,
        vendor: selectedVendor._id
      });

      // Add to cart with all required parameters
      await addToSearchCart(
        user._id,
        selectedItem,
        selectedVendor._id
      );
      setShowVendorModal(false);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add item to cart');
    }
  };

  const handleCancel = () => {
    setShowVendorModal(false);
    setSelectedVendor(null);
    setAvailableVendors([]);
  };

  // Find cart item and its quantity
  const getCartItemQuantity = (itemId: string) => {
    const cartItem = searchCartItems.find(item => item.id === itemId);
    return cartItem?.quantity || 0;
  };

  // const handleClearSearch = () => {
  //   setQuery("");
  //   setSearchResults([]);
  //   setSuggestedItems([]);
  //   router.push("?", undefined);
  //   if (onSearchResults) onSearchResults([]);
  // };

  const handleClearSearch = () => {
    setQuery("");
    lastSearchedQuery.current = "";
    setSearchResults([]);
    setSuggestedItems([]);
    router.push("?", undefined);
    if (onSearchResults) onSearchResults([]);

    if (clearSearch) {
      clearSearch(); // ✅ Call custom clear handler from parent (like VendorPage)
    }
  };


  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className={styles.mainContainer}>
        <div className={styles.container}>
          <div className={styles.header}>
            <button className={styles.backButton} onClick={handleBack} aria-label="Go back">
              <FaArrowLeft />
            </button>
            {!hideUniversityDropdown && (
              <div className={`${styles.selectBar} ${query !== "" ? styles.selectBarHidden : ""}`}>
                {selectedUniversity ? (
                  <select
                    value={selectedUniversity}
                    onChange={handleUniversityChange}
                    className={styles.dropdown}
                    disabled={!isAuthenticated}
                  >
                    {universities.map((uni) => (
                      <option key={uni._id} value={uni._id}>
                        {uni.fullName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select disabled className={styles.dropdown}>
                    <option>Loading Universities...</option>
                  </select>
                )}
              </div>
            )}

            <div className={`${styles.searchBar} ${query !== "" ? styles.searchBarFull : ""}`}>
              <div className={styles.searchInputContainer}>
                <FaSearch className={styles.searchIcon} />
                <input
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  placeholder={placeholder}
                  className={styles.searchInput}
                />
                {query && (
                  <button
                    className={styles.clearButton}
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {query === "" && !hideUniversityDropdown ? (
            <div className={styles.popularChoices}>
              <h2 className="text-xl font-bold mb-6">Popular Choices</h2>
              <div className={styles.popularGrid}>
                {Array.isArray(popularFoods) && popularFoods.map((food) => {
                  // Map FoodItem to DishListItemV2 expected format
                  const itemForList: SharedFoodItem = {
                    id: food._id,
                    title: food.name,
                    price: food.price,
                    image: food.image,
                    description: "",
                    isVeg: true,
                    type: food.type as 'retail' | 'produce',
                    category: food.type,
                    isSpecial: food.isSpecial,
                    isAvailable: food.isSpecial === 'true' ? 'Y' : 'Y',
                    quantity: 10
                  };

                  return (
                    <div key={food._id} onClick={() => handleSelectSuggestion(food.name)}>
                      <DishListItemV2
                        item={itemForList}
                        quantity={0}
                        showActions={false}
                        onAdd={() => handleSelectSuggestion(food.name)}
                        onIncrease={() => { }}
                        onDecrease={() => { }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={styles.searchResults}>
              {searchResults.length > 0 && (
                <div className={styles.resultsGrid}>
                  {searchResults.map((item) => {
                    const quantity = getCartItemQuantity(item._id || item.id);

                    if (item.isVendor) {
                      return (
                        <div key={item._id || item.id} className={styles.vendorCard}>
                          <h3 className="font-semibold">{item.name}</h3>
                          <button
                            className={styles.checkMenuButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVendorClick(item._id!);
                            }}
                          >
                            Check Menu
                          </button>
                        </div>

                      );
                    }

                    // Map SearchResult to SharedFoodItem
                    const itemForList: SharedFoodItem = {
                      id: item._id || item.id,
                      title: item.name,
                      price: item.price || 0,
                      image: item.image || '/images/coffee.jpeg',
                      description: "",
                      isVeg: true,
                      type: item.type as 'retail' | 'produce' || 'retail',
                      category: item.category || item.type || 'retail',
                      isSpecial: item.isSpecial ? 'true' : 'false',
                      isAvailable: 'Y',
                      quantity: 10,
                      source: item.source
                    };

                    return (
                      <div key={item._id || item.id}>
                        <DishListItemV2
                          item={itemForList}
                          quantity={quantity}
                          onAdd={() => handleAddToCart(item)}
                          onIncrease={() => handleAddToCart(item)}
                          onDecrease={() => { }} // SearchCartContext needs decrease support or handle via SearchQuantityControls if kept
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {suggestedItems.length > 0 && (
                <div className={styles.suggestedItems}>
                  <h2 className="text-xl font-bold">You may also like</h2>
                  <div className={styles.resultsGrid}>
                    {suggestedItems.map((item) => {
                      const itemForList: SharedFoodItem = {
                        id: item._id || item.id,
                        title: item.name,
                        price: item.price || 0,
                        image: item.image || '/images/coffee.jpeg',
                        description: "",
                        isVeg: true,
                        type: item.type as 'retail' | 'produce' || 'retail',
                        category: item.category || item.type || 'retail',
                        isSpecial: item.isSpecial ? 'true' : 'false',
                        isAvailable: 'Y',
                        quantity: 10,
                        source: item.source
                      };

                      return (
                        <div key={item._id || item.id} onClick={() => handleSelectSuggestion(item.name)}>
                          <DishListItemV2
                            item={itemForList}
                            quantity={0}
                            showActions={false}
                            onAdd={() => handleSelectSuggestion(item.name)}
                            onIncrease={() => { }}
                            onDecrease={() => { }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {query !== "" && searchResults.length === 0 && suggestedItems.length === 0 && (
                <div className={styles.noResults}>
                  <p>No results found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showVendorModal && (
        <div className={styles.modalOverlay} onClick={handleCancel}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.vendorModalHeader}>
              <div className={styles.vendorModalTitleWrapper}>
                <Store className={styles.vendorModalIcon} size={28} />
                <h2 className={styles.vendorModalTitle}>Select Vendor</h2>
              </div>
              <button
                className={styles.vendorModalCloseButton}
                onClick={handleCancel}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {availableVendors.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading vendors...</p>
              </div>
            ) : (
              <div className={styles.vendorList}>
                {availableVendors.map((vendor) => (
                  <div
                    key={vendor._id}
                    className={`${styles.vendorCard} ${selectedVendor?._id === vendor._id ? styles.vendorCardSelected : ""
                      }`}
                    onClick={() => handleVendorSelect(vendor)}
                  >
                    <div className={styles.vendorCardContent}>
                      <div className={styles.vendorCardInfo}>
                        <div className={styles.vendorCardIconWrapper}>
                          <Store className={styles.vendorCardIcon} size={24} />
                        </div>
                        <div className={styles.vendorCardDetails}>
                          <h3 className={styles.vendorCardName}>{vendor.name}</h3>
                          <div className={styles.vendorCardPriceWrapper}>
                            <span className={styles.vendorCardPriceLabel}>Price:</span>
                            <span className={styles.vendorCardPrice}>₹{vendor.price}</span>
                          </div>
                        </div>
                      </div>
                      {selectedVendor?._id === vendor._id && (
                        <div className={styles.vendorCardCheck}>
                          <CheckCircle2 size={24} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.modalButtons}>
              <button className={styles.cancelButton} onClick={handleCancel}>
                Cancel
              </button>
              <button
                className={styles.confirmButton}
                onClick={handleVendorConfirm}
                disabled={!selectedVendor}
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </Suspense>
  );
};

export default SearchBar;