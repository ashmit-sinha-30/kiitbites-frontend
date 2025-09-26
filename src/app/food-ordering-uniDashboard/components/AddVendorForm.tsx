import React, { useState } from "react";
import styles from "../styles/AddVendorForm.module.scss";

interface AddVendorFormProps {
  universityId: string;
}

export const AddVendorForm: React.FC<AddVendorFormProps> = ({ universityId }) => {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_URL + "/api/vendor/auth/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, uniID: universityId }),
        }
      );

      // Check if the response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(
          "Unexpected response from server: " + text.slice(0, 100)
        );
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add vendor");
      setSuccess("Vendor added successfully! OTP sent to email.");
      setForm({ fullName: "", email: "", phone: "", password: "", location: "" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add vendor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <div className={styles.header}>
          <h2>Add New Vendor</h2>
          <p>Create a new vendor account for your university</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="fullName">Full Name *</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter vendor&apos;s full name"
              value={form.fullName}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address *</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter vendor&apos;s email address"
              value={form.email}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phone">Phone Number *</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter vendor&apos;s phone number"
              value={form.phone}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password *</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter a secure password"
              value={form.password}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="location">Location</label>
            <input
              id="location"
              name="location"
              type="text"
              placeholder="Enter vendor&apos;s location (optional)"
              value={form.location}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className={styles.submitButton}
          >
            {loading ? (
              <span className={styles.loadingText}>
                <span className={styles.spinner}></span>
                Adding Vendor...
              </span>
            ) : (
              "Add Vendor"
            )}
          </button>

          {success && (
            <div className={styles.successMessage}>
              <span className={styles.successIcon}>✓</span>
              {success}
            </div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon}>✕</span>
              {error}
            </div>
          )}
        </form>

        <div className={styles.infoSection}>
          <h3>What happens next?</h3>
          <ul>
            <li>An OTP will be sent to the vendor&apos;s email address</li>
            <li>The vendor will need to verify their email to activate their account</li>
            <li>Once verified, they can log in and start managing their menu</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 