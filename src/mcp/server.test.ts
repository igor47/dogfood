import { describe, expect, test } from "bun:test"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { listBowelEntries } from "@src/db/bowel-entries"
import { listEventEntries } from "@src/db/event-entries"
import { listFoodEntries } from "@src/db/food-entries"
import { createFood, listFoods } from "@src/db/foods"
import { listSymptomEntries } from "@src/db/symptom-entries"
import { useTestApp } from "@src/test/app"
import {
  createTestBowelEntry,
  createTestDog,
  createTestFoodEntry,
} from "@src/test/factories/entries"
import { createMcpServer } from "./server"

useTestApp()

async function createTestClient() {
  const server = createMcpServer()
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

  const client = new Client({ name: "test-client", version: "1.0.0" })
  await server.connect(serverTransport)
  await client.connect(clientTransport)

  return client
}

function textContent(result: Awaited<ReturnType<Client["callTool"]>>): string {
  const content = result.content as Array<{ type: string; text: string }>
  return content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n")
}

describe("MCP tools", () => {
  test("add_food creates a food in the catalog", async () => {
    const client = await createTestClient()
    const result = await client.callTool({
      name: "add_food",
      arguments: {
        name: "Boiled Ground Turkey",
        category: "meal",
        unit: "oz",
        calories_per_unit: 50,
      },
    })
    const text = textContent(result)
    expect(text).toContain("Boiled Ground Turkey")
    expect(text).toContain("50 cal/oz")

    const foods = listFoods("meal")
    expect(foods).toHaveLength(1)
    expect(foods[0]!.name).toBe("Boiled Ground Turkey")
  })

  test("list_foods returns empty message when no foods defined", async () => {
    const client = await createTestClient()
    const result = await client.callTool({ name: "list_foods", arguments: {} })
    expect(textContent(result)).toContain("No foods defined")
  })

  test("list_foods returns catalog entries", async () => {
    const client = await createTestClient()
    createFood({ name: "Premium Kibble", category: "meal", unit: "cups", calories_per_unit: 350 })
    createFood({ name: "Greenie", category: "treat", unit: "pieces", calories_per_unit: 90 })

    const result = await client.callTool({ name: "list_foods", arguments: {} })
    const text = textContent(result)
    expect(text).toContain("Premium Kibble")
    expect(text).toContain("Greenie")
    expect(text).toContain("350 cal/cups")
  })

  test("list_foods filters by category", async () => {
    const client = await createTestClient()
    createFood({ name: "Kibble", category: "meal", unit: "cups" })
    createFood({ name: "Greenie", category: "treat", unit: "pieces" })

    const result = await client.callTool({
      name: "list_foods",
      arguments: { category: "treat" },
    })
    const text = textContent(result)
    expect(text).not.toContain("Kibble")
    expect(text).toContain("Greenie")
  })

  test("log_meal creates a food entry with calories", async () => {
    const client = await createTestClient()
    const dog = createTestDog()
    const food = createFood({
      name: "Premium Kibble",
      category: "meal",
      unit: "cups",
      calories_per_unit: 350,
    })

    const result = await client.callTool({
      name: "log_meal",
      arguments: { food_id: food.id, quantity: 1.5 },
    })
    const text = textContent(result)
    expect(text).toContain("Logged meal: 1.5 cups of Premium Kibble (525 cal)")

    const entries = listFoodEntries(dog.id)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.food_name).toBe("Premium Kibble")
    expect(entries[0]!.quantity).toBe(1.5)
    expect(entries[0]!.calories).toBe(525)
    expect(entries[0]!.entry_kind).toBe("meal")
  })

  test("log_meal returns error for unknown food_id", async () => {
    const client = await createTestClient()
    const result = await client.callTool({
      name: "log_meal",
      arguments: { food_id: "nonexistent", quantity: 1 },
    })
    expect(textContent(result)).toContain("Food not found")
  })

  test("log_treat with catalog food", async () => {
    const client = await createTestClient()
    const dog = createTestDog()
    const food = createFood({
      name: "Greenie",
      category: "treat",
      unit: "pieces",
      calories_per_unit: 90,
    })

    const result = await client.callTool({
      name: "log_treat",
      arguments: { food_id: food.id, quantity: 2 },
    })
    expect(textContent(result)).toContain("Logged treat: 2 x Greenie (180 cal)")

    const entries = listFoodEntries(dog.id)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.entry_kind).toBe("treat")
    expect(entries[0]!.calories).toBe(180)
  })

  test("log_treat with free-form name", async () => {
    const client = await createTestClient()
    const dog = createTestDog()

    const result = await client.callTool({
      name: "log_treat",
      arguments: { food_name: "Piece of cheese" },
    })
    expect(textContent(result)).toContain("Piece of cheese")

    const entries = listFoodEntries(dog.id)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.food_name).toBe("Piece of cheese")
    expect(entries[0]!.food_id).toBeNull()
  })

  test("log_bowel_movement creates entry", async () => {
    const client = await createTestClient()
    const dog = createTestDog()

    const result = await client.callTool({
      name: "log_bowel_movement",
      arguments: { consistency: 4, color: "brown", has_blood: false },
    })
    expect(textContent(result)).toContain("consistency: 4/7")

    const entries = listBowelEntries(dog.id)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.consistency).toBe(4)
    expect(entries[0]!.color).toBe("brown")
  })

  test("log_symptom creates entry", async () => {
    const client = await createTestClient()
    const dog = createTestDog()

    const result = await client.callTool({
      name: "log_symptom",
      arguments: { symptom_type: "vomiting", severity: 3, notes: "after breakfast" },
    })
    expect(textContent(result)).toContain("vomiting")
    expect(textContent(result)).toContain("severity: 3/5")

    const entries = listSymptomEntries(dog.id)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.symptom_type).toBe("vomiting")
    expect(entries[0]!.notes).toBe("after breakfast")
  })

  test("log_event creates entry", async () => {
    const client = await createTestClient()
    const dog = createTestDog()

    const result = await client.callTool({
      name: "log_event",
      arguments: {
        event_type: "medication",
        medication_name: "Apoquel",
        medication_dose: "16mg",
        notes: "morning dose",
      },
    })
    expect(textContent(result)).toContain("medication")
    expect(textContent(result)).toContain("Apoquel")

    const entries = listEventEntries(dog.id)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.event_type).toBe("medication")
    expect(entries[0]!.medication_name).toBe("Apoquel")
  })

  test("get_recent_entries returns timeline", async () => {
    const client = await createTestClient()
    const dog = createTestDog()
    createTestFoodEntry(dog.id, { food_name: "Kibble" })
    createTestBowelEntry(dog.id, { consistency: 4 })

    const result = await client.callTool({
      name: "get_recent_entries",
      arguments: { limit: 10 },
    })
    const text = textContent(result)
    expect(text).toContain("Kibble")
    expect(text).toContain("Bowel movement")
  })

  test("get_dog_profile returns dog info", async () => {
    const client = await createTestClient()
    createTestDog({ name: "Rex" })

    const result = await client.callTool({ name: "get_dog_profile", arguments: {} })
    const text = textContent(result)
    expect(text).toContain("Name: Rex")
  })
})
