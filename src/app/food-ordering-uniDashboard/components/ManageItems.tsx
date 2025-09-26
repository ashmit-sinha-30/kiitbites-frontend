import React, { useEffect, useState } from "react";
import * as Switch from "@radix-ui/react-switch";
import styles from "../styles/ManageItems.module.scss";

interface ManageItemsProps {
  universityId: string;
}

interface Item {
  _id: string;
  name: string;
  type: string;
  price: number;
  isSpecial: string;
  image: string;
  category: "retail" | "produce";
  packable?: boolean;
}

const ManageItems: React.FC<ManageItemsProps> = ({ universityId }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [editData, setEditData] = useState<Partial<Item> & { imageFile?: File }>({});
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  // Fetch both Retail and Produce items
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError("");
      try {
        const [retailRes, produceRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/item/retail/uni/${universityId}?limit=1000`),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/item/produce/uni/${universityId}?limit=1000`),
        ]);
        const retailData = await retailRes.json();
        const produceData = await produceRes.json();
        if (!retailRes.ok || !produceRes.ok) throw new Error("Failed to fetch items");
        const retailItems: Item[] = (retailData.items || []).map((item: Item) => ({ ...item, category: "retail" }));
        const produceItems: Item[] = (produceData.items || []).map((item: Item) => ({ ...item, category: "produce" }));
        setItems([...retailItems, ...produceItems]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to fetch items");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [universityId, refresh]);

  // Handle edit
  const handleEdit = (item: Item) => {
    setEditItem(item);
    setEditData({ ...item });
  };
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setEditData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setEditData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };
  const handleEditImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setEditData((prev) => ({ ...prev, imageFile: files[0] }));
    }
  };
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      let imageUrl = editData.image as string;
      if (editData.imageFile) {
        // Upload new image to Cloudinary
        const cloudRes = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/api/cloudinary/cloud-name");
        const { cloudName } = await cloudRes.json();
        const formData = new FormData();
        formData.append("file", editData.imageFile);
        formData.append("upload_preset", "bitesbay");
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.secure_url) throw new Error("Failed to upload image");
        imageUrl = uploadData.secure_url;
      }
      if (!editItem) return;
      const endpoint = `/api/item/${editItem.category}/${editItem._id}`;
      const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editData.name,
          price: parseFloat(String(editData.price ?? "")),
          type: editData.type,
          image: imageUrl,
          packable: editData.packable,
        }),
      });
      if (!res.ok) throw new Error("Failed to update item");
      setEditItem(null);
      setEditData({});
      setRefresh(r => r + 1);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update item");
    } finally {
      setEditLoading(false);
    }
  };
  // Handle delete
  const handleDelete = async (item: Item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(itemToDelete._id);
    setShowDeleteModal(false);
    try {
      const endpoint = `/api/item/${itemToDelete.category}/${itemToDelete._id}`;
      const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + endpoint, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete item");
      setRefresh(r => r + 1);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete item");
    } finally {
      setDeleteLoading(null);
      setItemToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  // Filtered items based on search
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Manage Items</h2>
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search by name or type..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      {loading ? <p>Loading items...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : (
        <div>
          {filteredItems.length === 0 ? <p>No items found.</p> : (
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>Image</th>
                  <th className={styles.th}>Name</th>
                  <th className={styles.th}>Type</th>
                  <th className={styles.th}>Price</th>
                  <th className={styles.th}>Packable</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item._id} style={{ borderBottom: '1px solid #e0e7ff', background: editItem && editItem._id === item._id ? '#f0f7ff' : '#fff' }}>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      <img src={item.image} alt={item.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, boxShadow: '0 1px 4px rgba(99,102,241,0.08)' }} />
                    </td>
                    <td style={{ padding: 10 }}>
                      {editItem && editItem._id === item._id ? (
                        <input name="name" value={editData.name ?? ""} onChange={handleEditChange} style={{ padding: '0.4rem 0.7rem', borderRadius: 6, border: '1px solid #a5b4fc', fontSize: '1rem' }} />
                      ) : item.name}
                    </td>
                    <td style={{ padding: 10 }}>
                      {editItem && editItem._id === item._id ? (
                        <input name="type" value={editData.type ?? ""} onChange={handleEditChange} style={{ padding: '0.4rem 0.7rem', borderRadius: 6, border: '1px solid #a5b4fc', fontSize: '1rem' }} />
                      ) : item.type}
                    </td>
                    <td style={{ padding: 10 }}>
                      {editItem && editItem._id === item._id ? (
                        <input name="price" type="number" value={String(editData.price ?? "")} onChange={handleEditChange} style={{ padding: '0.4rem 0.7rem', borderRadius: 6, border: '1px solid #a5b4fc', fontSize: '1rem', width: 80 }} />
                      ) : item.price}
                    </td>
                    <td style={{ padding: 10 }}>
                      {editItem && editItem._id === item._id ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <span>Packable</span>
                          <Switch.Root
                            className="w-[42px] h-[25px] bg-gray-200 rounded-full relative shadow-[0_2px_10px] shadow-gray-400 focus:shadow-[0_0_0_2px] focus:shadow-black data-[state=checked]:bg-blue-600 outline-none cursor-default"
                            checked={!!editData.packable}
                            onCheckedChange={(checked) => setEditData(prev => ({ ...prev, packable: checked }))}
                          >
                            <Switch.Thumb className="block w-[21px] h-[21px] bg-white rounded-full shadow-[0_2px_2px] shadow-gray-400 transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
                          </Switch.Root>
                        </label>
                      ) : item.packable ? 'Yes' : 'No'}
                    </td>
                    <td style={{ padding: 10, minWidth: 160 }}>
                      {editItem && editItem._id === item._id ? (
                        <form onSubmit={handleEditSubmit} style={{ display: 'inline' }}>
                          <input type="file" accept="image/*" onChange={handleEditImage} style={{ marginBottom: 6 }} />
                          <button type="submit" disabled={editLoading} style={{ marginRight: 8, padding: '0.4rem 1rem', borderRadius: 6, background: 'linear-gradient(90deg, #4ea199, #6fc3bd)', color: '#fff', border: 'none', fontWeight: 500 }}>{editLoading ? 'Saving...' : 'Save'}</button>
                          <button type="button" onClick={() => setEditItem(null)} disabled={editLoading} style={{ padding: '0.4rem 1rem', borderRadius: 6, background: '#e0e7ff', color: '#333', border: 'none', fontWeight: 500 }}>Cancel</button>
                        </form>
                      ) : (
                        <>
                          <button className={styles.editButton} onClick={() => handleEdit(item)} style={{ marginRight: 8, padding: '0.4rem 1rem', borderRadius: 6, background: 'linear-gradient(90deg, #4ea199, #6fc3bd)', color: '#fff', border: 'none', fontWeight: 500 }}>Edit</button>
                          <button className={styles.deleteButton} onClick={() => handleDelete(item)} disabled={deleteLoading === item._id} style={{ padding: '0.4rem 1rem', borderRadius: 6, background: '#ef4444', color: '#fff', border: 'none', fontWeight: 500 }}>
                            {deleteLoading === item._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.15)', minWidth: 320, textAlign: 'center' }}>
            <h3 style={{ marginBottom: 16 }}>Confirm Deletion</h3>
            <p style={{ marginBottom: 24 }}>Are you sure you want to delete <b>{itemToDelete.name}</b>?</p>
            <button onClick={confirmDelete} style={{ marginRight: 16, padding: '0.5rem 1.2rem', borderRadius: 6, background: '#ef4444', color: '#fff', border: 'none', fontWeight: 500 }}>Delete</button>
            <button onClick={cancelDelete} style={{ padding: '0.5rem 1.2rem', borderRadius: 6, background: '#e0e7ff', color: '#333', border: 'none', fontWeight: 500 }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageItems; 