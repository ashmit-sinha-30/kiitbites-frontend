'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ENV_CONFIG } from '@/config/environment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const AddCollegePage: React.FC = () => {
  const router = useRouter();
  const [form, setForm] = useState({ 
    fullName: '', 
    email: '', 
    phone: '', 
    password: '', 
    gstNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${ENV_CONFIG.BACKEND.URL}/api/uni/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || 'Failed to sign up');
      } else {
        router.push(`/admin-dashboard/colleges/verify-otp?email=${encodeURIComponent(form.email)}`);
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New College</CardTitle>
          <CardDescription>Register a college (signup + email OTP verification)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Input name="fullName" placeholder="College name" value={form.fullName} onChange={handleChange} required />
            </div>
            <div>
              <Input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <Input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required />
            </div>
            <div>
              <Input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
            </div>
            <div>
              <Input name="gstNumber" placeholder="GST Number" value={form.gstNumber} onChange={handleChange} required />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create & Send OTP'}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddCollegePage;


