import { getDb } from "../db"
import { ulid } from "../lib/ids"

export const FOOD_CATEGORIES = [
  { value: "meal", label: "Meal" },
  { value: "treat", label: "Treat" },
] as const

export type FoodCategory = (typeof FOOD_CATEGORIES)[number]["value"]

export interface Food {
  id: string
  name: string
  brand: string | null
  category: FoodCategory
  unit: string
  calories_per_unit: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export function createFood(data: {
  name: string
  brand?: string
  category?: FoodCategory
  unit?: string
  calories_per_unit?: number
  notes?: string
}): Food {
  const db = getDb()
  const id = ulid()
  db.run(
    `INSERT INTO foods (id, name, brand, category, unit, calories_per_unit, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.brand ?? null,
      data.category ?? "meal",
      data.unit ?? "cups",
      data.calories_per_unit ?? null,
      data.notes ?? null,
    ]
  )
  return getFood(id)!
}

export function getFood(id: string): Food | null {
  const db = getDb()
  return db.query("SELECT * FROM foods WHERE id = ?").get(id) as Food | null
}

export function listFoods(category?: FoodCategory): Food[] {
  const db = getDb()
  if (category) {
    return db
      .query("SELECT * FROM foods WHERE category = ? ORDER BY name ASC")
      .all(category) as Food[]
  }
  return db.query("SELECT * FROM foods ORDER BY category ASC, name ASC").all() as Food[]
}

export function updateFood(
  id: string,
  data: {
    name?: string
    brand?: string
    category?: FoodCategory
    unit?: string
    calories_per_unit?: number
    notes?: string
  }
): Food | null {
  const db = getDb()
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (data.name !== undefined) {
    fields.push("name = ?")
    values.push(data.name)
  }
  if (data.brand !== undefined) {
    fields.push("brand = ?")
    values.push(data.brand)
  }
  if (data.category !== undefined) {
    fields.push("category = ?")
    values.push(data.category)
  }
  if (data.unit !== undefined) {
    fields.push("unit = ?")
    values.push(data.unit)
  }
  if (data.calories_per_unit !== undefined) {
    fields.push("calories_per_unit = ?")
    values.push(data.calories_per_unit)
  }
  if (data.notes !== undefined) {
    fields.push("notes = ?")
    values.push(data.notes)
  }

  if (fields.length === 0) return getFood(id)

  fields.push("updated_at = datetime('now')")
  values.push(id)
  db.run(`UPDATE foods SET ${fields.join(", ")} WHERE id = ?`, values)
  return getFood(id)
}

export function deleteFood(id: string): void {
  const db = getDb()
  db.run("DELETE FROM foods WHERE id = ?", [id])
}
