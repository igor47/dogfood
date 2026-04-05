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
  meal_time: string
  notes: string | null
  created_at: string
  calories: number | null
}

export function createFoodEntry(data: {
  dog_id: string
  food_name: string
  meal_time: string
  entry_kind?: EntryKind
  food_id?: string
  brand?: string
  food_type?: string
  amount?: string
  unit?: string
  quantity?: number
  notes?: string
}): FoodEntry {
  const db = getDb()
  const id = ulid()
  db.run(
    `INSERT INTO food_entries (id, dog_id, food_id, food_name, brand, food_type, entry_kind, amount, unit, quantity, meal_time, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      toUtcSqlite(data.meal_time),
      data.notes ?? null,
    ]
  )
  return getFoodEntry(id)!
}

const FOOD_ENTRY_SELECT = `
  SELECT food_entries.*,
    CAST(food_entries.quantity * foods.calories_per_unit AS INTEGER) AS calories
  FROM food_entries
  LEFT JOIN foods ON food_entries.food_id = foods.id
`

export function getFoodEntry(id: string): FoodEntry | null {
  const db = getDb()
  return db.query(`${FOOD_ENTRY_SELECT} WHERE food_entries.id = ?`).get(id) as FoodEntry | null
}

export function listFoodEntries(
  dogId: string,
  opts?: { limit?: number; kind?: EntryKind; after?: string; before?: string }
): FoodEntry[] {
  const db = getDb()
  const conditions = ["food_entries.dog_id = ?"]
  const params: (string | number)[] = [dogId]

  if (opts?.kind) {
    conditions.push("food_entries.entry_kind = ?")
    params.push(opts.kind)
  }
  if (opts?.after) {
    conditions.push("food_entries.meal_time >= ?")
    params.push(opts.after)
  }
  if (opts?.before) {
    conditions.push("food_entries.meal_time <= ?")
    params.push(opts.before)
  }

  params.push(opts?.limit ?? 50)
  return db
    .query(
      `${FOOD_ENTRY_SELECT} WHERE ${conditions.join(" AND ")} ORDER BY food_entries.meal_time DESC LIMIT ?`
    )
    .all(...params) as FoodEntry[]
}

export function updateFoodEntry(
  id: string,
  data: {
    food_id?: string
    food_name?: string
    entry_kind?: EntryKind
    quantity?: number
    unit?: string
    meal_time?: string
    notes?: string
  }
): FoodEntry | null {
  const db = getDb()
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (data.food_id !== undefined) {
    fields.push("food_id = ?")
    values.push(data.food_id)
  }
  if (data.food_name !== undefined) {
    fields.push("food_name = ?")
    values.push(data.food_name)
  }
  if (data.entry_kind !== undefined) {
    fields.push("entry_kind = ?")
    values.push(data.entry_kind)
  }
  if (data.quantity !== undefined) {
    fields.push("quantity = ?")
    values.push(data.quantity)
  }
  if (data.unit !== undefined) {
    fields.push("unit = ?")
    values.push(data.unit)
  }
  if (data.meal_time !== undefined) {
    fields.push("meal_time = ?")
    values.push(toUtcSqlite(data.meal_time))
  }
  if (data.notes !== undefined) {
    fields.push("notes = ?")
    values.push(data.notes || null)
  }

  if (fields.length === 0) return getFoodEntry(id)

  values.push(id)
  db.run(`UPDATE food_entries SET ${fields.join(", ")} WHERE id = ?`, values)
  return getFoodEntry(id)
}

export function deleteFoodEntry(id: string): void {
  const db = getDb()
  db.run("DELETE FROM food_entries WHERE id = ?", [id])
}
