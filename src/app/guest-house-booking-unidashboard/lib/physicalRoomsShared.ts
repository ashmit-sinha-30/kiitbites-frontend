/** Shared types & styling for physical-room maps (guest-house CRM + uni Floor Plan). */

export interface RoomTypeOption {
  _id: string;
  roomName: string;
}

/** Floor-plan bedroom SKUs: "Suite — Single bedroom" or legacy "Single bedroom" (category General). */
export function parseSellableBedroomRoom(roomName: string): { category: string; occupancy: "single" | "double" } | null {
  const n = roomName.trim();
  const compound = /^(.+?)\s*[—–\-]\s*(Single bedroom|Double bedroom)\s*$/i.exec(n);
  if (compound) {
    const category = compound[1].trim();
    if (!category) return null;
    const occupancy = /^single/i.test(compound[2]) ? "single" : "double";
    return { category, occupancy };
  }
  if (/^single bedroom$/i.test(n)) return { category: "General", occupancy: "single" };
  if (/^double bedroom$/i.test(n)) return { category: "General", occupancy: "double" };
  return null;
}

export function sortBedroomCategories(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    if (a === "General") return -1;
    if (b === "General") return 1;
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  });
}

export interface PhysicalUnitRow {
  _id: string;
  floor: number;
  unitLabel: string;
  busyOnPreviewNight?: boolean;
  roomTypeId?: { _id?: string; roomName?: string } | null;
  notes?: string;
  housekeepingStatus?: string;
}

export interface SummaryFloor {
  floor: number;
  roomsOnFloor: number;
}

export interface SummaryByType {
  roomName: string;
  count: number;
  roomTypeId?: string | null;
}

export interface PhysicalRoomsSummary {
  totalUnits: number;
  floorCount: number;
  floors: SummaryFloor[];
  byRoomType: SummaryByType[];
  freeOnPreviewNight?: number;
  busyOnPreviewNight?: number;
}

export const HK_OPTIONS = [
  { value: "ready", label: "Ready / vacant" },
  { value: "dirty", label: "Dirty — needs housekeeping" },
  { value: "maintenance", label: "Maintenance" },
  { value: "blocked", label: "Blocked — do not sell" },
] as const;

export function hkBadgeClass(status: string | undefined) {
  switch (status) {
    case "dirty":
      return "bg-amber-100 text-amber-900 ring-amber-200";
    case "maintenance":
      return "bg-violet-100 text-violet-900 ring-violet-200";
    case "blocked":
      return "bg-rose-100 text-rose-900 ring-rose-200";
    default:
      return "bg-emerald-50 text-emerald-900 ring-emerald-100";
  }
}

export function todayLocalDateInput(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Stable accent for palette chips / tiles by room-type id */
export function roomTypeAccentClasses(roomTypeId: string | undefined | null, paletteIndex: number): string {
  if (!roomTypeId) {
    return "border-2 border-dashed border-slate-300 bg-slate-50 text-slate-700 ring-slate-200";
  }
  const SWATCHES = [
    "border-indigo-400 bg-indigo-50 text-indigo-950 ring-indigo-200",
    "border-teal-400 bg-teal-50 text-teal-950 ring-teal-200",
    "border-violet-400 bg-violet-50 text-violet-950 ring-violet-200",
    "border-amber-400 bg-amber-50 text-amber-950 ring-amber-200",
    "border-sky-400 bg-sky-50 text-sky-950 ring-sky-200",
    "border-fuchsia-400 bg-fuchsia-50 text-fuchsia-950 ring-fuchsia-200",
    "border-emerald-400 bg-emerald-50 text-emerald-950 ring-emerald-200",
    "border-orange-400 bg-orange-50 text-orange-950 ring-orange-200",
  ];
  const i = Math.abs(paletteIndex) % SWATCHES.length;
  return `border-2 ${SWATCHES[i]}`;
}
