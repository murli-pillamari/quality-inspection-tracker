import { SORT_FIELDS } from "../constants.js";

function toInspection(row) {
  if (!row) return null;

  return {
    id: row.id,
    inspectionDate: row.inspection_date,
    machineLineId: row.machine_line_id,
    defectType: row.defect_type,
    severity: row.severity,
    remarks: row.remarks,
    status: row.status,
    resolutionNote: row.resolution_note,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at
  };
}

export function createInspectionsRepository(database) {
  function findById(id) {
    return toInspection(database.prepare("SELECT * FROM inspections WHERE id = ?").get(id));
  }

  function create(inspection) {
    const result = database.prepare(`
      INSERT INTO inspections (inspection_date, machine_line_id, defect_type, severity, remarks, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      inspection.inspectionDate,
      inspection.machineLineId,
      inspection.defectType,
      inspection.severity,
      inspection.remarks,
      new Date().toISOString()
    );
    return findById(Number(result.lastInsertRowid));
  }

  function list(filters) {
    const where = [];
    const values = [];
    if (filters.severity) { where.push("severity = ?"); values.push(filters.severity); }
    if (filters.status) { where.push("status = ?"); values.push(filters.status); }
    if (filters.from) { where.push("inspection_date >= ?"); values.push(filters.from); }
    if (filters.to) { where.push("inspection_date <= ?"); values.push(filters.to); }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const orderColumn = SORT_FIELDS[filters.sortBy];
    const rows = database.prepare(`
      SELECT * FROM inspections
      ${whereClause}
      ORDER BY ${orderColumn} ${filters.sortOrder.toUpperCase()}, id DESC
    `).all(...values);
    return rows.map(toInspection);
  }

  function resolve(id, resolutionNote) {
    database.prepare(`
      UPDATE inspections
      SET status = 'Resolved', resolution_note = ?, resolved_at = ?
      WHERE id = ?
    `).run(resolutionNote, new Date().toISOString(), id);
    return findById(id);
  }

  function summary() {
    const rows = database.prepare(`
      SELECT severity, status, COUNT(*) AS count
      FROM inspections
      GROUP BY severity, status
    `).all();

    return ["Critical", "Major", "Minor"].map((severity) => ({
      severity,
      open: rows.find((row) => row.severity === severity && row.status === "Open")?.count ?? 0,
      resolved: rows.find((row) => row.severity === severity && row.status === "Resolved")?.count ?? 0
    }));
  }

  return { create, findById, list, resolve, summary };
}
