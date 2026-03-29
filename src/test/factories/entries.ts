import type { BowelColor, Consistency } from "@src/db/bowel-entries"
import { createBowelEntry } from "@src/db/bowel-entries"
import { createDog } from "@src/db/dogs"
import type { FoodType } from "@src/db/food-entries"
import { createFoodEntry } from "@src/db/food-entries"
import type { HealthEntryType, Severity } from "@src/db/health-entries"
import { createHealthEntry } from "@src/db/health-entries"

export function createTestDog(overrides?: { name?: string; breed?: string }) {
  return createDog(overrides?.name ?? "Fido", {
    breed: overrides?.breed ?? "Mixed",
  })
}

export function createTestFoodEntry(
  dogId: string,
  overrides?: { food_name?: string; food_type?: FoodType; amount?: string; meal_time?: string }
) {
  return createFoodEntry({
    dog_id: dogId,
    food_name: overrides?.food_name ?? "Kibble",
    food_type: overrides?.food_type ?? "kibble",
    amount: overrides?.amount ?? "1 cup",
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
