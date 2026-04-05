import { describe, expect, test } from "bun:test"
import { listBowelEntries } from "@src/db/bowel-entries"
import { listFoodEntries } from "@src/db/food-entries"
import { listHealthEntries } from "@src/db/health-entries"
import { useTestApp } from "@src/test/app"
import {
  createTestBowelEntry,
  createTestDog,
  createTestFood,
  createTestFoodEntry,
  createTestHealthEntry,
} from "@src/test/factories/entries"
import { makeRequest, parseHtml } from "@src/test/http"

const testCtx = useTestApp()

describe("POST /entries/new/meal", () => {
  test("creates a meal entry and returns success HTML", async () => {
    const dog = createTestDog()
    const food = createTestFood({ name: "Premium Kibble", unit: "cups", calories_per_unit: 350 })

    const form = new FormData()
    form.append("food_id", food.id)
    form.append("quantity", "1.5")
    form.append("meal_time", "2026-03-28T12:00:00Z")

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
    expect(entries[0]!.meal_time).toBeTruthy() // defaults to now via COALESCE
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

describe("POST /entries/new/health", () => {
  test("creates a health entry", async () => {
    const dog = createTestDog()

    const form = new FormData()
    form.append("entry_type", "vomiting")
    form.append("severity", "3")
    form.append("occurred_at", "2026-03-28T10:00:00Z")
    form.append("notes", "after breakfast")

    const response = await makeRequest(testCtx.app, "/entries/new/health", {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)
    const html = await response.text()
    expect(html).toContain("vomiting")
    expect(html).toContain("severity: 3/5")

    const entries = listHealthEntries(dog.id)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.entry_type).toBe("vomiting")
    expect(entries[0]!.severity).toBe(3)
    expect(entries[0]!.notes).toBe("after breakfast")
  })

  test("defaults severity to 1 when omitted", async () => {
    const dog = createTestDog()

    const form = new FormData()
    form.append("entry_type", "energy")

    const response = await makeRequest(testCtx.app, "/entries/new/health", {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)

    const entries = listHealthEntries(dog.id)
    expect(entries[0]!.severity).toBe(1)
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

  test("POST /entries/health/:id/edit updates health entry", async () => {
    const dog = createTestDog()
    const entry = createTestHealthEntry(dog.id, { entry_type: "energy", severity: 3 })

    const form = new FormData()
    form.append("entry_type", "vomiting")
    form.append("severity", "5")
    form.append("notes", "updated note")

    const response = await makeRequest(testCtx.app, `/entries/health/${entry.id}/edit`, {
      method: "POST",
      body: form,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("HX-Redirect")).toBe("/?saved=1")

    const entries = listHealthEntries(dog.id)
    expect(entries[0]!.entry_type).toBe("vomiting")
    expect(entries[0]!.severity).toBe(5)
    expect(entries[0]!.notes).toBe("updated note")
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

  test("DELETE /entries/health/:id removes the entry", async () => {
    const dog = createTestDog()
    const entry = createTestHealthEntry(dog.id)

    const response = await makeRequest(testCtx.app, `/entries/health/${entry.id}`, {
      method: "DELETE",
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("HX-Redirect")).toBe("/?saved=1")
    expect(listHealthEntries(dog.id)).toHaveLength(0)
  })
})
