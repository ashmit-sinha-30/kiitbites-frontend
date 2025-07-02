import React, { useState, useEffect, useRef } from "react";
import styles from "../styles/UploadItemForm.module.scss";

interface UploadItemFormProps {
  universityId: string;
}

export const UploadItemForm: React.FC<UploadItemFormProps> = ({ universityId }) => {
  const [itemType, setItemType] = useState("Retail");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [isSpecial, setIsSpecial] = useState("N");
  const [image, setImage] = useState<File | null>(null);
  const [cloudName, setCloudName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchCloudName = async () => {
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/api/cloudinary/cloud-name");
        const data = await res.json();
        if (data.cloudName) setCloudName(data.cloudName);
        else throw new Error("Cloud name not found");
      } catch {
        setError("Failed to fetch Cloudinary cloud name");
      }
    };
    fetchCloudName();
  }, []);

  useEffect(() => {
    const fetchTypes = async () => {
      setType(""); // Reset type selection
      try {
        const endpoint = itemType === "Retail" ? "/api/item/types/retail" : "/api/item/types/produce";
        const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + endpoint);
        const data = await res.json();
        setTypes(data.types || []);
      } catch {
        setTypes([]);
      }
    };
    fetchTypes();
  }, [itemType]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
      setError("");
      setSuccess("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) {
      setError("Please select a type.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      let imageUrl = "";
      if (image && cloudName) {
        const formData = new FormData();
        formData.append("file", image);
        formData.append("upload_preset", "bitesbay");
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!data.secure_url) throw new Error("Failed to upload image to Cloudinary");
        imageUrl = data.secure_url;
      }
      const endpoint = itemType === "Retail" ? "/api/item/retail" : "/api/item/produce";
      const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          price: parseFloat(price),
          isSpecial,
          image: imageUrl,
          uniId: universityId,
        }),
      });
      if (!res.ok) throw new Error("Failed to create item");
      setSuccess("Item uploaded successfully!");
      setName("");
      setType("");
      setPrice("");
      setIsSpecial("N");
      setImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setError("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.uploadItemContainer}>
      <h3 className={styles.title}>Upload New Item</h3>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Type
          <select value={itemType} onChange={e => setItemType(e.target.value)} className={styles.input}>
            <option value="Retail">Retail</option>
            <option value="Produce">Produce</option>
          </select>
        </label>
        <label className={styles.label}>
          Name
          <input value={name} onChange={e => setName(e.target.value)} required className={styles.input} />
        </label>
        <label className={styles.label}>
          Types
          <select value={type} onChange={e => setType(e.target.value)} required className={styles.input}>
            <option value="" disabled>Select type…</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className={styles.label}>
          Price
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} required min="0" step="0.01" className={styles.input} />
        </label>
        <label className={styles.label}>
          Is Special
          <select value={isSpecial} onChange={e => setIsSpecial(e.target.value)} className={styles.input}>
            <option value="Y">Yes</option>
            <option value="N">No</option>
          </select>
        </label>
        <label className={styles.label}>
          Image
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className={styles.input} />
        </label>
        <button type="submit" disabled={loading || !cloudName} className={styles.button}>
          {loading ? "Uploading..." : "Upload Item"}
        </button>
        {success && <div className={styles.success}>{success}</div>}
        {error && <div className={styles.error}>{error}</div>}
      </form>
    </div>
  );
}; 