"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import styles from "../styles/UniGrievances.module.scss";

const VENDOR_GRIEVANCE_CATEGORIES = [
  { value: "equipment_not_working", label: "Equipment Not Working" },
  { value: "machine_broken", label: "Machine / Appliance Broken" },
  { value: "technical_issue", label: "Technical Issue (POS / App / Dashboard)" },
  { value: "payment_delay", label: "Payment Delay / Settlement Issue" },
  { value: "billing_error", label: "Billing Error / Wrong Amount" },
  { value: "order_display_issue", label: "Order Display / Notification Issue" },
  { value: "something_needs_repair", label: "Something Needs Repair / Replacement" },
  { value: "power_or_network_issue", label: "Power / Network Issue" },
  { value: "delivery_team_issue", label: "Delivery / Runner Issue" },
  { value: "something_broken", label: "Something Broken" },
  { value: "something_missing", label: "Something Missing" },
  { value: "other", label: "Other" }
];

interface Grievance {
  _id: string;
  category: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  remarks?: string;
  vendor: {
    _id: string;
    fullName: string;
    email: string;
  };
  university: {
    _id: string;
    fullName: string;
  };
}

interface UniGrievancesProps {
  universityId: string;
}

export default function UniGrievances({ universityId }: UniGrievancesProps) {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const { toast } = useToast();

  const fetchGrievances = async () => {
    try {
      const token = localStorage.getItem("token");
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      
      let url = `${backendUrl}/api/university/${universityId}/grievances`;
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (severityFilter) params.append("severity", severityFilter);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success) {
          setGrievances(json.data);
        }
      }
    } catch (error) {
      console.error("Error fetching grievances:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universityId, statusFilter, severityFilter]);

  const handleUpdateStatus = async () => {
    if (!selectedGrievance || !updateStatus) return;

    setUpdating(true);

    try {
      const token = localStorage.getItem("token");
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

      const response = await fetch(`${backendUrl}/api/grievances/${selectedGrievance._id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: updateStatus,
          remarks: remarks,
          universityId: universityId
        })
      });

      const json = await response.json();

      if (json.success) {
        toast({
          title: "Success",
          description: "Grievance status updated successfully"
        });
        setShowModal(false);
        setSelectedGrievance(null);
        setUpdateStatus("");
        setRemarks("");
        fetchGrievances();
      } else {
        toast({
          title: "Error",
          description: json.message || "Failed to update grievance",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating grievance:", error);
      toast({
        title: "Error",
        description: "Failed to update grievance",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "in_progress":
        return "#3b82f6";
      case "completed":
        return "#10b981";
      case "closed":
        return "#6b7280";
      case "not_required":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "#dc2626";
      case "high":
        return "#ea580c";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const openUpdateModal = (grievance: Grievance) => {
    setSelectedGrievance(grievance);
    setUpdateStatus(grievance.status);
    setRemarks(grievance.remarks || "");
    setShowModal(true);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Vendor Grievances</h2>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="closed">Closed</option>
          <option value="not_required">Not Required</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          <option value="">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Grievances List */}
      {grievances.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No grievances found.</p>
        </div>
      ) : (
        <div className={styles.grievancesList}>
          {grievances.map((grievance) => (
            <div key={grievance._id} className={styles.grievanceCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <h4>{grievance.title}</h4>
                  <p>
                    Vendor: <strong>{grievance.vendor.fullName}</strong> ({grievance.vendor.email})
                  </p>
                  <p>
                    {VENDOR_GRIEVANCE_CATEGORIES.find(c => c.value === grievance.category)?.label}
                  </p>
                </div>
                <div className={styles.badges}>
                  <span 
                    className={styles.badge}
                    style={{ backgroundColor: getSeverityColor(grievance.severity) }}
                  >
                    {grievance.severity.toUpperCase()}
                  </span>
                  <span 
                    className={styles.badge}
                    style={{ backgroundColor: getStatusColor(grievance.status) }}
                  >
                    {grievance.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>
              <p className={styles.cardDescription}>{grievance.description}</p>
              <div className={styles.cardFooter}>
                <span>Created: {new Date(grievance.createdAt).toLocaleDateString()}</span>
                <button
                  onClick={() => openUpdateModal(grievance)}
                  className={styles.updateButton}
                >
                  Update Status
                </button>
              </div>
              {grievance.resolvedAt && (
                <div className={styles.resolvedInfo}>
                  <p>
                    <strong>Resolved on:</strong> {new Date(grievance.resolvedAt).toLocaleDateString()}
                  </p>
                  {grievance.remarks && (
                    <p>
                      <strong>Remarks:</strong> {grievance.remarks}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Update Status Modal */}
      {showModal && selectedGrievance && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Update Grievance Status</h3>
            
            <div className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Status *</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="closed">Closed</option>
                  <option value="not_required">Not Required</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Remarks (Optional)</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add any remarks or notes"
                  rows={4}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                onClick={() => setShowModal(false)}
                disabled={updating}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating || !updateStatus}
                className={styles.saveButton}
              >
                {updating ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
