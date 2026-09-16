import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

const schema = `
  CREATE TABLE IF NOT EXISTS inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inspection_date TEXT NOT NULL,
    machine_line_id TEXT NOT NULL,
    defect_type TEXT NOT NULL CHECK (defect_type IN ('Weave Defect', 'Shade Variation', 'Hole/Tear', 'Count Deviation', 'Other')),
    severity TEXT NOT NULL CHECK (severity IN ('Critical', 'Major', 'Minor')),
    remarks TEXT,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved')),
    resolution_note TEXT,
    resolved_at TEXT,
    created_at TEXT NOT NULL,
    CHECK ((status = 'Open' AND resolution_note IS NULL AND resolved_at IS NULL) OR (status = 'Resolved' AND resolution_note IS NOT NULL AND resolved_at IS NOT NULL))
  );

  CREATE INDEX IF NOT EXISTS idx_inspections_filters
    ON inspections(status, severity, inspection_date);
`;

export function openDatabase(filename) {
  if (filename !== ":memory:") {
    mkdirSync(dirname(filename), { recursive: true });
  }

  const database = new DatabaseSync(filename);
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec(schema);
  return database;
}
