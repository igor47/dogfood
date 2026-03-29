/**
 * One-off script to fix dates in the database that were stored with timezone offsets
 * instead of normalized UTC format.
 *
 * Usage: bun scripts/fix-dates.ts [path-to-db]
 * Default db path: ./data/db/dogfood.db
 */
import { Database } from "bun:sqlite"
import { toUtcSqlite } from "../src/lib/dates"

const dbPath = process.argv[2] || "./data/db/dogfood.db"
console.log(`Fixing dates in ${dbPath}`)

const db = new Database(dbPath)

const tables = [
  { table: "food_entries", column: "meal_time" },
  { table: "bowel_entries", column: "occurred_at" },
  { table: "health_entries", column: "occurred_at" },
]

let totalFixed = 0

for (const { table, column } of tables) {
  const rows = db.query(`SELECT id, ${column} FROM ${table}`).all() as Array<{
    id: string
    [key: string]: string
  }>

  let fixed = 0
  for (const row of rows) {
    const original = row[column]!
    // Skip if already in SQLite format (YYYY-MM-DD HH:MM:SS)
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(original)) continue

    const normalized = toUtcSqlite(original)
    if (!normalized) {
      console.warn(`  Could not parse ${table}.${column} for id=${row.id}: "${original}"`)
      continue
    }

    db.run(`UPDATE ${table} SET ${column} = ? WHERE id = ?`, [normalized, row.id])
    console.log(`  ${table} id=${row.id}: "${original}" -> "${normalized}"`)
    fixed++
  }

  console.log(`${table}.${column}: fixed ${fixed}/${rows.length} rows`)
  totalFixed += fixed
}

console.log(`Done. Fixed ${totalFixed} total rows.`)
db.close()
