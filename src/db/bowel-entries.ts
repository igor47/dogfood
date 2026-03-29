import { getDb } from "../db"
import { ulid } from "../lib/ids"

export interface BowelEntry {
  id: string
  dog_id: string
  consistency: number
  color: string | null
  has_blood: number
  has_mucus: number
  straining: number
  urgency: number
  occurred_at: string
  notes: string | null
  created_at: string
}

export function createBowelEntry(data: {
  dog_id: string
  consistency: number
  color?: string
  has_blood?: boolean
  has_mucus?: boolean
  straining?: boolean
  urgency?: number
  occurred_at?: string
  notes?: string
}): BowelEntry {
  const db = getDb()
  const id = ulid()
  db.run(
    `INSERT INTO bowel_entries (id, dog_id, consistency, color, has_blood, has_mucus, straining, urgency, occurred_at, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), ?)`,
    [
      id,
      data.dog_id,
      data.consistency,
      data.color ?? null,
      data.has_blood ? 1 : 0,
      data.has_mucus ? 1 : 0,
      data.straining ? 1 : 0,
      data.urgency ?? 0,
      data.occurred_at ?? null,
      data.notes ?? null,
    ]
  )
  return getBowelEntry(id)!
}

export function getBowelEntry(id: string): BowelEntry | null {
  const db = getDb()
  return db.query("SELECT * FROM bowel_entries WHERE id = ?").get(id) as BowelEntry | null
}

export function listBowelEntries(dogId: string, limit = 50): BowelEntry[] {
  const db = getDb()
  return db
    .query("SELECT * FROM bowel_entries WHERE dog_id = ? ORDER BY occurred_at DESC LIMIT ?")
    .all(dogId, limit) as BowelEntry[]
}

export function deleteBowelEntry(id: string): void {
  const db = getDb()
  db.run("DELETE FROM bowel_entries WHERE id = ?", [id])
}
