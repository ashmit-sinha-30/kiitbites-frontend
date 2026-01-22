'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  ActivityIcon, 
  ServerIcon, 
  AlertTriangleIcon, 
  TrendingUpIcon,
  ClockIcon,
  RefreshCwIcon,
  FilterIcon
} from 'lucide-react';
import styles from './styles/monitoring.module.scss';

interface ServerStatus {
  isRunning: boolean;
  lastEvent: {
    type: string;
    timestamp: string;
    details: Record<string, unknown>;
  } | null;
  uptime: {
    seconds: number;
    formatted: string;
  } | null;
}

interface ApiHits {
  today: number;
  month: number;
  year: number;
  todayStats: {
    averageResponseTime: number;
    hitsByHour: Record<string, number>;
    hitsByEndpoint: Record<string, number>;
    hitsByMethod: Record<string, number>;
  } | null;
}

interface Crash {
  timestamp: string;
  error: string;
  details: Record<string, unknown>;
}

interface MonitoringData {
  serverStatus: ServerStatus;
  apiHits: ApiHits;
  crashes: Crash[];
  recentEvents: Array<{
    type: string;
    timestamp: string;
    details: Record<string, unknown>;
    error?: string;
  }>;
  idlePeriods: Array<{
    start: string;
    end: string;
    duration: number;
    formatted: string;
  }>;
}

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

const MonitoringPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');
  const [data, setData] = useState<MonitoringData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Analytics filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [endpointFilter, setEndpointFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

  useEffect(() => {
    // Set default date range for analytics (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(sevenDaysAgo.toISOString().split('T')[0]);
  }, []);

  const fetchMonitoringData = async () => {
    if (!API_BASE) {
      setError('Backend URL is not configured');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await fetch(`${API_BASE}/admin/monitoring/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to fetch monitoring data');
      }
    } catch (err) {
      console.error('Error fetching monitoring data:', err);
      setError('Failed to fetch monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();

    if (autoRefresh) {
      const interval = setInterval(fetchMonitoringData, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  useEffect(() => {
    if (activeTab === 'analytics' && startDate && endDate) {
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, startDate, endDate, endpointFilter, categoryFilter]);

  const fetchAnalytics = async () => {
    if (!API_BASE) {
      setAnalyticsError('Backend URL is not configured');
      setAnalyticsLoading(false);
      return;
    }

    try {
      setAnalyticsError(null);
      setAnalyticsLoading(true);
      
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
        setAnalyticsData(result.data);
      } else {
        setAnalyticsError(result.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setAnalyticsError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'start':
      case 'active':
        return 'bg-green-500';
      case 'stop':
      case 'idle':
        return 'bg-yellow-500';
      case 'crash':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading && !data) {
    return (
      <div className={styles.monitoringPage}>
        <div className={styles.loadingContainer}>
          <RefreshCwIcon className={styles.spinner} />
          <p>Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={styles.monitoringPage}>
        <Card>
          <CardContent className={styles.errorContainer}>
            <AlertTriangleIcon className={styles.errorIcon} />
            <p>{error}</p>
            <Button onClick={fetchMonitoringData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={styles.monitoringPage}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Server Monitoring</h1>
          <p className={styles.subtitle}>Real-time backend status and API analytics</p>
        </div>
        <div className={styles.controls}>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
          >
            <RefreshCwIcon className={styles.icon} />
            Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={fetchMonitoringData} size="sm" variant="outline">
            <RefreshCwIcon className={styles.icon} />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <ServerIcon className={styles.tabIcon} />
          Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'analytics' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUpIcon className={styles.tabIcon} />
          Analytics & Graphs
        </button>
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <>
      {/* Server Status Card */}
      <Card className={styles.statusCard}>
        <CardHeader>
          <CardTitle className={styles.cardTitle}>
            <ServerIcon className={styles.cardIcon} />
            Server Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.statusGrid}>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Status:</span>
              <Badge className={`${styles.statusBadge} ${getStatusColor(data.serverStatus.isRunning ? 'active' : 'idle')}`}>
                {data.serverStatus.isRunning ? 'Running' : 'Stopped/Idle'}
              </Badge>
            </div>
            {data.serverStatus.uptime && (
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Uptime:</span>
                <span className={styles.statusValue}>{data.serverStatus.uptime.formatted}</span>
              </div>
            )}
            {data.serverStatus.lastEvent && (
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Last Event:</span>
                <div className={styles.eventInfo}>
                  <Badge className={getStatusColor(data.serverStatus.lastEvent.type)}>
                    {data.serverStatus.lastEvent.type}
                  </Badge>
                  <span className={styles.timestamp}>
                    {formatTimestamp(data.serverStatus.lastEvent.timestamp)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Hits Card */}
      <Card className={styles.statsCard}>
        <CardHeader>
          <CardTitle className={styles.cardTitle}>
            <TrendingUpIcon className={styles.cardIcon} />
            API Hits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{data.apiHits.today.toLocaleString()}</div>
              <div className={styles.statLabel}>Today</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{data.apiHits.month.toLocaleString()}</div>
              <div className={styles.statLabel}>This Month</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{data.apiHits.year.toLocaleString()}</div>
              <div className={styles.statLabel}>This Year</div>
            </div>
            {data.apiHits.todayStats && (
              <div className={styles.statItem}>
                <div className={styles.statValue}>
                  {Math.round(data.apiHits.todayStats.averageResponseTime)}ms
                </div>
                <div className={styles.statLabel}>Avg Response Time</div>
              </div>
            )}
          </div>

          {data.apiHits.todayStats && (
            <div className={styles.detailedStats}>
              <h3 className={styles.sectionTitle}>Today&apos;s Breakdown</h3>
              <div className={styles.breakdownGrid}>
                <div>
                  <h4>Top Endpoints</h4>
                  <ul className={styles.endpointList}>
                    {Object.entries(data.apiHits.todayStats.hitsByEndpoint)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([endpoint, count]) => (
                        <li key={endpoint}>
                          <span className={styles.endpoint}>{endpoint}</span>
                          <Badge>{count as number}</Badge>
                        </li>
                      ))}
                  </ul>
                </div>
                <div>
                  <h4>Methods</h4>
                  <ul className={styles.methodList}>
                    {Object.entries(data.apiHits.todayStats.hitsByMethod).map(([method, count]) => (
                      <li key={method}>
                        <span className={styles.method}>{method}</span>
                        <Badge>{count as number}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crashes Card */}
      {data.crashes.length > 0 && (
        <Card className={styles.crashesCard}>
          <CardHeader>
            <CardTitle className={styles.cardTitle}>
              <AlertTriangleIcon className={styles.cardIcon} />
              Server Crashes ({data.crashes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.crashesList}>
              {data.crashes.map((crash, index) => (
                <div key={index} className={styles.crashItem}>
                  <div className={styles.crashHeader}>
                    <Badge className="bg-red-500">CRASH</Badge>
                    <span className={styles.crashTime}>
                      {formatTimestamp(crash.timestamp)}
                    </span>
                  </div>
                  {crash.error && (
                    <div className={styles.crashError}>
                      <strong>Error:</strong> {crash.error}
                    </div>
                  )}
                  {crash.details && Object.keys(crash.details).length > 0 && (
                    <details className={styles.crashDetails}>
                      <summary>Details</summary>
                      <pre>{JSON.stringify(crash.details, null, 2)}</pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Idle Periods Card */}
      {data.idlePeriods.length > 0 && (
        <Card className={styles.idleCard}>
          <CardHeader>
            <CardTitle className={styles.cardTitle}>
              <ClockIcon className={styles.cardIcon} />
              Idle Periods (Last 24 Hours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.idleList}>
              {data.idlePeriods.map((period, index) => (
                <div key={index} className={styles.idleItem}>
                  <div className={styles.idleHeader}>
                    <span className={styles.idleDuration}>{period.formatted}</span>
                    <Badge variant="outline">Idle</Badge>
                  </div>
                  <div className={styles.idleTimes}>
                    <span>From: {formatTimestamp(period.start)}</span>
                    <span>To: {formatTimestamp(period.end)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Events Card */}
      <Card className={styles.eventsCard}>
        <CardHeader>
          <CardTitle className={styles.cardTitle}>
            <ActivityIcon className={styles.cardIcon} />
            Recent Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.eventsList}>
            {data.recentEvents.slice(0, 20).map((event, index) => (
              <div key={index} className={styles.eventItem}>
                <div className={styles.eventHeader}>
                  <Badge className={getStatusColor(event.type)}>
                    {event.type.toUpperCase()}
                  </Badge>
                  <span className={styles.eventTime}>
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
                {event.error && (
                  <div className={styles.eventError}>{event.error}</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
        </>
      )}

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && (
        <>
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

          {analyticsLoading && !analyticsData && (
            <div className={styles.loadingContainer}>
              <RefreshCwIcon className={styles.spinner} />
              <p>Loading analytics data...</p>
            </div>
          )}

          {analyticsError && !analyticsData && (
            <Card>
              <CardContent className={styles.errorContainer}>
                <p>{analyticsError}</p>
                <Button onClick={fetchAnalytics}>Retry</Button>
              </CardContent>
            </Card>
          )}

          {analyticsData && (
            <>
              {/* Summary Cards */}
              <div className={styles.summaryGrid}>
                <Card className={styles.summaryCard}>
                  <CardContent>
                    <div className={styles.summaryValue}>{analyticsData.summary.totalHits.toLocaleString()}</div>
                    <div className={styles.summaryLabel}>Total API Hits</div>
                  </CardContent>
                </Card>
                <Card className={styles.summaryCard}>
                  <CardContent>
                    <div className={styles.summaryValue}>{analyticsData.summary.uniqueEndpoints}</div>
                    <div className={styles.summaryLabel}>Unique Endpoints</div>
                  </CardContent>
                </Card>
                <Card className={styles.summaryCard}>
                  <CardContent>
                    <div className={styles.summaryValue}>{analyticsData.summary.averageResponseTime}ms</div>
                    <div className={styles.summaryLabel}>Avg Response Time</div>
                  </CardContent>
                </Card>
                <Card className={styles.summaryCard}>
                  <CardContent>
                    <div className={styles.summaryValue}>{analyticsData.authDetails.total}</div>
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
                        <span className={styles.authValue}>{analyticsData.authDetails.login}</span>
                      </div>
                      <div className={styles.authStat}>
                        <span className={styles.authLabel}>Signup:</span>
                        <span className={styles.authValue}>{analyticsData.authDetails.signup}</span>
                      </div>
                      <div className={styles.authStat}>
                        <span className={styles.authLabel}>Logout:</span>
                        <span className={styles.authValue}>{analyticsData.authDetails.logout}</span>
                      </div>
                    </div>
                    {analyticsData.charts.authEndpoints.login > 0 || 
                     analyticsData.charts.authEndpoints.signup > 0 || 
                     analyticsData.charts.authEndpoints.logout > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Login', value: analyticsData.authDetails.login },
                              { name: 'Signup', value: analyticsData.authDetails.signup },
                              { name: 'Logout', value: analyticsData.authDetails.logout }
                            ].filter(item => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { name: 'Login', value: analyticsData.authDetails.login },
                              { name: 'Signup', value: analyticsData.authDetails.signup },
                              { name: 'Logout', value: analyticsData.authDetails.logout }
                            ].filter(item => item.value > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className={styles.noData}>No auth endpoint data available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Top Endpoints */}
                <Card className={styles.chartCard}>
                  <CardHeader>
                    <CardTitle>Top 20 Endpoints</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analyticsData.charts.topEndpoints.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={analyticsData.charts.topEndpoints} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="endpoint" type="category" width={200} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#667eea" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className={styles.noData}>No endpoint data available</p>
                    )}
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
                    {analyticsData.charts.hourlyHits.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analyticsData.charts.hourlyHits}>
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
                    ) : (
                      <p className={styles.noData}>No hourly data available</p>
                    )}
                  </CardContent>
                </Card>

                <Card className={styles.chartCard}>
                  <CardHeader>
                    <CardTitle>Average Response Time Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analyticsData.charts.responseTime.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analyticsData.charts.responseTime}>
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
                    ) : (
                      <p className={styles.noData}>No response time data available</p>
                    )}
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
                    {analyticsData.charts.statusCodes.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analyticsData.charts.statusCodes}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="code" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#f093fb" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className={styles.noData}>No status code data available</p>
                    )}
                  </CardContent>
                </Card>

                <Card className={styles.chartCard}>
                  <CardHeader>
                    <CardTitle>Requests by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analyticsData.charts.categories.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analyticsData.charts.categories}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#4facfe" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className={styles.noData}>No category data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MonitoringPage;

