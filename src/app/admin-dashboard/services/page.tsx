'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ENV_CONFIG } from '@/config/environment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Feature = { _id: string; name: string; description?: string; isActive: boolean };
type Service = { _id: string; name: string; description?: string; feature: Feature | string; isActive: boolean; basePrice?: number };

const ServicesManagementPage: React.FC = () => {
  const baseUrl = useMemo(() => `${ENV_CONFIG.BACKEND.URL}/api/admin`, []);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [featureForm, setFeatureForm] = useState({ name: '', description: '' });
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', feature: '', basePrice: '' });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [fRes, sRes] = await Promise.all([
        fetch(`${baseUrl}/features`, { credentials: 'include' }),
        fetch(`${baseUrl}/services`, { credentials: 'include' }),
      ]);
      const fJson = await fRes.json();
      const sJson = await sRes.json();
      if (fJson.success) setFeatures(fJson.data);
      if (sJson.success) setServices(sJson.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const createFeature = async () => {
    if (!featureForm.name.trim()) return;
    const res = await fetch(`${baseUrl}/features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: featureForm.name.trim(), description: featureForm.description.trim() || undefined })
    });
    const json = await res.json();
    if (json.success) {
      setFeatureForm({ name: '', description: '' });
      fetchAll();
    } else {
      alert(json.message || 'Failed to create feature');
    }
  };

  const createService = async () => {
    if (!serviceForm.name.trim() || !serviceForm.feature) return;
    const res = await fetch(`${baseUrl}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim() || undefined,
        feature: serviceForm.feature,
        basePrice: serviceForm.basePrice ? Number(serviceForm.basePrice) : undefined
      })
    });
    const json = await res.json();
    if (json.success) {
      setServiceForm({ name: '', description: '', feature: '', basePrice: '' });
      fetchAll();
    } else {
      alert(json.message || 'Failed to create service');
    }
  };

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>Create and view features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Feature name" value={featureForm.name} onChange={(e) => setFeatureForm({ ...featureForm, name: e.target.value })} />
            <Input placeholder="Description (optional)" value={featureForm.description} onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })} />
            <Button onClick={createFeature} disabled={loading || !featureForm.name.trim()}>Add Feature</Button>
          </div>
          <ul className="list-disc pl-6">
            {features.map((f) => (
              <li key={f._id} className="py-1">
                <span className="font-medium">{f.name}</span>
                {f.description ? <span className="text-sm text-gray-500"> — {f.description}</span> : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <CardDescription>Create services under a feature</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
            <Input placeholder="Service name" value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} />
            <Input placeholder="Description (optional)" value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} />
            <select className="border rounded px-2" value={serviceForm.feature} onChange={(e) => setServiceForm({ ...serviceForm, feature: e.target.value })}>
              <option value="">Select feature</option>
              {features.map((f) => (
                <option key={f._id} value={f._id}>{f.name}</option>
              ))}
            </select>
            <Input placeholder="Base price (optional)" type="number" value={serviceForm.basePrice} onChange={(e) => setServiceForm({ ...serviceForm, basePrice: e.target.value })} />
          </div>
          <Button onClick={createService} disabled={loading || !serviceForm.name.trim() || !serviceForm.feature}>Add Service</Button>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">All Services</h3>
            <ul className="list-disc pl-6">
              {services.map((s) => (
                <li key={s._id} className="py-1">
                  <span className="font-medium">{s.name}</span>
                  {typeof s.feature === 'object' && s.feature && 'name' in s.feature ? (
                    <span className="text-sm text-gray-500"> — {((s.feature as Feature).name)}</span>
                  ) : null}
                  {s.description ? <span className="text-sm text-gray-500"> — {s.description}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServicesManagementPage;


