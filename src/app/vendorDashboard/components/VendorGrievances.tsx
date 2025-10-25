"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import styles from "../styles/VendorGrievances.module.scss";

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

const SEVERITY_LEVELS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" }
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
  university: {
    _id: string;
    fullName: string;
  };
}

interface VendorGrievancesProps {
  vendorId: string;
}

export default function VendorGrievances({ vendorId }: VendorGrievancesProps) {
  const [showForm, setShowForm] = useState(false);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    category: "",
    severity: "medium",
    title: "",
    description: ""
  });

  const fetchGrievances = async () => {
    try {
      const token = localStorage.getItem("token");
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      
      const response = await fetch(`${backendUrl}/api/vendor/${vendorId}/grievances`, {
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
  }, [vendorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

      const response = await fetch(`${backendUrl}/api/vendor/${vendorId}/grievances`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const json = await response.json();

      if (json.success) {
        toast({
          title: "Success",
          description: "Grievance created successfully"
        });
        setShowForm(false);
        setFormData({
          category: "",
          severity: "medium",
          title: "",
          description: ""
        });
        fetchGrievances();
      } else {
        toast({
          title: "Error",
          description: json.message || "Failed to create grievance",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating grievance:", error);
      toast({
        title: "Error",
        description: "Failed to create grievance",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Grievances</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className={styles.createButton}
        >
          {showForm ? "Cancel" : "Create New Grievance"}
        </button>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h3>Create New Grievance</h3>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select a category</option>
                {VENDOR_GRIEVANCE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Severity *</label>
              <select
                required
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              >
                {SEVERITY_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter a brief title"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Description *</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your grievance in detail"
                rows={5}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={styles.submitButton}
            >
              {submitting ? "Submitting..." : "Submit Grievance"}
            </button>
          </form>
        </div>
      )}

      <div className={styles.sectionTitle}>
        <h3>My Grievances</h3>
      </div>
      {grievances.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No grievances found. Create your first grievance to get started.</p>
        </div>
      ) : (
        <div className={styles.grievancesList}>
          {grievances.map((grievance) => (
            <div key={grievance._id} className={styles.grievanceCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <h4>{grievance.title}</h4>
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
                <span>University: {grievance.university?.fullName}</span>
                <span>Created: {new Date(grievance.createdAt).toLocaleDateString()}</span>
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
    </div>
  );
}
