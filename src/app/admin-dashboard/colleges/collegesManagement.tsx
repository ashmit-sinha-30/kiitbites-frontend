'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ENV_CONFIG } from '@/config/environment';
import styles from './styles/collegesManagement.module.scss';

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

interface University {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  gstNumber: string;
  packingCharge: number;
  deliveryCharge: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  totalVendors: number;
  activeVendors: number;
  vendorCount: number;
}

const CollegesManagement: React.FC = () => {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUniversities, setFilteredUniversities] = useState<University[]>([]);

  // Fetch universities from API
  const fetchUniversities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${ENV_CONFIG.BACKEND.URL}/admin/universities`);
      const data = await response.json();
      
      if (data.success) {
        setUniversities(data.data);
        setFilteredUniversities(data.data);
      } else {
        setError(data.message || 'Failed to fetch universities');
      }
    } catch (err) {
      console.error('Error fetching universities:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Filter universities based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUniversities(universities);
    } else {
      const filtered = universities.filter(uni =>
        uni.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        uni.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        uni.gstNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUniversities(filtered);
    }
  }, [searchTerm, universities]);

  // Load data on component mount
  useEffect(() => {
    fetchUniversities();
  }, []);

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

  // Go back to admin dashboard
  const goBack = () => {
    window.history.back();
  };

  return (
    <div className={styles.collegesManagement}>
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
            Back to Dashboard
          </Button>
          
          <div className={styles.headerInfo}>
            <div className={styles.headerTitle}>
              <BuildingIcon />
              <h1>Colleges Management</h1>
            </div>
            <p className={styles.headerSubtitle}>
              Manage and view all registered colleges and universities
            </p>
          </div>
        </div>

        {/* Search and Actions */}
        <div className={styles.headerActions}>
          <div className={styles.searchContainer}>
            <SearchIcon />
            <Input
              placeholder="Search colleges by name, email, or GST number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <Button 
            onClick={fetchUniversities}
            disabled={loading}
            variant="outline"
            className={styles.refreshButton}
          >
            <RefreshIcon />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <Button onClick={fetchUniversities} size="sm" variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading universities...</p>
        </div>
      )}

      {/* Statistics */}
      {!loading && !error && (
        <div className={styles.statistics}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{universities.length}</div>
            <div className={styles.statLabel}>Total Colleges</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>
              {universities.reduce((sum, uni) => sum + uni.totalVendors, 0)}
            </div>
            <div className={styles.statLabel}>Total Vendors</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>
              {universities.filter(uni => uni.isVerified).length}
            </div>
            <div className={styles.statLabel}>Verified Colleges</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>
              {universities.filter(uni => !uni.isVerified).length}
            </div>
            <div className={styles.statLabel}>Pending Verification</div>
          </div>
        </div>
      )}

      {/* Universities List */}
      {!loading && !error && (
        <div className={styles.universitiesList}>
          {filteredUniversities.length === 0 ? (
            <div className={styles.emptyState}>
              <BuildingIcon />
              <h3>No universities found</h3>
              <p>
                {searchTerm ? 'No universities match your search criteria.' : 'No universities have been registered yet.'}
              </p>
            </div>
          ) : (
            filteredUniversities.map((uni) => (
              <Card key={uni._id} className={styles.universityCard}>
                <CardHeader className={styles.cardHeader}>
                  <div className={styles.cardHeaderTop}>
                    <div className={styles.universityInfo}>
                      <CardTitle className={styles.universityName}>
                        {uni.fullName}
                      </CardTitle>
                      <div className={styles.universityMeta}>
                        <Badge variant={uni.isVerified ? "default" : "secondary"}>
                          {uni.isVerified ? 'Verified' : 'Pending Verification'}
                        </Badge>
                        <span className={styles.universityId}>
                          ID: {uni._id.slice(-8)}
                        </span>
                      </div>
                    </div>
                    <div className={styles.vendorStats}>
                      <div className={styles.vendorStat}>
                        <UsersIcon />
                        <span>{uni.totalVendors} Total</span>
                      </div>
                      <div className={styles.vendorStat}>
                        <UsersIcon />
                        <span>{uni.activeVendors} Active</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className={styles.cardContent}>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                      <EmailIcon />
                      <div>
                        <Label>Email</Label>
                        <p>{uni.email}</p>
                      </div>
                    </div>
                    
                    <div className={styles.detailItem}>
                      <PhoneIcon />
                      <div>
                        <Label>Phone</Label>
                        <p>{uni.phone}</p>
                      </div>
                    </div>
                    
                    <div className={styles.detailItem}>
                      <ReceiptIcon />
                      <div>
                        <Label>GST Number</Label>
                        <p>{uni.gstNumber}</p>
                      </div>
                    </div>
                    
                    <div className={styles.detailItem}>
                      <ReceiptIcon />
                      <div>
                        <Label>Packing Charge</Label>
                        <p>₹{uni.packingCharge}</p>
                      </div>
                    </div>
                    
                    <div className={styles.detailItem}>
                      <ReceiptIcon />
                      <div>
                        <Label>Delivery Charge</Label>
                        <p>₹{uni.deliveryCharge}</p>
                      </div>
                    </div>
                    
                    <div className={styles.detailItem}>
                      <CalendarIcon />
                      <div>
                        <Label>Added On</Label>
                        <p>{formatDate(uni.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <p>Showing {filteredUniversities.length} of {universities.length} universities</p>
      </div>
    </div>
  );
};

export default CollegesManagement;
