"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, AlertCircle, GraduationCap } from "lucide-react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./styles/global.css";
import styles from "./styles/CollegePage.module.scss";
import homeStyles from "../../home/styles/Home.module.scss";
import { useEffect, useRef, useState, useCallback } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FavoritesSection from "./components/FavoritesSection";
import SpecialOffersSection from "./components/SpecialOffersSection";
import CategorySection from "./components/CategorySection";
import { CartProvider } from "./context/CartContext";
import {
  FoodItem,
  FavoriteItem,
  College,
  ApiFavoritesResponse,
} from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

// Categories will be dynamically generated from fetched items

// Normalize college name for matching
const normalizeName = (name: string) =>
  name
    ?.toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-") || "";

const CustomPrevArrow = (props: { onClick?: () => void }) => (
  <button
    onClick={props.onClick}
    className={`${styles.carouselButton} ${styles.prevButton}`}
  >
    <ChevronLeft size={20} />
  </button>
);

const CustomNextArrow = (props: { onClick?: () => void }) => (
  <button
    onClick={props.onClick}
    className={`${styles.carouselButton} ${styles.nextButton}`}
  >
    <ChevronRight size={20} />
  </button>
);

const CollegePageClient = ({ slug = "" }: { slug?: string }) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  console.log('Original slug:', slug);
  console.log('Slug type:', typeof slug);
  console.log('Slug length:', slug.length);

  const formatCollegeName = (name: string) => {
    if (!name) return '';
    console.log('Formatting name:', name);
    // Split by hyphens and capitalize each word
    const formatted = name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    console.log('Formatted result:', formatted);
    return formatted;
  };

  // Get college name from URL path
  const getCollegeNameFromPath = () => {
    const parts = pathname.split('/');
    const collegeSlug = parts[parts.length - 1];
    console.log('College slug from path:', collegeSlug);
    return collegeSlug;
  };

  const collegeName = formatCollegeName(getCollegeNameFromPath());

  const [uniId, setUniId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userFullName, setUserFullName] = useState<string>("");
  const [items, setItems] = useState<{ [key: string]: FoodItem[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userFavorites, setUserFavorites] = useState<FavoriteItem[]>([]);
  const [vendorSpecialItems, setVendorSpecialItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<{ retail: string[]; produce: string[] }>({ retail: [], produce: [] });
  const [categorySubtypes, setCategorySubtypes] = useState<{ [key: string]: string[] }>({});

  const currentRequest = useRef<number>(0);

  // Update URL with college ID
  const updateUrlWithCollegeId = useCallback((collegeId: string) => {
    const currentPath = window.location.pathname;
    const newUrl = `${currentPath}?cid=${collegeId}`;
    window.history.replaceState({}, "", newUrl);
  }, []);

  // Get college list and match collegeName to get actual college id
  const fetchCollegesAndSetUniId = useCallback(async (collegeSlug: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/user/auth/list`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch colleges");
      const colleges = (await response.json()) as College[];

      // Normalize the input slug
      const normalizedSlug = normalizeName(collegeSlug);

      // Find the college that matches the normalized slug
      const matchedCollege = colleges.find((college) => {
        const normalizedCollegeName = normalizeName(college.name);
        return normalizedCollegeName === normalizedSlug;
      });

      if (matchedCollege) {
        setUniId(matchedCollege._id);
        localStorage.setItem("currentCollegeId", matchedCollege._id);
        updateUrlWithCollegeId(matchedCollege._id);
        setLoading(false);
        return true;
      } else {
        // Only set error if we've actually tried to load the data
        if (colleges.length > 0) {
          setError(`College not found: ${collegeSlug}`);
        }
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.error("Error fetching colleges:", err);
      setError("Failed to load college information");
      setLoading(false);
      return false;
    }
  }, [updateUrlWithCollegeId]);

  // Extract cid from searchParams for stable dependency
  const cid = searchParams.get("cid");

  // On load, determine uniId from multiple sources:
  useEffect(() => {
    let isMounted = true;

    const resolveCollegeId = async () => {
      const localCollegeId = localStorage.getItem("currentCollegeId");

      if (cid) {
        if (cid.length < 10) {
          try {
            const response = await fetch(`${BACKEND_URL}/api/user/auth/list`, {
              credentials: "include",
            });
            if (!response.ok) throw new Error("Failed to fetch colleges");
            const colleges = (await response.json()) as College[];
            const found = colleges.find((c) => c._id.startsWith(cid));
            if (found && isMounted) {
              setUniId(found._id);
              localStorage.setItem("currentCollegeId", found._id);
              updateUrlWithCollegeId(found._id);
              return;
            }
          } catch {}
        } else {
          if (isMounted) {
            setUniId(cid);
            localStorage.setItem("currentCollegeId", cid);
            updateUrlWithCollegeId(cid);
          }
          return;
        }
      }

      if (slug) {
        const success = await fetchCollegesAndSetUniId(slug);
        if (success) return;
      }

      if (localCollegeId && isMounted) {
        setUniId(localCollegeId);
        updateUrlWithCollegeId(localCollegeId);
      }
    };

    resolveCollegeId();

    return () => {
      isMounted = false;
    };
  }, [slug, cid, fetchCollegesAndSetUniId, updateUrlWithCollegeId]);

  // Fetch user & favorites
  useEffect(() => {
    const fetchUserAndFavorites = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token || !uniId) return;

        // Fetch user data
        const userResponse = await fetch(`${BACKEND_URL}/api/user/auth/user`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!userResponse.ok) return;
        const userData = await userResponse.json();
        setUserFullName(userData.fullName);
        setUserId(userData._id);

        // Fetch favorites using the new API endpoint
        const favoritesResponse = await fetch(
          `${BACKEND_URL}/fav/${userData._id}/${uniId}`,
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!favoritesResponse.ok) return;
        const favoritesData =
          (await favoritesResponse.json()) as ApiFavoritesResponse;
        setUserFavorites(favoritesData.favourites);
      } catch (err) {
        console.error("Error fetching user or favorites:", err);
        setUserFavorites([]);
      }
    };
    fetchUserAndFavorites();
  }, [uniId]);

  // Fetch food items for given uniId and categories
  useEffect(() => {
    if (!uniId) {
      console.log('No uniId available, skipping item fetch');
      return;
    }

    console.log('Fetching items for uniId:', uniId);
    const requestId = ++currentRequest.current;

    const fetchItems = async () => {
      setLoading(true);
      setError(null);

      const allItems: { [key: string]: FoodItem[] } = {};

      try {
        // Fetch sort order for university-wide menu
        let sortOrder: { itemId: string; sortIndex: number }[] = [];
        let typeOrder: { category: string; type: string; sortIndex: number }[] = [];
        let subtypeOrder: { category: string; type: string; subtype: string; sortIndex: number }[] = [];
        try {
          const sortRes = await fetch(
            `${BACKEND_URL}/api/menu-sort/order?uniId=${uniId}&vendorId=null`
          );
          if (sortRes.ok) {
            const sortData = await sortRes.json();
            if (sortData.success && sortData.data) {
              if (sortData.data.itemOrder) {
                sortOrder = sortData.data.itemOrder.map((item: { itemId: string; sortIndex: number }) => ({
                  itemId: item.itemId,
                  sortIndex: item.sortIndex,
                }));
              }
              if (sortData.data.typeOrder) {
                typeOrder = sortData.data.typeOrder;
              }
              if (sortData.data.subtypeOrder) {
                subtypeOrder = sortData.data.subtypeOrder;
              }
            }
          }
        } catch (err) {
          console.error("Error fetching sort order:", err);
          // Continue without sort order if it fails
        }

        // Create sort maps for quick lookup
        const sortMap = new Map<string, number>();
        sortOrder.forEach((item) => {
          sortMap.set(item.itemId, item.sortIndex);
        });

        const typeOrderMap = new Map<string, number>();
        typeOrder.forEach((item) => {
          // item.category is "retail" or "produce", item.type is the item type like "pizza"
          typeOrderMap.set(`${item.category}-${item.type}`, item.sortIndex);
        });

        const subtypeOrderMap = new Map<string, number>();
        subtypeOrder.forEach((item) => {
          // item.category is "retail" or "produce", item.type is the item type, item.subtype is the subtype
          subtypeOrderMap.set(`${item.category}-${item.type}-${item.subtype}`, item.sortIndex);
        });

        // Fetch all retail and produce items for the university (like uniDashboard)
        const [retailRes, produceRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/item/retail/uni/${uniId}?limit=1000`),
          fetch(`${BACKEND_URL}/api/item/produce/uni/${uniId}?limit=1000`),
        ]);
        
        // Check response status before parsing JSON
        if (!retailRes.ok) {
          let errorMessage = `Failed to fetch retail items: ${retailRes.status} ${retailRes.statusText}`;
          try {
            const errorData = await retailRes.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            // If JSON parsing fails, use status text
          }
          console.warn(`Failed to fetch retail items (${retailRes.status}):`, errorMessage);
        }
        
        if (!produceRes.ok) {
          let errorMessage = `Failed to fetch produce items: ${produceRes.status} ${produceRes.statusText}`;
          try {
            const errorData = await produceRes.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            // If JSON parsing fails, use status text
          }
          console.warn(`Failed to fetch produce items (${produceRes.status}):`, errorMessage);
        }
        
        // Parse JSON only if response is ok, otherwise use empty data
        const retailData = retailRes.ok ? await retailRes.json() : { items: [] };
        const produceData = produceRes.ok ? await produceRes.json() : { items: [] };
        
        let retailItems: FoodItem[] = (retailData.items || []).map((item: Record<string, unknown>) => ({
          id: item._id as string,
          title: item.name as string,
          description: item.description as string | undefined,
          image: item.image as string,
          category: item.type as string,
          type: 'retail',
          subtype: item.subtype as string | undefined,
          isSpecial: item.isSpecial as string,
          collegeId: uniId,
          price: item.price as number,
          vendorId: (item.vendorId as string) || null,
          quantity: item.quantity as number,
          isVeg: item.isVeg !== undefined ? (item.isVeg as boolean) : true,
        }));
        
        let produceItems: FoodItem[] = (produceData.items || []).map((item: Record<string, unknown>) => ({
          id: item._id as string,
          title: item.name as string,
          description: item.description as string | undefined,
          image: item.image as string,
          category: item.type as string,
          type: 'produce',
          subtype: item.subtype as string | undefined,
          isSpecial: item.isSpecial as string,
          collegeId: uniId,
          price: item.price as number,
          vendorId: (item.vendorId as string) || null,
          isAvailable: item.isAvailable as string,
          isVeg: item.isVeg !== undefined ? (item.isVeg as boolean) : true,
        }));

        // Apply sort order if available
        if (sortMap.size > 0) {
          retailItems = retailItems.sort((a, b) => {
            const aIndex = sortMap.get(a.id);
            const bIndex = sortMap.get(b.id);
            if (aIndex !== undefined && bIndex !== undefined) {
              return aIndex - bIndex;
            }
            if (aIndex !== undefined) return -1;
            if (bIndex !== undefined) return 1;
            return a.title.localeCompare(b.title);
          });
          
          produceItems = produceItems.sort((a, b) => {
            const aIndex = sortMap.get(a.id);
            const bIndex = sortMap.get(b.id);
            if (aIndex !== undefined && bIndex !== undefined) {
              return aIndex - bIndex;
            }
            if (aIndex !== undefined) return -1;
            if (bIndex !== undefined) return 1;
            return a.title.localeCompare(b.title);
          });
        } else {
          // If no sort order, sort alphabetically by title
          retailItems.sort((a, b) => a.title.localeCompare(b.title));
          produceItems.sort((a, b) => a.title.localeCompare(b.title));
        }
        
        // Track subtypes for each category
        const subtypesMap: { [key: string]: Set<string> } = {};
        
        // Group by category-type and subtype when subtype exists
        // Items are already sorted, so they will maintain order when grouped
        [...retailItems, ...produceItems].forEach(item => {
          if (item.subtype) {
            // If item has subtype, group by type-category-subtype
            const key = `${item.type}-${item.category}-${item.subtype}`;
            if (!allItems[key]) allItems[key] = [];
            allItems[key].push(item);
            
            // Track subtypes for this category
            const categoryKey = `${item.type}-${item.category}`;
            if (!subtypesMap[categoryKey]) {
              subtypesMap[categoryKey] = new Set<string>();
            }
            subtypesMap[categoryKey].add(item.subtype);
          } else {
            // If no subtype, group by type-category as before
            const key = `${item.type}-${item.category}`;
            if (!allItems[key]) allItems[key] = [];
            allItems[key].push(item);
          }
        });
        
        // Convert subtypes map to array format and apply subtype order
        // Key format: "type-category" where type is "retail"/"produce", category is item type like "pizza"
        const subtypesMapArrays: { [key: string]: string[] } = {};
        Object.keys(subtypesMap).forEach(key => {
          const subtypes = Array.from(subtypesMap[key]);
          
          // Extract type and category from key (format: "type-category")
          // type is "retail" or "produce", category is item type like "pizza"
          const [itemType, category] = key.split('-');
          
          // Apply subtype order if available
          // subtypeOrder key format: "category-type-subtype" where category is "retail"/"produce"
          if (subtypeOrderMap.size > 0) {
            subtypes.sort((a, b) => {
              // itemType is "retail" or "produce", category is item type like "pizza"
              const aKey = `${itemType}-${category}-${a}`;
              const bKey = `${itemType}-${category}-${b}`;
              const aIndex = subtypeOrderMap.get(aKey);
              const bIndex = subtypeOrderMap.get(bKey);
              if (aIndex !== undefined && bIndex !== undefined) {
                return aIndex - bIndex;
              }
              if (aIndex !== undefined) return -1;
              if (bIndex !== undefined) return 1;
              return a.localeCompare(b);
            });
          } else {
            // Sort alphabetically if no subtype order
            subtypes.sort();
          }
          
          subtypesMapArrays[key] = subtypes;
        });
        setCategorySubtypes(subtypesMapArrays);
        
        // Ensure items within each group maintain sort order
        // (Items are already sorted before grouping, but let's verify each group is sorted)
        Object.keys(allItems).forEach(key => {
          const groupItems = allItems[key];
          if (sortMap.size > 0) {
            // Re-sort items in each group to ensure correct order
            groupItems.sort((a, b) => {
              const aIndex = sortMap.get(a.id);
              const bIndex = sortMap.get(b.id);
              if (aIndex !== undefined && bIndex !== undefined) {
                return aIndex - bIndex;
              }
              if (aIndex !== undefined) return -1;
              if (bIndex !== undefined) return 1;
              return a.title.localeCompare(b.title);
            });
          }
        });
        
        // Dynamically generate categories from fetched items
        // Note: In FoodItem, item.category is the item type (like "pizza"), item.type is "retail" or "produce"
        const retailTypes = new Set<string>();
        const produceTypes = new Set<string>();
        retailItems.forEach(item => {
          if (item.category) retailTypes.add(item.category); // item.category is the type like "pizza"
        });
        produceItems.forEach(item => {
          if (item.category) produceTypes.add(item.category); // item.category is the type like "pizza"
        });
        
        // Apply type order if available
        const sortedRetailTypes = Array.from(retailTypes);
        const sortedProduceTypes = Array.from(produceTypes);
        
        if (typeOrderMap.size > 0) {
          sortedRetailTypes.sort((a, b) => {
            const aKey = `retail-${a}`; // a is the item type like "pizza"
            const bKey = `retail-${b}`;
            const aIndex = typeOrderMap.get(aKey);
            const bIndex = typeOrderMap.get(bKey);
            if (aIndex !== undefined && bIndex !== undefined) {
              return aIndex - bIndex;
            }
            if (aIndex !== undefined) return -1;
            if (bIndex !== undefined) return 1;
            return a.localeCompare(b);
          });
          
          sortedProduceTypes.sort((a, b) => {
            const aKey = `produce-${a}`; // a is the item type like "pizza"
            const bKey = `produce-${b}`;
            const aIndex = typeOrderMap.get(aKey);
            const bIndex = typeOrderMap.get(bKey);
            if (aIndex !== undefined && bIndex !== undefined) {
              return aIndex - bIndex;
            }
            if (aIndex !== undefined) return -1;
            if (bIndex !== undefined) return 1;
            return a.localeCompare(b);
          });
        } else {
          sortedRetailTypes.sort();
          sortedProduceTypes.sort();
        }
        
        setCategories({
          retail: sortedRetailTypes,
          produce: sortedProduceTypes,
        });
        
        if (requestId === currentRequest.current) {
          console.log('DEBUG allItems:', allItems);
          console.log('DEBUG categories:', { retail: Array.from(retailTypes), produce: Array.from(produceTypes) });
          setItems(allItems);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
        if (requestId === currentRequest.current) {
          // Don't set error state if it's just a 404 - just log it and show empty menu
          if (error instanceof Error && error.message.includes('404')) {
            console.warn("University not found, showing empty menu");
            setItems({});
            setCategories({ retail: [], produce: [] });
          } else {
            setError('Failed to load items.');
          }
          setLoading(false);
        }
      }
    };

    fetchItems();
  }, [uniId]);

  // Fetch vendor inventories and extract specials
  useEffect(() => {
    if (!uniId) return;
    type VendorInventoryEntry = {
      itemId: string;
      isSpecial?: string;
      quantity?: number;
      isAvailable?: string;
    };
    type Vendor = {
      _id: string;
      retailInventory?: VendorInventoryEntry[];
      produceInventory?: VendorInventoryEntry[];
    };
    const fetchVendorSpecials = async () => {
      // Early return if uniId is not available
      if (!uniId) {
        console.warn('uniId is not available, skipping vendor specials fetch');
        setVendorSpecialItems([]);
        return;
      }

      try {
        // Fetch vendors and all items in parallel
        const [vendorsRes, retailRes, produceRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/vendor/list/uni/${uniId}`),
          fetch(`${BACKEND_URL}/api/item/retail/uni/${uniId}?limit=1000`),
          fetch(`${BACKEND_URL}/api/item/produce/uni/${uniId}?limit=1000`),
        ]);
        
        // Check response status before parsing JSON
        if (!vendorsRes.ok) {
          let errorMessage = `Failed to fetch vendors: ${vendorsRes.status} ${vendorsRes.statusText}`;
          try {
            const errorData = await vendorsRes.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            // If JSON parsing fails, use status text
          }
          
          // Handle 404 (University not found) gracefully
          if (vendorsRes.status === 404) {
            console.warn(`University not found for uniId: ${uniId}. Setting empty vendor specials.`);
            setVendorSpecialItems([]);
            return;
          }
          
          // For other errors, log but don't throw - just set empty array
          console.error(`Failed to fetch vendors (${vendorsRes.status}):`, errorMessage);
          setVendorSpecialItems([]);
          return;
        }
        
        if (!retailRes.ok) {
          let errorMessage = `Failed to fetch retail items: ${retailRes.status} ${retailRes.statusText}`;
          try {
            const errorData = await retailRes.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            // If JSON parsing fails, use status text
          }
          
          // Handle 404 gracefully
          if (retailRes.status === 404) {
            console.warn(`Retail items not found for uniId: ${uniId}`);
            setVendorSpecialItems([]);
            return;
          }
          
          console.error(`Failed to fetch retail items (${retailRes.status}):`, errorMessage);
          setVendorSpecialItems([]);
          return;
        }
        
        if (!produceRes.ok) {
          let errorMessage = `Failed to fetch produce items: ${produceRes.status} ${produceRes.statusText}`;
          try {
            const errorData = await produceRes.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            // If JSON parsing fails, use status text
          }
          
          // Handle 404 gracefully
          if (produceRes.status === 404) {
            console.warn(`Produce items not found for uniId: ${uniId}`);
            setVendorSpecialItems([]);
            return;
          }
          
          console.error(`Failed to fetch produce items (${produceRes.status}):`, errorMessage);
          setVendorSpecialItems([]);
          return;
        }
        
        const vendors: Vendor[] = await vendorsRes.json();
        const retailData = await retailRes.json();
        const produceData = await produceRes.json();

        // Create lookup maps for items
        const retailItemsMap = new Map<string, Record<string, unknown>>();
        const produceItemsMap = new Map<string, Record<string, unknown>>();
        
        (retailData.items || []).forEach((item: Record<string, unknown>) => {
          retailItemsMap.set(item._id as string, item);
        });
        
        (produceData.items || []).forEach((item: Record<string, unknown>) => {
          produceItemsMap.set(item._id as string, item);
        });

        const specials: FoodItem[] = [];
        
        vendors.forEach((vendor) => {
          // Process retail inventory
          (vendor.retailInventory || []).forEach((entry) => {
            if (entry.isSpecial && entry.isSpecial === 'Y') {
              const itemData = retailItemsMap.get(entry.itemId);
              if (itemData) {
                specials.push({
                  id: entry.itemId,
                  title: (itemData.name as string) || '',
                  description: itemData.description as string | undefined,
                  image: (itemData.image as string) || '',
                  category: (itemData.type as string) || 'retail',
                  type: 'retail',
                  isSpecial: 'Y',
                  price: (itemData.price as number) || 0,
                  vendorId: vendor._id,
                  quantity: entry.quantity || 0,
                  isVeg: itemData.isVeg !== undefined ? (itemData.isVeg as boolean) : true,
                });
              }
            }
          });
          
          // Process produce inventory
          (vendor.produceInventory || []).forEach((entry) => {
            if (entry.isSpecial && entry.isSpecial === 'Y') {
              const itemData = produceItemsMap.get(entry.itemId);
              if (itemData) {
                specials.push({
                  id: entry.itemId,
                  title: (itemData.name as string) || '',
                  description: itemData.description as string | undefined,
                  image: (itemData.image as string) || '',
                  category: (itemData.type as string) || 'produce',
                  type: 'produce',
                  isSpecial: 'Y',
                  price: (itemData.price as number) || 0,
                  vendorId: vendor._id,
                  isAvailable: entry.isAvailable || 'N',
                  isVeg: itemData.isVeg !== undefined ? (itemData.isVeg as boolean) : true,
                });
              }
            }
          });
        });
        
        setVendorSpecialItems(specials);
        console.log('Special items (isSpecial === "Y"):', specials);
      } catch (error) {
        console.error('Error fetching vendor specials:', error);
        setVendorSpecialItems([]);
      }
    };
    fetchVendorSpecials();
  }, [uniId]);

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2, arrows: false } },
      { breakpoint: 480, settings: { slidesToShow: 1, arrows: false } },
    ],
  };

  const convertFavoriteToFoodItem = (item: FavoriteItem): FoodItem => {
    // Determine if it's retail or produce based on the kind field or categories
    // Since we don't have a direct way to know, we'll check if the kind matches any retail type first
    const isRetail = categories.retail.length > 0 && categories.retail.includes(item.kind);
    return {
      id: item._id,
      title: item.name,
      image: item.image,
      category: item.kind,
      type: isRetail ? "retail" : "produce",
      isSpecial: item.isSpecial,
      price: item.price,
      vendorId: item.vendorId,
      isVeg: true, // Default to veg for favorites
    };
  };

  if (loading) {
    return (
      <div className={homeStyles.container}>
        <div className={homeStyles.content}>
          <div className={homeStyles.headerSection}>
            <div className={homeStyles.iconWrapper}>
              <GraduationCap className={homeStyles.headerIcon} size={48} />
            </div>
            <h1 className={homeStyles.heading}>Discover Your Campus</h1>
            <p className={homeStyles.subtitle}>Loading delicious options...</p>
          </div>
          <div className={homeStyles.collegeGrid}>
            {[...Array(6)].map((_, index) => (
              <div key={index} className={homeStyles.skeletonCard}>
                <div className={homeStyles.skeletonShimmer}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.errorState}>
            <div className={styles.errorIconWrapper}>
              <AlertCircle className={styles.errorIcon} size={64} />
            </div>
            <h1 className={styles.greeting}>Oops! Something went wrong</h1>
            <p className={styles.errorText}>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CartProvider userId={userId}>
      <div className={styles.container}>
        <ToastContainer
          position="bottom-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <div className={styles.content}>
          <h1 className={styles.greeting}>
            {userId ? (
              <>
                Hi{" "}
                <span style={{ color: "#4ea199" }}>
                  {userFullName?.split(" ")[0] || "User"}
                </span>
                , what are you craving for?
              </>
            ) : (
              <>
                Welcome to{" "}
                <span style={{ color: "#4ea199" }}>
                  {collegeName}
                </span>
                , explore our menu
              </>
            )}
          </h1>

          {/* Render menu by type (retail/produce) first, then categories, then subtypes */}
          {Object.entries(categories).map(([itemType, types]) => {
            // Only render if there are types for this item type
            if (types.length === 0) return null;

            return (
              <div key={itemType} className={styles.itemTypeSection}>
                {types.map((type) => {
                  const categoryKey = `${itemType}-${type}`;
                  const subtypes = categorySubtypes[categoryKey] || [];
                  const itemsWithoutSubtype = items[categoryKey] || [];
                  
                  // Skip if no items at all for this category
                  if (itemsWithoutSubtype.length === 0 && subtypes.length === 0) return null;
                  
                  return (
                    <div key={categoryKey} className={styles.typeContainer}>
                      {/* Main Type Heading */}
                      <h3 className={styles.typeHeading}>
                        {type.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </h3>
                      
                      {/* Items without subtype (if any) */}
                      {itemsWithoutSubtype.length > 0 && (
                        <div className={styles.itemsWithoutSubtype}>
                          <CategorySection
                            categoryItems={itemsWithoutSubtype}
                            categoryTitle={type}
                            sliderSettings={sliderSettings}
                            userId={userId}
                            categories={categories}
                            hideTitle={true}
                          />
                        </div>
                      )}
                      
                      {/* Subtypes */}
                      {subtypes.length > 0 && (
                        <div className={styles.subtypesContainer}>
                          {itemsWithoutSubtype.length > 0 && (
                            <div className={styles.subtypeDivider}>
                              <span>Subtypes</span>
                            </div>
                          )}
                          {subtypes.map((subtype) => {
                            const subtypeKey = `${categoryKey}-${subtype}`;
                            const subtypeItems = items[subtypeKey] || [];
                            
                            if (subtypeItems.length === 0) return null;
                            
                            return (
                              <div key={subtypeKey} className={styles.subtypeSection}>
                                <CategorySection
                                  categoryItems={subtypeItems}
                                  categoryTitle={subtype}
                                  sliderSettings={sliderSettings}
                                  userId={userId}
                                  categories={categories}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {userId && (
            <FavoritesSection
              favoriteItems={userFavorites}
              convertFavoriteToFoodItem={convertFavoriteToFoodItem}
              sliderSettings={sliderSettings}
              userId={userId}
              categories={categories}
            />
          )}

          <SpecialOffersSection 
            allItems={vendorSpecialItems}
            sliderSettings={sliderSettings}
            userId={userId}
            categories={categories}
          />
        </div>
      </div>
    </CartProvider>
  );
};

export default CollegePageClient;
