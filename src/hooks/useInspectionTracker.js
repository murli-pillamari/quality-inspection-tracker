import { useEffect, useMemo, useState } from "react";
import { initialForm, initialFilters } from "../constants";
import { readPendingInspections, request, writePendingInspections } from "../utils/common";

export function useInspectionTracker() {
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [inspections, setInspections] = useState([]);
  const [summary, setSummary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resolving, setResolving] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [pendingInspections, setPendingInspections] = useState(() => readPendingInspections());

  const queryString = useMemo(() => {
    const query = new URLSearchParams();
    Object.entries(appliedFilters).forEach(([key, value]) => { if (value) query.set(key, value); });
    return query.toString();
  }, [appliedFilters]);

  async function loadDashboard() {
    setIsLoading(true); setError("");
    try {
      const [inspectionResponse, summaryResponse] = await Promise.all([
        request(`/api/inspections${queryString ? `?${queryString}` : ""}`),
        request("/api/inspections/summary"),
      ]);
      setInspections(inspectionResponse.data); setSummary(summaryResponse.data);
    } catch (loadError) { setError(loadError.message); } finally { setIsLoading(false); }
  }

  useEffect(() => { loadDashboard(); }, [queryString]);

  async function syncPendingInspections() {
    const queued = readPendingInspections();
    if (!queued.length || !navigator.onLine) return;

    const remaining = [];
    for (const queuedInspection of queued) {
      try {
        await request("/api/inspections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(queuedInspection.payload)
        });
      } catch {
        remaining.push(queuedInspection);
      }
    }

    writePendingInspections(remaining);
    setPendingInspections(remaining);
    if (remaining.length < queued.length) {
      const syncedCount = queued.length - remaining.length;
      setNotice(`${syncedCount} offline inspection${syncedCount === 1 ? "" : "s"} synced.`);
      await loadDashboard();
    }
  }

  useEffect(() => {
    syncPendingInspections();
    window.addEventListener("online", syncPendingInspections);
    return () => window.removeEventListener("online", syncPendingInspections);
  }, []);

  const updateForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const updateFilter = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));

  async function handleCreate(event) {
    event.preventDefault(); setIsSubmitting(true); setError(""); setNotice("");
    try {
      await request("/api/inspections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setForm(initialForm); setNotice("Inspection logged and added to the tracker."); await loadDashboard();
    } catch (submitError) {
      const isUnavailable = submitError.name === "TypeError" || [502, 503, 504].includes(submitError.status);
      if (!isUnavailable) {
        setError(submitError.message);
        return;
      }
      const queuedInspection = { localId: crypto.randomUUID(), payload: { ...form }, queuedAt: new Date().toISOString() };
      const queued = [...readPendingInspections(), queuedInspection];
      writePendingInspections(queued); setPendingInspections(queued); setForm(initialForm);
      setNotice("No connection. Inspection saved on this device and will sync automatically.");
    } finally { setIsSubmitting(false); }
  }

  async function handleResolve(event) {
    event.preventDefault(); if (!resolving) return; setIsSubmitting(true); setError("");
    try {
      await request(`/api/inspections/${resolving.id}/resolve`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resolutionNote }) });
      setNotice(`Inspection #${resolving.id} marked as resolved.`); setResolving(null); setResolutionNote(""); await loadDashboard();
    } catch (resolveError) { setError(resolveError.message); } finally { setIsSubmitting(false); }
  }

  const totalOpen = summary.reduce((total, item) => total + item.open, 0);
  const totalResolved = summary.reduce((total, item) => total + item.resolved, 0);

  return {
    form, filters, setFilters, setAppliedFilters, inspections, summary, pendingInspections,
    isLoading, isSubmitting, error, notice, resolving, setResolving,
    resolutionNote, setResolutionNote, totalOpen, totalResolved,
    updateForm, updateFilter, handleCreate, handleResolve,
  };
}