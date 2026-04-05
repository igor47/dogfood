import { getDb } from "../db"
import { toUtcSqlite } from "../lib/dates"
import { ulid } from "../lib/ids"

export const HEALTH_ENTRY_TYPES = [
  { value: "energy", label: "Energy Level" },
  { value: "activity", label: "Activity Level" },
  { value: "vomiting", label: "Vomiting" },
  { value: "gas", label: "Gas / Flatulence" },
  { value: "appetite_change", label: "Appetite Change" },
  { value: "lethargy", label: "Lethargy" },
  { value: "water_intake", label: "Water Intake" },
  { value: "weight", label: "Weight Check" },
  { value: "medication", label: "Medication" },
  { value: "vet_visit", label: "Vet Visit" },
  { value: "other", label: "Other" },
] as const

export type HealthEntryType = (typeof HEALTH_ENTRY_TYPES)[number]["value"]

export const SEVERITY_LEVELS = [
  { value: 1, label: "1 — Mild / Low" },
  { value: 2, label: "2" },
  { value: 3, label: "3 — Moderate" },
  { value: 4, label: "4" },
  { value: 5, label: "5 — Severe / High" },
] as const

export type Severity = (typeof SEVERITY_LEVELS)[number]["value"]

export interface HealthEntry {
  id: string
  dog_id: string
  entry_type: HealthEntryType
  severity: Severity
  occurred_at: string
  notes: string | null
  created_at: string
}

export function createHealthEntry(data: {
  dog_id: string
  entry_type: HealthEntryType
  occurred_at: string
  severity?: Severity
  notes?: string
}): HealthEntry {
  const db = getDb()
  const id = ulid()
  db.run(
    `INSERT INTO health_entries (id, dog_id, entry_type, severity, occurred_at, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.dog_id,
      data.entry_type,
      data.severity ?? 1,
      toUtcSqlite(data.occurred_at),
      data.notes ?? null,
    ]
  )
  return getHealthEntry(id)!
}

export function getHealthEntry(id: string): HealthEntry | null {
  const db = getDb()
  return db.query("SELECT * FROM health_entries WHERE id = ?").get(id) as HealthEntry | null
}

export function listHealthEntries(dogId: string, limit = 50): HealthEntry[] {
  const db = getDb()
  return db
    .query("SELECT * FROM health_entries WHERE dog_id = ? ORDER BY occurred_at DESC LIMIT ?")
    .all(dogId, limit) as HealthEntry[]
}

export function updateHealthEntry(
  id: string,
  data: {
    entry_type?: HealthEntryType
    severity?: Severity
    occurred_at?: string
    notes?: string
  }
): HealthEntry | null {
  const db = getDb()
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (data.entry_type !== undefined) {
    fields.push("entry_type = ?")
    values.push(data.entry_type)
  }
  if (data.severity !== undefined) {
    fields.push("severity = ?")
    values.push(data.severity)
  }
  if (data.occurred_at !== undefined) {
    fields.push("occurred_at = ?")
    values.push(toUtcSqlite(data.occurred_at))
  }
  if (data.notes !== undefined) {
    fields.push("notes = ?")
    values.push(data.notes || null)
  }

  if (fields.length === 0) return getHealthEntry(id)

  values.push(id)
  db.run(`UPDATE health_entries SET ${fields.join(", ")} WHERE id = ?`, values)
  return getHealthEntry(id)
}

export function deleteHealthEntry(id: string): void {
  const db = getDb()
  db.run("DELETE FROM health_entries WHERE id = ?", [id])
}
