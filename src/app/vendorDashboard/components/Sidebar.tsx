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
import styles from "../styles/SideBar.module.scss";

const segments = [
  { key: "dashboard", label: "Dashboard", icon: <AiOutlineDashboard /> },
  { key: "active-orders", label: "Active Orders", icon: <AiOutlineAppstore /> },
  {
    key: "retail-inventory",
    label: "Retail Inventory",
    icon: <AiOutlineAppstore />,
  },
  {
    key: "produce-inventory",
    label: "Produce Inventory",
    icon: <AiOutlineApple />,
  },
  { key: "raw-materials", label: "Raw Materials", icon: <AiOutlineShopping /> },
  {
    key: "inventory-reports",
    label: "Inventory Reports",
    icon: <AiOutlineFileText />,
  },
  {
    key: "inventory-transfer",
    label: "Inventory Transfer",
    icon: <AiOutlineSwap />,
  },
  {
    key: "delivery-orders",
    label: "Delivery Orders",
    icon: <AiOutlineCar />,
  },
  {
    key: "past-orders",
    label: "Past Orders",
    icon: <AiOutlineHistory />,
  },
  {
    key: "invoices",
    label: "Invoices",
    icon: <AiOutlineFileZip />,
  },
  {
    key: "vendor-cart",
    label: "Vendor Cart",
    icon: <AiOutlineShoppingCart />,
  },
  {
    key: "delivery-settings",
    label: "Delivery Settings",
    icon: <AiOutlineTruck />,
  },
  { key: "logout", label: "Logout", icon: <AiOutlineLogout /> },
];


interface Props {
  active: string;
  onSegmentChange: (key: string) => void;
  vendorName?: string;
  vendorId?: string;
}

export default function Sidebar({
  active,
  onSegmentChange,
  vendorName = "—",
  vendorId = "—",
}: Props) {
  const router = useRouter();

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
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Clear token and redirect
      localStorage.removeItem("token");
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still redirect even if backend call fails
      localStorage.removeItem("token");
      router.push("/login");
    }
  };

  return (
    <aside className={styles.sidebar}>
      <ul className={styles.menu}>
        {segments.map((s) => (
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
