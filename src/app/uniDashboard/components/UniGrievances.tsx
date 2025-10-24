"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ENV_CONFIG } from "@/config/environment";
import styles from "../styles/UniGrievances.module.scss";

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
  raisedBy: {
    type: string;
    id: {
      fullName: string;
      email: string;
    };
  };
  relatedOrderId?: {
    orderNumber: string;
    status: string;
  };
  internalNotes?: Array<{
    note: string;
    addedBy: { type: string; id: string };
    addedAt: string;
  }>;
}

interface GrievanceStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  rejected: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  overdue: number;
}

const UniGrievances: React.FC = () => {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [stats, setStats] = useState<GrievanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showInternalNoteModal, setShowInternalNoteModal] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    severity: "",
    category: ""
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [statusUpdate, setStatusUpdate] = useState({
    status: "",
    note: ""
  });
  const [internalNote, setInternalNote] = useState("");

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

  const fetchGrievances = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const uniId = localStorage.getItem("uniId");
      
      if (!token || !uniId) {
        setError("Authentication required");
        return;
      }

      let url = `${ENV_CONFIG.BACKEND.URL}/api/${uniId}/grievances`;
      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.severity) queryParams.append("severity", filters.severity);
      if (filters.category) queryParams.append("category", filters.category);
      
      if (searchQuery) {
        url = `${ENV_CONFIG.BACKEND.URL}/api/${uniId}/grievances-search`;
        queryParams.append("q", searchQuery);
      }

      const response = await fetch(`${url}?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });

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
  }, [filters, searchQuery]);

  useEffect(() => {
    fetchGrievances();
    fetchStats();
  }, [filters, searchQuery, fetchGrievances]);

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

  const updateGrievanceStatus = async (grievanceId: string) => {
    try {
      const token = localStorage.getItem("token");
      const uniId = localStorage.getItem("uniId");
      
      if (!token || !uniId) return;

      const response = await fetch(
        `${ENV_CONFIG.BACKEND.URL}/api/${uniId}/grievances/${grievanceId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          credentials: "include",
          body: JSON.stringify(statusUpdate)
        }
      );

      if (response.ok) {
        setShowStatusModal(false);
        setStatusUpdate({ status: "", note: "" });
        fetchGrievances();
        fetchStats();
      } else {
        setError("Failed to update status");
      }
    } catch {
      setError("Network error");
    }
  };

  const addInternalNote = async (grievanceId: string) => {
    try {
      const token = localStorage.getItem("token");
      const uniId = localStorage.getItem("uniId");
      
      if (!token || !uniId) return;

      const response = await fetch(
        `${ENV_CONFIG.BACKEND.URL}/api/${uniId}/grievances/${grievanceId}/internal-notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          credentials: "include",
          body: JSON.stringify({ note: internalNote })
        }
      );

      if (response.ok) {
        setShowInternalNoteModal(false);
        setInternalNote("");
        fetchGrievances();
      } else {
        setError("Failed to add internal note");
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

  const getValidStatusTransitions = (currentStatus: string) => {
    const transitions: { [key: string]: string[] } = {
      'open': ['in_progress', 'rejected'],
      'in_progress': ['resolved', 'closed'],
      'resolved': ['closed'],
      'closed': [],
      'rejected': ['open']
    };
    return transitions[currentStatus] || [];
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
        <h1>Grievance Management</h1>
        <div className={styles.headerActions}>
          <input
            type="text"
            placeholder="Search grievances..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
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
          <div className={styles.statCard}>
            <h3>Critical</h3>
            <span>{stats.critical}</span>
          </div>
          <div className={styles.statCard}>
            <h3>Overdue</h3>
            <span className={stats.overdue > 0 ? styles.overdueCount : ""}>{stats.overdue}</span>
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
                <span className={styles.raisedBy}>
                  Raised by: {grievance.raisedBy.id.fullName}
                </span>
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

              <div className={styles.grievanceActions}>
                <button 
                  className={styles.actionButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGrievance(grievance);
                    setStatusUpdate({ status: "", note: "" });
                    setShowStatusModal(true);
                  }}
                >
                  Update Status
                </button>
                <button 
                  className={styles.actionButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGrievance(grievance);
                    setInternalNote("");
                    setShowInternalNoteModal(true);
                  }}
                >
                  Add Note
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedGrievance && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Update Status - {selectedGrievance.title}</h2>
              <button onClick={() => setShowStatusModal(false)}>×</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              updateGrievanceStatus(selectedGrievance._id);
            }}>
              <div className={styles.formGroup}>
                <label>New Status *</label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate({...statusUpdate, status: e.target.value})}
                  required
                >
                  <option value="">Select Status</option>
                  {getValidStatusTransitions(selectedGrievance.status).map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Note *</label>
                <textarea
                  value={statusUpdate.note}
                  onChange={(e) => setStatusUpdate({...statusUpdate, note: e.target.value})}
                  required
                  rows={4}
                  placeholder="Add a note explaining the status change..."
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowStatusModal(false)}>
                  Cancel
                </button>
                <button type="submit">Update Status</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Internal Note Modal */}
      {showInternalNoteModal && selectedGrievance && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Add Internal Note - {selectedGrievance.title}</h2>
              <button onClick={() => setShowInternalNoteModal(false)}>×</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              addInternalNote(selectedGrievance._id);
            }}>
              <div className={styles.formGroup}>
                <label>Internal Note *</label>
                <textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  required
                  rows={4}
                  placeholder="Add an internal note (not visible to vendors)..."
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowInternalNoteModal(false)}>
                  Cancel
                </button>
                <button type="submit">Add Note</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grievance Detail Modal */}
      {selectedGrievance && !showStatusModal && !showInternalNoteModal && (
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
                  <strong>Raised by:</strong>
                  <span>{selectedGrievance.raisedBy.id.fullName} ({selectedGrievance.raisedBy.id.email})</span>
                </div>
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

              {selectedGrievance.internalNotes && selectedGrievance.internalNotes.length > 0 && (
                <div className={styles.detailSection}>
                  <h3>Internal Notes</h3>
                  <div className={styles.internalNotesList}>
                    {selectedGrievance.internalNotes.map((note, index) => (
                      <div key={index} className={styles.internalNoteItem}>
                        <div className={styles.internalNoteHeader}>
                          <span className={styles.internalNoteDate}>
                            {formatDate(note.addedAt)}
                          </span>
                        </div>
                        <p className={styles.internalNoteText}>{note.note}</p>
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

export default UniGrievances;
