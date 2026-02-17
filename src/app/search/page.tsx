"use client";

import { Suspense, useEffect, useState } from "react";
import SearchBar from "../components/search/SearchBar/SearchBar";
import { CartProvider } from "../home/[slug]/context/CartContext";
import PageLoading from "../components/layout/PageLoading/PageLoading";

export default function SearchBarPage() {
  const [userId, setUserId] = useState<string>("");

  // Fetch user ID in the background without blocking initial render,
  // so the search page shows instantly and cart features become active once ready.
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = await res.json();
        if (user?._id) {
          setUserId(user._id);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
  }, []);

  return (
    <Suspense fallback={<PageLoading message="Loading search results…" />}>
      <CartProvider userId={userId}>
        <SearchBar />
      </CartProvider>
    </Suspense>
  );
}
