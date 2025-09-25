'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ENV_CONFIG } from '@/config/environment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const VerifyOtpPage: React.FC = () => {
  const router = useRouter();
  const params = useSearchParams();
  const emailFromQuery = params.get('email') || '';
  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const baseUrl = useMemo(() => `${ENV_CONFIG.BACKEND.URL}/api/uni/auth`, []);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/otpverification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const json = await res.json();
      if (res.ok) {
        router.push('/admin-dashboard/colleges');
      } else {
        setError(json.message || 'Invalid OTP');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Verify OTP</CardTitle>
          <CardDescription>Enter the 6-digit OTP sent to the college email</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={verify} className="space-y-3">
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify'}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Back</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyOtpPage;


