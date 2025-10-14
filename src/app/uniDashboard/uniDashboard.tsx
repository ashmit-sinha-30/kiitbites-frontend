"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ENV_CONFIG } from "@/config/environment";

export default function UniDashboardPage() {
  const router = useRouter();
  const [features, setFeatures] = useState<{ _id: string; name: string }[]>([]);
  const [activeSegment, setActiveSegment] = useState<string>("dashboard");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Always land on dashboard for this page
    localStorage.removeItem("activeSegment");
    setActiveSegment("dashboard");
  }, []);

  useEffect(() => {
    localStorage.setItem("activeSegment", activeSegment);
  }, [activeSegment]);

  // Load university identity and assignments
  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/uni-login");
          return;
        }
        const userRes = await fetch(`${ENV_CONFIG.BACKEND.URL}/api/uni/auth/user`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (userRes.ok) {
          const user = await userRes.json();
          const uniId = user._id || user.id;
          const assignRes = await fetch(`${ENV_CONFIG.BACKEND.URL}/api/university/universities/${uniId}/assignments`);
          const assignJson = await assignRes.json();
          if (assignJson.success) {
            setFeatures(assignJson.data.features);
          }
        } else {
          // Token is invalid or expired, redirect to login
          localStorage.removeItem("token");
          router.push("/uni-login");
          return;
        }
      } catch (e) {
        console.error("Failed to init uni dashboard", e);
        // On error, remove token and redirect to login
        localStorage.removeItem("token");
        router.push("/uni-login");
        return;
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {/* Sidebar removed: only feature selection remains in this page */}

      <main className="w-full max-w-6xl mx-auto p-6">
        {loading && (
          <div className="flex justify-center items-center min-h-32">
            <div className="p-4 text-sm text-gray-500">Loading your features…</div>
          </div>
        )}
        {/* Dashboard Segment: Feature selection */}
        {activeSegment === "dashboard" && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-8 text-gray-800">What would you like to monitor?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {features.map((f) => {
                const slug = `${f.name}`
                  .toLowerCase()
                  .replace(/[^a-z0-9\s-]/g, "")
                  .trim()
                  .replace(/\s+/g, "-");
                return (
                  <button
                    key={f._id}
                    className="border border-gray-200 rounded-lg p-6 text-left hover:bg-white hover:shadow-md transition-all duration-200 bg-white shadow-sm"
                    onClick={() => {
                      // Clear any existing activeSegment to ensure dashboard is active by default
                      localStorage.removeItem("activeSegment");
                      router.push(`/${slug}-uniDashboard`);
                    }}
                  >
                    <div className="font-semibold text-gray-800 mb-2">{f.name}</div>
                    <div className="text-sm text-gray-500">Click to open related dashboard</div>
                  </button>
                );
              })}
              {!loading && features.length === 0 && (
                <div className="col-span-full text-center">
                  <div className="text-gray-500 py-8">No features assigned to your university yet.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Other content removed; this page only lists features and navigates to their dashboards */}
      </main>
    </div>
  );
} 