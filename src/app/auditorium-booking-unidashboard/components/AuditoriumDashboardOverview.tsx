"use client";

import React, { useEffect, useState } from "react";
import api from "@/utils/apiUtils";

interface Auditorium {
  _id: string;
  name: string;
  sittingSpace: number;
  pricePerDay: number;
  location: string;
  contactNumber: string;
  isActive: boolean;
}

interface Booking {
  _id: string;
  auditoriumId?: { name?: string; location?: string };
  eventName: string;
  attendeeCount: number;
  bookedByName: string;
  startDate: string;
  endDate: string;
  totalDays?: number;
  totalPrice?: number;
  paymentStatus?: string;
  status: string;
}

export default function AuditoriumDashboardOverview({ refreshKey = 0 }: { refreshKey?: number }) {
  const [auditoriums, setAuditoriums] = useState<Auditorium[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const loadData = async () => {
    try {
      const [audRes, bookingRes] = await Promise.all([
        api.get("/api/auditoriums"),
        api.get("/api/auditorium-bookings/uni/bookings"),
      ]);
      setAuditoriums(audRes.data?.data || []);
      setBookings(bookingRes.data?.data || []);
    } catch {
      setAuditoriums([]);
      setBookings([]);
    }
  };

  useEffect(() => {
    void loadData();
  }, [refreshKey]);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Auditoriums" value={String(auditoriums.length)} />
        <StatCard title="Active Auditoriums" value={String(auditoriums.filter((a) => a.isActive).length)} />
        <StatCard title="Total Bookings" value={String(bookings.length)} />
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Auditorium List</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Capacity</th>
                <th className="py-2 pr-4">Price/Day</th>
                <th className="py-2 pr-4">Location</th>
                <th className="py-2 pr-4">Contact</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {auditoriums.map((a) => (
                <tr key={a._id} className="border-b last:border-b-0">
                  <td className="py-2 pr-4">{a.name}</td>
                  <td className="py-2 pr-4">{a.sittingSpace}</td>
                  <td className="py-2 pr-4">₹{Number(a.pricePerDay || 0).toFixed(2)}</td>
                  <td className="py-2 pr-4">{a.location}</td>
                  <td className="py-2 pr-4">{a.contactNumber}</td>
                  <td className="py-2 pr-4">{a.isActive ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Auditorium Bookings Dashboard</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 pr-4">Auditorium</th>
                <th className="py-2 pr-4">Event</th>
                <th className="py-2 pr-4">Booked By</th>
                <th className="py-2 pr-4">Attendees</th>
                <th className="py-2 pr-4">Dates</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Payment</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id} className="border-b last:border-b-0">
                  <td className="py-2 pr-4">{b.auditoriumId?.name || "Auditorium"}</td>
                  <td className="py-2 pr-4">{b.eventName}</td>
                  <td className="py-2 pr-4">{b.bookedByName}</td>
                  <td className="py-2 pr-4">{b.attendeeCount}</td>
                  <td className="py-2 pr-4">{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</td>
                  <td className="py-2 pr-4">{b.totalPrice !== undefined ? `₹${Number(b.totalPrice).toFixed(2)}` : "—"}</td>
                  <td className="py-2 pr-4">{b.paymentStatus || "—"}</td>
                  <td className="py-2 pr-4">{b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
