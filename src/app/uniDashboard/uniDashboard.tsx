"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ENV_CONFIG } from "@/config/environment";

const segmentsMap: Record<string, string> = {};

export default function UniDashboardPage() {
  const router = useRouter();
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [universityName, setUniversityName] = useState<string>("University");
  const [features, setFeatures] = useState<{ _id: string; name: string }[]>([]);
  const [services, setServices] = useState<{ _id: string; name: string; feature: { _id: string; name: string } }[]>([]);
  const [activeSegment, setActiveSegment] = useState<string>("dashboard");

  useEffect(() => {
    const saved = localStorage.getItem("activeSegment");
    if (saved) setActiveSegment(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("activeSegment", activeSegment);
  }, [activeSegment]);

  // Load university identity and assignments
  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const userRes = await fetch(`${ENV_CONFIG.BACKEND.URL}/api/uni/auth/user`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (userRes.ok) {
          const user = await userRes.json();
          const uniId = user._id || user.id;
          setUniversityId(uniId);
          setUniversityName(user.fullName || "University");
          const assignRes = await fetch(`${ENV_CONFIG.BACKEND.URL}/api/university/universities/${uniId}/assignments`);
          const assignJson = await assignRes.json();
          if (assignJson.success) {
            setFeatures(assignJson.data.features);
            setServices(assignJson.data.services);
          }
        }
      } catch (e) {
        console.error("Failed to init uni dashboard", e);
      }
    };
    init();
  }, []);

  const sidebarSegments = useMemo(() => [], []);

  return (
    <div >
      {/* Sidebar removed: only feature selection remains in this page */}

      <main >
        {/* Dashboard Segment: Feature selection */}
        {activeSegment === "dashboard" && (
          <div>
            <h2 className="text-lg font-semibold mb-3">What would you like to monitor?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {features.map((f) => {
                const slug = `${f.name}`
                  .toLowerCase()
                  .replace(/[^a-z0-9\s-]/g, "")
                  .trim()
                  .replace(/\s+/g, "-");
                return (
                  <button
                    key={f._id}
                    className="border rounded p-4 text-left hover:bg-gray-50"
                    onClick={() => router.push(`/${slug}-uniDashboard`)}
                  >
                    <div className="font-medium">{f.name}</div>
                    <div className="text-xs text-gray-500">Click to open related dashboard</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Other content removed; this page only lists features and navigates to their dashboards */}
      </main>
    </div>
  );
} 