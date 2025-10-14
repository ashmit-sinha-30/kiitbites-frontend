import {
  AiOutlineDashboard,
  AiOutlineShopping,
  AiOutlineFileText,
  AiOutlinePlusCircle,
  AiOutlineDollar,
  AiOutlineSetting,
  AiOutlineLogout,
} from "react-icons/ai";
import { useRouter } from "next/navigation";
import styles from "../styles/SideBar.module.scss";

const defaultSegments = [
  { key: "dashboard", 
    label: "Dashboard", 
    icon: <AiOutlineDashboard /> 
},
  {
    key: "add-vendor",
    label: "Add Vendor",
    icon: <AiOutlineShopping />,
  },
  {
    key: "addItem",
    label: "Add Food Item",
    icon: <AiOutlinePlusCircle />,
  },
  {
    key: "manage-items",
    label: "Manage Items",
    icon: <AiOutlineFileText />,
  },
  {
    key: "manage-charges",
    label: "Manage Charges",
    icon: <AiOutlineDollar />,
  },
  {
    key: "tax-updating",
    label: "Tax Updating — Food Ordering",
    icon: <AiOutlineSetting />,
  },
  // Note: dynamic services loaded from assignments will include Review/Invoice/DeleteVendorList etc.
  { key: "logout", label: "Logout", icon: <AiOutlineLogout /> },
];

interface Props {
  active: string;
  onSegmentChange: (key: string) => void;
  universityName?: string;
  universityId?: string;
  segments?: { key: string; label: string; icon: React.ReactNode }[];
}

export default function Sidebar({
  active,
  onSegmentChange,
  universityName = "—",
  universityId = "—",
  segments,
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
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/uni/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Clear token and redirect
      localStorage.removeItem("token");
      router.push("/uni-login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still redirect even if backend call fails
      localStorage.removeItem("token");
      router.push("/uni-login");
    }
  };

  return (
    <aside className={styles.sidebar}>
      <ul className={styles.menu}>
        {(segments || defaultSegments).map((s) => (
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
        <span className={styles.universityName}>{universityName}</span>
        <br />
        <span className={styles.universityId}>ID: {universityId}</span>
      </div>
    </aside>
  );
}
