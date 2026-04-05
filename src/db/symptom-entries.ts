import { getDb } from "../db"
import { toUtcSqlite } from "../lib/dates"
import { ulid } from "../lib/ids"

export const SYMPTOM_TYPES = [
  { value: "vomiting", label: "Vomiting" },
  { value: "diarrhea", label: "Diarrhea" },
  { value: "gas", label: "Gas / Flatulence" },
  { value: "appetite_change", label: "Appetite Change" },
  { value: "energy_level", label: "Energy Level" },
  { value: "skin_irritation", label: "Skin / Coat Irritation" },
  { value: "eye_ear_issue", label: "Eye / Ear Issue" },
  { value: "limping", label: "Limping" },
  { value: "anxiety", label: "Anxiety / Restlessness" },
  { value: "coughing_sneezing", label: "Coughing / Sneezing" },
  { value: "seizure", label: "Seizure" },
  { value: "other", label: "Other" },
] as const

export type SymptomType = (typeof SYMPTOM_TYPES)[number]["value"]

export const SEVERITY_LEVELS = [
  { value: 1, label: "1 — Mild / Low" },
  { value: 2, label: "2" },
  { value: 3, label: "3 — Moderate" },
  { value: 4, label: "4" },
  { value: 5, label: "5 — Severe / High" },
] as const

export type Severity = (typeof SEVERITY_LEVELS)[number]["value"]

export interface SymptomEntry {
  id: string
  dog_id: string
  symptom_type: SymptomType
  severity: Severity
  occurred_at: string
  notes: string | null
  created_at: string
}

export function createSymptomEntry(data: {
  dog_id: string
  symptom_type: SymptomType
  occurred_at: string
  severity?: Severity
  notes?: string
}): SymptomEntry {
  const db = getDb()
  const id = ulid()
  db.run(
    `INSERT INTO symptom_entries (id, dog_id, symptom_type, severity, occurred_at, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.dog_id,
      data.symptom_type,
      data.severity ?? 3,
      toUtcSqlite(data.occurred_at),
      data.notes ?? null,
    ]
  )
  return getSymptomEntry(id)!
}

export function getSymptomEntry(id: string): SymptomEntry | null {
  const db = getDb()
  return db.query("SELECT * FROM symptom_entries WHERE id = ?").get(id) as SymptomEntry | null
}

export function listSymptomEntries(dogId: string, limit = 50): SymptomEntry[] {
  const db = getDb()
  return db
    .query("SELECT * FROM symptom_entries WHERE dog_id = ? ORDER BY occurred_at DESC LIMIT ?")
    .all(dogId, limit) as SymptomEntry[]
}

export function updateSymptomEntry(
  id: string,
  data: {
    symptom_type?: SymptomType
    severity?: Severity
    occurred_at?: string
    notes?: string
  }
): SymptomEntry | null {
  const db = getDb()
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (data.symptom_type !== undefined) {
    fields.push("symptom_type = ?")
    values.push(data.symptom_type)
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

  if (fields.length === 0) return getSymptomEntry(id)

  values.push(id)
  db.run(`UPDATE symptom_entries SET ${fields.join(", ")} WHERE id = ?`, values)
  return getSymptomEntry(id)
}

export function deleteSymptomEntry(id: string): void {
  const db = getDb()
  db.run("DELETE FROM symptom_entries WHERE id = ?", [id])
}
