import React, { useCallback, useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "@/utils/apiUtils";

type ItemStats = {
  name: string;
  quantity: number;
};

type TimeStats = {
  hour: string;
  count: number;
};

type RevenueStats = {
  day: number;
  week: number;
  month: number;
};

type OrderStats = {
  day: number;
  week: number;
  month: number;
};

type AvgOrderValueStats = {
  day: number;
  week: number;
  month: number;
};

type UniqueCustomersStats = {
  day: number;
  week: number;
  month: number;
};

interface Order {
  _id: string;
  createdAt: string;
}

function getMostLeastSold(stats: Record<string, number>, count = 3) {
  const items = Object.entries(stats).map(([name, quantity]) => ({ name, quantity }));
  const sorted = [...items].sort((a, b) => b.quantity - a.quantity);
  return {
    most: sorted.slice(0, count),
    least: sorted.slice(-count).reverse(),
  };
}

function getOrderCountsByHour(orders: Order[], date: Date) {
  const hours: Record<string, number> = {};
  for (let i = 0; i < 24; i++) hours[i] = 0;
  orders.forEach((order) => {
    const d = new Date(order.createdAt);
    if (d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate()) {
      hours[d.getHours()]++;
    }
  });
  return Object.entries(hours).map(([hour, count]) => ({ hour: `${hour}:00`, count }));
}

interface VendorAnalyticsDashboardProps {
  vendorId?: string;
  vendorName?: string;
  styles: Record<string, string>;
  rootClassName: string;
  titlePrefix?: string;
  renderLoading?: () => React.ReactNode;
}

const VendorAnalyticsDashboard: React.FC<VendorAnalyticsDashboardProps> = ({
  vendorId,
  vendorName,
  styles,
  rootClassName,
  titlePrefix,
  renderLoading,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostSold, setMostSold] = useState<{ day: ItemStats[]; week: ItemStats[]; month: ItemStats[] }>({ day: [], week: [], month: [] });
  const [leastSold, setLeastSold] = useState<{ day: ItemStats[]; week: ItemStats[]; month: ItemStats[] }>({ day: [], week: [], month: [] });
  const [orderTimes, setOrderTimes] = useState<TimeStats[]>([]);
  const [revenue, setRevenue] = useState<RevenueStats>({ day: 0, week: 0, month: 0 });
  const [orderStats, setOrderStats] = useState<OrderStats>({ day: 0, week: 0, month: 0 });
  const [avgOrderValue, setAvgOrderValue] = useState<AvgOrderValueStats>({ day: 0, week: 0, month: 0 });
  const [uniqueCustomers, setUniqueCustomers] = useState<UniqueCustomersStats>({ day: 0, week: 0, month: 0 });

  const fetchAnalytics = useCallback(
    async (date: string) => {
      if (!vendorId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/order/analytics/${vendorId}`, { params: { date } });
        const data = response.data;
        if (!data.success) throw new Error(data.message || "Failed to fetch analytics");

        setRevenue({ day: data.day.totalRevenue, week: data.week.totalRevenue, month: data.month.totalRevenue });
        setOrderStats({ day: data.day.totalOrders, week: data.week.totalOrders, month: data.month.totalOrders });
        setAvgOrderValue({ day: data.day.avgOrderValue, week: data.week.avgOrderValue, month: data.month.avgOrderValue });
        setUniqueCustomers({ day: data.day.uniqueCustomers, week: data.week.uniqueCustomers, month: data.month.uniqueCustomers });
        setMostSold({
          day: getMostLeastSold(data.day.itemStats).most,
          week: getMostLeastSold(data.week.itemStats).most,
          month: getMostLeastSold(data.month.itemStats).most,
        });
        setLeastSold({
          day: getMostLeastSold(data.day.itemStats).least,
          week: getMostLeastSold(data.week.itemStats).least,
          month: getMostLeastSold(data.month.itemStats).least,
        });
        setOrderTimes(getOrderCountsByHour(data.ordersDay, new Date(date)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch analytics");
      } finally {
        setLoading(false);
      }
    },
    [vendorId],
  );

  useEffect(() => {
    fetchAnalytics(selectedDate);
  }, [selectedDate, fetchAnalytics]);

  if (!vendorId) return <div>No vendor selected</div>;
  if (loading) return <>{renderLoading ? renderLoading() : <div>Loading analytics...</div>}</>;

  const title = titlePrefix ? `${titlePrefix} - ${vendorName || "Vendor"}` : null;

  return (
    <div className={rootClassName}>
      <div className={styles.analyticsDatePickerRow}>
        <label htmlFor="analytics-date-picker" className={styles.analyticsDateLabel}>Select Date:</label>
        <input
          id="analytics-date-picker"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className={styles.analyticsDatePicker}
        />
      </div>
      {title && <h2>{title}</h2>}
      {error ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#e53e3e" }}>
          <p>Error: {error}</p>
          <button onClick={() => fetchAnalytics(selectedDate)} style={{ marginTop: "1rem", padding: "0.5rem 1rem", backgroundColor: "#319795", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className={styles.analyticsSummaryGrid}>
            <div className={styles.analyticsSummaryCard}><h4>Total Revenue</h4><ul><li><b>Selected Day:</b> ₹{revenue.day.toFixed(2)}</li><li><b>This Week:</b> ₹{revenue.week.toFixed(2)}</li><li><b>This Month:</b> ₹{revenue.month.toFixed(2)}</li></ul></div>
            <div className={styles.analyticsSummaryCard}><h4>Total Orders</h4><ul><li><b>Selected Day:</b> {orderStats.day}</li><li><b>This Week:</b> {orderStats.week}</li><li><b>This Month:</b> {orderStats.month}</li></ul></div>
            <div className={styles.analyticsSummaryCard}><h4>Average Order Value</h4><ul><li><b>Selected Day:</b> ₹{avgOrderValue.day.toFixed(2)}</li><li><b>This Week:</b> ₹{avgOrderValue.week.toFixed(2)}</li><li><b>This Month:</b> ₹{avgOrderValue.month.toFixed(2)}</li></ul></div>
            <div className={styles.analyticsSummaryCard}><h4>Unique Customers</h4><ul><li><b>Selected Day:</b> {uniqueCustomers.day}</li><li><b>This Week:</b> {uniqueCustomers.week}</li><li><b>This Month:</b> {uniqueCustomers.month}</li></ul></div>
          </div>
          <div className={styles.analyticsGrid}>
            <div className={styles.analyticsSection}><h3>Most Sold Items</h3><ul><li><b>Selected Day:</b> {mostSold.day.map((i) => `${i.name} (${i.quantity})`).join(", ") || "-"}</li><li><b>This Week:</b> {mostSold.week.map((i) => `${i.name} (${i.quantity})`).join(", ") || "-"}</li><li><b>This Month:</b> {mostSold.month.map((i) => `${i.name} (${i.quantity})`).join(", ") || "-"}</li></ul></div>
            <div className={styles.analyticsSection}><h3>Least Sold Items</h3><ul><li><b>Selected Day:</b> {leastSold.day.map((i) => `${i.name} (${i.quantity})`).join(", ") || "-"}</li><li><b>This Week:</b> {leastSold.week.map((i) => `${i.name} (${i.quantity})`).join(", ") || "-"}</li><li><b>This Month:</b> {leastSold.month.map((i) => `${i.name} (${i.quantity})`).join(", ") || "-"}</li></ul></div>
            <div className={styles.analyticsSection} style={{ minWidth: 600, height: 350, flex: "2 1 600px" }}>
              <h3>Peak Order Times (Selected Day)</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={orderTimes} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#319795" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VendorAnalyticsDashboard;
