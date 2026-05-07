"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AiOutlineMenu } from "react-icons/ai";
import axios from "axios";
import api from "@/utils/apiUtils";
import Sidebar from "@/app/guest-house-booking-unidashboard/components/Sidebar";
import AddAuditoriumForm from "./components/AddAuditoriumForm";
import AuditoriumDashboardOverview from "./components/AuditoriumDashboardOverview";

interface ServiceItem {
  _id: string;
  name: string;
  feature?: { _id: string; name: string };
}
interface FeatureItem {
  _id: string;
  name: string;
}

export default function AuditoriumBookingUniDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [universityName, setUniversityName] = useState<string>("University");
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [activeSegment, setActiveSegment] = useState<string>("dashboard");
  const [refreshKey, setRefreshKey] = useState(0);

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

        const assignRes = await api.get(`/api/university/universities/${uniId}/assignments`);
        const assignJson = assignRes.data;
        if (assignJson.success) {
          const assignedFeatures: FeatureItem[] = assignJson.data?.features || [];
          const assignedServices: ServiceItem[] = assignJson.data?.services || [];
          const auditoriumFeatureIds = assignedFeatures
            .filter((f) => f.name.toLowerCase().includes("auditorium"))
            .map((f) => f._id);
          const scopedServices = assignedServices.filter((s) =>
            s.feature?._id ? auditoriumFeatureIds.includes(s.feature._id) : false
          );
          const nameWhitelist = ["uni dashboard", "add auditorium"];
          const auditoriumServices = scopedServices.filter((s) =>
            nameWhitelist.includes(s.name.toLowerCase().trim())
          );
          setServices(auditoriumServices);
          setActiveSegment(auditoriumServices[0]?._id || "dashboard");
        }
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 401) return;
        router.push("/uni-login");
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, [router]);

  const sidebarSegments = useMemo(
    () => [
      ...services.map((s) => ({ key: s._id, label: s.name, icon: <></> })),
      { key: "logout", label: "Logout", icon: <></> },
    ],
    [services]
  );

  const activeService = services.find((service) => service._id === activeSegment);
  const activeServiceName = activeService?.name?.toLowerCase() || "";

  if (loading) return <div className="min-h-screen bg-[#f4f7fb] p-6" />;

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
          <button className="rounded-md border bg-white p-2 text-slate-700" onClick={() => setIsMobileMenuOpen(true)}>
            <AiOutlineMenu />
          </button>
          <p className="text-sm font-medium text-slate-700">{universityName}</p>
        </div>

        {(activeServiceName === "uni dashboard" || activeServiceName.includes("uni dashboard")) && (
          <AuditoriumDashboardOverview refreshKey={refreshKey} />
        )}
        {(activeServiceName === "add auditorium" || activeServiceName.includes("add auditorium")) && (
          <AddAuditoriumForm onCreated={() => setRefreshKey((v) => v + 1)} />
        )}
        {!activeService && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">No Services Assigned</h2>
            <p className="mt-2 text-sm text-slate-600">No auditorium-related services are assigned to this account.</p>
          </div>
        )}
      </main>
    </div>
  );
}
