import { useState, useMemo } from "react";
import { InventoryItem, InventoryReport } from "../types";
import styles from "../styles/InventoryTable.module.scss";

interface Props {
  items: InventoryItem[];
  date: string;
  // Optional movement breakdowns
  sent?: InventoryReport["sent"];
  sentTo?: InventoryReport["sentTo"];
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

type TabType = 'Retail' | 'Produce' | 'Raw';

export default function InventoryTable({ items, date, sent, sentTo }: Props) {
  // Split items by type
  const retailItems = items.filter((it) => it.itemType === "Retail");
  const produceItems = items.filter((it) => it.itemType === "Produce");
  const rawItems = items.filter((it) => it.itemType === "Raw");

  // Determine available tabs
  const availableTabs = useMemo(() => {
    const tabs: TabType[] = [];
    if (retailItems.length > 0) tabs.push('Retail');
    if (produceItems.length > 0) tabs.push('Produce');
    if (rawItems.length > 0) tabs.push('Raw');
    // If no items at all, default to Retail so we show the "No items" message
    if (tabs.length === 0) tabs.push('Retail');
    return tabs;
  }, [retailItems.length, produceItems.length, rawItems.length]);

  const [activeTab, setActiveTab] = useState<TabType>(availableTabs[0]);

  // Create lookup maps for sent data
  const sentMap = new Map<string, number>();
  const sentToMap = new Map<string, { total: number; targets: string[] }>();

  if (sent) {
    sent.forEach((s) => {
      if (s.item?._id) sentMap.set(s.item._id, s.quantity);
    });
  }

  if (sentTo) {
    sentTo.forEach((s) => {
      if (s.item?._id) {
        const existing = sentToMap.get(s.item._id) || { total: 0, targets: [] };
        existing.total += s.quantity;
        if (s.to?.name && !existing.targets.includes(s.to.name)) {
          existing.targets.push(s.to.name);
        }
        sentToMap.set(s.item._id, existing);
      }
    });
  }

  // Merge sent data into retail items using itemId
  const retailItemsWithSent = retailItems.map((item) => ({
    ...item,
    sentQty: item.itemId ? sentMap.get(item.itemId) || 0 : 0,
    sentToNames: item.itemId ? sentToMap.get(item.itemId)?.targets.join(", ") || "" : "",
  }));

  return (
    <div className={styles.tableWrap}>
      <div className={styles.tableHeaderSection}>
        <div>
          <h3>Daily Inventory Report – {formatDate(date)}</h3>
          <p className={styles.sub}>
            Opening stock, movements, and closing balances
          </p>
        </div>

        <div className={styles.tabs}>
          {availableTabs.includes('Retail') && (
            <button
              className={`${styles.tabButton} ${activeTab === 'Retail' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('Retail')}
            >
              Retail
            </button>
          )}
          {availableTabs.includes('Produce') && (
            <button
              className={`${styles.tabButton} ${activeTab === 'Produce' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('Produce')}
            >
              Produce
            </button>
          )}
          {availableTabs.includes('Raw') && (
            <button
              className={`${styles.tabButton} ${activeTab === 'Raw' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('Raw')}
            >
              Raw Material
            </button>
          )}
        </div>
      </div>

      <div className={styles.contentArea}>
        {/* Retail Section */}
        {activeTab === 'Retail' && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Retail Inventory</h4>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Opening Stock</th>
                    <th>Produced</th>
                    <th>Received</th>
                    <th>Sold</th>
                    <th>Sent</th>
                    <th>Sent To</th>
                    <th>Closing Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {retailItemsWithSent.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: "center" }}>No retail items</td></tr>
                  ) : retailItemsWithSent.map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.name}</td>
                      <td>{it.opening}</td>
                      <td className={styles.received}>+{it.produced}</td>
                      <td className={styles.received}>+{it.received}</td>
                      <td className={styles.sold}>-{it.sold}</td>
                      <td className={styles.sold}>-{it.sentQty}</td>
                      <td>{it.sentToNames}</td>
                      <td>{it.closing}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Produce Section */}
        {activeTab === 'Produce' && (
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
        )}

        {/* Raw Material Section */}
        {activeTab === 'Raw' && (
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
        )}
      </div>
    </div>
  );
}
