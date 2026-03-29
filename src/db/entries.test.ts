import { describe, expect, test } from "bun:test"
import { listBowelEntries } from "@src/db/bowel-entries"
import { getDefaultDog, getDog } from "@src/db/dogs"
import { listRecentEntries } from "@src/db/entries"
import { listFoodEntries } from "@src/db/food-entries"
import { listHealthEntries } from "@src/db/health-entries"
import { formatDatetime, toUtcSqlite } from "@src/lib/dates"
import { useTestApp } from "@src/test/app"
import {
  createTestBowelEntry,
  createTestDog,
  createTestFoodEntry,
  createTestHealthEntry,
} from "@src/test/factories/entries"

useTestApp()

describe("dogs", () => {
  test("getDefaultDog creates a dog if none exists", () => {
    const dog = getDefaultDog()
    expect(dog.name).toBe("Dog")
    expect(dog.id).toBeTruthy()
  })

  test("getDefaultDog returns existing dog", () => {
    const created = createTestDog({ name: "Rex" })
    const dog = getDefaultDog()
    expect(dog.id).toBe(created.id)
    expect(dog.name).toBe("Rex")
  })

  test("getDog returns null for missing id", () => {
    expect(getDog("nonexistent")).toBeNull()
  })
})

describe("food entries", () => {
  test("create and list food entries", () => {
    const dog = createTestDog()
    createTestFoodEntry(dog.id, { food_name: "Chicken kibble" })
    createTestFoodEntry(dog.id, { food_name: "Dental treat", entry_kind: "treat" })

    const entries = listFoodEntries(dog.id)
    expect(entries).toHaveLength(2)
    expect(entries.map((e) => e.food_name)).toContain("Chicken kibble")
    expect(entries.map((e) => e.food_name)).toContain("Dental treat")
  })
})

describe("bowel entries", () => {
  test("create and list bowel entries", () => {
    const dog = createTestDog()
    const entry = createTestBowelEntry(dog.id, { consistency: 3, color: "dark brown" })

    expect(entry.consistency).toBe(3)
    expect(entry.color).toBe("dark brown")

    const entries = listBowelEntries(dog.id)
    expect(entries).toHaveLength(1)
  })

  test("boolean fields default to false", () => {
    const dog = createTestDog()
    const entry = createTestBowelEntry(dog.id)

    expect(entry.has_blood).toBe(0)
    expect(entry.has_mucus).toBe(0)
    expect(entry.straining).toBe(0)
  })
})

describe("health entries", () => {
  test("create and list health entries", () => {
    const dog = createTestDog()
    const entry = createTestHealthEntry(dog.id, { entry_type: "vomiting", severity: 4 })

    expect(entry.entry_type).toBe("vomiting")
    expect(entry.severity).toBe(4)

    const entries = listHealthEntries(dog.id)
    expect(entries).toHaveLength(1)
  })
})

describe("timeline entries", () => {
  test("listRecentEntries returns all types sorted by time", () => {
    const dog = createTestDog()
    createTestFoodEntry(dog.id, { meal_time: "2025-01-01 08:00:00" })
    createTestBowelEntry(dog.id, { occurred_at: "2025-01-01 09:00:00" })
    createTestHealthEntry(dog.id, { occurred_at: "2025-01-01 10:00:00" })

    const entries = listRecentEntries(dog.id)
    expect(entries).toHaveLength(3)
    // Most recent first
    expect(entries[0]!.entry_type).toBe("health")
    expect(entries[1]!.entry_type).toBe("bowel")
    expect(entries[2]!.entry_type).toBe("food")
  })

  test("listRecentEntries filters by type", () => {
    const dog = createTestDog()
    createTestFoodEntry(dog.id)
    createTestBowelEntry(dog.id)
    createTestHealthEntry(dog.id)

    const foodOnly = listRecentEntries(dog.id, 20, "food")
    expect(foodOnly).toHaveLength(1)
    expect(foodOnly[0]!.entry_type).toBe("food")
  })
})

describe("date parsing", () => {
  test("toUtcSqlite parses ISO 8601 with timezone offset", () => {
    // This is the format claude.ai sends: "2026-03-28T05:00:00-07:00"
    const result = toUtcSqlite("2026-03-28T05:00:00-07:00")
    expect(result).toBe("2026-03-28 12:00:00")
  })

  test("toUtcSqlite parses ISO 8601 with Z suffix", () => {
    const result = toUtcSqlite("2026-03-28T12:00:00Z")
    expect(result).toBe("2026-03-28 12:00:00")
  })

  test("toUtcSqlite parses SQLite datetime format", () => {
    const result = toUtcSqlite("2026-03-28 12:00:00")
    expect(result).toBe("2026-03-28 12:00:00")
  })

  test("toUtcSqlite parses ISO without timezone as UTC", () => {
    const result = toUtcSqlite("2026-03-28T12:00:00")
    expect(result).toBe("2026-03-28 12:00:00")
  })

  test("toUtcSqlite returns null for invalid input", () => {
    expect(toUtcSqlite("not a date")).toBeNull()
    expect(toUtcSqlite("")).toBeNull()
  })

  test("food entries store normalized UTC dates from ISO with offset", () => {
    const dog = createTestDog()
    const entry = createTestFoodEntry(dog.id, {
      meal_time: "2026-03-28T17:00:00-07:00",
    })
    // -07:00 offset means UTC is +7 hours = midnight UTC
    expect(entry.meal_time).toBe("2026-03-29 00:00:00")
  })

  test("bowel entries store normalized UTC dates from ISO with offset", () => {
    const dog = createTestDog()
    const entry = createTestBowelEntry(dog.id, {
      occurred_at: "2026-03-28T05:00:00-07:00",
    })
    expect(entry.occurred_at).toBe("2026-03-28 12:00:00")
  })

  test("health entries store normalized UTC dates from ISO with offset", () => {
    const dog = createTestDog()
    const entry = createTestHealthEntry(dog.id, {
      occurred_at: "2026-03-28T05:00:00-07:00",
    })
    expect(entry.occurred_at).toBe("2026-03-28 12:00:00")
  })

  test("formatDatetime renders valid output for UTC SQLite dates", () => {
    const result = formatDatetime("2026-03-28 12:00:00")
    expect(result).not.toBe("Invalid Date")
    // Should contain a time component
    expect(result).toMatch(/\d+:\d+/)
  })

  test("formatDatetime renders valid output for ISO with offset", () => {
    const result = formatDatetime("2026-03-28T05:00:00-07:00")
    expect(result).not.toBe("Invalid Date")
  })
})
