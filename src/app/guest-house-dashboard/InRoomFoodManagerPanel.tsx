"use client";

import { useEffect, useState } from "react";
import api from "@/utils/apiUtils";
import AppDialog from "@/components/AppDialog";

type Item = {
  _id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  isAvailable: boolean;
};

type Order = {
  _id: string;
  roomLabel: string;
  guestName: string;
  guestPhone: string;
  items: Array<{ name: string; qty: number; unitPrice: number; lineTotal: number }>;
  subtotal: number;
  status: "pending" | "accepted" | "preparing" | "delivered" | "cancelled";
  createdAt: string;
};

export default function InRoomFoodManagerPanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "General",
    description: "",
    price: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogVariant, setDialogVariant] = useState<"info" | "error">("info");

  // const showInfo = (message: string) => {
  //   setDialogVariant("info");
  //   setDialogMessage(message);
  //   setDialogOpen(true);
  // };

  const showError = (message: string) => {
    setDialogVariant("error");
    setDialogMessage(message);
    setDialogOpen(true);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [iRes, oRes] = await Promise.all([
        api.get("/api/guest-house-bookings/manager/in-room-food/items"),
        api.get("/api/guest-house-bookings/manager/in-room-food/orders"),
      ]);
      setItems(iRes.data?.data || []);
      setOrders(oRes.data?.data || []);
    } catch {
      setItems([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createItem = async () => {
    try {
      await api.post("/api/guest-house-bookings/manager/in-room-food/items", {
        name: newItem.name,
        category: newItem.category,
        description: newItem.description,
        price: Number(newItem.price || 0),
      });
      setNewItem({ name: "", category: "General", description: "", price: "" });
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      showError(err.response?.data?.message || err.message || "Failed to create item.");
    }
  };

  const toggleAvailability = async (item: Item) => {
    try {
      await api.patch(`/api/guest-house-bookings/manager/in-room-food/items/${item._id}`, {
        isAvailable: !item.isAvailable,
      });
      await load();
    } catch {
      // ignore
    }
  };

  const setOrderStatus = async (orderId: string, status: Order["status"]) => {
    try {
      await api.patch(`/api/guest-house-bookings/manager/in-room-food/orders/${orderId}`, { status });
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      showError(err.response?.data?.message || err.message || "Failed to update order.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">In-room Food Menu</h2>
          <button className="rounded border px-3 py-1.5 text-xs" onClick={() => void load()} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
          <input
            className="rounded border px-2 py-2 text-sm"
            placeholder="Item name"
            value={newItem.name}
            onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            className="rounded border px-2 py-2 text-sm"
            placeholder="Category"
            value={newItem.category}
            onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value }))}
          />
          <input
            className="rounded border px-2 py-2 text-sm"
            placeholder="Price"
            type="number"
            min={0}
            value={newItem.price}
            onChange={(e) => setNewItem((p) => ({ ...p, price: e.target.value }))}
          />
          <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white" onClick={() => void createItem()}>
            Add item
          </button>
          <input
            className="md:col-span-4 rounded border px-2 py-2 text-sm"
            placeholder="Description (optional)"
            value={newItem.description}
            onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))}
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 pr-3">Item</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Price</th>
                <th className="py-2 pr-3">Available</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i._id} className="border-b last:border-b-0">
                  <td className="py-2 pr-3">
                    <div className="font-medium">{i.name}</div>
                    {i.description ? <div className="text-xs text-slate-500">{i.description}</div> : null}
                  </td>
                  <td className="py-2 pr-3">{i.category}</td>
                  <td className="py-2 pr-3">₹{Number(i.price || 0).toFixed(2)}</td>
                  <td className="py-2 pr-3">{i.isAvailable ? "Yes" : "No"}</td>
                  <td className="py-2">
                    <button className="rounded border px-2 py-1 text-xs" onClick={() => void toggleAvailability(i)}>
                      {i.isAvailable ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr><td colSpan={5} className="py-3 text-center text-slate-500">No items yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Food Orders</h2>
        <div className="mt-3 space-y-2">
          {orders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders yet.</p>
          ) : (
            orders.map((o) => (
              <div key={o._id} className="rounded border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {o.status} · ₹{Number(o.subtotal || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-600">
                      Room: {o.roomLabel || "—"} · {o.guestName || "Guest"} · {o.guestPhone}
                    </div>
                    <div className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(["accepted", "preparing", "delivered", "cancelled"] as const).map((s) => (
                      <button
                        key={s}
                        className="rounded border px-2 py-1 text-xs"
                        onClick={() => void setOrderStatus(o._id, s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <ul className="mt-2 list-disc pl-5 text-xs text-slate-700">
                  {o.items.map((li, idx) => (
                    <li key={idx}>
                      {li.name} × {li.qty}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
      <AppDialog
        open={dialogOpen}
        message={dialogMessage}
        variant={dialogVariant}
        onConfirm={() => setDialogOpen(false)}
      />
    </div>
  );
}

