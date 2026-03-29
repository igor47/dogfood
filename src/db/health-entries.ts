import { getDb } from "../db"
import { ulid } from "../lib/ids"

export interface HealthEntry {
  id: string
  dog_id: string
  entry_type: string
  severity: number
  occurred_at: string
  notes: string | null
  created_at: string
}

export function createHealthEntry(data: {
  dog_id: string
  entry_type: string
  severity?: number
  occurred_at?: string
  notes?: string
}): HealthEntry {
  const db = getDb()
  const id = ulid()
  db.run(
    `INSERT INTO health_entries (id, dog_id, entry_type, severity, occurred_at, notes)
     VALUES (?, ?, ?, ?, COALESCE(?, datetime('now')), ?)`,
    [
      id,
      data.dog_id,
      data.entry_type,
      data.severity ?? 1,
      data.occurred_at ?? null,
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

export function deleteHealthEntry(id: string): void {
  const db = getDb()
  db.run("DELETE FROM health_entries WHERE id = ?", [id])
}
