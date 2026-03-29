import { getDb } from "../db"
import { ulid } from "../lib/ids"

export interface Dog {
  id: string
  name: string
  breed: string | null
  birth_date: string | null
  weight_kg: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export function createDog(
  name: string,
  opts?: { breed?: string; birth_date?: string; weight_kg?: number; notes?: string }
): Dog {
  const db = getDb()
  const id = ulid()
  db.run(
    "INSERT INTO dogs (id, name, breed, birth_date, weight_kg, notes) VALUES (?, ?, ?, ?, ?, ?)",
    [
      id,
      name,
      opts?.breed ?? null,
      opts?.birth_date ?? null,
      opts?.weight_kg ?? null,
      opts?.notes ?? null,
    ]
  )
  return getDog(id)!
}

export function getDog(id: string): Dog | null {
  const db = getDb()
  return db.query("SELECT * FROM dogs WHERE id = ?").get(id) as Dog | null
}

export function getDefaultDog(): Dog {
  const db = getDb()
  const existing = db
    .query("SELECT * FROM dogs ORDER BY created_at ASC LIMIT 1")
    .get() as Dog | null
  if (existing) return existing
  return createDog("Dog")
}

export function updateDog(
  id: string,
  data: { name?: string; breed?: string; birth_date?: string; weight_kg?: number; notes?: string }
): Dog | null {
  const db = getDb()
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (data.name !== undefined) {
    fields.push("name = ?")
    values.push(data.name)
  }
  if (data.breed !== undefined) {
    fields.push("breed = ?")
    values.push(data.breed)
  }
  if (data.birth_date !== undefined) {
    fields.push("birth_date = ?")
    values.push(data.birth_date)
  }
  if (data.weight_kg !== undefined) {
    fields.push("weight_kg = ?")
    values.push(data.weight_kg)
  }
  if (data.notes !== undefined) {
    fields.push("notes = ?")
    values.push(data.notes)
  }

  if (fields.length === 0) return getDog(id)

  fields.push("updated_at = datetime('now')")
  values.push(id)
  db.run(`UPDATE dogs SET ${fields.join(", ")} WHERE id = ?`, values)
  return getDog(id)
}
