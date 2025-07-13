import { InventoryItem } from "../types";
import styles from "../styles/InventoryTable.module.scss";

interface Props {
  items: InventoryItem[];
  date: string;
}

// Helper function to format date safely
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toDateString();
  } catch {
    return 'Invalid Date';
  }
}

export default function InventoryTable({ items, date }: Props) {
  // Split items by type
  const retailItems = items.filter((it) => it.itemType === "Retail");
  const produceItems = items.filter((it) => it.itemType === "Produce");
  const rawItems = items.filter((it) => it.itemType === "Raw");

  return (
    <div className={styles.tableWrap}>
      <h3>Daily Inventory Report – {formatDate(date)}</h3>
      <p className={styles.sub}>
        Opening stock, movements, and closing balances
      </p>

      {/* Retail Section */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Retail Inventory</h4>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Opening Stock</th>
                <th>Received</th>
                <th>Sold</th>
                <th>Closing Stock</th>
              </tr>
            </thead>
            <tbody>
              {retailItems.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center" }}>No retail items</td></tr>
              ) : retailItems.map((it, idx) => (
                <tr key={idx}>
                  <td>{it.name}</td>
                  <td>{it.opening}</td>
                  <td className={styles.received}>+{it.received}</td>
                  <td className={styles.sold}>-{it.sold}</td>
                  <td>{it.closing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Produce Section */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Produce Inventory</h4>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Times Sold</th>
              </tr>
            </thead>
            <tbody>
              {produceItems.length === 0 ? (
                <tr><td colSpan={2} style={{ textAlign: "center" }}>No produce items</td></tr>
              ) : produceItems.map((it, idx) => (
                <tr key={idx}>
                  <td>{it.name}</td>
                  <td>{it.sold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Material Section */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Raw Material Inventory</h4>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Opening Amount</th>
                <th>Closing Amount</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              {rawItems.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center" }}>No raw material items</td></tr>
              ) : rawItems.map((it, idx) => (
                <tr key={idx}>
                  <td>{it.name}</td>
                  <td>{it.opening}</td>
                  <td>{it.closing}</td>
                  <td>{it.unit || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
