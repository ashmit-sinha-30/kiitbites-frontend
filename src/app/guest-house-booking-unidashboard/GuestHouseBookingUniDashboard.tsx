"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AiOutlineMenu } from "react-icons/ai";
import axios from "axios";
import api from "@/utils/apiUtils";
import Sidebar from "./components/Sidebar";
import UniDashboardOverview from "./components/UniDashboardOverview";
import AddGuestHouseForm from "./components/AddGuestHouseForm";
import AddRoomDetailsForm from "./components/AddRoomDetailsForm";

interface ServiceItem {
  _id: string;
  name: string;
  feature?: { _id: string; name: string };
}
interface FeatureItem {
  _id: string;
  name: string;
}

export default function GuestHouseBookingUniDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [universityName, setUniversityName] = useState<string>("University");
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [activeSegment, setActiveSegment] = useState<string>("dashboard");
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await api.get("/api/uni/auth/user");
        if (userRes.status !== 200) {
          router.push("/uni-login");
          return;
        }

        const user = userRes.data;
        const uniId = user._id || user.id;
        setUniversityId(uniId);
        setUniversityName(user.fullName || "University");
        localStorage.setItem("uniId", uniId);

        const assignRes = await api.get(`/api/university/universities/${uniId}/assignments`);
        const assignJson = assignRes.data;

        if (assignJson.success) {
          const assignedFeatures: FeatureItem[] = assignJson.data?.features || [];
          const assignedServices: ServiceItem[] = assignJson.data?.services || [];

          const guestHouseFeatureIds = assignedFeatures
            .filter((feature) => {
              const name = feature.name.toLowerCase();
              return name.includes("guest") && name.includes("house");
            })
            .map((feature) => feature._id);

          const scopedServices = assignedServices.filter((service) =>
            service.feature?._id ? guestHouseFeatureIds.includes(service.feature._id) : false
          );

          const serviceNameWhitelist = ["uni dashboard", "add guest house", "add room details"];
          const guestHouseDashboardServices = scopedServices.filter((service) =>
            serviceNameWhitelist.includes(service.name.toLowerCase().trim())
          );

          setServices(guestHouseDashboardServices);

          if (guestHouseDashboardServices.length > 0) {
            const preferredOrder = ["uni dashboard", "add guest house"];
            const defaultService =
              guestHouseDashboardServices.find((service) =>
                preferredOrder.includes(service.name.toLowerCase().trim())
              ) || guestHouseDashboardServices[0];
            setActiveSegment(defaultService._id);
          } else {
            setActiveSegment("dashboard");
          }
        }
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 401) return;
        router.push("/uni-login");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const sidebarSegments = useMemo(() => {
    const serviceSegments = services.map((s) => ({
      key: s._id,
      label: s.name,
      icon: <></>,
    }));
    return [
      ...serviceSegments,
      { key: "profile", label: "Manage Profile", icon: <></> },
      { key: "logout", label: "Logout", icon: <></> },
    ];
  }, [services]);

  const activeService = services.find((service) => service._id === activeSegment);
  const activeServiceName = activeService?.name?.toLowerCase() || "";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] p-6">
        <div className="mx-auto max-w-7xl animate-pulse space-y-4">
          <div className="h-8 w-72 rounded bg-slate-200" />
          <div className="h-4 w-56 rounded bg-slate-200" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="h-32 rounded-xl border bg-white" />
            <div className="h-32 rounded-xl border bg-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <Sidebar
        active={activeSegment}
        onSegmentChange={setActiveSegment}
        universityName={universityName}
        universityId={universityId || "—"}
        segments={sidebarSegments}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <main className="p-4 md:ml-[280px] md:p-8">
        <div className="mb-6 flex items-center gap-3 md:hidden">
          <button
            className="rounded-md border bg-white p-2 text-slate-700"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <AiOutlineMenu />
          </button>
          <p className="text-sm font-medium text-slate-700">{universityName}</p>
        </div>

        {activeSegment === "profile" ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Guest House Profile</h2>
            <p className="mt-2 text-sm text-slate-600">
              Work in progress for guest-house specific profile management.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              This section is intentionally separate from food-ordering profile flows.
            </p>
          </div>
        ) : activeService ? (
          <div className="space-y-6">
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-slate-900">{activeService.name}</h1>
              <p className="mt-1 text-sm text-slate-600">
                Feature: {activeService.feature?.name || "Uncategorized"} | University: {universityName}
              </p>
            </section>

            {(activeServiceName === "uni dashboard" || activeServiceName.includes("uni dashboard")) && (
              <UniDashboardOverview refreshKey={dashboardRefreshKey} />
            )}

            {(activeServiceName === "add guest house" || activeServiceName.includes("add guest house")) && (
              <AddGuestHouseForm onCreated={() => setDashboardRefreshKey((prev) => prev + 1)} />
            )}

            {(activeServiceName === "add room details" || activeServiceName.includes("add room details")) && (
              <AddRoomDetailsForm />
            )}

            {!(
              activeServiceName === "uni dashboard" ||
              activeServiceName.includes("uni dashboard") ||
              activeServiceName === "add guest house" ||
              activeServiceName.includes("add guest house") ||
              activeServiceName === "add room details" ||
              activeServiceName.includes("add room details")
            ) && (
              <section className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Service Workspace</h2>
                <p className="mt-2 text-sm text-slate-600">
                  This service is assigned but not yet mapped. Current key: {activeService._id}
                </p>
              </section>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">No Services Assigned</h2>
            <p className="mt-2 text-sm text-slate-600">
              No guest-house related services are currently assigned to this university account.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

