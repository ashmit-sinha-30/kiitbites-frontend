"use client";

import React, { useEffect, useState } from "react";
import styles from "../styles/VendorMenuManagement.module.scss";
import Modal from "react-modal";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface Vendor {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  location?: string;
}

interface MenuItem {
  _id?: string;
  itemId?: string;
  name: string;
  price: number;
  type: string;
  image?: string;
  packable: boolean;
  isSpecial?: "Y" | "N";
  isAvailable?: "Y" | "N";
  inventory?: {
    isSpecial: "Y" | "N";
    isAvailable: "Y" | "N";
    quantity?: number;
  };
  quantity?: number;
}

interface Props {
  vendorId: string;
}

export function VendorMenuManagement({ vendorId }: Props) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [retailItems, setRetailItems] = useState<MenuItem[]>([]);
  const [produceItems, setProduceItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"retail" | "produce">("retail");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  // Form states for adding/editing items
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    price: "",
    quantity: "",
    isSpecial: "N" as "Y" | "N",
    packable: false,
    image: null as File | null,
    imageUrl: ""
  });

  const [types, setTypes] = useState<string[]>([]);
  const [cloudName, setCloudName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch vendor details
      const vendorResponse = await fetch(`${BACKEND_URL}/api/vendor/list/uni/68320fd75c6f79ec179ad3bb`);
      if (!vendorResponse.ok) throw new Error("Failed to fetch vendor data");
      const vendors = await vendorResponse.json();
      const currentVendor = vendors.find((v: Vendor) => v._id === vendorId);
      if (!currentVendor) throw new Error("Vendor not found");
      setVendor(currentVendor);

      // Fetch vendor's retail items using the correct endpoint
      const retailResponse = await fetch(`${BACKEND_URL}/api/item/getvendors/${vendorId}/retail`);
      console.log('Retail response status:', retailResponse.status);
      if (retailResponse.ok) {
        const retailData = await retailResponse.json();
        console.log('Retail data:', retailData);
        if (retailData.success) {
          setRetailItems(retailData.data.retailItems || []);
          // Debug: log image fields
          (retailData.data.retailItems || []).forEach((item: MenuItem, idx: number) => {
            console.log(`Retail item #${idx} image:`, item.image, 'itemId:', item.itemId);
          });
        }
      } else {
        console.error('Retail response not ok:', retailResponse.status);
      }

      // Fetch vendor's produce items using the correct endpoint
      const produceResponse = await fetch(`${BACKEND_URL}/api/item/getvendors/${vendorId}/produce`);
      console.log('Produce response status:', produceResponse.status);
      if (produceResponse.ok) {
        const produceData = await produceResponse.json();
        console.log('Produce data:', produceData);
        if (produceData.success) {
          setProduceItems(produceData.data.produceItems || []);
          // Debug: log image fields
          (produceData.data.produceItems || []).forEach((item: MenuItem, idx: number) => {
            console.log(`Produce item #${idx} image:`, item.image, 'itemId:', item.itemId);
          });
        }
      } else {
        console.error('Produce response not ok:', produceResponse.status);
      }

    } catch (err) {
      console.error("Error fetching vendor data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch vendor data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTypes = async () => {
    try {
      const endpoint = activeTab === "retail" ? "/api/item/types/retail" : "/api/item/types/produce";
      const res = await fetch(`${BACKEND_URL}${endpoint}`);
      const data = await res.json();
      setTypes(data.types || []);
    } catch (err) {
      console.error("Error fetching types:", err);
      setTypes([]);
    }
  };

  const fetchCloudName = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/cloudinary/cloud-name`);
      const data = await res.json();
      if (data.cloudName) setCloudName(data.cloudName);
    } catch (err) {
      console.error("Error fetching cloud name:", err);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.price) {
      alert("Please fill in all required fields");
      return;
    }
    
    if (activeTab === "retail" && !formData.quantity) {
      alert("Please fill in quantity for retail items");
      return;
    }

    try {
      let imageUrl = "";
      if (formData.image && cloudName) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", formData.image);
        formDataUpload.append("upload_preset", "bitesbay");
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formDataUpload,
        });
        const data = await res.json();
        if (!data.secure_url) throw new Error("Failed to upload image");
        imageUrl = data.secure_url;
      }

      const endpoint = activeTab === "retail" ? "/api/item/retail" : "/api/item/produce";
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          price: parseFloat(formData.price),
          quantity: activeTab === "retail" ? parseInt(formData.quantity) : undefined,
          isSpecial: formData.isSpecial,
          image: imageUrl,
          uniId: "68320fd75c6f79ec179ad3bb",
          packable: formData.packable,
          vendorId: vendorId // Add vendor-specific flag
        }),
      });

      if (!res.ok) throw new Error("Failed to create item");
      
      setSuccessMsg("Item added successfully!");
      setShowAddModal(false);
      resetForm();
      fetchVendorData(); // Refresh the menu
    } catch (err) {
      console.error("Error adding item:", err);
      alert(err instanceof Error ? err.message : "Failed to add item");
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    if (!formData.name || !formData.type || !formData.price) {
      alert("Please fill in all required fields");
      return;
    }
    
    if (activeTab === "retail" && !formData.quantity) {
      alert("Please fill in quantity for retail items");
      return;
    }

    try {
      let imageUrl = editingItem.image || "";
      if (formData.image && cloudName) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", formData.image);
        formDataUpload.append("upload_preset", "bitesbay");
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formDataUpload,
        });
        const data = await res.json();
        if (!data.secure_url) throw new Error("Failed to upload image");
        imageUrl = data.secure_url;
      }

      const endpoint = activeTab === "retail" ? "/api/item/retail" : "/api/item/produce";
      const res = await fetch(`${BACKEND_URL}${endpoint}/${editingItem._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          price: parseFloat(formData.price),
          quantity: activeTab === "retail" ? parseInt(formData.quantity) : undefined,
          isSpecial: formData.isSpecial,
          image: imageUrl,
          packable: formData.packable,
        }),
      });

      if (!res.ok) throw new Error("Failed to update item");
      
      setSuccessMsg("Item updated successfully!");
      setShowEditModal(false);
      setEditingItem(null);
      resetForm();
      fetchVendorData(); // Refresh the menu
    } catch (err) {
      console.error("Error updating item:", err);
      alert(err instanceof Error ? err.message : "Failed to update item");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const endpoint = activeTab === "retail" ? "/api/item/retail" : "/api/item/produce";
      const res = await fetch(`${BACKEND_URL}${endpoint}/${itemId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete item");
      
      setSuccessMsg("Item deleted successfully!");
      fetchVendorData(); // Refresh the menu
    } catch (err) {
      console.error("Error deleting item:", err);
      alert(err instanceof Error ? err.message : "Failed to delete item");
    }
  };

  const toggleItemAvailability = async (itemId: string, currentStatus: "Y" | "N") => {
    try {
      const newStatus = currentStatus === "Y" ? "N" : "Y";
      const kind = activeTab === "retail" ? "retail" : "produce";
      
      const res = await fetch(`${BACKEND_URL}/api/vendor/${vendorId}/item/${itemId}/${kind}/available`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update item availability");
      
      setSuccessMsg("Item availability updated!");
      fetchVendorData(); // Refresh the menu
    } catch (err) {
      console.error("Error updating item availability:", err);
      alert(err instanceof Error ? err.message : "Failed to update item availability");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      price: "",
      quantity: "",
      isSpecial: "N",
      packable: false,
      image: null,
      imageUrl: ""
    });
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      type: item.type,
      price: item.price.toString(),
      quantity: (item.quantity?.toString() || item.inventory?.quantity?.toString() || ""),
      isSpecial: item.inventory?.isSpecial || item.isSpecial || "N",
      packable: item.packable,
      image: null,
      imageUrl: item.image || ""
    });
    setShowEditModal(true);
  };

  useEffect(() => {
    fetchVendorData();
    fetchCloudName();
  }, [vendorId]);

  useEffect(() => {
    fetchTypes();
  }, [activeTab]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading vendor menu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Error: {error}</p>
          <button onClick={fetchVendorData} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Vendor not found</div>
      </div>
    );
  }

  const currentItems = activeTab === "retail" ? retailItems : produceItems;
  
  // Filter items based on search query
  const filteredItems = currentItems.filter(item => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query) ||
      item.price.toString().includes(query) ||
      (item.quantity?.toString() || "").includes(query) ||
      (item.isSpecial === "Y" ? "special" : "regular").includes(query) ||
      (item.packable ? "packable" : "not packable").includes(query) ||
      ((item.isAvailable || item.inventory?.isAvailable) === "Y" ? "available" : "unavailable").includes(query)
    );
  });
  
  // Debug logging
  console.log('Current items:', currentItems);
  console.log('Filtered items:', filteredItems);
  console.log('Active tab:', activeTab);
  console.log('Retail items:', retailItems);
  console.log('Produce items:', produceItems);

  return (
    <div className={styles.container}>
      {/* <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Back to Vendors
        </button>
        <h2>{vendor.fullName} - Menu Management</h2>
        <p>Manage menu items specifically for this vendor</p>
      </div> */}



      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "retail" ? styles.active : ""}`}
          onClick={() => setActiveTab("retail")}
        >
          Retail Items ({retailItems.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "produce" ? styles.active : ""}`}
          onClick={() => setActiveTab("produce")}
        >
          Produce Items ({produceItems.length})
        </button>
      </div>

      <div className={styles.actions}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder={`Search ${activeTab} items by name, type, price, etc...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className={styles.clearSearchButton}
            >
              ✕
            </button>
          )}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className={styles.addButton}
        >
          + Add {activeTab === "retail" ? "Retail" : "Produce"} Item
        </button>
      </div>

      <div className={styles.menuGrid}>
        {filteredItems.length === 0 ? (
          <div className={styles.noItems}>
            <p>
              {searchQuery 
                ? `No ${activeTab} items found matching "${searchQuery}".` 
                : `No ${activeTab} items found for this vendor.`
              }
            </p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className={styles.clearSearchButton}
                style={{ marginRight: "8px" }}
              >
                Clear Search
              </button>
            )}
            <button onClick={() => setShowAddModal(true)} className={styles.addButton}>
              Add First Item
            </button>
          </div>
        ) : (
          filteredItems.map((item, index) => (
            <div key={String(item._id ?? item.itemId ?? index ?? '')} className={styles.menuItem}>
              <div className={styles.itemImage}>
                {item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  <div className={styles.noImage}>No Image</div>
                )}
              </div>
              <div className={styles.itemInfo}>
                <h4>{item.name}</h4>
                <p><strong>Type:</strong> {item.type}</p>
                <p><strong>Price:</strong> ₹{item.price}</p>
                {/* Handle different data structures for retail vs produce */}
                {activeTab === "retail" ? (
                  <>
                    <p><strong>Special:</strong> {item.isSpecial === "Y" ? "Yes" : "No"}</p>
                    <p><strong>Quantity:</strong> {item.quantity ?? 0}</p>
                    <p><strong>Available:</strong> {(item.quantity ?? 0) > 0 ? "Yes" : "No"}</p>
                  </>
                ) : (
                  <>
                    <p><strong>Special:</strong> {(item.isSpecial || item.inventory?.isSpecial) === "Y" ? "Yes" : "No"}</p>
                    <p><strong>Available:</strong> {(item.isAvailable || item.inventory?.isAvailable) === "Y" ? "Yes" : "No"}</p>
                  </>
                )}
                {/* For image: if item.image is missing, show a placeholder. To show the real image, the backend must populate it or fetch by itemId. */}
                {item.packable && <p><strong>Packable:</strong> Yes</p>}
              </div>
              <div className={styles.itemActions}>
                <button
                  onClick={() => openEditModal(item)}
                  className={styles.editButton}
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleItemAvailability(item._id ?? '', activeTab === "retail" ? ((item.quantity ?? 0) > 0 ? "Y" : "N") : (item.isAvailable || item.inventory?.isAvailable || "N"))}
                  className={`${styles.toggleButton} ${(activeTab === "retail" ? ((item.quantity ?? 0) > 0 ? styles.available : styles.unavailable) : ((item.isAvailable || item.inventory?.isAvailable) === "Y" ? styles.available : styles.unavailable))}`}
                >
                  {activeTab === "retail"
                    ? (item.quantity ?? 0) > 0 ? "Make Unavailable" : "Make Available"
                    : (item.isAvailable || item.inventory?.isAvailable) === "Y" ? "Make Unavailable" : "Make Available"}
                </button>
                <button
                  onClick={() => handleDeleteItem(item._id ?? '')}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={showAddModal}
        onRequestClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        contentLabel="Add Item"
        ariaHideApp={false}
        className={styles.modal}
        overlayClassName={styles.modalOverlay}
        shouldCloseOnOverlayClick={false}
        shouldCloseOnEsc={true}
      >
        <h3>Add {activeTab === "retail" ? "Retail" : "Produce"} Item</h3>
        <form onSubmit={handleAddItem} className={styles.modalForm}>
          <label>
            Name
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </label>
          <label>
            Type
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="">Select type...</option>
              {types.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            Price
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              min="0"
              step="0.01"
              required
            />
          </label>
          {activeTab === "retail" && (
            <label>
              Quantity
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                min="0"
                step="1"
                required
              />
            </label>
          )}
          <label>
            Special Item
            <select
              value={formData.isSpecial}
              onChange={(e) => setFormData({ ...formData, isSpecial: e.target.value as "Y" | "N" })}
            >
              <option value="N">No</option>
              <option value="Y">Yes</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={formData.packable}
              onChange={(e) => setFormData({ ...formData, packable: e.target.checked })}
            />
            Packable
          </label>
          <label>
            Image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
            />
          </label>
          <div className={styles.modalActions}>
            <button type="submit" className={styles.saveButton}>
              Add Item
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={showEditModal}
        onRequestClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
          resetForm();
        }}
        contentLabel="Edit Item"
        ariaHideApp={false}
        className={styles.modal}
        overlayClassName={styles.modalOverlay}
        shouldCloseOnOverlayClick={false}
        shouldCloseOnEsc={true}
      >
        <h3>Edit {activeTab === "retail" ? "Retail" : "Produce"} Item</h3>
        <form onSubmit={handleEditItem} className={styles.modalForm}>
          <label>
            Name
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </label>
          <label>
            Type
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="">Select type...</option>
              {types.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            Price
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              min="0"
              step="0.01"
              required
            />
          </label>
          {activeTab === "retail" && (
            <label>
              Quantity
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                min="0"
                step="1"
                required
              />
            </label>
          )}
          <label>
            Special Item
            <select
              value={formData.isSpecial}
              onChange={(e) => setFormData({ ...formData, isSpecial: e.target.value as "Y" | "N" })}
            >
              <option value="N">No</option>
              <option value="Y">Yes</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={formData.packable}
              onChange={(e) => setFormData({ ...formData, packable: e.target.checked })}
            />
            Packable
          </label>
          <label>
            Image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
            />
          </label>
          {formData.imageUrl && (
            <div className={styles.currentImage}>
              <p>Current Image:</p>
              <img src={formData.imageUrl} alt="Current" style={{ width: 100, height: 100, objectFit: "cover" }} />
            </div>
          )}
          <div className={styles.modalActions}>
            <button type="submit" className={styles.saveButton}>
              Update Item
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setEditingItem(null);
                resetForm();
              }}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {successMsg && (
        <div className={styles.successMessage + ' ' + styles.toastBottom}>
          {successMsg}
          <button onClick={() => setSuccessMsg("")}>×</button>
        </div>
      )}
    </div>
  );
} 