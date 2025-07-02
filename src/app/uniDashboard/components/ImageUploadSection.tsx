// import React, { useState } from "react";

// interface ImageUploadSectionProps {
//   universityId: string;
//   onImageUploaded?: (url: string) => void;
// }

// export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({ universityId, onImageUploaded }) => {
//   const [image, setImage] = useState<File | null>(null);
//   const [uploading, setUploading] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [cloudName, setCloudName] = useState<string | null>(null);

//   const fetchCloudName = async () => {
//     try {
//       const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/api/cloudinary/cloud-name");
//       const data = await res.json();
//       if (data.cloudName) setCloudName(data.cloudName);
//       else throw new Error("Cloud name not found");
//     } catch  {
//       setError("Failed to fetch Cloudinary cloud name");
//     }
//   };

//   React.useEffect(() => {
//     fetchCloudName();
//   }, []);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       setImage(e.target.files[0]);
//       setError("");
//       setSuccess("");
//     }
//   };

//   const handleUpload = async () => {
//     if (!image || !cloudName) return;
//     setUploading(true);
//     setError("");
//     setSuccess("");
//     try {
//       const formData = new FormData();
//       formData.append("file", image);
//       // No upload preset

//       const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
//         method: "POST",
//         body: formData,
//       });
//       const data = await res.json();
//       if (!data.secure_url) throw new Error("Failed to upload image to Cloudinary");

//       // Save the image URL to your backend
//       const saveRes = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/api/university/upload-image", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ universityId, imageUrl: data.secure_url }),
//       });
//       if (!saveRes.ok) throw new Error("Failed to save image URL to database");

//       setSuccess("Image uploaded and saved successfully!");
//       setImage(null);
//       if (onImageUploaded) onImageUploaded(data.secure_url);
//     } catch  {
//       setError("Upload failed");
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <div>
//       <h3>Upload University Image</h3>
//       <input type="file" accept="image/*" onChange={handleFileChange} />
//       <button onClick={handleUpload} disabled={!image || uploading || !cloudName}>
//         {uploading ? "Uploading..." : "Upload"}
//       </button>
//       {success && <div style={{ color: "green" }}>{success}</div>}
//       {error && <div style={{ color: "red" }}>{error}</div>}
//     </div>
//   );
// }; 