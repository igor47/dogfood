import { getDb } from "../db"
import { ulid } from "../lib/ids"

export interface FoodEntry {
  id: string
  dog_id: string
  food_name: string
  brand: string | null
  food_type: string
  amount: string | null
  unit: string | null
  meal_time: string
  notes: string | null
  created_at: string
}

export function createFoodEntry(data: {
  dog_id: string
  food_name: string
  brand?: string
  food_type?: string
  amount?: string
  unit?: string
  meal_time?: string
  notes?: string
}): FoodEntry {
  const db = getDb()
  const id = ulid()
  db.run(
    `INSERT INTO food_entries (id, dog_id, food_name, brand, food_type, amount, unit, meal_time, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), ?)`,
    [
      id,
      data.dog_id,
      data.food_name,
      data.brand ?? null,
      data.food_type ?? "kibble",
      data.amount ?? null,
      data.unit ?? null,
      data.meal_time ?? null,
      data.notes ?? null,
    ]
  )
  return getFoodEntry(id)!
}

export function getFoodEntry(id: string): FoodEntry | null {
  const db = getDb()
  return db.query("SELECT * FROM food_entries WHERE id = ?").get(id) as FoodEntry | null
}

export function listFoodEntries(dogId: string, limit = 50): FoodEntry[] {
  const db = getDb()
  return db
    .query("SELECT * FROM food_entries WHERE dog_id = ? ORDER BY meal_time DESC LIMIT ?")
    .all(dogId, limit) as FoodEntry[]
}

export function deleteFoodEntry(id: string): void {
  const db = getDb()
  db.run("DELETE FROM food_entries WHERE id = ?", [id])
}
