import { getDb } from "../db"
import { toUtcSqlite } from "../lib/dates"
import { ulid } from "../lib/ids"

export const EVENT_TYPES = [
  { value: "medication", label: "Medication" },
  { value: "vet_visit", label: "Vet Visit" },
  { value: "weight_check", label: "Weight Check" },
  { value: "grooming", label: "Grooming" },
  { value: "other", label: "Other" },
] as const

export type EventType = (typeof EVENT_TYPES)[number]["value"]

export interface EventEntry {
  id: string
  dog_id: string
  event_type: EventType
  occurred_at: string
  notes: string | null
  weight_kg: number | null
  medication_name: string | null
  medication_dose: string | null
  created_at: string
}

export function createEventEntry(data: {
  dog_id: string
  event_type: EventType
  occurred_at: string
  notes?: string
  weight_kg?: number
  medication_name?: string
  medication_dose?: string
}): EventEntry {
  const db = getDb()
  const id = ulid()
  db.run(
    `INSERT INTO event_entries (id, dog_id, event_type, occurred_at, notes, weight_kg, medication_name, medication_dose)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.dog_id,
      data.event_type,
      toUtcSqlite(data.occurred_at),
      data.notes ?? null,
      data.weight_kg ?? null,
      data.medication_name ?? null,
      data.medication_dose ?? null,
    ]
  )
  return getEventEntry(id)!
}

export function getEventEntry(id: string): EventEntry | null {
  const db = getDb()
  return db.query("SELECT * FROM event_entries WHERE id = ?").get(id) as EventEntry | null
}

export function listEventEntries(dogId: string, limit = 50): EventEntry[] {
  const db = getDb()
  return db
    .query("SELECT * FROM event_entries WHERE dog_id = ? ORDER BY occurred_at DESC LIMIT ?")
    .all(dogId, limit) as EventEntry[]
}

export function updateEventEntry(
  id: string,
  data: {
    event_type?: EventType
    occurred_at?: string
    notes?: string
    weight_kg?: number | null
    medication_name?: string | null
    medication_dose?: string | null
  }
): EventEntry | null {
  const db = getDb()
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (data.event_type !== undefined) {
    fields.push("event_type = ?")
    values.push(data.event_type)
  }
  if (data.occurred_at !== undefined) {
    fields.push("occurred_at = ?")
    values.push(toUtcSqlite(data.occurred_at))
  }
  if (data.notes !== undefined) {
    fields.push("notes = ?")
    values.push(data.notes || null)
  }
  if (data.weight_kg !== undefined) {
    fields.push("weight_kg = ?")
    values.push(data.weight_kg)
  }
  if (data.medication_name !== undefined) {
    fields.push("medication_name = ?")
    values.push(data.medication_name)
  }
  if (data.medication_dose !== undefined) {
    fields.push("medication_dose = ?")
    values.push(data.medication_dose)
  }

  if (fields.length === 0) return getEventEntry(id)

  values.push(id)
  db.run(`UPDATE event_entries SET ${fields.join(", ")} WHERE id = ?`, values)
  return getEventEntry(id)
}

export function deleteEventEntry(id: string): void {
  const db = getDb()
  db.run("DELETE FROM event_entries WHERE id = ?", [id])
}
