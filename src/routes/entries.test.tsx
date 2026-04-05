import { describe, expect, test } from "bun:test"
import { listBowelEntries } from "@src/db/bowel-entries"
import { listEventEntries } from "@src/db/event-entries"
import { listFoodEntries } from "@src/db/food-entries"
import { listSymptomEntries } from "@src/db/symptom-entries"
import { useTestApp } from "@src/test/app"
import {
  createTestBowelEntry,
  createTestDog,
  createTestEventEntry,
  createTestFood,
  createTestFoodEntry,
  createTestSymptomEntry,
} from "@src/test/factories/entries"
import { makeRequest } from "@src/test/http"

const testCtx = useTestApp()

describe("POST /entries/new/meal", () => {
  test("creates a meal entry and returns success HTML", async () => {
    const dog = createTestDog()
    const food = createTestFood({ name: "Premium Kibble", unit: "cups", calories_per_unit: 350 })

    const form = new FormData()
    form.append("food_id", food.id)
    form.append("quantity", "1.5")
    form.append("occurred_at", "2026-03-28T12:00:00Z")

    const response = await makeRequest(testCtx.app, "/entries/new/meal", {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)
    const html = await response.text()
    expect(html).toContain("Premium Kibble")
    expect(html).toContain("alert-success")

    const entries = listFoodEntries(dog.id)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.food_name).toBe("Premium Kibble")
    expect(entries[0]!.quantity).toBe(1.5)
    expect(entries[0]!.entry_kind).toBe("meal")
  })

  test("returns 400 for unknown food_id", async () => {
    createTestDog()

    const form = new FormData()
    form.append("food_id", "nonexistent")
    form.append("quantity", "1")

    const response = await makeRequest(testCtx.app, "/entries/new/meal", {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(400)
  })

  test("creates entry without optional fields", async () => {
    const dog = createTestDog()
    const food = createTestFood()

    const form = new FormData()
    form.append("food_id", food.id)
    form.append("quantity", "1")

    const response = await makeRequest(testCtx.app, "/entries/new/meal", {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)

    const entries = listFoodEntries(dog.id)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.occurred_at).toBeTruthy() // defaults to now via COALESCE
  })
})

describe("POST /entries/new/treat", () => {
  test("creates a treat with catalog food", async () => {
    const dog = createTestDog()
    const food = createTestFood({ name: "Greenie", category: "treat", unit: "pieces" })

    const form = new FormData()
    form.append("food_id", food.id)
    form.append("quantity", "2")

    const response = await makeRequest(testCtx.app, "/entries/new/treat", {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)
    const html = await response.text()
    expect(html).toContain("Greenie")

    const entries = listFoodEntries(dog.id)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.entry_kind).toBe("treat")
    expect(entries[0]!.quantity).toBe(2)
  })

  test("creates a treat with free-form name", async () => {
    const dog = createTestDog()

    const form = new FormData()
    form.append("food_name", "Piece of cheese")

    const response = await makeRequest(testCtx.app, "/entries/new/treat", {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)

    const entries = listFoodEntries(dog.id)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.food_name).toBe("Piece of cheese")
    expect(entries[0]!.food_id).toBeNull()
    expect(entries[0]!.quantity).toBe(1) // default
  })

  test("returns 400 for unknown food_id", async () => {
    createTestDog()

    const form = new FormData()
    form.append("food_id", "nonexistent")

    const response = await makeRequest(testCtx.app, "/entries/new/treat", {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(400)
  })
})

describe("POST /entries/new/bowel", () => {
  test("creates a bowel entry", async () => {
    const dog = createTestDog()

    const form = new FormData()
    form.append("consistency", "4")
    form.append("color", "brown")
    form.append("occurred_at", "2026-03-28T12:00:00Z")
    form.append("notes", "normal")

    const response = await makeRequest(testCtx.app, "/entries/new/bowel", {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)
    const html = await response.text()
    expect(html).toContain("consistency: 4/7")

    const entries = listBowelEntries(dog.id)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.consistency).toBe(4)
    expect(entries[0]!.color).toBe("brown")
    expect(entries[0]!.notes).toBe("normal")
  })

  test("creates entry with boolean flags", async () => {
    const dog = createTestDog()

    const form = new FormData()
    form.append("consistency", "6")
    form.append("has_blood", "on")
    form.append("has_mucus", "on")
    form.append("straining", "on")

    const response = await makeRequest(testCtx.app, "/entries/new/bowel", {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)

    const entries = listBowelEntries(dog.id)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.has_blood).toBe(1)
    expect(entries[0]!.has_mucus).toBe(1)
    expect(entries[0]!.straining).toBe(1)
  })

  test("boolean flags default to false when unchecked", async () => {
    const dog = createTestDog()

    const form = new FormData()
    form.append("consistency", "4")

    const response = await makeRequest(testCtx.app, "/entries/new/bowel", {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)

    const entries = listBowelEntries(dog.id)
    expect(entries[0]!.has_blood).toBe(0)
    expect(entries[0]!.has_mucus).toBe(0)
    expect(entries[0]!.straining).toBe(0)
  })
})

describe("POST /entries/new/symptom", () => {
  test("creates a symptom entry", async () => {
    const dog = createTestDog()

    const form = new FormData()
    form.append("symptom_type", "vomiting")
    form.append("severity", "3")
    form.append("occurred_at", "2026-03-28T10:00:00Z")
    form.append("notes", "after breakfast")

    const response = await makeRequest(testCtx.app, "/entries/new/symptom", {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)
    const html = await response.text()
    expect(html).toContain("vomiting")
    expect(html).toContain("severity: 3/5")

    const entries = listSymptomEntries(dog.id)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.symptom_type).toBe("vomiting")
    expect(entries[0]!.severity).toBe(3)
    expect(entries[0]!.notes).toBe("after breakfast")
  })

  test("defaults severity to 3 when omitted", async () => {
    const dog = createTestDog()

    const form = new FormData()
    form.append("symptom_type", "energy_level")

    const response = await makeRequest(testCtx.app, "/entries/new/symptom", {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)

    const entries = listSymptomEntries(dog.id)
    expect(entries[0]!.severity).toBe(3)
  })
})

describe("POST /entries/new/event", () => {
  test("creates an event entry", async () => {
    const dog = createTestDog()

    const form = new FormData()
    form.append("event_type", "vet_visit")
    form.append("occurred_at", "2026-03-28T10:00:00Z")
    form.append("notes", "annual checkup")

    const response = await makeRequest(testCtx.app, "/entries/new/event", {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)
    const html = await response.text()
    expect(html).toContain("vet_visit")

    const entries = listEventEntries(dog.id)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.event_type).toBe("vet_visit")
    expect(entries[0]!.notes).toBe("annual checkup")
  })

  test("creates a medication event with extra fields", async () => {
    const dog = createTestDog()

    const form = new FormData()
    form.append("event_type", "medication")
    form.append("medication_name", "Apoquel")
    form.append("medication_dose", "16mg daily")

    const response = await makeRequest(testCtx.app, "/entries/new/event", {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)

    const entries = listEventEntries(dog.id)
    expect(entries[0]!.medication_name).toBe("Apoquel")
    expect(entries[0]!.medication_dose).toBe("16mg daily")
  })

  test("creates a weight check with weight_kg", async () => {
    const dog = createTestDog()

    const form = new FormData()
    form.append("event_type", "weight_check")
    form.append("weight_kg", "25.5")

    const response = await makeRequest(testCtx.app, "/entries/new/event", {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)

    const entries = listEventEntries(dog.id)
    expect(entries[0]!.weight_kg).toBe(25.5)
  })
})

describe("edit entry routes", () => {
  test("POST /entries/meal/:id/edit updates meal and redirects", async () => {
    const dog = createTestDog()
    const food = createTestFood({ name: "Kibble A" })
    const foodB = createTestFood({ name: "Kibble B" })
    const entry = createTestFoodEntry(dog.id, { food_id: food.id, food_name: "Kibble A" })

    const form = new FormData()
    form.append("food_id", foodB.id)
    form.append("quantity", "2.5")

    const response = await makeRequest(testCtx.app, `/entries/meal/${entry.id}/edit`, {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("HX-Redirect")).toBe("/?saved=1")

    const entries = listFoodEntries(dog.id)
    expect(entries[0]!.food_name).toBe("Kibble B")
    expect(entries[0]!.quantity).toBe(2.5)
  })

  test("POST /entries/treat/:id/edit updates treat", async () => {
    const dog = createTestDog()
    const entry = createTestFoodEntry(dog.id, {
      food_name: "Old treat",
      entry_kind: "treat",
    })

    const form = new FormData()
    form.append("food_name", "New treat")
    form.append("quantity", "3")

    const response = await makeRequest(testCtx.app, `/entries/treat/${entry.id}/edit`, {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("HX-Redirect")).toBe("/?saved=1")

    const entries = listFoodEntries(dog.id)
    expect(entries[0]!.food_name).toBe("New treat")
  })

  test("POST /entries/bowel/:id/edit updates bowel entry", async () => {
    const dog = createTestDog()
    const entry = createTestBowelEntry(dog.id, { consistency: 4 })

    const form = new FormData()
    form.append("consistency", "2")
    form.append("color", "dark brown")

    const response = await makeRequest(testCtx.app, `/entries/bowel/${entry.id}/edit`, {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("HX-Redirect")).toBe("/?saved=1")

    const entries = listBowelEntries(dog.id)
    expect(entries[0]!.consistency).toBe(2)
    expect(entries[0]!.color).toBe("dark brown")
  })

  test("POST /entries/symptom/:id/edit updates symptom entry", async () => {
    const dog = createTestDog()
    const entry = createTestSymptomEntry(dog.id, { symptom_type: "energy_level", severity: 3 })

    const form = new FormData()
    form.append("symptom_type", "vomiting")
    form.append("severity", "5")
    form.append("notes", "updated note")

    const response = await makeRequest(testCtx.app, `/entries/symptom/${entry.id}/edit`, {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("HX-Redirect")).toBe("/?saved=1")

    const entries = listSymptomEntries(dog.id)
    expect(entries[0]!.symptom_type).toBe("vomiting")
    expect(entries[0]!.severity).toBe(5)
    expect(entries[0]!.notes).toBe("updated note")
  })

  test("POST /entries/event/:id/edit updates event entry", async () => {
    const dog = createTestDog()
    const entry = createTestEventEntry(dog.id, { event_type: "vet_visit" })

    const form = new FormData()
    form.append("event_type", "medication")
    form.append("medication_name", "Apoquel")
    form.append("notes", "started new medication")

    const response = await makeRequest(testCtx.app, `/entries/event/${entry.id}/edit`, {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("HX-Redirect")).toBe("/?saved=1")

    const entries = listEventEntries(dog.id)
    expect(entries[0]!.event_type).toBe("medication")
    expect(entries[0]!.medication_name).toBe("Apoquel")
  })
})

describe("delete entry routes", () => {
  test("DELETE /entries/food/:id removes the entry", async () => {
    const dog = createTestDog()
    const entry = createTestFoodEntry(dog.id)

    const response = await makeRequest(testCtx.app, `/entries/food/${entry.id}`, {
      method: "DELETE",
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("HX-Redirect")).toBe("/?saved=1")
    expect(listFoodEntries(dog.id)).toHaveLength(0)
  })

  test("DELETE /entries/bowel/:id removes the entry", async () => {
    const dog = createTestDog()
    const entry = createTestBowelEntry(dog.id)

    const response = await makeRequest(testCtx.app, `/entries/bowel/${entry.id}`, {
      method: "DELETE",
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("HX-Redirect")).toBe("/?saved=1")
    expect(listBowelEntries(dog.id)).toHaveLength(0)
  })

  test("DELETE /entries/symptom/:id removes the entry", async () => {
    const dog = createTestDog()
    const entry = createTestSymptomEntry(dog.id)

    const response = await makeRequest(testCtx.app, `/entries/symptom/${entry.id}`, {
      method: "DELETE",
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("HX-Redirect")).toBe("/?saved=1")
    expect(listSymptomEntries(dog.id)).toHaveLength(0)
  })

  test("DELETE /entries/event/:id removes the entry", async () => {
    const dog = createTestDog()
    const entry = createTestEventEntry(dog.id)

    const response = await makeRequest(testCtx.app, `/entries/event/${entry.id}`, {
      method: "DELETE",
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("HX-Redirect")).toBe("/?saved=1")
    expect(listEventEntries(dog.id)).toHaveLength(0)
  })
})
