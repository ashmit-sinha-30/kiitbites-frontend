import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import styles from "../styles/VendorManagement.module.scss";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

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
  total: number;
  items: Array<{
    name: string;
    quantity: number;
  }>;
}

interface VendorAnalyticsProps {
  vendorId: string;
  vendorName?: string;
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
  orders.forEach(order => {
    const d = new Date(order.createdAt);
    if (
      d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth() &&
      d.getDate() === date.getDate()
    ) {
      hours[d.getHours()]++;
    }
  });
  return Object.entries(hours).map(([hour, count]) => ({ hour: `${hour}:00`, count }));
}

const VendorAnalytics: React.FC<VendorAnalyticsProps> = ({ vendorId, vendorName }) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostSold, setMostSold] = useState<{ day: ItemStats[]; week: ItemStats[]; month: ItemStats[] }>({ day: [], week: [], month: [] });
  const [leastSold, setLeastSold] = useState<{ day: ItemStats[]; week: ItemStats[]; month: ItemStats[] }>({ day: [], week: [], month: [] });
  const [orderTimes, setOrderTimes] = useState<TimeStats[]>([]);
  const [revenue, setRevenue] = useState<RevenueStats>({ day: 0, week: 0, month: 0 });
  const [orderStats, setOrderStats] = useState<OrderStats>({ day: 0, week: 0, month: 0 });
  const [avgOrderValue, setAvgOrderValue] = useState<AvgOrderValueStats>({ day: 0, week: 0, month: 0 });
  const [uniqueCustomers, setUniqueCustomers] = useState<UniqueCustomersStats>({ day: 0, week: 0, month: 0 });

  const fetchAnalytics = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/order/analytics/${vendorId}?date=${date}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success) {
        // Process analytics data
        setRevenue({
          day: data.day.totalRevenue,
          week: data.week.totalRevenue,
          month: data.month.totalRevenue,
        });
        setOrderStats({
          day: data.day.totalOrders,
          week: data.week.totalOrders,
          month: data.month.totalOrders,
        });
        setAvgOrderValue({
          day: data.day.avgOrderValue,
          week: data.week.avgOrderValue,
          month: data.month.avgOrderValue,
        });
        setUniqueCustomers({
          day: data.day.uniqueCustomers,
          week: data.week.uniqueCustomers,
          month: data.month.uniqueCustomers,
        });
        
        // Process most/least sold items
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
        
        // Process order times for graph
        setOrderTimes(getOrderCountsByHour(data.ordersDay, new Date(date)));
      } else {
        throw new Error(data.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorId) {
      fetchAnalytics(selectedDate);
    }
  }, [selectedDate, vendorId]);

  if (!vendorId) {
    return <div>No vendor selected</div>;
  }

  if (loading) {
    return (
      <div className={styles.vendorAnalytics}>
        <div className={styles.analyticsDatePickerRow}>
          <label htmlFor="analytics-date-picker" className={styles.analyticsDateLabel}>Select Date:</label>
          <input
            id="analytics-date-picker"
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className={styles.analyticsDatePicker}
          />
        </div>
        <h2>Sales Analytics - {vendorName || 'Vendor'}</h2>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.vendorAnalytics}>
        <div className={styles.analyticsDatePickerRow}>
          <label htmlFor="analytics-date-picker" className={styles.analyticsDateLabel}>Select Date:</label>
          <input
            id="analytics-date-picker"
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className={styles.analyticsDatePicker}
          />
        </div>
        <h2>Sales Analytics - {vendorName || 'Vendor'}</h2>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#e53e3e' }}>
          <p>Error: {error}</p>
          <button onClick={() => fetchAnalytics(selectedDate)} style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: '#319795', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.vendorAnalytics}>
      <div className={styles.analyticsDatePickerRow}>
        <label htmlFor="analytics-date-picker" className={styles.analyticsDateLabel}>Select Date:</label>
        <input
          id="analytics-date-picker"
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className={styles.analyticsDatePicker}
        />
      </div>
      <h2>Sales Analytics - {vendorName || 'Vendor'}</h2>
      <div className={styles.analyticsSummaryGrid}>
        <div className={styles.analyticsSummaryCard}>
          <h4>Total Revenue</h4>
          <ul>
            <li><b>Selected Day:</b> ₹{revenue.day.toFixed(2)}</li>
            <li><b>This Week:</b> ₹{revenue.week.toFixed(2)}</li>
            <li><b>This Month:</b> ₹{revenue.month.toFixed(2)}</li>
          </ul>
        </div>
        <div className={styles.analyticsSummaryCard}>
          <h4>Total Orders</h4>
          <ul>
            <li><b>Selected Day:</b> {orderStats.day}</li>
            <li><b>This Week:</b> {orderStats.week}</li>
            <li><b>This Month:</b> {orderStats.month}</li>
          </ul>
        </div>
        <div className={styles.analyticsSummaryCard}>
          <h4>Average Order Value</h4>
          <ul>
            <li><b>Selected Day:</b> ₹{avgOrderValue.day.toFixed(2)}</li>
            <li><b>This Week:</b> ₹{avgOrderValue.week.toFixed(2)}</li>
            <li><b>This Month:</b> ₹{avgOrderValue.month.toFixed(2)}</li>
          </ul>
        </div>
        <div className={styles.analyticsSummaryCard}>
          <h4>Unique Customers</h4>
          <ul>
            <li><b>Selected Day:</b> {uniqueCustomers.day}</li>
            <li><b>This Week:</b> {uniqueCustomers.week}</li>
            <li><b>This Month:</b> {uniqueCustomers.month}</li>
          </ul>
        </div>
      </div>
      <div className={styles.analyticsGrid}>
        <div className={styles.analyticsSection}>
          <h3>Most Sold Items</h3>
          <ul>
            <li><b>Selected Day:</b> {mostSold.day.map(i => `${i.name} (${i.quantity})`).join(", ") || "-"}</li>
            <li><b>This Week:</b> {mostSold.week.map(i => `${i.name} (${i.quantity})`).join(", ") || "-"}</li>
            <li><b>This Month:</b> {mostSold.month.map(i => `${i.name} (${i.quantity})`).join(", ") || "-"}</li>
          </ul>
        </div>
        <div className={styles.analyticsSection}>
          <h3>Least Sold Items</h3>
          <ul>
            <li><b>Selected Day:</b> {leastSold.day.map(i => `${i.name} (${i.quantity})`).join(", ") || "-"}</li>
            <li><b>This Week:</b> {leastSold.week.map(i => `${i.name} (${i.quantity})`).join(", ") || "-"}</li>
            <li><b>This Month:</b> {leastSold.month.map(i => `${i.name} (${i.quantity})`).join(", ") || "-"}</li>
          </ul>
        </div>
        <div className={styles.analyticsSection} style={{ minWidth: 600, height: 350, flex: '2 1 600px' }}>
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
    </div>
  );
};

export default VendorAnalytics; 