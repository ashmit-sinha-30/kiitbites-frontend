import React, { useState } from "react";
import styles from "../styles/VendorManagement.module.scss";

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
      <h2 style={{ marginBottom: "1rem" }}>Add New Vendor</h2>
      <form onSubmit={handleSubmit} className={styles.vendorCard} style={{ maxWidth: 400, margin: "0 auto" }}>
        <input name="fullName" placeholder="Full Name" value={form.fullName} onChange={handleChange} required className={styles.vendorInput} />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required className={styles.vendorInput} />
        <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required className={styles.vendorInput} />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required className={styles.vendorInput} />
        <input name="location" placeholder="Location" value={form.location} onChange={handleChange} className={styles.vendorInput} />
        <button type="submit" disabled={loading} className={styles.toggleButton + " " + styles.turnOn}>
          {loading ? "Adding..." : "Add Vendor"}
        </button>
        {success && <div style={{ color: "green", marginTop: 8 }}>{success}</div>}
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      </form>
    </div>
  );
}; 