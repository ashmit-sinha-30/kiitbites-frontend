"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/apiUtils";

const toSlug = (name: string) =>
  String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalize = (value: string) => String(value || "").toLowerCase().replace(/[\s_-]+/g, " ").trim();

interface CollegeListItem {
  _id: string;
  fullName: string;
}

interface Feature {
  _id?: string;
  name?: string;
}

interface UniversityWithAvailability {
  _id: string;
  fullName: string;
  slug: string;
  hasAuditoriumFeature: boolean;
  activeAuditoriumCount: number;
}

export default function AuditoriumBookingEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [universities, setUniversities] = useState<UniversityWithAvailability[]>([]);

  useEffect(() => {
    const loadUniversities = async () => {
      try {
        setLoading(true);
        setError("");
        const listRes = await api.get("/api/user/auth/list");
        const colleges = (Array.isArray(listRes.data) ? listRes.data : []) as CollegeListItem[];

        const resolved = await Promise.all(
          colleges.map(async (college) => {
            let features: Feature[] = [];
            let activeAuditoriumCount = 0;
            try {
              const profileRes = await api.get(`/api/university/${college._id}/profile`);
              features = Array.isArray(profileRes.data?.features) ? profileRes.data.features : [];
            } catch {
              features = [];
            }
            try {
              const auditoriumRes = await api.get(`/api/auditoriums/public/${college._id}`);
              const rows = Array.isArray(auditoriumRes.data?.data) ? auditoriumRes.data.data : [];
              activeAuditoriumCount = rows.length;
            } catch {
              activeAuditoriumCount = 0;
            }

            const hasAuditoriumFeature = features.some((feature) => normalize(feature?.name).includes("auditorium"));
            return {
              _id: college._id,
              fullName: college.fullName,
              slug: toSlug(college.fullName) || "campus",
              hasAuditoriumFeature,
              activeAuditoriumCount,
            } as UniversityWithAvailability;
          })
        );

        setUniversities(resolved.filter((u) => u.hasAuditoriumFeature));
      } catch (e) {
        const err = e as { response?: { status?: number } };
        if (err?.response?.status === 401) {
          router.replace("/login");
          return;
        }
        setError("Failed to load universities for auditorium booking.");
      } finally {
        setLoading(false);
      }
    };
    void loadUniversities();
  }, [router]);

  const sortedUniversities = useMemo(
    () =>
      [...universities].sort((a, b) => {
        if (b.activeAuditoriumCount !== a.activeAuditoriumCount) {
          return b.activeAuditoriumCount - a.activeAuditoriumCount;
        }
        return a.fullName.localeCompare(b.fullName);
      }),
    [universities]
  );

  return (
    <div className="min-h-screen bg-[#f4f7fb] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Auditorium Booking</h1>
          <p className="mt-2 text-sm text-slate-600">
            Select a university where auditorium booking is enabled.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-slate-600">Loading universities...</p>
          ) : error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : sortedUniversities.length === 0 ? (
            <p className="text-sm text-slate-600">
              No universities currently have auditorium booking enabled.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {sortedUniversities.map((uni) => (
                <button
                  key={uni._id}
                  type="button"
                  onClick={() => router.push(`/auditorium-booking/${uni.slug}?cid=${uni._id}`)}
                  className="rounded-lg border border-slate-200 p-4 text-left transition hover:border-slate-900 hover:bg-slate-50"
                >
                  <p className="text-base font-semibold text-slate-900">{uni.fullName}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Feature: Auditorium booking available
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Active auditoriums: {uni.activeAuditoriumCount}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
