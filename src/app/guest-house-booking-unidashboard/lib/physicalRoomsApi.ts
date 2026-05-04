import api from "@/utils/apiUtils";

export async function fetchUniPhysicalRooms(guestHouseId: string, asOfDate?: string) {
  const res = await api.get(`/api/guest-house/${guestHouseId}/physical-rooms`, {
    params: asOfDate ? { asOfDate } : {},
  });
  return res.data as {
    success: boolean;
    message?: string;
    data?: { summary: unknown; units: unknown[] };
  };
}

export async function postUniPhysicalLayout(
  guestHouseId: string,
  floors: { floor: number; roomsOnFloor: number }[]
) {
  const res = await api.post(`/api/guest-house/${guestHouseId}/physical-rooms/layout`, { floors });
  return res.data as { success: boolean; message?: string; data?: unknown };
}

export async function patchUniPhysicalRoomPlan(
  guestHouseId: string,
  physicalRoomId: string,
  body: { floor?: number; roomTypeId?: string | null }
) {
  const res = await api.patch(`/api/guest-house/${guestHouseId}/physical-rooms/${physicalRoomId}`, body);
  return res.data as { success: boolean; message?: string; data?: unknown };
}

/**
 * Creates bedroom GuestHouseRoom rows with placeholders if missing.
 * Omit bedroomCategories (or empty) → legacy "Single bedroom" + "Double bedroom".
 * Non-empty → per category e.g. "Suite — Single bedroom", "Suite — Double bedroom".
 */
export async function postEnsureFloorPlanPresets(guestHouseId: string, bedroomCategories?: string[]) {
  const body =
    bedroomCategories && bedroomCategories.length > 0 ? { bedroomCategories } : undefined;
  const res = await api.post(`/api/guest-house/${guestHouseId}/floor-plan/ensure-presets`, body);
  return res.data as {
    success: boolean;
    message?: string;
    data?: { created: { _id: string; roomName: string }[]; skipped: { roomName: string; reason: string }[] };
  };
}
