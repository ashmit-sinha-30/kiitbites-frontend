"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import api from "@/utils/apiUtils";
import {
  HK_OPTIONS,
  hkBadgeClass,
  parseSellableBedroomRoom,
  sortBedroomCategories,
  type PhysicalRoomsSummary,
  type PhysicalUnitRow,
  type RoomTypeOption,
  roomTypeAccentClasses,
} from "../lib/physicalRoomsShared";
import {
  fetchUniPhysicalRooms,
  patchUniPhysicalRoomPlan,
  postEnsureFloorPlanPresets,
  postUniPhysicalLayout,
} from "../lib/physicalRoomsApi";
import AppDialog from "@/components/AppDialog";

interface GuestHouseOption {
  _id: string;
  name: string;
}

interface ShellRow {
  floor: string;
  roomsOnFloor: string;
}

const BRUSH_UNASSIGNED = "__unassigned__";

/** Missing level numbers become 0, 1, 2…; missing room counts become 1 — keeps generate unambiguous */
function coerceShellRows(rows: ShellRow[]): ShellRow[] {
  let prevFloorNum = -999;
  return rows.map((row, idx) => {
    let floorStr = row.floor.trim();
    if (floorStr === "" || !Number.isFinite(Number(floorStr))) {
      floorStr = String(prevFloorNum === -999 ? idx : prevFloorNum + 1);
    }
    prevFloorNum = Number(floorStr);

    let roomsStr = row.roomsOnFloor.trim();
    const rn = Number(roomsStr);
    if (roomsStr === "" || !Number.isFinite(rn) || rn < 1) {
      roomsStr = "1";
    }
    return { floor: floorStr, roomsOnFloor: roomsStr };
  });
}

/** Same building level must not appear twice — backend would reuse door codes and counts get wrong. Sum rooms per level into one row each. */
function mergeShellRowsByFloor(rows: ShellRow[]): ShellRow[] {
  const normalized = coerceShellRows(rows);
  const map = new Map<number, number>();
  for (const r of normalized) {
    const f = Number(r.floor);
    const n = Number(r.roomsOnFloor);
    if (!Number.isFinite(f) || !Number.isFinite(n) || n < 1) continue;
    map.set(f, (map.get(f) ?? 0) + n);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([floor, rooms]) => ({ floor: String(floor), roomsOnFloor: String(rooms) }));
}

function duplicateBuildingLevels(rows: ShellRow[]): number[] {
  const normalized = coerceShellRows(rows);
  const counts = new Map<number, number>();
  for (const r of normalized) {
    const f = Number(r.floor);
    if (!Number.isFinite(f)) continue;
    counts.set(f, (counts.get(f) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, c]) => c > 1)
    .map(([f]) => f);
}

export default function FloorPlanService() {
  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => setPortalReady(true), []);

  const [guestHouses, setGuestHouses] = useState<GuestHouseOption[]>([]);
  const [guestHouseId, setGuestHouseId] = useState("");
  const [loadingHouses, setLoadingHouses] = useState(true);

  const [roomTypes, setRoomTypes] = useState<RoomTypeOption[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [syncingShell, setSyncingShell] = useState(false);
  const [summary, setSummary] = useState<PhysicalRoomsSummary | null>(null);
  const [units, setUnits] = useState<PhysicalUnitRow[]>([]);

  const [shellRows, setShellRows] = useState<ShellRow[]>([
    { floor: "0", roomsOnFloor: "6" },
    { floor: "1", roomsOnFloor: "6" },
  ]);

  /** Tap-to-paint: which room category to apply */
  const [brush, setBrush] = useState<string>(BRUSH_UNASSIGNED);
  const [paintingId, setPaintingId] = useState<string | null>(null);

  const [floorSheet, setFloorSheet] = useState<PhysicalUnitRow | null>(null);
  const [floorInput, setFloorInput] = useState("");
  const [savingFloor, setSavingFloor] = useState(false);
  const [ensuringPresets, setEnsuringPresets] = useState(false);
  /** Bedroom categories for preset creation e.g. "Suite, Deluxe" → named pairs with Single/Double */
  const [presetBedroomCategoriesInput, setPresetBedroomCategoriesInput] = useState("");
  /** Which bedroom category row is active for Single/Double chips */
  const [selectedBedroomCategory, setSelectedBedroomCategory] = useState("General");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogVariant, setDialogVariant] = useState<"info" | "error">("info");

  const showInfo = (message: string) => {
    setDialogVariant("info");
    setDialogMessage(message);
    setDialogOpen(true);
  };

  const showError = (message: string) => {
    setDialogVariant("error");
    setDialogMessage(message);
    setDialogOpen(true);
  };

  const bedroomPaintMeta = useMemo(() => {
    const pairBy = new Map<string, { single?: RoomTypeOption; double?: RoomTypeOption }>();
    const ids = new Set<string>();
    for (const r of roomTypes) {
      const p = parseSellableBedroomRoom(r.roomName);
      if (!p) continue;
      ids.add(r._id);
      const row = pairBy.get(p.category) ?? {};
      if (p.occupancy === "single") row.single = r;
      else row.double = r;
      pairBy.set(p.category, row);
    }
    return {
      pairBy,
      bedroomRoomIds: ids,
      categoryKeys: sortBedroomCategories([...pairBy.keys()]),
    };
  }, [roomTypes]);

  useEffect(() => {
    const keys = bedroomPaintMeta.categoryKeys;
    if (keys.length === 0) return;
    if (!keys.includes(selectedBedroomCategory)) {
      setSelectedBedroomCategory(keys[0]);
    }
  }, [bedroomPaintMeta.categoryKeys, selectedBedroomCategory]);

  const currentBedPair = bedroomPaintMeta.pairBy.get(selectedBedroomCategory);
  const currentBedroomSingle = currentBedPair?.single;
  const currentBedroomDouble = currentBedPair?.double;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingHouses(true);
        const res = await api.get("/api/guest-house");
        const json = res.data;
        if (!json.success || cancelled) return;
        const houses: GuestHouseOption[] = json.data || [];
        setGuestHouses(houses);
        if (houses.length && !guestHouseId) {
          setGuestHouseId(houses[0]._id);
        }
      } catch {
        if (!cancelled) setGuestHouses([]);
      } finally {
        if (!cancelled) setLoadingHouses(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadFloorData = useCallback(async () => {
    if (!guestHouseId) return;
    try {
      setLoadingData(true);
      const [roomsRes, physRes] = await Promise.all([
        api.get(`/api/guest-house-rooms?guestHouseId=${guestHouseId}`),
        fetchUniPhysicalRooms(guestHouseId),
      ]);

      const rj = roomsRes.data;
      if (rj.success) {
        const list = (rj.data || []) as { _id: string; roomName: string; isActive?: boolean }[];
        setRoomTypes(list.filter((x) => x.isActive !== false).map((x) => ({ _id: x._id, roomName: x.roomName })));
      } else setRoomTypes([]);

      if (physRes.success && physRes.data) {
        setSummary(physRes.data.summary as PhysicalRoomsSummary);
        setUnits((physRes.data.units || []) as PhysicalUnitRow[]);
      } else {
        setSummary(null);
        setUnits([]);
      }
    } catch {
      setRoomTypes([]);
      setSummary(null);
      setUnits([]);
    } finally {
      setLoadingData(false);
    }
  }, [guestHouseId]);

  useEffect(() => {
    void loadFloorData();
  }, [loadFloorData]);

  useEffect(() => {
    setSummary(null);
    setUnits([]);
    setShellRows([
      { floor: "0", roomsOnFloor: "6" },
      { floor: "1", roomsOnFloor: "6" },
    ]);
  }, [guestHouseId]);

  useEffect(() => {
    if (!summary?.floors?.length) return;
    setShellRows((prev) => {
      const defaultish =
        prev.length === 2 && prev[0].floor === "0" && prev[1].floor === "1" && prev[0].roomsOnFloor === "6" && prev[1].roomsOnFloor === "6";
      if (!defaultish) return prev;
      return summary.floors.map((f) => ({
        floor: String(f.floor),
        roomsOnFloor: String(f.roomsOnFloor),
      }));
    });
  }, [guestHouseId, summary?.floors]);

  const roomTypeIndexMap = useMemo(() => {
    const m = new Map<string, number>();
    roomTypes.forEach((r, i) => m.set(r._id, i));
    return m;
  }, [roomTypes]);

  const nonBedroomRoomTypes = useMemo(() => {
    const ids = bedroomPaintMeta.bedroomRoomIds;
    return roomTypes.filter((r) => !ids.has(r._id));
  }, [roomTypes, bedroomPaintMeta.bedroomRoomIds]);

  const unitsByFloor = useMemo(() => {
    const m = new Map<number, PhysicalUnitRow[]>();
    for (const u of units) {
      const arr = m.get(u.floor) ?? [];
      arr.push(u);
      m.set(u.floor, arr);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.unitLabel.localeCompare(b.unitLabel, undefined, { numeric: true }));
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [units]);

  const layoutPreview = useMemo(() => {
    const coerced = coerceShellRows(shellRows);
    const merged = mergeShellRowsByFloor(shellRows);
    const dupLevels = duplicateBuildingLevels(shellRows);
    const floors = merged.map((r) => ({
      floor: Number(r.floor),
      rooms: Number(r.roomsOnFloor),
    }));
    const totalRooms = floors.reduce((s, x) => s + x.rooms, 0);
    const samples = floors.map((x) => {
      const first = `${x.floor}-${String(1).padStart(2, "0")}`;
      const last = `${x.floor}-${String(x.rooms).padStart(2, "0")}`;
      return x.rooms === 1 ? `${first}` : `${first} … ${last}`;
    });
    const needsAutoFix = shellRows.some((row, i) => {
      const c = coerced[i];
      return row.floor.trim() !== c.floor || row.roomsOnFloor.trim() !== c.roomsOnFloor;
    });
    return {
      coerced,
      merged,
      floors,
      totalRooms,
      samples,
      needsAutoFix,
      levelCount: floors.length,
      duplicateLevels: dupLevels,
      mergedFromDuplicates: dupLevels.length > 0,
    };
  }, [shellRows]);

  const parsePresetCategoriesFromInput = () =>
    presetBedroomCategoriesInput
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  const ensureSingleDoubleTypes = async (opts?: { silent?: boolean; bedroomCategories?: string[] }) => {
    if (!guestHouseId) return false;
    /** After layout sync we only add legacy plain Single/Double — ignore optional categories field */
    let categoriesArg: string[] | undefined;
    if (opts?.silent) {
      categoriesArg = undefined;
    } else if (opts?.bedroomCategories !== undefined) {
      categoriesArg = opts.bedroomCategories.length > 0 ? opts.bedroomCategories : undefined;
    } else {
      const parsed = parsePresetCategoriesFromInput();
      categoriesArg = parsed.length > 0 ? parsed : undefined;
    }
    try {
      setEnsuringPresets(true);
      const json = await postEnsureFloorPlanPresets(guestHouseId, categoriesArg);
      if (!json.success) throw new Error(json.message || "Request failed");
      const skipped = json.data?.skipped?.length ? `\nSkipped: ${json.data.skipped.map((s) => `${s.roomName}: ${s.reason}`).join("; ")}` : "";
      if (!opts?.silent) {
        showInfo(String(json.message || "Bedroom types created.") + skipped);
      }
      await loadFloorData();
      return true;
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = e2.response?.data?.message || e2.message || "Could not create types";
      if (!opts?.silent) showError(msg);
      return false;
    } finally {
      setEnsuringPresets(false);
    }
  };

  const syncBuildingShell = async () => {
    if (!guestHouseId) return;
    const merged = mergeShellRowsByFloor(shellRows);
    setShellRows(merged);
    const floorsPayload = merged.map((row) => ({
      floor: Number(row.floor),
      roomsOnFloor: Number(row.roomsOnFloor),
    }));
    if (floorsPayload.length === 0) {
      return showError("Add at least one row (building level + number of guest rooms).");
    }
    try {
      setSyncingShell(true);
      const json = await postUniPhysicalLayout(guestHouseId, floorsPayload);
      if (!json.success) throw new Error(json.message || "Sync failed");
      showInfo(String(json.message || "Rooms added to the map."));
      await loadFloorData();

      try {
        const roomsRes = await api.get(`/api/guest-house-rooms?guestHouseId=${guestHouseId}`);
        const rj = roomsRes.data as { success?: boolean; data?: { isActive?: boolean }[] };
        const list = rj.success ? rj.data || [] : [];
        const activeTypes = list.filter((x) => x.isActive !== false);
        if (activeTypes.length === 0) {
          const ok = await ensureSingleDoubleTypes({ silent: true });
          if (!ok) {
            showError(
              "Rooms are on the map, but Single/Double categories could not be created automatically (often guest-house capacity is full). Use “Create Single & Double bedroom types” above."
            );
          }
        }
      } catch {
        /* non-fatal */
      }
      await loadFloorData();
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { message?: string } }; message?: string };
      showError(e2.response?.data?.message || e2.message || "Could not generate rooms.");
    } finally {
      setSyncingShell(false);
    }
  };

  const paintWithRoomType = async (u: PhysicalUnitRow, roomTypeId: string | null) => {
    if (!guestHouseId || paintingId) return;
    const unitId = String(u._id);
    const currentId = u.roomTypeId?._id ? String(u.roomTypeId._id) : "";
    const nextId = roomTypeId ?? "";
    if (nextId === "" && currentId === "") return;
    if (nextId !== "" && nextId === currentId) return;

    const body: { roomTypeId: string | null } = {
      roomTypeId: nextId === "" ? null : String(nextId),
    };

    try {
      setPaintingId(unitId);
      const json = await patchUniPhysicalRoomPlan(guestHouseId.trim(), unitId, body);
      if (!json.success) throw new Error((json as { message?: string }).message || "Update failed");
      await loadFloorData();
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { message?: string } }; message?: string };
      showError(e2.response?.data?.message || e2.message || "Could not update room.");
    } finally {
      setPaintingId(null);
    }
  };

  const paintUnitFromBrush = async (u: PhysicalUnitRow) => {
    const roomTypeId = brush === BRUSH_UNASSIGNED ? null : brush;
    await paintWithRoomType(u, roomTypeId);
  };

  const fetchBedroomPaintId = useCallback(
    async (category: string, kind: "single" | "double"): Promise<string | null> => {
      if (!guestHouseId) return null;
      try {
        const roomsRes = await api.get(`/api/guest-house-rooms?guestHouseId=${guestHouseId}`);
        const rj = roomsRes.data as { success?: boolean; data?: { _id: string; roomName: string; isActive?: boolean }[] };
        const list = rj.success ? rj.data || [] : [];
        const active = list.filter((x) => x.isActive !== false);
        const hit = active.find((r) => {
          const p = parseSellableBedroomRoom(r.roomName);
          return p && p.category === category && p.occupancy === kind;
        });
        return hit?._id ? String(hit._id) : null;
      } catch {
        return null;
      }
    },
    [guestHouseId]
  );

  const ensureThenBedroomId = useCallback(
    async (category: string, kind: "single" | "double"): Promise<string | null> => {
      const id = await fetchBedroomPaintId(category, kind);
      if (id) return id;
      if (!guestHouseId) return null;
      try {
        setEnsuringPresets(true);
        const catsForApi = category === "General" ? undefined : [category];
        await postEnsureFloorPlanPresets(guestHouseId, catsForApi);
        await loadFloorData();
        return await fetchBedroomPaintId(category, kind);
      } finally {
        setEnsuringPresets(false);
      }
    },
    [guestHouseId, fetchBedroomPaintId, loadFloorData]
  );

  const tapPaletteOccupancy = async (kind: "single" | "double") => {
    const id = await ensureThenBedroomId(selectedBedroomCategory, kind);
    if (id) setBrush(id);
    else {
      showError(
        `Could not enable ${kind === "single" ? "Single" : "Double"} bedroom for “${selectedBedroomCategory}”. Check guest-house capacity or Add room details.`
      );
    }
  };

  const paintCardSingle = async (u: PhysicalUnitRow) => {
    const id = await ensureThenBedroomId(selectedBedroomCategory, "single");
    if (id) await paintWithRoomType(u, id);
    else showError(`Could not assign Single (${selectedBedroomCategory}) — check capacity or Add room details.`);
  };

  const paintCardDouble = async (u: PhysicalUnitRow) => {
    const id = await ensureThenBedroomId(selectedBedroomCategory, "double");
    if (id) await paintWithRoomType(u, id);
    else showError(`Could not assign Double (${selectedBedroomCategory}) — check capacity or Add room details.`);
  };

  const openFloorSheet = (u: PhysicalUnitRow) => {
    setFloorSheet(u);
    setFloorInput(String(u.floor));
  };

  const saveFloorSheet = async () => {
    if (!guestHouseId || !floorSheet) return;
    const fl = Number(floorInput);
    if (!Number.isFinite(fl) || fl < -5 || fl > 200) {
      return showError("Floor must be between -5 and 200.");
    }
    try {
      setSavingFloor(true);
      const json = await patchUniPhysicalRoomPlan(guestHouseId.trim(), String(floorSheet._id), { floor: fl });
      if (!json.success) throw new Error((json as { message?: string }).message || "Save failed");
      setFloorSheet(null);
      await loadFloorData();
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { message?: string } }; message?: string };
      showError(e2.response?.data?.message || e2.message || "Could not move floor.");
    } finally {
      setSavingFloor(false);
    }
  };

  const floorPalette =
    guestHouseId && units.length > 0 && !floorSheet ? (
      <div
        className="pointer-events-auto fixed bottom-0 left-0 right-0 z-[300] border-t border-slate-200 bg-white p-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(15,23,42,0.18)] md:left-[280px]"
        style={{ touchAction: "manipulation" }}
      >
        {roomTypes.length === 0 ? (
          <>
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">No sellable types yet</p>
            <button
              type="button"
              disabled={ensuringPresets}
              className="pointer-events-auto min-h-[52px] w-full cursor-pointer rounded-2xl bg-indigo-600 text-sm font-semibold text-white disabled:opacity-50"
              onClick={() => void ensureSingleDoubleTypes()}
            >
              {ensuringPresets ? "Creating types…" : "Create bedroom types (General)"}
            </button>
          </>
        ) : (
          <>
            <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Choose bedroom type, then Single or Double — tap a room card above
            </p>
            <div className="flex flex-wrap gap-2 pb-1 pt-1 [-webkit-overflow-scrolling:touch]">
              <button
                type="button"
                className={`pointer-events-auto min-h-[52px] shrink-0 cursor-pointer rounded-2xl px-5 py-3 text-sm font-semibold ring-2 transition active:scale-[0.98] md:min-h-[48px] [&:focus-visible]:outline [&:focus-visible]:outline-2 [&:focus-visible]:outline-offset-2 [&:focus-visible]:outline-indigo-600 ${
                  brush === BRUSH_UNASSIGNED ? "bg-slate-900 text-white ring-slate-900" : "bg-slate-100 text-slate-900 ring-slate-300"
                }`}
                style={{ touchAction: "manipulation" }}
                onClick={() => setBrush(BRUSH_UNASSIGNED)}
              >
                Unassigned
              </button>
            </div>

            {bedroomPaintMeta.categoryKeys.length > 0 ? (
              <>
                <p className="mt-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Bedroom type</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {bedroomPaintMeta.categoryKeys.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      disabled={ensuringPresets}
                      className={`pointer-events-auto min-h-[48px] shrink-0 cursor-pointer rounded-2xl px-4 py-2.5 text-sm font-semibold ring-2 transition active:scale-[0.98] disabled:opacity-60 [&:focus-visible]:outline [&:focus-visible]:outline-2 [&:focus-visible]:outline-offset-2 [&:focus-visible]:outline-indigo-600 ${
                        selectedBedroomCategory === cat
                          ? "bg-slate-900 text-white ring-slate-900"
                          : "border border-slate-200 bg-slate-50 text-slate-800 ring-transparent"
                      }`}
                      style={{ touchAction: "manipulation" }}
                      onClick={() => setSelectedBedroomCategory(cat)}
                    >
                      {cat === "General" ? "General (plain names)" : cat}
                    </button>
                  ))}
                </div>
                <p className="mt-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Occupancy for “{selectedBedroomCategory}”
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={ensuringPresets}
                    className={`pointer-events-auto min-h-[52px] shrink-0 cursor-pointer rounded-2xl px-5 py-3 text-sm font-semibold ring-2 transition active:scale-[0.98] md:min-h-[48px] disabled:opacity-60 [&:focus-visible]:outline [&:focus-visible]:outline-2 [&:focus-visible]:outline-offset-2 [&:focus-visible]:outline-indigo-600 ${roomTypeAccentClasses(currentBedroomSingle?._id ?? "preset-single", 0)} ${currentBedroomSingle && String(brush) === String(currentBedroomSingle._id) ? "ring-offset-2 ring-offset-white ring-indigo-600" : ""}`}
                    style={{ touchAction: "manipulation" }}
                    onClick={() => void tapPaletteOccupancy("single")}
                  >
                    Single bedroom
                  </button>
                  <button
                    type="button"
                    disabled={ensuringPresets}
                    className={`pointer-events-auto min-h-[52px] shrink-0 cursor-pointer rounded-2xl px-5 py-3 text-sm font-semibold ring-2 transition active:scale-[0.98] md:min-h-[48px] disabled:opacity-60 [&:focus-visible]:outline [&:focus-visible]:outline-2 [&:focus-visible]:outline-offset-2 [&:focus-visible]:outline-indigo-600 ${roomTypeAccentClasses(currentBedroomDouble?._id ?? "preset-double", 1)} ${currentBedroomDouble && String(brush) === String(currentBedroomDouble._id) ? "ring-offset-2 ring-offset-white ring-indigo-600" : ""}`}
                    style={{ touchAction: "manipulation" }}
                    onClick={() => void tapPaletteOccupancy("double")}
                  >
                    Double bedroom
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-2 rounded-lg bg-amber-50 px-2 py-2 text-xs text-amber-950 ring-1 ring-amber-100">
                No bedroom pairs detected (names should look like <span className="font-mono">Suite — Single bedroom</span> or plain{" "}
                <span className="font-mono">Single bedroom</span>). Create presets below or in Add room details.
              </p>
            )}

            {nonBedroomRoomTypes.length > 0 ? (
              <>
                <p className="mt-3 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Other sellable types</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {nonBedroomRoomTypes.map((r, i) => (
                    <button
                      key={r._id}
                      type="button"
                      className={`pointer-events-auto min-h-[52px] shrink-0 cursor-pointer rounded-2xl px-4 py-3 text-sm font-semibold ring-2 transition active:scale-[0.98] md:min-h-[48px] [&:focus-visible]:outline [&:focus-visible]:outline-2 [&:focus-visible]:outline-offset-2 [&:focus-visible]:outline-indigo-600 ${roomTypeAccentClasses(r._id, i)} ${
                        String(brush) === String(r._id) ? "ring-offset-2 ring-offset-white ring-indigo-600" : ""
                      }`}
                      style={{ touchAction: "manipulation" }}
                      onClick={() => setBrush(r._id)}
                    >
                      {r.roomName}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    ) : null;

  return (
    <div className="relative min-h-[70vh] pb-[14rem] md:pb-[15rem]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Floor Plan</h2>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-slate-600">
            <li>
              Choose the guest house, then say <strong>how many guest rooms</strong> sit on each <strong>building level</strong> (ground might be 0 or 1 — your choice).
            </li>
            <li>
              Tap <strong>Generate rooms on map</strong>. Each room gets a short code like <span className="font-mono text-slate-800">7-01</span>.
            </li>
            <li>
              Scroll to the room cards. On the bar: pick a <strong>bedroom type</strong> (e.g. Suite), then <strong>Single bedroom</strong> or{" "}
              <strong>Double bedroom</strong>, and tap rooms — or use the quick Single/Double buttons on each card (they follow the same bedroom type).
              After generating rooms we try to add plain Single/Double categories automatically when possible.
            </li>
          </ol>

          {guestHouseId ? (
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <p className="text-sm font-medium text-indigo-950">Bedroom categories for painting</p>
              <p className="mt-1 text-xs text-indigo-900/80">
                Names follow <strong>Bedroom type → occupancy</strong>: either plain <span className="font-mono text-[11px]">Single bedroom</span> /{" "}
                <span className="font-mono text-[11px]">Double bedroom</span>, or for Suite-style listings{" "}
                <span className="font-mono text-[11px]">Suite — Single bedroom</span> and <span className="font-mono text-[11px]">Suite — Double bedroom</span>.
              </p>
              <label className="mt-3 block text-xs font-semibold text-indigo-950">
                Optional bedroom types (comma-separated)
                <input
                  type="text"
                  className="mt-1.5 block min-h-[44px] w-full max-w-xl rounded-lg border border-indigo-200 bg-white px-3 text-sm font-normal text-slate-900 placeholder:text-slate-400"
                  placeholder='e.g. Suite — or leave blank for plain "Single bedroom" / "Double bedroom"'
                  value={presetBedroomCategoriesInput}
                  onChange={(e) => setPresetBedroomCategoriesInput(e.target.value)}
                  disabled={ensuringPresets}
                />
              </label>
              <p className="mt-1 text-[11px] text-indigo-900/75">Blank = General pair only. Enter <strong>Suite</strong> to create Suite single/double sellable rows.</p>
              <button
                type="button"
                disabled={ensuringPresets}
                className="mt-3 min-h-[48px] w-full max-w-xl rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
                onClick={() => void ensureSingleDoubleTypes()}
              >
                {ensuringPresets ? "Creating…" : "Create bedroom types"}
              </button>
            </div>
          ) : null}

          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Guest house</span>
            <select
              className="min-h-[48px] w-full max-w-xl rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base font-medium text-slate-900"
              value={guestHouseId}
              onChange={(e) => setGuestHouseId(e.target.value)}
              disabled={loadingHouses || guestHouses.length === 0}
            >
              {guestHouses.length === 0 ? (
                <option value="">No guest houses</option>
              ) : (
                guestHouses.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))
              )}
            </select>
          </label>
        </section>

        {guestHouseId ? (
          <>
            <section className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm md:p-6">
              <h3 className="text-base font-semibold text-slate-900">Step 1 · Rooms per building level</h3>
              <p className="mt-1 text-sm text-slate-600">
                Use <strong>one row per building level</strong> (lift number).{" "}
                <strong>Guest rooms</strong> = how many bookable doors on that level only — not corridors or staff rooms.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                If you accidentally entered the <strong>same level twice</strong> (e.g. two rows both say “6”), they are{" "}
                <strong>combined into one row</strong> when you generate — add 4 + 8 together so you get twelve codes{" "}
                <span className="font-mono">6-01 … 6-12</span>, not two overlapping lists.
              </p>

              {layoutPreview.mergedFromDuplicates ? (
                <p className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-950">
                  <strong>Same level more than once:</strong> levels{" "}
                  {[...layoutPreview.duplicateLevels].sort((a, b) => a - b).join(", ")} appear on multiple rows. Preview below uses{" "}
                  <strong>merged</strong> totals (what will be sent when you tap Generate).
                </p>
              ) : null}

              {layoutPreview.needsAutoFix ? (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                  <strong>Tip:</strong> A level or room count was left blank. When you generate, we use the next level number in order (0, 1, 2…) and at least{" "}
                  <strong>1</strong> room per row — you can edit the numbers first if you prefer.
                </p>
              ) : null}

              <div className="mt-4 space-y-3">
                {shellRows.map((row, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm"
                  >
                    <label className="min-w-[120px] flex-1 text-xs font-semibold text-slate-700">
                      Building level
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder={String(idx)}
                        className="mt-1.5 block min-h-[48px] w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-medium text-slate-900"
                        value={row.floor}
                        onChange={(e) => {
                          const next = [...shellRows];
                          next[idx] = { ...next[idx], floor: e.target.value };
                          setShellRows(next);
                        }}
                      />
                      <span className="mt-1 block text-[11px] font-normal text-slate-500">e.g. 0 = ground, 1 = first</span>
                    </label>
                    <label className="min-w-[140px] flex-1 text-xs font-semibold text-slate-700">
                      Guest rooms on this level
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        placeholder="4"
                        className="mt-1.5 block min-h-[48px] w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-medium text-slate-900"
                        value={row.roomsOnFloor}
                        onChange={(e) => {
                          const next = [...shellRows];
                          next[idx] = { ...next[idx], roomsOnFloor: e.target.value };
                          setShellRows(next);
                        }}
                      />
                      <span className="mt-1 block font-normal text-[11px] text-slate-500">How many doors guests can book</span>
                    </label>
                    <button
                      type="button"
                      className="min-h-[48px] rounded-lg px-3 text-sm font-medium text-rose-700 hover:bg-rose-50"
                      onClick={() => setShellRows((r) => r.filter((_, i) => i !== idx))}
                      disabled={shellRows.length <= 1}
                    >
                      Remove row
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-slate-100/80 px-4 py-3 text-sm text-slate-700">
                <p className="font-medium text-slate-900">Preview</p>
                <p className="mt-1">
                  About <strong>{layoutPreview.totalRooms}</strong> guest room{layoutPreview.totalRooms === 1 ? "" : "s"} across{" "}
                  <strong>{layoutPreview.levelCount}</strong> level{layoutPreview.levelCount === 1 ? "" : "s"}.
                </p>
                <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-slate-600">
                  {layoutPreview.samples.map((s, i) => (
                    <li key={i}>
                      Codes: <span className="font-mono text-slate-800">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="min-h-[48px] rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800"
                  onClick={() =>
                    setShellRows((r) => {
                      const last = r[r.length - 1];
                      const lastLevel = Number(last?.floor);
                      const nextLevel = Number.isFinite(lastLevel) ? lastLevel + 1 : r.length;
                      return [
                        ...r,
                        {
                          floor: String(nextLevel),
                          roomsOnFloor: last?.roomsOnFloor && last.roomsOnFloor.trim() !== "" ? last.roomsOnFloor : "4",
                        },
                      ];
                    })
                  }
                >
                  + Add another level
                </button>
                <button
                  type="button"
                  disabled={syncingShell}
                  className="min-h-[48px] rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
                  onClick={() => void syncBuildingShell()}
                >
                  {syncingShell ? "Working…" : "Generate rooms on map"}
                </button>
                <button
                  type="button"
                  disabled={loadingData}
                  className="min-h-[48px] rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700"
                  onClick={() => void loadFloorData()}
                >
                  Reload map
                </button>
              </div>
            </section>

            {loadingData ? (
              <p className="text-sm text-slate-500">Loading plan…</p>
            ) : units.length === 0 ? (
              <p className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-950">
                <strong>Step 1 isn&apos;t done yet.</strong> Fill in each building level and guest-room count above, then tap{" "}
                <strong>Generate rooms on map</strong>. After that, this area shows touch cards for Single / Double.
              </p>
            ) : (
              <section className="space-y-8">
                <h3 className="text-base font-semibold text-slate-900">Step 2 · Mark each room</h3>
                <p className="text-xs text-slate-600">
                  Bottom bar: choose <strong>Bedroom type</strong> then <strong>Single</strong> or <strong>Double</strong>. Card shortcuts use the{" "}
                  <strong>same</strong> bedroom type selected on the bar (change it there first). Categories can be created after Generate or with the blue box above.
                </p>
                {summary ? (
                  <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                    <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                      <strong>{summary.totalUnits}</strong> rooms on map
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                      <strong>{summary.floorCount}</strong> levels
                    </span>
                  </div>
                ) : null}

                <div className="rounded-xl border border-white bg-white p-3 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Housekeeping (read-only here)</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {HK_OPTIONS.map((o) => (
                      <span key={o.value} className={`rounded-full px-2 py-1 text-[10px] font-medium ring-1 ${hkBadgeClass(o.value)}`}>
                        {o.label}
                      </span>
                    ))}
                  </div>
                </div>

                {unitsByFloor.map(([floorNum, floorUnits]) => (
                  <div key={floorNum}>
                    <h4 className="mb-3 text-sm font-bold text-slate-800">Level {floorNum}</h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                      {floorUnits.map((u) => {
                        const rtId = u.roomTypeId?._id ? String(u.roomTypeId._id) : "";
                        const pi = rtId ? roomTypeIndexMap.get(rtId) ?? 0 : 0;
                        const accent = roomTypeAccentClasses(rtId || null, pi);
                        const busy = paintingId === u._id;
                        return (
                          <div
                            key={u._id}
                            className={`flex flex-col rounded-2xl p-1 shadow-sm ring-1 ring-slate-100 ${accent}`}
                          >
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void paintUnitFromBrush(u)}
                              className="flex min-h-[100px] flex-1 flex-col rounded-xl px-3 py-3 text-left transition active:scale-[0.98] disabled:opacity-60"
                            >
                              <span className="text-base font-bold leading-tight">{u.unitLabel}</span>
                              <span className="mt-1 line-clamp-2 text-xs font-medium opacity-90">
                                {u.roomTypeId?.roomName || "Unassigned"}
                              </span>
                              <span
                                className={`mt-2 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${hkBadgeClass(u.housekeepingStatus)}`}
                              >
                                {(HK_OPTIONS.find((h) => h.value === u.housekeepingStatus)?.label || "Ready").split("—")[0].trim()}
                              </span>
                              <span className="mt-2 text-[10px] text-slate-500">Tap = paint selected palette below</span>
                            </button>
                            <div className="grid grid-cols-3 gap-1 border-t border-black/5 bg-white/80 px-1 py-1">
                              <button
                                type="button"
                                disabled={busy || ensuringPresets}
                                title={`Mark as Single (${selectedBedroomCategory})`}
                                className="pointer-events-auto min-h-[44px] cursor-pointer rounded-lg bg-indigo-50 text-xs font-semibold text-indigo-900 disabled:opacity-40"
                                style={{ touchAction: "manipulation" }}
                                onClick={() => void paintCardSingle(u)}
                              >
                                Single
                              </button>
                              <button
                                type="button"
                                disabled={busy || ensuringPresets}
                                title={`Mark as Double (${selectedBedroomCategory})`}
                                className="pointer-events-auto min-h-[44px] cursor-pointer rounded-lg bg-teal-50 text-xs font-semibold text-teal-900 disabled:opacity-40"
                                style={{ touchAction: "manipulation" }}
                                onClick={() => void paintCardDouble(u)}
                              >
                                Double
                              </button>
                              <button
                                type="button"
                                disabled={busy || !(u.roomTypeId?._id)}
                                className="min-h-[40px] rounded-lg bg-slate-100 text-xs font-semibold text-slate-700 disabled:opacity-40"
                                title="Clear category"
                                onClick={() => void paintWithRoomType(u, null)}
                              >
                                Clear
                              </button>
                            </div>
                            <button
                              type="button"
                              className="min-h-[40px] rounded-b-xl border-t border-black/5 bg-white/60 px-2 text-xs font-medium text-slate-600 hover:bg-white"
                              onClick={() => openFloorSheet(u)}
                            >
                              Change level #
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </section>
            )}
          </>
        ) : null}
      </div>

      {portalReady && floorPalette ? createPortal(floorPalette, document.body) : null}

      {roomTypes.length === 0 && guestHouseId && !loadingData && units.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          After you sync slots, create categories with <strong>Create bedroom types</strong> above (or use{" "}
          <strong>Add room details</strong> for full listings).
        </div>
      ) : null}

      {floorSheet ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-4 sm:items-center" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-lg font-semibold">Building level for this room</h4>
                <p className="text-xs text-slate-600">
                  Room <strong>{floorSheet.unitLabel}</strong> — which level should it sit under on the map? (Same idea as the lift number.)
                </p>
              </div>
              <button type="button" className="text-2xl text-slate-400 hover:text-slate-700" onClick={() => setFloorSheet(null)}>
                ×
              </button>
            </div>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Building level
              <input
                type="number"
                min={-5}
                max={200}
                className="mt-1 min-h-[48px] w-full rounded-xl border px-4 text-lg"
                value={floorInput}
                onChange={(e) => setFloorInput(e.target.value)}
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="rounded-xl border px-4 py-2.5 text-sm font-medium" onClick={() => setFloorSheet(null)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={savingFloor}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                onClick={() => void saveFloorSheet()}
              >
                {savingFloor ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <AppDialog
        open={dialogOpen}
        message={dialogMessage}
        variant={dialogVariant}
        onConfirm={() => setDialogOpen(false)}
      />
    </div>
  );
}
