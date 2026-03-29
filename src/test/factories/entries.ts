import type { BowelColor, Consistency } from "@src/db/bowel-entries"
import { createBowelEntry } from "@src/db/bowel-entries"
import { createDog } from "@src/db/dogs"
import type { EntryKind } from "@src/db/food-entries"
import { createFoodEntry } from "@src/db/food-entries"
import type { FoodCategory } from "@src/db/foods"
import { createFood } from "@src/db/foods"
import type { HealthEntryType, Severity } from "@src/db/health-entries"
import { createHealthEntry } from "@src/db/health-entries"

export function createTestDog(overrides?: { name?: string; breed?: string }) {
  return createDog(overrides?.name ?? "Fido", {
    breed: overrides?.breed ?? "Mixed",
  })
}

export function createTestFood(overrides?: {
  name?: string
  category?: FoodCategory
  unit?: string
  calories_per_unit?: number
}) {
  return createFood({
    name: overrides?.name ?? "Test Kibble",
    category: overrides?.category ?? "meal",
    unit: overrides?.unit ?? "cups",
    calories_per_unit: overrides?.calories_per_unit ?? 350,
  })
}

export function createTestFoodEntry(
  dogId: string,
  overrides?: {
    food_name?: string
    entry_kind?: EntryKind
    food_id?: string
    quantity?: number
    meal_time?: string
  }
) {
  return createFoodEntry({
    dog_id: dogId,
    food_name: overrides?.food_name ?? "Kibble",
    entry_kind: overrides?.entry_kind ?? "meal",
    food_id: overrides?.food_id,
    quantity: overrides?.quantity,
    meal_time: overrides?.meal_time,
  })
}

export function createTestBowelEntry(
  dogId: string,
  overrides?: { consistency?: Consistency; color?: BowelColor; occurred_at?: string }
) {
  return createBowelEntry({
    dog_id: dogId,
    consistency: overrides?.consistency ?? 4,
    color: overrides?.color ?? "brown",
    occurred_at: overrides?.occurred_at,
  })
}

export function createTestHealthEntry(
  dogId: string,
  overrides?: { entry_type?: HealthEntryType; severity?: Severity; occurred_at?: string }
) {
  return createHealthEntry({
    dog_id: dogId,
    entry_type: overrides?.entry_type ?? "energy",
    severity: overrides?.severity ?? 3,
    occurred_at: overrides?.occurred_at,
  })
}
