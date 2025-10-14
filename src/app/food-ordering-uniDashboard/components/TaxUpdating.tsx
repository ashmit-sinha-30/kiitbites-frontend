"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "../styles/TaxUpdating.module.scss";

interface Props {
  universityId: string;
}

type Category = "retail" | "produce";

interface TypeResponse {
  types: string[];
}

export default function TaxUpdating({ universityId }: Props) {
  const [category, setCategory] = useState<Category>("retail");
  const [types, setTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [hsnCode, setHsnCode] = useState<string>("");
  const [gstPercentage, setGstPercentage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resultMsg, setResultMsg] = useState<string>("");
  const [previousHsn, setPreviousHsn] = useState<string>("");
  const [previousGst, setPreviousGst] = useState<number | null>(null);
  const [detailedItems, setDetailedItems] = useState<
    { _id?: string; name?: string; hsnCode?: string; gstPercentage?: number | null }[]
  >([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [enableHsn, setEnableHsn] = useState<boolean>(true);
  const [enableGst, setEnableGst] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        setResultMsg("");
        if (!baseUrl) {
          setResultMsg("Backend URL is not configured (NEXT_PUBLIC_BACKEND_URL)");
          setTypes([]);
          return;
        }
        const url = `${baseUrl}/api/item/types/${category}?t=${Date.now()}`;
        const res = await fetch(url);
        const ct = res.headers.get("content-type") || "";
        if (!res.ok || !ct.includes("application/json")) {
          const text = await res.text();
          setResultMsg(`Failed to load types (${res.status}). ${text.slice(0,200)}`);
          setTypes([]);
          return;
        }
        const data: TypeResponse = await res.json();
        setTypes(data?.types || []);
        setSelectedType("");
        setPreviousHsn("");
        setPreviousGst(null);
      } catch {
        setTypes([]);
        setResultMsg("Error loading types. Check network and backend.");
      }
    };
    if (baseUrl) fetchTypes();
  }, [category, baseUrl]);

  useEffect(() => {
    interface FetchedItem {
      _id?: string;
      name?: string;
      hsnCode?: string;
      gstPercentage?: number | null;
    }
    const fetchPrev = async () => {
      try {
        setPreviousHsn("");
        setPreviousGst(null);
        if (!baseUrl || !selectedType || !universityId) return;
        const url = `${baseUrl}/api/item/${category}/${encodeURIComponent(selectedType)}/${universityId}/detailed?t=${Date.now()}`;
        const res = await fetch(url);
        const ct = res.headers.get("content-type") || "";
        if (!res.ok || !ct.includes("application/json")) {
          const text = await res.text();
          setResultMsg(`Failed to load items (${res.status}). ${text.slice(0,200)}`);
          return;
        }
        const data = await res.json();
        const items: FetchedItem[] = Array.isArray(data?.items) ? data.items : [];
        setDetailedItems(
          items.map((it: FetchedItem) => ({
            _id: it?._id,
            name: it?.name,
            hsnCode: it?.hsnCode,
            gstPercentage: typeof it?.gstPercentage === "number" ? it.gstPercentage : null,
          }))
        );
        // Compute most frequent HSN and associated GST from real items
        const hsnMap = new Map<string, { count: number; gst: number | null }>();
        for (const it of items) {
          const code = (it?.hsnCode || "").toString();
          if (!code) continue;
          const gst = typeof it?.gstPercentage === "number" ? it.gstPercentage : null;
          const prev = hsnMap.get(code) || { count: 0, gst: null };
          hsnMap.set(code, { count: prev.count + 1, gst: prev.gst ?? gst ?? null });
        }
        const sorted = Array.from(hsnMap.entries()).sort((a, b) => b[1].count - a[1].count);
        if (sorted.length > 0) {
          setPreviousHsn(sorted[0][0]);
          setPreviousGst(sorted[0][1].gst);
        } else {
          // Fallback: use common-hsn suggestions across categories for this type
          try {
            const url2 = `${baseUrl}/api/item/common-hsn/${encodeURIComponent(selectedType)}?t=${Date.now()}`;
            const res2 = await fetch(url2);
            const ct2 = res2.headers.get("content-type") || "";
            if (!res2.ok || !ct2.includes("application/json")) {
              const text2 = await res2.text();
              setResultMsg(`No current items found; suggestions failed (${res2.status}). ${text2.slice(0,200)}`);
              return;
            }
            const data2 = await res2.json();
            const top = Array.isArray(data2?.suggestions) ? data2.suggestions[0] : null;
            if (top && top.hsnCode) {
              setPreviousHsn(top.hsnCode);
              setPreviousGst(
                typeof top.gstPercentage === "number" ? top.gstPercentage : null
              );
            }
          } catch {
            // ignore
          }
        }
      } catch {
        setResultMsg("Error loading current HSN/GST. Check network and backend.");
      }
    };
    fetchPrev();
  }, [baseUrl, category, selectedType, universityId, refreshKey]);

  const canSubmit = useMemo(() => {
    return (
      !!universityId &&
      !!selectedType &&
      ((enableHsn && hsnCode.trim().length > 0) || (enableGst && gstPercentage.trim().length > 0)) &&
      (!enableGst || (!Number.isNaN(Number(gstPercentage)) && Number(gstPercentage) >= 0)) &&
      (selectedItemIds.length === 0 || selectedItemIds.length > 0)
    );
  }, [universityId, selectedType, hsnCode, gstPercentage, enableHsn, enableGst, selectedItemIds.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setIsSubmitting(true);
      setResultMsg("");
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      } as Record<string, string>;

      // Build body with optional fields
      type UpdatePayload = { hsnCode?: string; gstPercentage?: number };
      const bodyPayload: UpdatePayload = {};
      if (enableHsn && hsnCode.trim().length > 0) {
        bodyPayload.hsnCode = hsnCode.trim();
      }
      if (enableGst && gstPercentage.trim().length > 0) {
        bodyPayload.gstPercentage = Number(gstPercentage);
      }

      let res: Response;
      if (selectedItemIds.length > 0) {
        // Update specific items only
        res = await fetch(
          `${baseUrl}/api/items/${category}/tax/by-ids`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({ uniId: universityId, itemIds: selectedItemIds, ...bodyPayload }),
          }
        );
      } else {
        // Update all items by type within uni
        res = await fetch(
          `${baseUrl}/api/items/${category}/${encodeURIComponent(selectedType)}/${universityId}/tax`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify(bodyPayload),
          }
        );
      }
      const data = await res.json();
      if (!res.ok) {
        setResultMsg(data?.error || "Failed to update taxes");
      } else {
        const matched = data?.matchedCount ?? 0;
        const modified = data?.modifiedCount ?? 0;
        if (selectedItemIds.length > 0) {
          setResultMsg(`Updated ${modified}/${matched} selected items.`);
        } else {
          setResultMsg(`Updated ${modified}/${matched} items for "${selectedType}" in ${category}.`);
        }
        // Reset input fields and selections then refresh current values
        setHsnCode("");
        setGstPercentage("");
        setSelectedItemIds([]);
        setRefreshKey((k) => k + 1);
      }
    } catch (err: unknown) {
      setResultMsg(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>Tax Updating — Food Ordering</h2>
      <p className={styles.subtitle}>
        Update HSN and/or GST% for all items of a selected type, or target specific items below.
      </p>


      <div className={styles.toggle}>
      <label className={styles.label}>
            Update Fields
            <div className={styles.toggleRow}>
              <label className={styles.toggleLabel}>
                <input type="checkbox" checked={enableHsn} onChange={(e) => setEnableHsn(e.target.checked)} />
                HSN
              </label>
              <label className={styles.toggleLabel}>
                <input type="checkbox" checked={enableGst} onChange={(e) => setEnableGst(e.target.checked)} />
                GST
              </label>
            </div>
          </label>
      </div>

      {selectedType && (
        <div className={styles.comparePanel}>
          <div className={styles.compareBox}>
            <div className={styles.compareHeading}>Current (Most Common)</div>
            <div className={styles.compareRow}>
              <span className={styles.compareLabel}>HSN:</span>
              <span className={styles.compareValue}>{previousHsn || "—"}</span>
            </div>
            <div className={styles.compareRow}>
              <span className={styles.compareLabel}>GST%:</span>
              <span className={styles.compareValue}>
                {previousGst != null ? previousGst : "—"}
              </span>
            </div>
          </div>
          <div className={styles.compareArrow}>→</div>
          <div className={styles.compareBox}>
            <div className={styles.compareHeading}>Updating To</div>
            <div className={styles.compareRow}>
              <span className={styles.compareLabel}>HSN:</span>
              <span className={styles.compareValue}>{enableHsn ? (hsnCode || "—") : "(no change)"}</span>
            </div>
            <div className={styles.compareRow}>
              <span className={styles.compareLabel}>GST%:</span>
              <span className={styles.compareValue}>
                {enableGst ? (gstPercentage ? Number(gstPercentage) : "—") : "(no change)"}
              </span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.row}>
          <label className={styles.label}>
            Category
            <select
              className={styles.input}
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              <option value="retail">Retail</option>
              <option value="produce">Produce</option>
            </select>
          </label>

          <label className={styles.label}>
            Item Type
            <select
              className={styles.input}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">Select type</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.row}>
         

          <label className={styles.label}>
            HSN Code
            <input
              className={styles.input}
              type="text"
              value={hsnCode}
              onChange={(e) => setHsnCode(e.target.value)}
              placeholder="e.g. 2106"
              disabled={!enableHsn}
            />
          </label>

          <label className={styles.label}>
            GST Percentage
            <input
              className={styles.input}
              type="number"
              min="0"
              step="0.01"
              value={gstPercentage}
              onChange={(e) => setGstPercentage(e.target.value)}
              placeholder="e.g. 18"
              disabled={!enableGst}
            />
          </label>

          
        </div>

        <button className={styles.primaryButton} type="submit" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? "Updating..." : selectedItemIds.length > 0 ? "Apply to Selected Items" : "Apply to All Items of This Type"}
        </button>
      </form>

      {resultMsg && <div className={styles.note}>{resultMsg}</div>}

      {detailedItems.length > 0 && (
        <div className={styles.itemsPanel}>
          <div className={styles.sampleHeading}>Select Specific Items to Update (optional)</div>
          <ul className={styles.itemsList}>
            {detailedItems.slice(0, 50).map((it) => {
              const id = it._id || "";
              const checked = selectedItemIds.includes(id);
              return (
                <li key={id} className={styles.itemRow}>
                  <label className={styles.itemLabel}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (!id) return;
                        setSelectedItemIds((prev) => {
                          if (e.target.checked) {
                            return Array.from(new Set([...prev, id]));
                          }
                          return prev.filter((x) => x !== id);
                        });
                      }}
                    />
                    <span className={styles.sampleName}>{it.name || "—"}</span>
                  </label>
                  <span className={styles.sampleMeta}>HSN: {it.hsnCode || "—"}</span>
                  <span className={styles.sampleMeta}>GST%: {it.gstPercentage != null ? it.gstPercentage : "—"}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}


