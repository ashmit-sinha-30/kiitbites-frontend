"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import api from "@/utils/apiUtils";

interface GuestHouse {
  _id: string;
  name: string;
  totalRooms: number;
  contactNumber: string;
  location: string;
  managerName?: string;
  description?: string;
  images?: string[];
}

interface RoomType {
  _id: string;
  roomName: string;
  roomCount: number;
  coverImage: string;
  detailedImages: string[];
  services: string[];
}

const prettifySlug = (slug: string) =>
  slug
    .split("-")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");

export default function GuestHouseBookingClient() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const cid = searchParams.get("cid") || "";
  const slug = params?.slug || "";

  const [loadingGuestHouses, setLoadingGuestHouses] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [guestHouses, setGuestHouses] = useState<GuestHouse[]>([]);
  const [selectedGuestHouse, setSelectedGuestHouse] = useState<GuestHouse | null>(null);
  const [rooms, setRooms] = useState<RoomType[]>([]);

  useEffect(() => {
    const loadGuestHouses = async () => {
      if (!cid) {
        setGuestHouses([]);
        setLoadingGuestHouses(false);
        return;
      }

      try {
        setLoadingGuestHouses(true);
        const res = await api.get(`/api/guest-house/public/${cid}`);
        const json = res.data;
        if (json.success) {
          setGuestHouses(json.data || []);
        } else {
          setGuestHouses([]);
        }
      } catch {
        setGuestHouses([]);
      } finally {
        setLoadingGuestHouses(false);
      }
    };

    void loadGuestHouses();
  }, [cid]);

  const pageTitle = useMemo(() => {
    if (!slug) return "Guest House Booking";
    return `Guest House Booking - ${prettifySlug(slug)}`;
  }, [slug]);

  const selectGuestHouse = async (guestHouse: GuestHouse) => {
    setSelectedGuestHouse(guestHouse);
    try {
      setLoadingRooms(true);
      const res = await api.get(`/api/guest-house-rooms/public/${guestHouse._id}`);
      const json = res.data;
      if (json.success) {
        setRooms(json.data || []);
      } else {
        setRooms([]);
      }
    } catch {
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Browse available guest houses and view room types.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Available Guest Houses</h2>
            {loadingGuestHouses ? (
              <p className="mt-3 text-sm text-slate-500">Loading guest houses...</p>
            ) : guestHouses.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No guest houses available right now.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {guestHouses.map((house) => (
                  <button
                    key={house._id}
                    type="button"
                    onClick={() => void selectGuestHouse(house)}
                    className={`w-full rounded-xl border p-4 text-left transition hover:bg-slate-50 ${
                      selectedGuestHouse?._id === house._id ? "border-slate-900" : "border-slate-200"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">{house.name}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Rooms: {house.totalRooms} | Location: {house.location}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              {selectedGuestHouse ? `Room Types - ${selectedGuestHouse.name}` : "Room Types"}
            </h2>

            {!selectedGuestHouse ? (
              <p className="mt-3 text-sm text-slate-500">Select a guest house to view room types.</p>
            ) : loadingRooms ? (
              <p className="mt-3 text-sm text-slate-500">Loading room types...</p>
            ) : rooms.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No room types configured yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {rooms.map((room) => (
                  <div key={room._id} className="rounded-xl border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{room.roomName}</p>
                        <p className="text-xs text-slate-600">Available units: {room.roomCount}</p>
                      </div>
                      {room.coverImage ? (
                        <img
                          src={room.coverImage}
                          alt={room.roomName}
                          className="h-16 w-20 rounded-md object-cover"
                        />
                      ) : null}
                    </div>
                    {room.services?.length ? (
                      <p className="mt-2 text-xs text-slate-600">Services: {room.services.join(", ")}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

