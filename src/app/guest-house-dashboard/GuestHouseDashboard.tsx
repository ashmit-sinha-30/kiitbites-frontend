"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/apiUtils";

type Service = {
  _id: string;
  name: string;
  feature?: { _id: string; name: string };
};

type Segment = {
  key: string;
  label: string;
};

const normalize = (value: string) => (value || "").toLowerCase().trim();

export default function GuestHouseDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeSegment, setActiveSegment] = useState("dashboard");
  const [guestHouseName, setGuestHouseName] = useState("Guest House");
  const [guestHouseId, setGuestHouseId] = useState("");
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const assignmentRes = await api.get("/api/guest-house/auth/assignments");
        const assignmentData = assignmentRes.data?.data;

        if (!assignmentData?.guestHouseId) {
          router.push("/guest-house-login");
          return;
        }

        setGuestHouseId(assignmentData.guestHouseId);
        setGuestHouseName(assignmentData.guestHouseName || "Guest House");
        setServices(Array.isArray(assignmentData.services) ? assignmentData.services : []);
      } catch {
        router.push("/guest-house-login");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const segments = useMemo<Segment[]>(() => {
    const serviceSegments = services
      .filter((service) => normalize(service.name) !== "dashboard")
      .map((service) => ({
        key: service._id,
        label: service.name,
      }));

    return [
      { key: "dashboard", label: "Dashboard" },
      { key: "profile", label: "Profile" },
      ...serviceSegments,
      { key: "logout", label: "Logout" },
    ];
  }, [services]);

  const handleLogout = async () => {
    try {
      await api.post("/api/guest-house/auth/logout");
    } catch {
      // Best effort logout; local cleanup still runs.
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("guestHouseRole");
      window.dispatchEvent(new Event("authChanged"));
      router.push("/guest-house-login");
    }
  };

  const renderMainContent = () => {
    if (activeSegment === "dashboard") {
      return (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Guest House Dashboard</h1>
          <p className="text-gray-600">
            Welcome {guestHouseName}. Your assigned services are shown in the sidebar and loaded dynamically.
          </p>
        </div>
      );
    }

    if (activeSegment === "profile") {
      return (
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">Profile</h1>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p><span className="font-semibold">Guest House:</span> {guestHouseName}</p>
            <p><span className="font-semibold">Guest House ID:</span> {guestHouseId}</p>
          </div>
        </div>
      );
    }

    const currentService = services.find((service) => service._id === activeSegment);
    if (!currentService) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          Service not found.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{currentService.name}</h1>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-gray-700">
            This section is enabled for your account by admin service assignment.
          </p>
          {currentService.feature?.name ? (
            <p className="mt-2 text-sm text-gray-500">Feature: {currentService.feature.name}</p>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-72 border-r border-gray-200 bg-white p-4">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider text-gray-500">Guest House</p>
          <p className="text-lg font-semibold text-gray-800">{guestHouseName}</p>
        </div>

        <nav className="space-y-2">
          {segments.map((segment) => (
            <button
              key={segment.key}
              onClick={() => {
                if (segment.key === "logout") {
                  handleLogout();
                  return;
                }
                setActiveSegment(segment.key);
              }}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                activeSegment === segment.key
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {segment.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6">
        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-500">
            Loading dashboard...
          </div>
        ) : (
          renderMainContent()
        )}
      </main>
    </div>
  );
}

