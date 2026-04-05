import type { BowelColor, Consistency } from "@src/db/bowel-entries"
import { createBowelEntry } from "@src/db/bowel-entries"
import { createDog } from "@src/db/dogs"
import type { EventType } from "@src/db/event-entries"
import { createEventEntry } from "@src/db/event-entries"
import type { EntryKind } from "@src/db/food-entries"
import { createFoodEntry } from "@src/db/food-entries"
import type { FoodCategory } from "@src/db/foods"
import { createFood } from "@src/db/foods"
import type { Severity, SymptomType } from "@src/db/symptom-entries"
import { createSymptomEntry } from "@src/db/symptom-entries"

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
    meal_time: overrides?.meal_time ?? new Date().toISOString(),
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
    occurred_at: overrides?.occurred_at ?? new Date().toISOString(),
  })
}

export function createTestSymptomEntry(
  dogId: string,
  overrides?: { symptom_type?: SymptomType; severity?: Severity; occurred_at?: string }
) {
  return createSymptomEntry({
    dog_id: dogId,
    symptom_type: overrides?.symptom_type ?? "vomiting",
    severity: overrides?.severity ?? 3,
    occurred_at: overrides?.occurred_at ?? new Date().toISOString(),
  })
}

export function createTestEventEntry(
  dogId: string,
  overrides?: {
    event_type?: EventType
    occurred_at?: string
    weight_kg?: number
    medication_name?: string
    medication_dose?: string
  }
) {
  return createEventEntry({
    dog_id: dogId,
    event_type: overrides?.event_type ?? "vet_visit",
    occurred_at: overrides?.occurred_at ?? new Date().toISOString(),
    weight_kg: overrides?.weight_kg,
    medication_name: overrides?.medication_name,
    medication_dose: overrides?.medication_dose,
  })
}
