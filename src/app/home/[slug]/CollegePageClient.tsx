"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./styles/global.css";
import styles from "./styles/CollegePage.module.scss";
import { useEffect, useRef, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FavoritesSection from "./components/FavoritesSection";
import SpecialOffersSection from "./components/SpecialOffersSection";
import CategorySection from "./components/CategorySection";
import ProductCard from "./components/ProductCard";
import { CartProvider } from "./context/CartContext";
import {
  FoodItem,
  FavoriteItem,
  College,
  ApiFavoritesResponse,
} from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

// Categories will be dynamically generated from fetched items

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

  // Normalize college name for matching
  const normalizeName = (name: string) =>
    name
      ?.toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-") || "";

  // Update URL with college ID
  const updateUrlWithCollegeId = (collegeId: string) => {
    const currentPath = window.location.pathname;
    const newUrl = `${currentPath}?cid=${collegeId}`;
    window.history.replaceState({}, "", newUrl);
  };

  // Get college list and match collegeName to get actual college id
  const fetchCollegesAndSetUniId = async (collegeSlug: string) => {
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
  };

  // On load, determine uniId from multiple sources:
  useEffect(() => {
    let isMounted = true;

    const resolveCollegeId = async () => {
      const cid = searchParams.get("cid");
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
  }, [slug, searchParams]);

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
    if (!uniId) return;

    const requestId = ++currentRequest.current;

    const fetchItems = async () => {
      setLoading(true);
      setError(null);

      const allItems: { [key: string]: FoodItem[] } = {};

      try {
        // Fetch all retail and produce items for the university (like uniDashboard)
        const [retailRes, produceRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/item/retail/uni/${uniId}?limit=1000`),
          fetch(`${BACKEND_URL}/api/item/produce/uni/${uniId}?limit=1000`),
        ]);
        const retailData = await retailRes.json();
        const produceData = await produceRes.json();
        if (!retailRes.ok || !produceRes.ok) throw new Error("Failed to fetch items");
        const retailItems: FoodItem[] = (retailData.items || []).map((item: Record<string, unknown>) => ({
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
        }));
        const produceItems: FoodItem[] = (produceData.items || []).map((item: Record<string, unknown>) => ({
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
        }));
        // Track subtypes for each category
        const subtypesMap: { [key: string]: Set<string> } = {};
        
        // Group by category-type and subtype when subtype exists
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
        
        // Convert subtypes map to array format
        const subtypesMapArrays: { [key: string]: string[] } = {};
        Object.keys(subtypesMap).forEach(key => {
          subtypesMapArrays[key] = Array.from(subtypesMap[key]).sort();
        });
        setCategorySubtypes(subtypesMapArrays);
        
        // Dynamically generate categories from fetched items
        const retailTypes = new Set<string>();
        const produceTypes = new Set<string>();
        retailItems.forEach(item => {
          if (item.category) retailTypes.add(item.category);
        });
        produceItems.forEach(item => {
          if (item.category) produceTypes.add(item.category);
        });
        
        setCategories({
          retail: Array.from(retailTypes).sort(),
          produce: Array.from(produceTypes).sort(),
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
          setError('Failed to load items.');
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
          console.error(`Failed to fetch vendors (${vendorsRes.status}):`, errorMessage);
          throw new Error(errorMessage);
        }
        
        if (!retailRes.ok) {
          let errorMessage = `Failed to fetch retail items: ${retailRes.status} ${retailRes.statusText}`;
          try {
            const errorData = await retailRes.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            // If JSON parsing fails, use status text
          }
          console.error(`Failed to fetch retail items (${retailRes.status}):`, errorMessage);
          throw new Error(errorMessage);
        }
        
        if (!produceRes.ok) {
          let errorMessage = `Failed to fetch produce items: ${produceRes.status} ${produceRes.statusText}`;
          try {
            const errorData = await produceRes.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            // If JSON parsing fails, use status text
          }
          console.error(`Failed to fetch produce items (${produceRes.status}):`, errorMessage);
          throw new Error(errorMessage);
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
    };
  };

  // Aggregate all items for fallback display
  const allItemsFlat = Object.values(items).flat();

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.greeting}>Loading...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.greeting}>Error: {error}</h1>
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

          {/* Fallback: Show all items if no category has items */}
          {allItemsFlat.length > 0 && Object.values(items).every(arr => arr.length === 0) && (
            <section style={{ marginBottom: 32 }}>
              <h3 style={{ fontWeight: 600, fontSize: 22, marginBottom: 12 }}>
                All Items (Fallback)
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {allItemsFlat.map(item => (
                  <div key={item.id} style={{ minWidth: 220, maxWidth: 260 }}>
                    <ProductCard
                      item={item}
                      categories={categories}
                      userId={userId}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {Object.entries(categories).map(([category, types]) =>
            types.map((type) => {
              const categoryKey = `${category}-${type}`;
              const subtypes = categorySubtypes[categoryKey] || [];
              
              // If this category has subtypes, show separate sections for each subtype
              if (subtypes.length > 0) {
                return (
                  <section key={categoryKey} style={{ marginBottom: 32 }}>
                    {subtypes.map((subtype) => {
                      const subtypeKey = `${categoryKey}-${subtype}`;
                      const subtypeItems = items[subtypeKey] || [];
                      
                      return (
                        <div key={subtypeKey} style={{ marginBottom: 24 }}>
                          <CategorySection
                            categoryItems={subtypeItems}
                            categoryTitle={`${type} - ${subtype}`}
                            sliderSettings={sliderSettings}
                            userId={userId}
                            categories={categories}
                          />
                        </div>
                      );
                    })}
                    {/* Also show items without subtype if they exist */}
                    {items[categoryKey] && items[categoryKey].length > 0 && (
                      <div style={{ marginBottom: 24 }}>
                        <CategorySection
                          categoryItems={items[categoryKey]}
                          categoryTitle={type}
                          sliderSettings={sliderSettings}
                          userId={userId}
                          categories={categories}
                        />
                      </div>
                    )}
                  </section>
                );
              } else {
                // No subtypes, show as before
                const categoryItems = items[categoryKey] || [];
                console.log('DEBUG category:', categoryKey, 'items:', categoryItems.length);

                return (
                  <section key={categoryKey} style={{ marginBottom: 32 }}>
                    <CategorySection
                      categoryItems={categoryItems}
                      categoryTitle={type}
                      sliderSettings={sliderSettings}
                      userId={userId}
                      categories={categories}
                    />
                  </section>
                );
              }
            })
          )}

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
