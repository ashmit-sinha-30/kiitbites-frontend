'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface InvoiceData {
  orderId: string;
  orderNumber: string;
  vendorId: string;
  total: number;
  status: string;
  createdAt: string;
}

interface SystemHealth {
  uptime: number;
  memory: any;
  version: string;
  platform: string;
  timestamp: string;
}

interface LockStats {
  totalLocks: number;
  activeLocks: number;
  expiredLocks: number;
}

const AdminPage: React.FC = () => {
  const [orderId, setOrderId] = useState('');
  const [orders, setOrders] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [lockStats, setLockStats] = useState<LockStats | null>(null);
  const [activeTab, setActiveTab] = useState('invoices');

  // Fetch system health
  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/admin/system/health');
      const data = await response.json();
      if (data.success) {
        setSystemHealth(data.data);
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
    }
  };

  // Fetch lock statistics
  const fetchLockStats = async () => {
    try {
      const response = await fetch('/admin/locks/stats');
      const data = await response.json();
      if (data.success) {
        setLockStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching lock stats:', error);
    }
  };

  // Fetch orders for invoice generation
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/order');
      const data = await response.json();
      if (data.success) {
        setOrders(data.data || []);
      } else {
        setMessage('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setMessage('Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  // Generate invoices for an order
  const generateInvoices = async () => {
    if (!orderId.trim()) {
      setMessage('Please enter an Order ID');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/admin/invoices/generate-order-invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: orderId.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Invoices generated successfully! Vendor Invoice: ${data.data.vendorInvoiceNumber}, Platform Invoice: ${data.data.platformInvoiceNumber}`);
        setOrderId('');
        // Refresh orders
        fetchOrders();
      } else {
        setMessage(`❌ Failed to generate invoices: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating invoices:', error);
      setMessage('❌ Error generating invoices. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup expired orders and locks
  const cleanupLocks = async () => {
    setLoading(true);
    setMessage('Cleaning up expired orders and locks...');

    try {
      const response = await fetch('/admin/locks/cleanup', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Cleanup completed! ${JSON.stringify(data.data)}`);
        // Refresh lock stats
        fetchLockStats();
      } else {
        setMessage(`❌ Cleanup failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      setMessage('❌ Error during cleanup. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Force release locks for a specific order
  const releaseOrderLocks = async (orderId: string) => {
    setLoading(true);
    setMessage(`Releasing locks for order ${orderId}...`);

    try {
      const response = await fetch(`/admin/locks/release/${orderId}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Locks released for order ${orderId}!`);
        // Refresh lock stats
        fetchLockStats();
      } else {
        setMessage(`❌ Failed to release locks: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error releasing locks:', error);
      setMessage('❌ Error releasing locks. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Clear all locks (use with caution)
  const clearAllLocks = async () => {
    if (!confirm('⚠️ This will clear ALL locks. Are you sure?')) {
      return;
    }

    setLoading(true);
    setMessage('Clearing all locks...');

    try {
      const response = await fetch('/admin/locks/clear-all', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ All locks cleared! ${JSON.stringify(data.data)}`);
        // Refresh lock stats
        fetchLockStats();
      } else {
        setMessage(`❌ Failed to clear locks: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error clearing locks:', error);
      setMessage('❌ Error clearing locks. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchSystemHealth();
    fetchLockStats();
    fetchOrders();
  }, []);

  // Auto-refresh system health and lock stats every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSystemHealth();
      fetchLockStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatMemory = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🔧 Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage invoices, locks, and system health</p>
        </div>
        <Badge variant="outline" className="text-sm">
          Development Mode - No Authentication Required
        </Badge>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('✅') 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : message.includes('❌') 
            ? 'bg-red-50 border border-red-200 text-red-800'
            : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          {message}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'invoices'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📄 Invoice Management
        </button>
        <button
          onClick={() => setActiveTab('locks')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'locks'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🔒 Lock Management
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'system'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🖥️ System Health
        </button>
      </div>

      {/* Invoice Management Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>📄 Generate Invoices</CardTitle>
              <CardDescription>
                Generate vendor and platform invoices for a specific order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="orderId">Order ID</Label>
                  <Input
                    id="orderId"
                    placeholder="Enter Order ID (e.g., 68a791ff02245ebee8a2a5e7)"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={generateInvoices} 
                    disabled={loading || !orderId.trim()}
                    className="min-w-[120px]"
                  >
                    {loading ? 'Generating...' : 'Generate Invoices'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📋 Available Orders</CardTitle>
              <CardDescription>
                Orders available for invoice generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">
                  {orders.length} orders found
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchOrders}
                  disabled={loading}
                >
                  🔄 Refresh
                </Button>
              </div>
              
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No orders found</div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {orders.slice(0, 10).map((order) => (
                    <div
                      key={order.orderId}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{order.orderNumber}</div>
                        <div className="text-sm text-gray-600">
                          Order ID: {order.orderId}
                        </div>
                        <div className="text-sm text-gray-600">
                          Vendor: {order.vendorId}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₹{order.total}</div>
                        <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {orders.length > 10 && (
                    <div className="text-center py-2 text-sm text-gray-500">
                      ... and {orders.length - 10} more orders
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lock Management Tab */}
      {activeTab === 'locks' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🔒 Lock Statistics</CardTitle>
              <CardDescription>
                Current status of order locks and inventory locks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lockStats ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{lockStats.totalLocks}</div>
                    <div className="text-sm text-blue-600">Total Locks</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{lockStats.activeLocks}</div>
                    <div className="text-sm text-green-600">Active Locks</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{lockStats.expiredLocks}</div>
                    <div className="text-sm text-red-600">Expired Locks</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Loading lock statistics...</div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>🧹 Cleanup Operations</CardTitle>
                <CardDescription>
                  Clean up expired orders and release stale locks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={cleanupLocks} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  🧹 Cleanup Expired Orders & Locks
                </Button>
                <Button 
                  onClick={clearAllLocks} 
                  disabled={loading}
                  variant="destructive"
                  className="w-full"
                >
                  ⚠️ Clear All Locks (Dangerous!)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🔓 Force Release Locks</CardTitle>
                <CardDescription>
                  Manually release locks for a specific order
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="releaseOrderId">Order ID</Label>
                  <Input
                    id="releaseOrderId"
                    placeholder="Enter Order ID to release locks"
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={() => {
                    const input = document.getElementById('releaseOrderId') as HTMLInputElement;
                    if (input?.value) {
                      releaseOrderLocks(input.value);
                      input.value = '';
                    }
                  }}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  🔓 Release Order Locks
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* System Health Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🖥️ System Health</CardTitle>
              <CardDescription>
                Real-time system information and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {systemHealth ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Uptime</Label>
                      <div className="text-lg font-mono">{formatUptime(systemHealth.uptime)}</div>
                    </div>
                    <div>
                      <Label>Node Version</Label>
                      <div className="text-lg font-mono">{systemHealth.version}</div>
                    </div>
                    <div>
                      <Label>Platform</Label>
                      <div className="text-lg font-mono">{systemHealth.platform}</div>
                    </div>
                    <div>
                      <Label>Last Updated</Label>
                      <div className="text-sm text-gray-600">
                        {new Date(systemHealth.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Memory Usage</Label>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>RSS:</span>
                          <span className="font-mono">{formatMemory(systemHealth.memory.rss)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Heap Used:</span>
                          <span className="font-mono">{formatMemory(systemHealth.memory.heapUsed)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Heap Total:</span>
                          <span className="font-mono">{formatMemory(systemHealth.memory.heapTotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>External:</span>
                          <span className="font-mono">{formatMemory(systemHealth.memory.external)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Loading system health...</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🔄 Auto-Refresh</CardTitle>
              <CardDescription>
                System health and lock statistics are automatically refreshed every 30 seconds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button 
                  onClick={fetchSystemHealth} 
                  variant="outline"
                  size="sm"
                >
                  🔄 Refresh System Health
                </Button>
                <Button 
                  onClick={fetchLockStats} 
                  variant="outline"
                  size="sm"
                >
                  🔄 Refresh Lock Stats
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 pt-8">
        <p>🔓 This admin panel is accessible without authentication for development purposes.</p>
        <p className="mt-1">⚠️ Remember to re-enable authentication before deploying to production!</p>
      </div>
    </div>
  );
};

export default AdminPage;
