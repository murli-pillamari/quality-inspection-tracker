export const defectTypes = ["Weave Defectt", "Shade Variation", "Hole/Tear", "Count Deviation", "Other"];
export const severities = ["Critical", "Major", "Minor"];
export const initialForm = { inspectionDate: new Date().toISOString().slice(0, 10), machineLineId: "", defectType: "Weave Defect", severity: "Major", remarks: "" };
export const initialFilters = { severity: "", status: "", from: "", to: "", sortBy: "inspectionDate", sortOrder: "desc" };
export const severityStyles = { Critical: "bg-rose-100 text-rose-700 ring-rose-200", Major: "bg-amber-100 text-amber-700 ring-amber-200", Minor: "bg-sky-100 text-sky-700 ring-sky-200" };
