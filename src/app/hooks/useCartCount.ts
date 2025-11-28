"use client";

import { useState, useEffect, useCallback } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface CachedCartCount {
  count: number;
  timestamp: number;
  userId: string | null;
}

const CART_COUNT_CACHE_KEY = 'cart_count_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Event name for cart updates
export const CART_COUNT_UPDATE_EVENT = 'cartCountUpdated';

/**
 * Hook to get and manage cart item count
 * Uses localStorage caching and custom events to avoid multiple API calls
 */
export const useCartCount = () => {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Get cached cart count
  const getCachedCount = useCallback((): CachedCartCount | null => {
    try {
      const cached = localStorage.getItem(CART_COUNT_CACHE_KEY);
      if (!cached) return null;

      const parsed: CachedCartCount = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - parsed.timestamp < CACHE_DURATION) {
        return parsed;
      }

      // Cache expired, remove it
      localStorage.removeItem(CART_COUNT_CACHE_KEY);
      return null;
    } catch {
      return null;
    }
  }, []);

  // Get user ID helper
  const getUserId = useCallback(async (): Promise<string | null> => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const response = await fetch(`${BACKEND_URL}/api/user/auth/user`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return null;

      const user = await response.json();
      return user._id || user.id || null;
    } catch {
      return null;
    }
  }, []);

  // Fetch cart count from API
  const fetchCartCount = useCallback(async (userId: string | null, forceRefresh: boolean = false) => {
    // If not forcing refresh, check cache first
    if (!forceRefresh) {
      const cached = getCachedCount();
      if (cached) {
        const token = localStorage.getItem("token");
        const currentUserId = userId || (token ? await getUserId() : null);

        // If user matches and cache is valid, use cached count
        if (cached.userId === currentUserId) {
          setCount(cached.count);
          return cached.count;
        }
      }
    }

    // No valid cache or force refresh, fetch from API
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Handle guest cart (no token)
      if (!token) {
        const guestCart = localStorage.getItem("guest_cart") || "[]";
        try {
          const guestCartItems = JSON.parse(guestCart);
          const guestCount = Array.isArray(guestCartItems)
            ? guestCartItems.reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity || 1), 0)
            : 0;
          
          const cacheData: CachedCartCount = {
            count: guestCount,
            timestamp: Date.now(),
            userId: null
          };
          localStorage.setItem(CART_COUNT_CACHE_KEY, JSON.stringify(cacheData));
          setCount(guestCount);
          return guestCount;
        } catch {
          setCount(0);
          return 0;
        }
      }

      // Handle logged-in user
      const currentUserId = userId || await getUserId();
      if (!currentUserId) {
        setCount(0);
        return 0;
      }

      const response = await fetch(`${BACKEND_URL}/cart/${currentUserId}`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }

      const data = await response.json();
      const cartItems = data.cart || [];
      const itemCount = cartItems.reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity || 1), 0);

      // Cache the result
      const cacheData: CachedCartCount = {
        count: itemCount,
        timestamp: Date.now(),
        userId: currentUserId
      };
      localStorage.setItem(CART_COUNT_CACHE_KEY, JSON.stringify(cacheData));

      setCount(itemCount);
      return itemCount;
    } catch (error) {
      console.error('Error fetching cart count:', error);
      setCount(0);
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [getCachedCount, getUserId]);

  // Initialize cart count on mount
  useEffect(() => {
    const initializeCartCount = async () => {
      const token = localStorage.getItem("token");
      const userId = token ? await getUserId() : null;
      await fetchCartCount(userId, false);
    };

    initializeCartCount();

    // Listen for cart count update events
    const handleCartUpdate = async () => {
      const token = localStorage.getItem("token");
      const userId = token ? await getUserId() : null;
      await fetchCartCount(userId, true); // Force refresh on event
    };

    window.addEventListener(CART_COUNT_UPDATE_EVENT, handleCartUpdate);

    // Also listen for auth changes to refresh cart count
    const handleAuthChange = async () => {
      const token = localStorage.getItem("token");
      const userId = token ? await getUserId() : null;
      await fetchCartCount(userId, true);
    };

    window.addEventListener("authChanged", handleAuthChange);

    return () => {
      window.removeEventListener(CART_COUNT_UPDATE_EVENT, handleCartUpdate);
      window.removeEventListener("authChanged", handleAuthChange);
    };
  }, [fetchCartCount, getUserId]);

  // Manual refresh function
  const refreshCount = useCallback(async () => {
    const token = localStorage.getItem("token");
    const userId = token ? await getUserId() : null;
    await fetchCartCount(userId, true);
  }, [fetchCartCount, getUserId]);

  return { count, isLoading, refreshCount };
};

