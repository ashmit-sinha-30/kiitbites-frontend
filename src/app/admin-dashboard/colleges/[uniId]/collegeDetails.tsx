'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ENV_CONFIG } from '@/config/environment';
import styles from '../styles/collegeDetails.module.scss';

// Icons as React components
const BuildingIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ReceiptIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const MapPinIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ToggleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

interface Vendor {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  isAvailable: string;
  deliverySettings: {
    offersDelivery: boolean;
    deliveryPreparationTime: number;
  };
}

interface UniversityDetails {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  gstNumber: string;
  packingCharge: number;
  deliveryCharge: number;
  isVerified: boolean;
  isAvailable: string;
  createdAt: string;
  updatedAt: string;
  vendors: Vendor[];
  features?: { _id: string; name: string }[];
  services?: { _id: string; name: string; feature?: { _id: string; name: string } }[];
  statistics: {
    totalVendors: number;
    activeVendors: number;
    inactiveVendors: number;
  };
}

interface CollegeDetailsProps {
  uniId: string;
}

const CollegeDetails: React.FC<CollegeDetailsProps> = ({ uniId }) => {
  const [university, setUniversity] = useState<UniversityDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [allFeatures, setAllFeatures] = useState<{ _id: string; name: string }[]>([]);
  const [allServices, setAllServices] = useState<{ _id: string; name: string; feature: { _id: string; name: string } }[]>([]);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [featureToAdd, setFeatureToAdd] = useState<string>("");
  const [serviceToAdd, setServiceToAdd] = useState<string>("");
  // Vendor service assignment modal state
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignVendorId, setAssignVendorId] = useState<string>("");
  const [allowedServices, setAllowedServices] = useState<{ _id: string; name: string; feature?: { _id: string; name: string } }[]>([]);
  const [vendorServices, setVendorServices] = useState<string[]>([]);
  const [savingVendorServices, setSavingVendorServices] = useState(false);

  // Fetch university details
  const fetchUniversityDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${ENV_CONFIG.BACKEND.URL}/admin/universities/${uniId}`);
      const data = await response.json();
      
      if (data.success) {
        setUniversity(data.data);
        setFilteredVendors(data.data.vendors);
        // Load current assignments
        try {
          const assignRes = await fetch(`${ENV_CONFIG.BACKEND.URL}/api/university/universities/${uniId}/assignments`);
          const assignJson = await assignRes.json();
          if (assignJson.success) {
            setSelectedFeatureIds(assignJson.data.features.map((f: { _id: string }) => f._id));
            setSelectedServiceIds(assignJson.data.services.map((s: { _id: string }) => s._id));
          }
        } catch {
          console.error('Failed to load assignments');
        }
      } else {
        setError(data.message || 'Failed to fetch university details');
      }
    } catch (err) {
      console.error('Error fetching university details:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Fetch catalog for features/services
  const fetchFeatureAndServiceCatalog = async () => {
    try {
      const [fRes, sRes] = await Promise.all([
        fetch(`${ENV_CONFIG.BACKEND.URL}/api/admin/features`),
        fetch(`${ENV_CONFIG.BACKEND.URL}/api/admin/services`),
      ]);
      const fJson = await fRes.json();
      const sJson = await sRes.json();
      if (fJson.success) setAllFeatures(fJson.data);
      if (sJson.success) setAllServices(sJson.data);
    } catch (e) {
      console.error('Failed to fetch feature/service catalog', e);
    }
  };

  // Open vendor service assignment modal
  const openAssignServices = async (vendorId: string) => {
    try {
      setAssignVendorId(vendorId);
      setAssignOpen(true);
      // load allowed services for this uni
      const [allowedRes, vendorRes] = await Promise.all([
        fetch(`${ENV_CONFIG.BACKEND.URL}/api/university/universities/${uniId}/allowed-services`),
        fetch(`${ENV_CONFIG.BACKEND.URL}/api/university/universities/${uniId}/vendors/${vendorId}/services`),
      ]);
      const allowedJson = await allowedRes.json();
      const vendorJson = await vendorRes.json();
      if (allowedJson.success) setAllowedServices(allowedJson.data?.services || []);
      if (vendorJson.success) {
        const services = vendorJson.data?.services || [];
        setVendorServices(services.filter((s: { isAssigned: boolean }) => s.isAssigned).map((s: { _id: string }) => s._id));
      }
    } catch {
      console.error('Failed to open assign services');
    }
  };

  const toggleVendorService = (serviceId: string) => {
    setVendorServices(prev => prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]);
  };

  const saveVendorServices = async () => {
    try {
      setSavingVendorServices(true);
      const res = await fetch(`${ENV_CONFIG.BACKEND.URL}/api/university/universities/${uniId}/vendors/${assignVendorId}/services`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: vendorServices })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to update vendor services');
      setAssignOpen(false);
    } catch (e) {
      console.error('Failed to save vendor services', e);
      alert('Failed to save vendor services');
    } finally {
      setSavingVendorServices(false);
    }
  };

  // Toggle university availability
  const toggleAvailability = async () => {
    if (!university) return;
    
    try {
      setUpdatingAvailability(true);
      const newAvailability = university.isAvailable === 'Y' ? 'N' : 'Y';
      
      const response = await fetch(`${ENV_CONFIG.BACKEND.URL}/admin/universities/${uniId}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAvailable: newAvailability }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUniversity(prev => prev ? { ...prev, isAvailable: newAvailability } : null);
      } else {
        setError(data.message || 'Failed to update availability');
      }
    } catch (err) {
      console.error('Error updating availability:', err);
      setError('Failed to update availability');
    } finally {
      setUpdatingAvailability(false);
    }
  };

  // Filter vendors based on search term
  useEffect(() => {
    if (!university) return;
    
    if (!searchTerm.trim()) {
      setFilteredVendors(university.vendors);
    } else {
      const filtered = university.vendors.filter(vendor =>
        vendor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVendors(filtered);
    }
  }, [searchTerm, university]);

  // Load data on component mount
  useEffect(() => {
    fetchUniversityDetails();
    fetchFeatureAndServiceCatalog();
  }, [uniId, fetchUniversityDetails]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Go back to colleges list
  const goBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading university details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorMessage}>
        <p>{error}</p>
        <Button onClick={fetchUniversityDetails} size="sm" variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!university) {
    return (
      <div className={styles.errorMessage}>
        <p>University not found</p>
        <Button onClick={goBack} size="sm" variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.collegeDetails}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goBack}
            className={styles.backButton}
          >
            <ArrowLeftIcon />
            Back to Colleges
          </Button>
          
          <div className={styles.headerInfo}>
            <div className={styles.headerTitle}>
              <BuildingIcon />
              <h1>{university.fullName}</h1>
            </div>
            <p className={styles.headerSubtitle}>
              University Details & Vendor Management
            </p>
          </div>
        </div>

        {/* Availability Toggle */}
        <div className={styles.availabilityToggle}>
          <div className={styles.toggleContainer}>
            <Label htmlFor="availability-toggle" className={styles.toggleLabel}>
              <ToggleIcon />
              University Available
            </Label>
            <Switch
              id="availability-toggle"
              checked={university.isAvailable === 'Y'}
              onCheckedChange={toggleAvailability}
              disabled={updatingAvailability}
              className={styles.toggleSwitch}
            />
          </div>
          <Badge 
            variant={university.isAvailable === 'Y' ? "default" : "destructive"}
            className={styles.availabilityBadge}
          >
            {university.isAvailable === 'Y' ? 'Available' : 'Unavailable'}
          </Badge>
        </div>
      </div>

      {/* University Information */}
      <Card className={styles.universityInfoCard}>
        <CardHeader>
          <CardTitle className={styles.cardTitle}>University Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <EmailIcon />
              <div>
                <Label>Email</Label>
                <p>{university.email}</p>
              </div>
            </div>
            
            <div className={styles.detailItem}>
              <PhoneIcon />
              <div>
                <Label>Phone</Label>
                <p>{university.phone}</p>
              </div>
            </div>
            
            <div className={styles.detailItem}>
              <ReceiptIcon />
              <div>
                <Label>GST Number</Label>
                <p>{university.gstNumber}</p>
              </div>
            </div>
            
            <div className={styles.detailItem}>
              <ReceiptIcon />
              <div>
                <Label>Packing Charge</Label>
                <p>₹{university.packingCharge}</p>
              </div>
            </div>
            
            <div className={styles.detailItem}>
              <ReceiptIcon />
              <div>
                <Label>Delivery Charge</Label>
                <p>₹{university.deliveryCharge}</p>
              </div>
            </div>
            
            <div className={styles.detailItem}>
              <CalendarIcon />
              <div>
                <Label>Added On</Label>
                <p>{formatDate(university.createdAt)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Assignment */}
      <Card className={styles.universityInfoCard}>
        <CardHeader>
          <CardTitle className={styles.cardTitle}>Assign Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap gap-2">
                {selectedFeatureIds.length === 0 && (
                  <span className="text-sm text-gray-500">No features assigned</span>
                )}
                {selectedFeatureIds.map((fid) => {
                  const f = allFeatures.find((x) => x._id === fid);
                  return (
                    <span key={fid} className="inline-flex items-center gap-2 border rounded px-2 py-1 text-sm">
                      {f?.name || fid}
                      <button
                        className="text-red-600"
                        onClick={async () => {
                          const next = selectedFeatureIds.filter((id) => id !== fid);
                          setSelectedFeatureIds(next);
                          await fetch(`${ENV_CONFIG.BACKEND.URL}/api/university/universities/${uniId}/features`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ features: next })
                          });
                          // also remove any services that belong to removed feature from selected state
                          const remainingServiceIds = selectedServiceIds.filter((sid) => {
                            const svc = allServices.find((s) => s._id === sid);
                            return svc ? next.includes(svc.feature._id) : false;
                          });
                          if (remainingServiceIds.length !== selectedServiceIds.length) {
                            setSelectedServiceIds(remainingServiceIds);
                            await fetch(`${ENV_CONFIG.BACKEND.URL}/api/university/universities/${uniId}/services`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ services: remainingServiceIds })
                            });
                          }
                        }}
                        aria-label="Remove feature"
                      >×</button>
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <select
                className="border rounded p-2 w-full"
                value={featureToAdd}
                onChange={(e) => setFeatureToAdd(e.target.value)}
              >
                <option value="">Select feature to add</option>
                {allFeatures
                  .filter((f) => !selectedFeatureIds.includes(f._id))
                  .map((f) => (
                    <option key={f._id} value={f._id}>{f.name}</option>
                  ))}
              </select>
              <Button
                disabled={!featureToAdd}
                onClick={async () => {
                  const next = Array.from(new Set([...selectedFeatureIds, featureToAdd]));
                  setSelectedFeatureIds(next);
                  setFeatureToAdd("");
                  await fetch(`${ENV_CONFIG.BACKEND.URL}/api/university/universities/${uniId}/features`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ features: next })
                  });
                }}
              >Add Feature</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Assignment */}
      <Card className={styles.universityInfoCard}>
        <CardHeader>
          <CardTitle className={styles.cardTitle}>Assign Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap gap-2">
                {selectedServiceIds.length === 0 && (
                  <span className="text-sm text-gray-500">No services assigned</span>
                )}
                {selectedServiceIds.map((sid) => {
                  const s = allServices.find((x) => x._id === sid);
                  return (
                    <span key={sid} className="inline-flex items-center gap-2 border rounded px-2 py-1 text-sm">
                      {s?.name || sid}{s?.feature?.name ? ` — ${s.feature.name}` : ''}
                      <button
                        className="text-red-600"
                        onClick={async () => {
                          const next = selectedServiceIds.filter((id) => id !== sid);
                          setSelectedServiceIds(next);
                          await fetch(`${ENV_CONFIG.BACKEND.URL}/api/university/universities/${uniId}/services`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ services: next })
                          });
                        }}
                        aria-label="Remove service"
                      >×</button>
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <select
                className="border rounded p-2 w-full"
                value={serviceToAdd}
                onChange={(e) => setServiceToAdd(e.target.value)}
              >
                <option value="">Select service to add</option>
                {allServices
                  .filter((s) => selectedFeatureIds.includes(s.feature._id))
                  .filter((s) => !selectedServiceIds.includes(s._id))
                  .map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} {s.feature?.name ? `— ${s.feature.name}` : ''}
                    </option>
                  ))}
              </select>
              <Button
                disabled={!serviceToAdd}
                onClick={async () => {
                  const next = Array.from(new Set([...selectedServiceIds, serviceToAdd]));
                  setSelectedServiceIds(next);
                  setServiceToAdd("");
                  await fetch(`${ENV_CONFIG.BACKEND.URL}/api/university/universities/${uniId}/services`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ services: next })
                  });
                }}
              >Add Service</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className={styles.statistics}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{university.statistics.totalVendors}</div>
          <div className={styles.statLabel}>Total Vendors</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{university.statistics.activeVendors}</div>
          <div className={styles.statLabel}>Active Vendors</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{university.statistics.inactiveVendors}</div>
          <div className={styles.statLabel}>Inactive Vendors</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>
            {university.isVerified ? 'Yes' : 'No'}
          </div>
          <div className={styles.statLabel}>Verified</div>
        </div>
      </div>

      {/* Vendors Section */}
      <div className={styles.vendorsSection}>
        <div className={styles.vendorsHeader}>
          <h2>Vendors ({filteredVendors.length})</h2>
          <div className={styles.vendorsActions}>
            <div className={styles.searchContainer}>
              <SearchIcon />
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            <Button 
              onClick={fetchUniversityDetails}
              disabled={loading}
              variant="outline"
              className={styles.refreshButton}
            >
              <RefreshIcon />
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Vendors List */}
        <div className={styles.vendorsList}>
          {filteredVendors.length === 0 ? (
            <div className={styles.emptyState}>
              <UsersIcon />
              <h3>No vendors found</h3>
              <p>
                {searchTerm ? 'No vendors match your search criteria.' : 'No vendors are registered for this university.'}
              </p>
            </div>
          ) : (
            filteredVendors.map((vendor) => (
              <Card key={vendor._id} className={styles.vendorCard}>
                <CardHeader className={styles.vendorCardHeader}>
                  <div className={styles.vendorInfo}>
                    <CardTitle className={styles.vendorName}>
                      {vendor.fullName}
                    </CardTitle>
                    <div className={styles.vendorMeta}>
                      <Badge variant={vendor.isAvailable === 'Y' ? "default" : "secondary"}>
                        {vendor.isAvailable === 'Y' ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className={styles.vendorId}>
                        ID: {vendor._id.slice(-8)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className={styles.vendorCardContent}>
                  <div className={styles.vendorDetails}>
                    <div className={styles.vendorDetailItem}>
                      <EmailIcon />
                      <div>
                        <Label>Email</Label>
                        <p>{vendor.email}</p>
                      </div>
                    </div>
                    
                    <div className={styles.vendorDetailItem}>
                      <PhoneIcon />
                      <div>
                        <Label>Phone</Label>
                        <p>{vendor.phone}</p>
                      </div>
                    </div>
                    
                    <div className={styles.vendorDetailItem}>
                      <MapPinIcon />
                      <div>
                        <Label>Location</Label>
                        <p>{vendor.location}</p>
                      </div>
                    </div>
                    
                    <div className={styles.vendorDetailItem}>
                      <UsersIcon />
                      <div>
                        <Label>Delivery</Label>
                        <p>
                          {vendor.deliverySettings.offersDelivery 
                            ? `Yes (${vendor.deliverySettings.deliveryPreparationTime} min)` 
                            : 'No'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <Button size="sm" onClick={() => openAssignServices(vendor._id)}>Assign Services</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <p>Showing {filteredVendors.length} of {university.vendors.length} vendors</p>
      </div>

      {assignOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: 8, padding: 16, width: 'min(720px, 90vw)', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 className="text-lg font-semibold">Assign Services to Vendor</h3>
              <button onClick={() => setAssignOpen(false)} style={{ fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>Only services that are assigned to this university are available.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              {allowedServices.length === 0 && (
                <div className="text-sm text-gray-500">No services are assigned to this university yet.</div>
              )}
              {allowedServices.map(s => (
                <label key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, border: '1px solid #ddd', borderRadius: 6 }}>
                  <input type="checkbox" checked={vendorServices.includes(s._id)} onChange={() => toggleVendorService(s._id)} />
                  <span style={{ fontWeight: 500 }}>{s.name}</span>
                  {s.feature?.name ? <span style={{ fontSize: 12, color: '#666' }}>— {s.feature.name}</span> : null}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
              <Button onClick={saveVendorServices} disabled={savingVendorServices}>{savingVendorServices ? 'Saving...' : 'Save'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeDetails;
