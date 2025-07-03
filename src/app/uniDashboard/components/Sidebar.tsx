import {
  AiOutlineDashboard,
  AiOutlineShopping,
  AiOutlineFileText,
  AiOutlinePlusCircle,
} from "react-icons/ai";
import styles from "../styles/SideBar.module.scss";

const segments = [
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
];

interface Props {
  active: string;
  onSegmentChange: (key: string) => void;
  universityName?: string;
  universityId?: string;
}

export default function Sidebar({
  active,
  onSegmentChange,
  universityName = "—",
  universityId = "—",
}: Props) {
  return (
    <aside className={styles.sidebar}>
      <ul className={styles.menu}>
        {segments.map((s) => (
          <li
            key={s.key}
            className={active === s.key ? styles.active : ""}
            onClick={() => onSegmentChange(s.key)}
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
