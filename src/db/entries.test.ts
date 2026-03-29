import { describe, expect, test } from "bun:test"
import { listBowelEntries } from "@src/db/bowel-entries"
import { getDefaultDog, getDog } from "@src/db/dogs"
import { listRecentEntries } from "@src/db/entries"
import { listFoodEntries } from "@src/db/food-entries"
import { listHealthEntries } from "@src/db/health-entries"
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
    createTestFoodEntry(dog.id, { food_name: "Dental treat", food_type: "treat" })

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
