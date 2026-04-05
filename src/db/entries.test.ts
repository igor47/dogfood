import { describe, expect, test } from "bun:test"
import { config } from "@src/config"
import { listBowelEntries } from "@src/db/bowel-entries"
import { getDefaultDog, getDog } from "@src/db/dogs"
import { listEventEntries } from "@src/db/event-entries"
import { createFoodEntry, getFoodEntry, listFoodEntries } from "@src/db/food-entries"
import { createFood, updateFood } from "@src/db/foods"
import { listSymptomEntries } from "@src/db/symptom-entries"
import { formatDatetime, toUtcSqlite } from "@src/lib/dates"
import { listRecentEntries } from "@src/services/listEntries"
import { useTestApp } from "@src/test/app"
import {
  createTestBowelEntry,
  createTestDog,
  createTestEventEntry,
  createTestFoodEntry,
  createTestSymptomEntry,
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

describe("symptom entries", () => {
  test("create and list symptom entries", () => {
    const dog = createTestDog()
    const entry = createTestSymptomEntry(dog.id, { symptom_type: "vomiting", severity: 4 })

    expect(entry.symptom_type).toBe("vomiting")
    expect(entry.severity).toBe(4)

    const entries = listSymptomEntries(dog.id)
    expect(entries).toHaveLength(1)
  })
})

describe("event entries", () => {
  test("create and list event entries", () => {
    const dog = createTestDog()
    const entry = createTestEventEntry(dog.id, { event_type: "vet_visit" })

    expect(entry.event_type).toBe("vet_visit")

    const entries = listEventEntries(dog.id)
    expect(entries).toHaveLength(1)
  })

  test("stores event-specific fields", () => {
    const dog = createTestDog()
    const entry = createTestEventEntry(dog.id, {
      event_type: "medication",
      medication_name: "Apoquel",
      medication_dose: "16mg daily",
    })

    expect(entry.medication_name).toBe("Apoquel")
    expect(entry.medication_dose).toBe("16mg daily")
    expect(entry.weight_kg).toBeNull()
  })

  test("stores weight for weight_check", () => {
    const dog = createTestDog()
    const entry = createTestEventEntry(dog.id, {
      event_type: "weight_check",
      weight_kg: 25.5,
    })

    expect(entry.weight_kg).toBe(25.5)
  })
})

describe("timeline entries", () => {
  test("listRecentEntries returns all types sorted by time", () => {
    const dog = createTestDog()
    createTestFoodEntry(dog.id, { meal_time: "2025-01-01 08:00:00" })
    createTestBowelEntry(dog.id, { occurred_at: "2025-01-01 09:00:00" })
    createTestSymptomEntry(dog.id, { occurred_at: "2025-01-01 10:00:00" })
    createTestEventEntry(dog.id, { occurred_at: "2025-01-01 11:00:00" })

    const entries = listRecentEntries(dog.id)
    expect(entries).toHaveLength(4)
    // Most recent first
    expect(entries[0]!.entry_type).toBe("event")
    expect(entries[1]!.entry_type).toBe("symptom")
    expect(entries[2]!.entry_type).toBe("bowel")
    expect(entries[3]!.entry_type).toBe("food")
  })

  test("listRecentEntries filters by type", () => {
    const dog = createTestDog()
    createTestFoodEntry(dog.id)
    createTestBowelEntry(dog.id)
    createTestSymptomEntry(dog.id)
    createTestEventEntry(dog.id)

    const foodOnly = listRecentEntries(dog.id, 20, "food")
    expect(foodOnly).toHaveLength(1)
    expect(foodOnly[0]!.entry_type).toBe("food")

    const symptomOnly = listRecentEntries(dog.id, 20, "symptom")
    expect(symptomOnly).toHaveLength(1)
    expect(symptomOnly[0]!.entry_type).toBe("symptom")
  })
})

describe("computed calories", () => {
  test("getFoodEntry computes calories from food catalog", () => {
    const dog = createTestDog()
    const food = createFood({ name: "Kibble", unit: "cups", calories_per_unit: 350 })
    const entry = createTestFoodEntry(dog.id, { food_id: food.id, quantity: 1.5 })

    const fetched = getFoodEntry(entry.id)!
    expect(fetched.calories).toBe(525)
  })

  test("getFoodEntry returns null calories when no food_id", () => {
    const dog = createTestDog()
    const entry = createFoodEntry({
      dog_id: dog.id,
      food_name: "Random treat",
      entry_kind: "treat",
      meal_time: new Date().toISOString(),
    })

    const fetched = getFoodEntry(entry.id)!
    expect(fetched.calories).toBeNull()
  })

  test("calories update when food calories_per_unit changes", () => {
    const dog = createTestDog()
    const food = createFood({ name: "Kibble", unit: "cups", calories_per_unit: 350 })
    const entry = createTestFoodEntry(dog.id, { food_id: food.id, quantity: 1 })

    expect(getFoodEntry(entry.id)!.calories).toBe(350)

    updateFood(food.id, { calories_per_unit: 400 })
    expect(getFoodEntry(entry.id)!.calories).toBe(400)
  })

  test("listFoodEntries includes computed calories", () => {
    const dog = createTestDog()
    const food = createFood({ name: "Kibble", unit: "cups", calories_per_unit: 350 })
    createTestFoodEntry(dog.id, { food_id: food.id, quantity: 2 })

    const entries = listFoodEntries(dog.id)
    expect(entries[0]!.calories).toBe(700)
  })

  test("timeline summary includes computed calories", () => {
    const dog = createTestDog()
    const food = createFood({ name: "Kibble", unit: "cups", calories_per_unit: 350 })
    createTestFoodEntry(dog.id, { food_id: food.id, quantity: 1 })

    const entries = listRecentEntries(dog.id, 10, "food")
    expect(entries[0]!.summary).toContain("350 cal")
  })
})

describe("date parsing", () => {
  function withDisplayTz(tz: string, fn: () => void) {
    const original = config.displayTz
    ;(config as any).displayTz = tz
    try {
      fn()
    } finally {
      ;(config as any).displayTz = original
    }
  }

  test("explicit offset: ISO with -07:00 converts to UTC", () => {
    const result = toUtcSqlite("2026-03-28T05:00:00-07:00")
    expect(result).toBe("2026-03-28 12:00:00")
  })

  test("explicit offset: ISO with Z stays UTC", () => {
    const result = toUtcSqlite("2026-03-28T12:00:00Z")
    expect(result).toBe("2026-03-28 12:00:00")
  })

  test("naive ISO with DISPLAY_TZ=UTC treats as UTC", () => {
    withDisplayTz("UTC", () => {
      const result = toUtcSqlite("2026-03-28T12:00:00")
      expect(result).toBe("2026-03-28 12:00:00")
    })
  })

  test("naive ISO with DISPLAY_TZ=America/Los_Angeles converts to UTC", () => {
    withDisplayTz("America/Los_Angeles", () => {
      // 4pm Pacific (PDT, UTC-7) = 11pm UTC
      const result = toUtcSqlite("2026-03-28T16:00:00")
      expect(result).toBe("2026-03-28 23:00:00")
    })
  })

  test("naive SQL format with DISPLAY_TZ=America/New_York converts to UTC", () => {
    withDisplayTz("America/New_York", () => {
      // noon Eastern (EDT, UTC-4) = 4pm UTC
      const result = toUtcSqlite("2026-03-28 12:00:00")
      expect(result).toBe("2026-03-28 16:00:00")
    })
  })

  test("explicit offset is respected regardless of DISPLAY_TZ", () => {
    withDisplayTz("America/Los_Angeles", () => {
      // Explicit +05:30 should not be affected by DISPLAY_TZ
      const result = toUtcSqlite("2026-03-28T12:00:00+05:30")
      expect(result).toBe("2026-03-28 06:30:00")
    })
  })

  test("returns null for invalid input", () => {
    expect(toUtcSqlite("not a date")).toBeNull()
    expect(toUtcSqlite("")).toBeNull()
  })

  test("food entries store normalized UTC dates from ISO with offset", () => {
    const dog = createTestDog()
    const entry = createTestFoodEntry(dog.id, {
      meal_time: "2026-03-28T17:00:00-07:00",
    })
    expect(entry.meal_time).toBe("2026-03-29 00:00:00")
  })

  test("bowel entries store normalized UTC dates from ISO with offset", () => {
    const dog = createTestDog()
    const entry = createTestBowelEntry(dog.id, {
      occurred_at: "2026-03-28T05:00:00-07:00",
    })
    expect(entry.occurred_at).toBe("2026-03-28 12:00:00")
  })

  test("symptom entries store normalized UTC dates from ISO with offset", () => {
    const dog = createTestDog()
    const entry = createTestSymptomEntry(dog.id, {
      occurred_at: "2026-03-28T05:00:00-07:00",
    })
    expect(entry.occurred_at).toBe("2026-03-28 12:00:00")
  })

  test("event entries store normalized UTC dates from ISO with offset", () => {
    const dog = createTestDog()
    const entry = createTestEventEntry(dog.id, {
      occurred_at: "2026-03-28T05:00:00-07:00",
    })
    expect(entry.occurred_at).toBe("2026-03-28 12:00:00")
  })

  test("formatDatetime renders valid output", () => {
    const result = formatDatetime("2026-03-28 12:00:00")
    expect(result).not.toBe("Invalid Date")
    expect(result).toMatch(/\d+:\d+/)
  })
})
