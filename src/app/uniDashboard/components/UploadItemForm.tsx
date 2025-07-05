import React, { useState, useEffect, useRef } from "react";
import * as Switch from "@radix-ui/react-switch";
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
  const [packable, setPackable] = useState(itemType === "Produce");

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
    setPackable(itemType === "Produce"); // Reset packable default when type changes
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
          packable,
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
        <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Packable</span>
          <Switch.Root
            className="w-[42px] h-[25px] bg-gray-200 rounded-full relative shadow-[0_2px_10px] shadow-gray-400 focus:shadow-[0_0_0_2px] focus:shadow-black data-[state=checked]:bg-blue-600 outline-none cursor-default"
            checked={packable}
            onCheckedChange={setPackable}
          >
            <Switch.Thumb className="block w-[21px] h-[21px] bg-white rounded-full shadow-[0_2px_2px] shadow-gray-400 transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
          </Switch.Root>
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