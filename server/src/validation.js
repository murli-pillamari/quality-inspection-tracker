import { DEFECT_TYPES, SEVERITIES, SORT_FIELDS, STATUSES } from "./constants.js";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function validateSapWebhook(input) {
  const errors = {};
  const payload = isPlainObject(input) ? input : {};
  const eventId = requiredText(payload.eventId, "eventId", errors);

  if (!isPlainObject(payload.inspection)) {
    errors.inspection = "Inspection must be an object.";
  }

  return { errors, value: { eventId, inspection: payload.inspection } };
}

function requiredText(value, field, errors) {
  if (typeof value !== "string" || value.trim() === "") {
    errors[field] = "This field is required.";
    return null;
  }
  return value.trim();
}

function isoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateInspection(input) {
  const errors = {};
  const payload = isPlainObject(input) ? input : {};
  const inspectionDate = requiredText(payload.inspectionDate, "inspectionDate", errors);
  const machineLineId = requiredText(payload.machineLineId, "machineLineId", errors);

  if (inspectionDate && !isoDate(inspectionDate)) {
    errors.inspectionDate = "Use a valid date in YYYY-MM-DD format.";
  }

  if (!DEFECT_TYPES.includes(payload.defectType)) {
    errors.defectType = `Choose one of: ${DEFECT_TYPES.join(", ")}.`;
  }

  if (!SEVERITIES.includes(payload.severity)) {
    errors.severity = `Choose one of: ${SEVERITIES.join(", ")}.`;
  }

  if (payload.remarks !== undefined && typeof payload.remarks !== "string") {
    errors.remarks = "Remarks must be text.";
  }

  return {
    errors,
    value: {
      inspectionDate,
      machineLineId,
      defectType: payload.defectType,
      severity: payload.severity,
      remarks: typeof payload.remarks === "string" && payload.remarks.trim() ? payload.remarks.trim() : null
    }
  };
}

export function validateResolution(input) {
  const errors = {};
  const payload = isPlainObject(input) ? input : {};
  const resolutionNote = requiredText(payload.resolutionNote, "resolutionNote", errors);
  return { errors, value: { resolutionNote } };
}

export function validateListFilters(params) {
  const errors = {};
  const severity = params.get("severity");
  const status = params.get("status");
  const from = params.get("from");
  const to = params.get("to");
  const sortBy = params.get("sortBy") ?? "inspectionDate";
  const sortOrder = (params.get("sortOrder") ?? "desc").toLowerCase();

  if (severity !== null && !SEVERITIES.includes(severity)) errors.severity = "Invalid severity.";
  if (status !== null && !STATUSES.includes(status)) errors.status = "Invalid status.";
  if (from !== null && !isoDate(from)) errors.from = "Use a valid YYYY-MM-DD date.";
  if (to !== null && !isoDate(to)) errors.to = "Use a valid YYYY-MM-DD date.";
  if (from && to && from > to) errors.dateRange = "The from date must not be after the to date.";
  if (!(sortBy in SORT_FIELDS)) errors.sortBy = `Choose one of: ${Object.keys(SORT_FIELDS).join(", ")}.`;
  if (!["asc", "desc"].includes(sortOrder)) errors.sortOrder = "Use asc or desc.";

  return { errors, value: { severity, status, from, to, sortBy, sortOrder } };
}
