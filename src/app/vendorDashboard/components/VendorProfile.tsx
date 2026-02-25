"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/VendorProfile.module.scss';
import { ENV_CONFIG } from '@/config/environment';
import Image from 'next/image';

interface VendorProfileProps {
    vendorId: string;
}

interface VendorData {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    image?: string;
    coverImage?: string;
}

export const VendorProfile: React.FC<VendorProfileProps> = ({ vendorId }) => {
    const [vendorData, setVendorData] = useState<VendorData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

    const [profilePreview, setProfilePreview] = useState<string | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);

    const profileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchVendorData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const res = await fetch(`${ENV_CONFIG.BACKEND.URL}/api/vendor/auth/user`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setVendorData(data);
                    setProfilePreview(data.image || null);
                    setCoverPreview(data.coverImage || null);
                }
            } catch (err) {
                console.error("Failed to fetch vendor data", err);
            } finally {
                setLoading(false);
            }
        };

        if (vendorId) {
            fetchVendorData();
        }
    }, [vendorId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'profile') {
                setProfileImageFile(file);
                setProfilePreview(reader.result as string);
            } else {
                setCoverImageFile(file);
                setCoverPreview(reader.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!vendorId) return;

        setSaving(true);
        setMessage(null);

        try {
            const formData = new FormData();
            if (profileImageFile) {
                formData.append('image', profileImageFile);
            }
            if (coverImageFile) {
                formData.append('coverImage', coverImageFile);
            }

            // If no files selected, just return (or handle text updates if added later)
            if (!profileImageFile && !coverImageFile) {
                setMessage({ type: 'success', text: 'No changes to save.' });
                setSaving(false);
                return;
            }

            const res = await fetch(`${ENV_CONFIG.BACKEND.URL}/api/vendor/${vendorId}/profile`, {
                method: 'PUT',
                body: formData, // Don't set Content-Type header, let browser set it with boundary
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setVendorData(data.vendor);
                setProfileImageFile(null);
                setCoverImageFile(null);
            } else {
                throw new Error(data.message || 'Failed to update profile');
            }
        } catch (err: unknown) {
            console.error("Error updating profile:", err);
            setMessage({ type: 'error', text: (err as Error).message || 'An error occurred.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading profile...</div>;

    return (
        <div className={styles.profileContainer}>
            <div className={styles.profileHeader}>
                <h1>Vendor Profile</h1>
                <p>Manage your public profile and images</p>
            </div>

            <div className={styles.card}>
                <div className={styles.sectionTitle}>Profile Images</div>

                <div className={styles.imageUploadSection}>
                    {/* Profile Image */}
                    <div className={styles.uploadGroup}>
                        <label>Profile Picture</label>
                        <div className={`${styles.imagePreview} ${styles.circle}`}>
                            {profilePreview ? (
                                <Image
                                    src={profilePreview}
                                    alt="Profile Preview"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                            ) : (
                                <span className="text-gray-400">No image</span>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={profileInputRef}
                            onChange={(e) => handleFileChange(e, 'profile')}
                            accept="image/*"
                            className={styles.fileInput}
                        />
                        <button
                            className={styles.uploadButton}
                            onClick={() => profileInputRef.current?.click()}
                        >
                            Change Profile Picture
                        </button>
                    </div>

                    {/* Cover Image */}
                    <div className={styles.uploadGroup}>
                        <label>Cover / Banner Image</label>
                        <div className={styles.imagePreview}>
                            {coverPreview ? (
                                <Image
                                    src={coverPreview}
                                    alt="Cover Preview"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                            ) : (
                                <span className="text-gray-400">No image</span>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={coverInputRef}
                            onChange={(e) => handleFileChange(e, 'cover')}
                            accept="image/*"
                            className={styles.fileInput}
                        />
                        <button
                            className={styles.uploadButton}
                            onClick={() => coverInputRef.current?.click()}
                        >
                            Change Cover Image
                        </button>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button
                        className={styles.saveButton}
                        onClick={handleSave}
                        disabled={saving || (!profileImageFile && !coverImageFile)}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                {message && (
                    <div className={`${styles.message} ${message.type === 'success' ? styles.success : styles.error}`}>
                        {message.text}
                    </div>
                )}
            </div>

            <div className={styles.card}>
                <div className={styles.sectionTitle}>Account Details</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                            {vendorData?.fullName}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                            {vendorData?.email}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                            {vendorData?.phone}
                        </div>
                    </div>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                    To update these details, please contact support or your university administrator.
                </p>
            </div>
        </div>
    );
};
