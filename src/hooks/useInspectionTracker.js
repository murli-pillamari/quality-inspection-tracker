import { useEffect, useMemo, useState } from "react";
import { initialForm, initialFilters } from "../constants";
import { request } from "../utils/common";

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

  const updateForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const updateFilter = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));

  async function handleCreate(event) {
    event.preventDefault(); setIsSubmitting(true); setError(""); setNotice("");
    try {
      await request("/api/inspections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setForm(initialForm); setNotice("Inspection logged and added to the tracker."); await loadDashboard();
    } catch (submitError) { setError(submitError.message); } finally { setIsSubmitting(false); }
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
    form, filters, setFilters, setAppliedFilters, inspections, summary,
    isLoading, isSubmitting, error, notice, resolving, setResolving,
    resolutionNote, setResolutionNote, totalOpen, totalResolved,
    updateForm, updateFilter, handleCreate, handleResolve,
  };
}