"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ENV_CONFIG } from "@/config/environment";
import styles from "../styles/VendorGrievances.module.scss";

interface Grievance {
  _id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed" | "rejected";
  category: string;
  createdAt: string;
  slaDeadline: string;
  progress: Array<{
    status: string;
    note: string;
    updatedBy: { type: string; id: string };
    updatedAt: string;
  }>;
  relatedOrderId?: {
    orderNumber: string;
    status: string;
  };
}

interface GrievanceStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  rejected: number;
}

const VendorGrievances: React.FC = () => {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [stats, setStats] = useState<GrievanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    severity: "",
    category: ""
  });

  // Form state for creating new grievance
  const [newGrievance, setNewGrievance] = useState({
    title: "",
    description: "",
    severity: "medium" as const,
    category: "order_issue",
    relatedOrderId: "",
    tags: [] as string[]
  });

  const severityColors = {
    low: "#10b981",
    medium: "#f59e0b", 
    high: "#ef4444",
    critical: "#dc2626"
  };

  const statusColors = {
    open: "#3b82f6",
    in_progress: "#f59e0b",
    resolved: "#10b981",
    closed: "#6b7280",
    rejected: "#ef4444"
  };

  const categories = [
    { value: "order_issue", label: "Order Issue" },
    { value: "payment_issue", label: "Payment Issue" },
    { value: "delivery_issue", label: "Delivery Issue" },
    { value: "food_quality", label: "Food Quality" },
    { value: "service_issue", label: "Service Issue" },
    { value: "technical_issue", label: "Technical Issue" },
    { value: "billing_issue", label: "Billing Issue" },
    { value: "something_broken", label: "Something Broken" },
    { value: "something_required", label: "Something Required" },
    { value: "things_too", label: "Things Too" },
    { value: "other", label: "Other" }
  ];

  useEffect(() => {
    fetchGrievances();
    fetchStats();
  }, [filters, fetchGrievances]);

  const fetchGrievances = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const uniId = localStorage.getItem("uniId");
      
      if (!token || !uniId) {
        setError("Authentication required");
        return;
      }

      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.severity) queryParams.append("severity", filters.severity);
      if (filters.category) queryParams.append("category", filters.category);

      const response = await fetch(
        `${ENV_CONFIG.BACKEND.URL}/api/${uniId}/vendor-grievances?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include"
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGrievances(data.data || []);
      } else {
        setError("Failed to fetch grievances");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const uniId = localStorage.getItem("uniId");
      
      if (!token || !uniId) return;

      const response = await fetch(
        `${ENV_CONFIG.BACKEND.URL}/api/${uniId}/grievances-stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include"
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const createGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const uniId = localStorage.getItem("uniId");
      
      if (!token || !uniId) return;

      const response = await fetch(
        `${ENV_CONFIG.BACKEND.URL}/api/${uniId}/grievances`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          credentials: "include",
          body: JSON.stringify({
            ...newGrievance,
            relatedOrderId: newGrievance.relatedOrderId || undefined
          })
        }
      );

      if (response.ok) {
        setShowCreateForm(false);
        setNewGrievance({
          title: "",
          description: "",
          severity: "medium",
          category: "order_issue",
          relatedOrderId: "",
          tags: []
        });
        fetchGrievances();
        fetchStats();
      } else {
        setError("Failed to create grievance");
      }
    } catch {
      setError("Network error");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const isOverdue = (slaDeadline: string, status: string) => {
    if (status === "resolved" || status === "closed") return false;
    return new Date() > new Date(slaDeadline);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading grievances...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Grievances</h1>
        <button 
          className={styles.createButton}
          onClick={() => setShowCreateForm(true)}
        >
          + Create New Grievance
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Total</h3>
            <span>{stats.total}</span>
          </div>
          <div className={styles.statCard}>
            <h3>Open</h3>
            <span>{stats.open}</span>
          </div>
          <div className={styles.statCard}>
            <h3>In Progress</h3>
            <span>{stats.inProgress}</span>
          </div>
          <div className={styles.statCard}>
            <h3>Resolved</h3>
            <span>{stats.resolved}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={filters.severity}
          onChange={(e) => setFilters({...filters, severity: e.target.value})}
        >
          <option value="">All Severity</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <select
          value={filters.category}
          onChange={(e) => setFilters({...filters, category: e.target.value})}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Grievances List */}
      <div className={styles.grievancesList}>
        {grievances.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No grievances found</p>
          </div>
        ) : (
          grievances.map((grievance) => (
            <div 
              key={grievance._id} 
              className={styles.grievanceCard}
              onClick={() => setSelectedGrievance(grievance)}
            >
              <div className={styles.grievanceHeader}>
                <h3>{grievance.title}</h3>
                <div className={styles.badges}>
                  <span 
                    className={styles.severityBadge}
                    style={{ backgroundColor: severityColors[grievance.severity] }}
                  >
                    {grievance.severity.toUpperCase()}
                  </span>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: statusColors[grievance.status] }}
                  >
                    {grievance.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              
              <p className={styles.description}>{grievance.description}</p>
              
              <div className={styles.grievanceMeta}>
                <span className={styles.category}>
                  {categories.find(c => c.value === grievance.category)?.label}
                </span>
                <span className={styles.date}>
                  Created: {formatDate(grievance.createdAt)}
                </span>
                {isOverdue(grievance.slaDeadline, grievance.status) && (
                  <span className={styles.overdue}>OVERDUE</span>
                )}
              </div>

              {grievance.relatedOrderId && (
                <div className={styles.relatedOrder}>
                  Related Order: {grievance.relatedOrderId.orderNumber}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Grievance Modal */}
      {showCreateForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Create New Grievance</h2>
            <form onSubmit={createGrievance}>
              <div className={styles.formGroup}>
                <label>Title *</label>
                <input
                  type="text"
                  value={newGrievance.title}
                  onChange={(e) => setNewGrievance({...newGrievance, title: e.target.value})}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description *</label>
                <textarea
                  value={newGrievance.description}
                  onChange={(e) => setNewGrievance({...newGrievance, description: e.target.value})}
                  required
                  rows={4}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Severity *</label>
                  <select
                    value={newGrievance.severity}
                    onChange={(e) => setNewGrievance({...newGrievance, severity: e.target.value as "low" | "medium" | "high" | "critical"})}
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Category *</label>
                  <select
                    value={newGrievance.category}
                    onChange={(e) => setNewGrievance({...newGrievance, category: e.target.value})}
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Related Order ID (Optional)</label>
                <input
                  type="text"
                  value={newGrievance.relatedOrderId}
                  onChange={(e) => setNewGrievance({...newGrievance, relatedOrderId: e.target.value})}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit">Create Grievance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grievance Detail Modal */}
      {selectedGrievance && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{selectedGrievance.title}</h2>
              <button onClick={() => setSelectedGrievance(null)}>×</button>
            </div>

            <div className={styles.grievanceDetail}>
              <div className={styles.detailSection}>
                <h3>Description</h3>
                <p>{selectedGrievance.description}</p>
              </div>

              <div className={styles.detailMeta}>
                <div className={styles.metaItem}>
                  <strong>Severity:</strong>
                  <span style={{ color: severityColors[selectedGrievance.severity] }}>
                    {selectedGrievance.severity.toUpperCase()}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <strong>Status:</strong>
                  <span style={{ color: statusColors[selectedGrievance.status] }}>
                    {selectedGrievance.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <strong>Category:</strong>
                  <span>{categories.find(c => c.value === selectedGrievance.category)?.label}</span>
                </div>
                <div className={styles.metaItem}>
                  <strong>Created:</strong>
                  <span>{formatDate(selectedGrievance.createdAt)}</span>
                </div>
                <div className={styles.metaItem}>
                  <strong>SLA Deadline:</strong>
                  <span className={isOverdue(selectedGrievance.slaDeadline, selectedGrievance.status) ? styles.overdue : ""}>
                    {formatDate(selectedGrievance.slaDeadline)}
                  </span>
                </div>
              </div>

              {selectedGrievance.progress && selectedGrievance.progress.length > 0 && (
                <div className={styles.detailSection}>
                  <h3>Progress Updates</h3>
                  <div className={styles.progressList}>
                    {selectedGrievance.progress.map((update, index) => (
                      <div key={index} className={styles.progressItem}>
                        <div className={styles.progressHeader}>
                          <span className={styles.progressStatus}>
                            {update.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={styles.progressDate}>
                            {formatDate(update.updatedAt)}
                          </span>
                        </div>
                        {update.note && (
                          <p className={styles.progressNote}>{update.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorGrievances;
