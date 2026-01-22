'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  RefreshCwIcon,
  FilterIcon
} from 'lucide-react';
import styles from './styles/analytics.module.scss';

interface AnalyticsData {
  summary: {
    totalHits: number;
    dateRange: { start: string; end: string };
    uniqueEndpoints: number;
    averageResponseTime: number;
  };
  charts: {
    hourlyHits: Array<{ time: string; count: number }>;
    topEndpoints: Array<{ endpoint: string; count: number }>;
    statusCodes: Array<{ code: string; count: number }>;
    categories: Array<{ category: string; count: number }>;
    authEndpoints: { login: number; signup: number; logout: number; other: number };
    responseTime: Array<{ time: string; avgResponseTime: number }>;
  };
  authDetails: {
    login: number;
    signup: number;
    logout: number;
    total: number;
  };
}

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140'];

const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [endpointFilter, setEndpointFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

  useEffect(() => {
    // Set default date range (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(sevenDaysAgo.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, endpointFilter, categoryFilter]);

  const fetchAnalytics = async () => {
    if (!API_BASE) {
      setError('Backend URL is not configured');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      const params = new URLSearchParams({
        startDate,
        endDate
      });
      
      if (endpointFilter) params.append('endpoint', endpointFilter);
      if (categoryFilter) params.append('category', categoryFilter);

      const response = await fetch(`${API_BASE}/admin/monitoring/detailed-analytics?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className={styles.analyticsPage}>
        <div className={styles.loadingContainer}>
          <RefreshCwIcon className={styles.spinner} />
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={styles.analyticsPage}>
        <Card>
          <CardContent className={styles.errorContainer}>
            <p>{error}</p>
            <Button onClick={fetchAnalytics}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  // Prepare auth endpoints data for pie chart
  const authData = [
    { name: 'Login', value: data.authDetails.login },
    { name: 'Signup', value: data.authDetails.signup },
    { name: 'Logout', value: data.authDetails.logout }
  ].filter(item => item.value > 0);

  return (
    <div className={styles.analyticsPage}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>API Analytics Dashboard</h1>
          <p className={styles.subtitle}>Detailed insights into your server activity</p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline" size="sm">
          <RefreshCwIcon className={styles.icon} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <CardHeader>
          <CardTitle className={styles.filterTitle}>
            <FilterIcon className={styles.icon} />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.filtersGrid}>
            <div className={styles.filterItem}>
              <label>Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className={styles.filterItem}>
              <label>End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className={styles.filterItem}>
              <label>Endpoint (search)</label>
              <Input
                type="text"
                placeholder="e.g., /api/user/auth/login"
                value={endpointFilter}
                onChange={(e) => setEndpointFilter(e.target.value)}
              />
            </div>
            <div className={styles.filterItem}>
              <label>Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={styles.select}
              >
                <option value="">All Categories</option>
                <option value="auth">Auth</option>
                <option value="order">Order</option>
                <option value="item">Item</option>
                <option value="payment">Payment</option>
                <option value="cart">Cart</option>
                <option value="inventory">Inventory</option>
                <option value="vendor">Vendor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <Card className={styles.summaryCard}>
          <CardContent>
            <div className={styles.summaryValue}>{data.summary.totalHits.toLocaleString()}</div>
            <div className={styles.summaryLabel}>Total API Hits</div>
          </CardContent>
        </Card>
        <Card className={styles.summaryCard}>
          <CardContent>
            <div className={styles.summaryValue}>{data.summary.uniqueEndpoints}</div>
            <div className={styles.summaryLabel}>Unique Endpoints</div>
          </CardContent>
        </Card>
        <Card className={styles.summaryCard}>
          <CardContent>
            <div className={styles.summaryValue}>{data.summary.averageResponseTime}ms</div>
            <div className={styles.summaryLabel}>Avg Response Time</div>
          </CardContent>
        </Card>
        <Card className={styles.summaryCard}>
          <CardContent>
            <div className={styles.summaryValue}>{data.authDetails.total}</div>
            <div className={styles.summaryLabel}>Auth Requests</div>
          </CardContent>
        </Card>
      </div>

      {/* Auth Endpoints Breakdown */}
      <div className={styles.chartsGrid}>
        <Card className={styles.chartCard}>
          <CardHeader>
            <CardTitle>Authentication Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.authStats}>
              <div className={styles.authStat}>
                <span className={styles.authLabel}>Login:</span>
                <span className={styles.authValue}>{data.authDetails.login}</span>
              </div>
              <div className={styles.authStat}>
                <span className={styles.authLabel}>Signup:</span>
                <span className={styles.authValue}>{data.authDetails.signup}</span>
              </div>
              <div className={styles.authStat}>
                <span className={styles.authLabel}>Logout:</span>
                <span className={styles.authValue}>{data.authDetails.logout}</span>
              </div>
            </div>
            {authData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={authData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {authData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Endpoints */}
        <Card className={styles.chartCard}>
          <CardHeader>
            <CardTitle>Top 20 Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.charts.topEndpoints} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="endpoint" type="category" width={200} />
                <Tooltip />
                <Bar dataKey="count" fill="#667eea" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Hits & Response Time */}
      <div className={styles.chartsGrid}>
        <Card className={styles.chartCard}>
          <CardHeader>
            <CardTitle>API Hits Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.charts.hourlyHits}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#667eea" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className={styles.chartCard}>
          <CardHeader>
            <CardTitle>Average Response Time Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.charts.responseTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgResponseTime" 
                  stroke="#764ba2" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status Codes & Categories */}
      <div className={styles.chartsGrid}>
        <Card className={styles.chartCard}>
          <CardHeader>
            <CardTitle>Status Code Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.charts.statusCodes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="code" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#f093fb" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className={styles.chartCard}>
          <CardHeader>
            <CardTitle>Requests by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.charts.categories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#4facfe" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;

