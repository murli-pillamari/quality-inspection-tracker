import { severityStyles } from "../constants";

export const PENDING_INSPECTIONS_KEY = "quality_tracker_pending_inspections";

export function readPendingInspections() {
  try {
    const value = localStorage.getItem(PENDING_INSPECTIONS_KEY);
    const records = value ? JSON.parse(value) : [];
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

export function writePendingInspections(records) {
  localStorage.setItem(PENDING_INSPECTIONS_KEY, JSON.stringify(records));
}

export function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

export async function request(path, options) {
  const response = await fetch(path, options);
  if (response.status === 204) return null;
  const responseText = await response.text();
  let payload = null;
  try { payload = responseText ? JSON.parse(responseText) : null; } catch { payload = null; }
  if (!response.ok) {
    const error = new Error(payload?.error?.message ?? `Request failed with status ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

export function SeverityBadge({ severity }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${severityStyles[severity]}`}>{severity}</span>;
}

export function FieldLabel({ children, htmlFor }) {
  return <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-700">{children}</label>;
}
