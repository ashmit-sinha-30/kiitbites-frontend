'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminQuickAccessProps {
  className?: string;
}

const AdminQuickAccess: React.FC<AdminQuickAccessProps> = ({ className = '' }) => {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  // Quick cleanup function
  const quickCleanup = async () => {
    setLoading(true);
    setMessage('Quick cleanup in progress...');

    try {
      const response = await fetch('/admin/locks/cleanup', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Quick cleanup completed!');
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

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Admin Quick Access
          <Badge variant="outline" className="text-xs">
            Dev Mode
          </Badge>
        </CardTitle>
        <CardDescription>
          Quick access to admin functions for development and testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Message Display */}
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.includes('✅') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : message.includes('❌') 
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            {message}
          </div>
        )}

        {/* Quick Invoice Generation */}
        <div className="space-y-3">
          <Label htmlFor="quickOrderId">Generate Invoices</Label>
          <div className="flex space-x-2">
            <Input
              id="quickOrderId"
              placeholder="Order ID (e.g., 68a791ff02245ebee8a2a5e7)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={generateInvoices} 
              disabled={loading || !orderId.trim()}
              size="sm"
            >
              {loading ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <Label>Quick Actions</Label>
          <div className="flex space-x-2">
            <Button 
              onClick={quickCleanup} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              🧹 Quick Cleanup
            </Button>
            <Button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              variant="ghost"
              size="sm"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
          </div>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-3 pt-3 border-t">
            <Label className="text-sm font-medium">Advanced Functions</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => window.open('/admin', '_blank')}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                🔧 Full Admin Panel
              </Button>
              <Button 
                onClick={() => window.open('/admin/system/health', '_blank')}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                🖥️ System Health
              </Button>
              <Button 
                onClick={() => window.open('/admin/locks/stats', '_blank')}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                🔒 Lock Stats
              </Button>
              <Button 
                onClick={() => window.open('/admin/invoices', '_blank')}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                📄 All Invoices
              </Button>
            </div>
          </div>
        )}

        {/* Quick Status */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          <p>🔓 No authentication required for development</p>
          <p>⚠️ Remember to re-enable auth in production!</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminQuickAccess;
