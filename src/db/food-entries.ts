import { getDb } from "../db"
import { toUtcSqlite } from "../lib/dates"
import { ulid } from "../lib/ids"

export const ENTRY_KINDS = [
  { value: "meal", label: "Meal" },
  { value: "treat", label: "Treat" },
] as const

export type EntryKind = (typeof ENTRY_KINDS)[number]["value"]

export interface FoodEntry {
  id: string
  dog_id: string
  food_id: string | null
  food_name: string
  brand: string | null
  food_type: string
  entry_kind: EntryKind
  amount: string | null
  unit: string | null
  quantity: number | null
  calories: number | null
  meal_time: string
  notes: string | null
  created_at: string
}

export function createFoodEntry(data: {
  dog_id: string
  food_name: string
  entry_kind?: EntryKind
  food_id?: string
  brand?: string
  food_type?: string
  amount?: string
  unit?: string
  quantity?: number
  calories?: number
  meal_time?: string
  notes?: string
}): FoodEntry {
  const db = getDb()
  const id = ulid()
  db.run(
    `INSERT INTO food_entries (id, dog_id, food_id, food_name, brand, food_type, entry_kind, amount, unit, quantity, calories, meal_time, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), ?)`,
    [
      id,
      data.dog_id,
      data.food_id ?? null,
      data.food_name,
      data.brand ?? null,
      data.food_type ?? "kibble",
      data.entry_kind ?? "meal",
      data.amount ?? null,
      data.unit ?? null,
      data.quantity ?? null,
      data.calories ?? null,
      data.meal_time ? toUtcSqlite(data.meal_time) : null,
      data.notes ?? null,
    ]
  )
  return getFoodEntry(id)!
}

export function getFoodEntry(id: string): FoodEntry | null {
  const db = getDb()
  return db.query("SELECT * FROM food_entries WHERE id = ?").get(id) as FoodEntry | null
}

export function listFoodEntries(dogId: string, limit = 50, kind?: EntryKind): FoodEntry[] {
  const db = getDb()
  if (kind) {
    return db
      .query(
        "SELECT * FROM food_entries WHERE dog_id = ? AND entry_kind = ? ORDER BY meal_time DESC LIMIT ?"
      )
      .all(dogId, kind, limit) as FoodEntry[]
  }
  return db
    .query("SELECT * FROM food_entries WHERE dog_id = ? ORDER BY meal_time DESC LIMIT ?")
    .all(dogId, limit) as FoodEntry[]
}

export function deleteFoodEntry(id: string): void {
  const db = getDb()
  db.run("DELETE FROM food_entries WHERE id = ?", [id])
}
