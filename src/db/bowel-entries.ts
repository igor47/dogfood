import { getDb } from "../db"
import { toUtcSqlite } from "../lib/dates"
import { ulid } from "../lib/ids"

export const CONSISTENCY_SCALE = [
  { value: 1, label: "Hard pellets" },
  { value: 2, label: "Lumpy, sausage-shaped" },
  { value: 3, label: "Sausage with cracks" },
  { value: 4, label: "Smooth, soft sausage" },
  { value: 5, label: "Soft blobs" },
  { value: 6, label: "Mushy, no solid pieces" },
  { value: 7, label: "Liquid, no solid pieces" },
] as const

export type Consistency = (typeof CONSISTENCY_SCALE)[number]["value"]

export const BOWEL_COLORS = [
  { value: "brown", label: "Brown" },
  { value: "dark brown", label: "Dark Brown" },
  { value: "light brown", label: "Light Brown" },
  { value: "yellow", label: "Yellow" },
  { value: "green", label: "Green" },
  { value: "black", label: "Black" },
  { value: "red", label: "Red" },
  { value: "orange", label: "Orange" },
] as const

export type BowelColor = (typeof BOWEL_COLORS)[number]["value"]

export const URGENCY_LEVELS = [
  { value: 0, label: "Normal" },
  { value: 1, label: "Somewhat urgent" },
  { value: 2, label: "Very urgent" },
] as const

export type Urgency = (typeof URGENCY_LEVELS)[number]["value"]

export interface BowelEntry {
  id: string
  dog_id: string
  consistency: Consistency
  color: BowelColor | null
  has_blood: number
  has_mucus: number
  straining: number
  urgency: Urgency
  occurred_at: string
  notes: string | null
  created_at: string
}

export function createBowelEntry(data: {
  dog_id: string
  consistency: Consistency
  color?: BowelColor
  has_blood?: boolean
  has_mucus?: boolean
  straining?: boolean
  urgency?: Urgency
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
      data.occurred_at ? toUtcSqlite(data.occurred_at) : null,
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
