"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/utils/apiUtils";

type CatalogItem = {
  _id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
};

type OrderRow = {
  _id: string;
  items: Array<{ name: string; qty: number; unitPrice: number; lineTotal: number }>;
  subtotal: number;
  notes?: string;
  status: string;
  createdAt: string;
};

export default function InRoomFoodOrderPanel({
  bookingId,
  guestPhone,
  enabled,
}: {
  bookingId: string;
  guestPhone: string;
  enabled: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [menuNote, setMenuNote] = useState("");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [message, setMessage] = useState("");

  const cart = useMemo(() => {
    const lines = items
      .map((i) => ({ item: i, qty: Math.max(0, Number(qty[i._id] || 0)) }))
      .filter((x) => x.qty > 0);
    const subtotal = lines.reduce((sum, l) => sum + l.qty * Number(l.item.price || 0), 0);
    return { lines, subtotal };
  }, [items, qty]);

  const load = async () => {
    if (!enabled) return;
    if (!bookingId || !guestPhone) return;
    setLoading(true);
    setMessage("");
    try {
      const catRes = await api.get("/api/guest-house-bookings/public/in-room-food/catalog", {
        params: { bookingId, guestPhone },
      });
      setItems(catRes.data?.data?.items || []);
      setMenuNote(catRes.data?.data?.menuNote || "");

      const ordRes = await api.get("/api/guest-house-bookings/public/in-room-food/orders", {
        params: { bookingId, guestPhone },
      });
      setOrders(ordRes.data?.data || []);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setMessage(err.response?.data?.message || err.message || "Failed to load in-room food");
      setItems([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [bookingId, guestPhone, enabled]);

  const placeOrder = async () => {
    if (cart.lines.length === 0) return;
    setMessage("");
    try {
      await api.post("/api/guest-house-bookings/public/in-room-food/orders", {
        bookingId,
        guestPhone,
        items: cart.lines.map((l) => ({ itemId: l.item._id, qty: l.qty })),
        notes,
      });
      setNotes("");
      setQty({});
      setMessage("Order placed successfully.");
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setMessage(err.response?.data?.message || err.message || "Could not place order");
    }
  };

  if (!enabled) return null;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="text-sm font-semibold text-slate-900">In-room Food Ordering</h4>
      {menuNote ? <p className="mt-1 text-xs text-slate-600">{menuNote}</p> : null}
      <div className="mt-2 flex gap-2">
        <button className="rounded border px-3 py-1.5 text-xs" onClick={() => void load()} disabled={loading}>
          {loading ? "Loading..." : "Refresh menu & orders"}
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-slate-700">{message}</p> : null}

      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
        <div className="rounded-lg border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Menu</p>
          {items.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">No items available.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {items.map((i) => (
                <div key={i._id} className="flex items-start justify-between gap-2 rounded border px-2 py-2 text-xs">
                  <div>
                    <p className="font-medium text-slate-900">{i.name}</p>
                    <p className="text-slate-600">{i.category} · ₹{Number(i.price || 0).toFixed(2)}</p>
                    {i.description ? <p className="mt-0.5 text-slate-500">{i.description}</p> : null}
                  </div>
                  <input
                    type="number"
                    min={0}
                    className="w-16 rounded border px-2 py-1"
                    value={qty[i._id] ?? 0}
                    onChange={(e) => setQty((p) => ({ ...p, [i._id]: Number(e.target.value || 0) }))}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 border-t pt-2 text-xs text-slate-700">
            <p>
              Subtotal: <span className="font-semibold">₹{cart.subtotal.toFixed(2)}</span>
            </p>
            <input
              className="mt-2 w-full rounded border px-2 py-1 text-xs"
              placeholder="Notes (optional) e.g. less spicy"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button
              className="mt-2 rounded bg-slate-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
              disabled={cart.lines.length === 0}
              onClick={() => void placeOrder()}
            >
              Place order
            </button>
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">My food orders</p>
          {orders.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">No orders yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {orders.map((o) => (
                <div key={o._id} className="rounded border px-2 py-2 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">{o.status}</p>
                    <p className="text-slate-500">{new Date(o.createdAt).toLocaleString()}</p>
                  </div>
                  <ul className="mt-1 list-disc pl-5 text-slate-700">
                    {o.items.map((li, idx) => (
                      <li key={idx}>
                        {li.name} × {li.qty} (₹{Number(li.lineTotal || 0).toFixed(2)})
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 font-semibold">₹{Number(o.subtotal || 0).toFixed(2)}</p>
                  {o.notes ? <p className="mt-1 text-slate-600">Note: {o.notes}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

