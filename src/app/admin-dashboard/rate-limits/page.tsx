'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import styles from './rateLimits.module.scss';

interface BlockedIP {
    key: string;
    ip: string;
    endpoint: string;
    hitCount: number;
    resetTime: string;
    blockedUntil: string;
}

const RateLimitsPage: React.FC = () => {
    const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [releasing, setReleasing] = useState<string | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

    const fetchBlockedIPs = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/admin/rate-limits/blocked-ips`);
            const data = await response.json();

            if (data.success) {
                setBlockedIPs(data.data || []);
            } else {
                setError(data.message || 'Failed to fetch blocked IPs');
            }
        } catch (err) {
            setError('Network error: Unable to fetch blocked IPs');
            console.error('Error fetching blocked IPs:', err);
        } finally {
            setLoading(false);
        }
    };

    const releaseIP = async (ip: string) => {
        try {
            setReleasing(ip);

            const response = await fetch(`${API_BASE_URL}/admin/rate-limits/release/${encodeURIComponent(ip)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                // Refresh the list
                await fetchBlockedIPs();
            } else {
                setError(data.message || 'Failed to release IP');
            }
        } catch (err) {
            setError('Network error: Unable to release IP');
            console.error('Error releasing IP:', err);
        } finally {
            setReleasing(null);
        }
    };

    const clearAllRateLimits = async () => {
        try {
            setLoading(true);

            const response = await fetch(`${API_BASE_URL}/admin/rate-limits/clear-all`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setShowClearConfirm(false);
                await fetchBlockedIPs();
            } else {
                setError(data.message || 'Failed to clear all rate limits');
            }
        } catch (err) {
            setError('Network error: Unable to clear rate limits');
            console.error('Error clearing rate limits:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlockedIPs();

        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchBlockedIPs, 300000);

        return () => clearInterval(interval);
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const getTimeRemaining = (resetTime: string) => {
        const now = new Date().getTime();
        const reset = new Date(resetTime).getTime();
        const diff = reset - now;

        if (diff <= 0) return 'Expired';

        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        return `${minutes}m ${seconds}s`;
    };

    return (
        <div className={styles.rateLimitsContainer}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Rate Limit Management</h1>
                    <p className={styles.subtitle}>View and manage rate-limited IP addresses</p>
                </div>
                <div className={styles.actions}>
                    <Button
                        onClick={fetchBlockedIPs}
                        disabled={loading}
                        variant="outline"
                    >
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </Button>
                    <Button
                        onClick={() => setShowClearConfirm(true)}
                        disabled={loading || blockedIPs.length === 0}
                        variant="destructive"
                    >
                        Clear All
                    </Button>
                </div>
            </div>

            {error && (
                <div className={styles.errorBanner}>
                    <p>{error}</p>
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {showClearConfirm && (
                <Card className={styles.confirmDialog}>
                    <CardHeader>
                        <CardTitle>Confirm Clear All</CardTitle>
                        <CardDescription>
                            Are you sure you want to clear all rate limits? This action cannot be undone.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className={styles.confirmActions}>
                        <Button onClick={() => setShowClearConfirm(false)} variant="outline">
                            Cancel
                        </Button>
                        <Button onClick={clearAllRateLimits} variant="destructive">
                            Clear All
                        </Button>
                    </CardContent>
                </Card>
            )}

            <Card className={styles.tableCard}>
                <CardHeader>
                    <CardTitle>Blocked IP Addresses</CardTitle>
                    <CardDescription>
                        Total: {blockedIPs.length} | Auto-refreshes every 5 minutes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading && blockedIPs.length === 0 ? (
                        <div className={styles.loading}>Loading...</div>
                    ) : blockedIPs.length === 0 ? (
                        <div className={styles.empty}>
                            <p>No IP addresses are currently rate-limited</p>
                        </div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>IP Address</th>
                                        <th>Endpoint</th>
                                        <th>Hit Count</th>
                                        <th>Time Remaining</th>
                                        <th>Blocked Until</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {blockedIPs.map((blockedIP) => (
                                        <tr key={blockedIP.key}>
                                            <td>
                                                <Badge variant="outline">{blockedIP.ip}</Badge>
                                            </td>
                                            <td className={styles.endpoint}>{blockedIP.endpoint}</td>
                                            <td>
                                                <Badge variant="destructive">{blockedIP.hitCount}</Badge>
                                            </td>
                                            <td>{getTimeRemaining(blockedIP.resetTime)}</td>
                                            <td>{formatDate(blockedIP.blockedUntil)}</td>
                                            <td>
                                                <Button
                                                    onClick={() => releaseIP(blockedIP.ip)}
                                                    disabled={releasing === blockedIP.ip}
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    {releasing === blockedIP.ip ? 'Releasing...' : 'Release'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default RateLimitsPage;
