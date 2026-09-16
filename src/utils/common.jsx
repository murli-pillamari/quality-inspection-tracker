import { severityStyles } from "../constants";

export function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

export async function request(path, options) {
  const response = await fetch(path, options);
  if (response.status === 204) return null;
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message ?? "Something went wrong. Please try again.");
  return payload;
}

export function SeverityBadge({ severity }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${severityStyles[severity]}`}>{severity}</span>;
}

export function FieldLabel({ children, htmlFor }) {
  return <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-700">{children}</label>;
}
