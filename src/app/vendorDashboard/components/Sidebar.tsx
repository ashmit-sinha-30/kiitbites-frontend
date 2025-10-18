// components/Sidebar.tsx
import {
  AiOutlineDashboard,
  AiOutlineAppstore,
  AiOutlineApple,
  AiOutlineShopping,
  AiOutlineFileText,
  AiOutlineLogout,
  AiOutlineHistory,
  AiOutlineCar,
  AiOutlineShoppingCart,
  AiOutlineTruck,
  AiOutlineSwap,
  AiOutlineFileZip,
} from "react-icons/ai";
import { useRouter } from "next/navigation";
import React from "react";
import styles from "../styles/SideBar.module.scss";

const allSegments = [
  { key: "dashboard", label: "Dashboard", icon: <AiOutlineDashboard />, featureKey: "service.food_ordering.dashboard" },
  { key: "active-orders", label: "Active Orders", icon: <AiOutlineAppstore />, featureKey: "service.food_ordering.active_orders" },
  {
    key: "retail-inventory",
    label: "Retail Inventory",
    icon: <AiOutlineAppstore />,
    featureKey: "service.food_ordering.retail_inventory",
  },
  {
    key: "produce-inventory",
    label: "Produce Inventory",
    icon: <AiOutlineApple />,
    featureKey: "service.food_ordering.produce_inventory",
  },
  { key: "raw-materials", label: "Raw Materials", icon: <AiOutlineShopping />, featureKey: "service.food_ordering.raw_inventory" },
  {
    key: "inventory-reports",
    label: "Inventory Reports",
    icon: <AiOutlineFileText />,
    featureKey: "service.food_ordering.inventory_report",
  },
  {
    key: "inventory-transfer",
    label: "Inventory Transfer",
    icon: <AiOutlineSwap />,
    featureKey: "service.food_ordering.inventory_transfer",
  },
  {
    key: "delivery-orders",
    label: "Delivery Orders",
    icon: <AiOutlineCar />,
    featureKey: "service.food_ordering.delivery",
  },
  {
    key: "past-orders",
    label: "Past Orders",
    icon: <AiOutlineHistory />,
    featureKey: "service.food_ordering.past_orders",
  },
  {
    key: "invoices",
    label: "Invoices",
    icon: <AiOutlineFileZip />,
    featureKey: "service.food_ordering.invoices",
  },
  {
    key: "vendor-cart",
    label: "Vendor Cart",
    icon: <AiOutlineShoppingCart />,
    featureKey: "service.food_ordering.vendor_cart",
  },
  {
    key: "delivery-settings",
    label: "Delivery Settings",
    icon: <AiOutlineTruck />,
    featureKey: "service.food_ordering.delivery_settings",
  },
  { key: "logout", label: "Logout", icon: <AiOutlineLogout />, featureKey: null }, // Always visible
];


interface Props {
  active: string;
  onSegmentChange: (key: string) => void;
  vendorName?: string;
  vendorId?: string;
  segments?: { key: string; label: string; icon: React.ReactNode; featureKey?: string }[];
}

export default function Sidebar({
  active,
  onSegmentChange,
  vendorName = "—",
  vendorId = "—",
  segments,
}: Props) {
  const router = useRouter();
  const [allowed, setAllowed] = React.useState<Record<string, boolean> | null>(null);

  // Use provided segments or fallback to allSegments
  const segmentsToUse = segments || allSegments;

  React.useEffect(() => {
    const fetchAccess = async () => {
      try {
        const uniId = localStorage.getItem('uniId') || '';
        const role = localStorage.getItem('vendorRole') || undefined; // 'seller' | 'nonSeller'
        const params = new URLSearchParams({ uniId });
        if (vendorId && vendorId !== '—') params.set('vendorId', vendorId);
        if (role) params.set('role', role);
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
        const res = await fetch(`${backendUrl}/api/access/features?${params.toString()}`, { credentials: 'include' });
        const json = await res.json();
        const featureMap: Record<string, boolean> = json.features || {};
        const allowedMap: Record<string, boolean> = {};
        
        segmentsToUse.forEach((seg) => {
          if (seg.featureKey) {
            allowedMap[seg.key] = !!featureMap[seg.featureKey];
          } else {
            allowedMap[seg.key] = true; // Always allow logout and segments without featureKey
          }
        });
        
        setAllowed(allowedMap);
      } catch (e) {
        console.error('Failed to fetch access', e);
        // If access check fails, allow all segments (fallback behavior)
        const fallbackMap: Record<string, boolean> = {};
        segmentsToUse.forEach((seg) => {
          fallbackMap[seg.key] = true;
        });
        setAllowed(fallbackMap);
      }
    };
    fetchAccess();
  }, [vendorId, segmentsToUse]);

  const handleSegmentClick = (key: string) => {
    if (key === "logout") {
      handleLogout();
    } else {
      onSegmentChange(key);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        // Optional: Notify backend to invalidate the session
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
        await fetch(`${backendUrl}/api/vendor/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Clear token and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("vendorRole");
      localStorage.removeItem("uniId");
      router.push("/vendor-login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still redirect even if backend call fails
      localStorage.removeItem("token");
      localStorage.removeItem("vendorRole");
      localStorage.removeItem("uniId");
      router.push("/vendor-login");
    }
  };

  // Filter segments based on allowed features
  const visibleSegments = allowed ? segmentsToUse.filter(seg => allowed[seg.key]) : segmentsToUse;

  return (
    <aside className={styles.sidebar}>
      <ul className={styles.menu}>
        {visibleSegments.map((s) => (
          <li
            key={s.key}
            className={active === s.key ? styles.active : ""}
            onClick={() => handleSegmentClick(s.key)}
            data-segment={s.key}
          >
            <span className={styles.icon}>{s.icon}</span>
            <span className={styles.label}>{s.label}</span>
          </li>
        ))}
      </ul>
      <div className={styles.footer}>
        <span className={styles.vendorName}>{vendorName}</span>
        <br />
        <span className={styles.vendorId}>ID: {vendorId}</span>
      </div>
    </aside>
  );
}
