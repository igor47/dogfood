import type { BowelColor, Consistency, Urgency } from "@src/db/bowel-entries"
import { deleteBowelEntry, getBowelEntry, updateBowelEntry } from "@src/db/bowel-entries"
import { getDefaultDog, updateDog } from "@src/db/dogs"
import type { EventType } from "@src/db/event-entries"
import { deleteEventEntry, getEventEntry, updateEventEntry } from "@src/db/event-entries"
import { deleteFoodEntry, getFoodEntry, updateFoodEntry } from "@src/db/food-entries"
import { getFood, listFoods } from "@src/db/foods"
import type { Severity, SymptomType } from "@src/db/symptom-entries"
import { deleteSymptomEntry, getSymptomEntry, updateSymptomEntry } from "@src/db/symptom-entries"
import { linkUploadToEntry, listUploadsForEntry, saveUploadedFile } from "@src/db/uploads"
import { logBowel } from "@src/services/logBowel"
import { logEvent } from "@src/services/logEvent"
import { logMeal } from "@src/services/logMeal"
import { logSymptom } from "@src/services/logSymptom"
import { logTreat } from "@src/services/logTreat"
import { Hono } from "hono"
import type { HtmlEscapedString } from "hono/utils/html"
import { BowelEntryForm } from "../components/BowelEntryForm"
import { EventEntryForm, EventExtraFields } from "../components/EventEntryForm"
import { MealEntryForm } from "../components/MealEntryForm"
import { SymptomEntryForm } from "../components/SymptomEntryForm"
import { TreatEntryForm } from "../components/TreatEntryForm"

export const entriesRoutes = new Hono()

async function processUploads(
  entryType: string,
  entryId: string,
  body: Record<string, string | File | (string | File)[]>
): Promise<void> {
  // Collect all File values from the body (handles both single and array cases)
  const files: File[] = []
  for (const value of Object.values(body)) {
    if (value instanceof File && value.size > 0) {
      files.push(value)
    } else if (Array.isArray(value)) {
      for (const v of value) {
        if (v instanceof File && v.size > 0) {
          files.push(v)
        }
      }
    }
  }

  for (const file of files) {
    const result = await saveUploadedFile(file)
    if ("error" in result) continue
    linkUploadToEntry(entryType, entryId, result.id)
  }
}

// New entry forms
entriesRoutes.get("/entries/new/:type", (c) => {
  const type = c.req.param("type")

  let title: string
  let form: HtmlEscapedString | Promise<HtmlEscapedString>

  switch (type) {
    case "meal": {
      title = "Log Meal"
      const mealFoods = listFoods("meal")
      form = <MealEntryForm foods={mealFoods} />
      break
    }
    case "treat": {
      title = "Log Treat"
      const treatFoods = listFoods("treat")
      form = <TreatEntryForm foods={treatFoods} />
      break
    }
    case "bowel":
      title = "Log Bowel Movement"
      form = <BowelEntryForm />
      break
    case "symptom":
      title = "Log Symptom"
      form = <SymptomEntryForm />
      break
    case "event":
      title = "Log Event"
      form = <EventEntryForm />
      break
    default:
      return c.text("Unknown entry type", 404)
  }

  return c.render(
    <div>
      <h2>{title}</h2>
      <div class="row">
        <div class="col-md-8">
          {form}
          <div id="form-result" class="mt-3"></div>
        </div>
      </div>
    </div>,
    { title: `Dogfood — ${title}` }
  )
})

// Meal submission
entriesRoutes.post("/entries/new/meal", async (c) => {
  const body = await c.req.parseBody({ all: true })

  const result = logMeal({
    food_id: body.food_id as string,
    quantity: parseFloat(body.quantity as string),
    meal_time: (body.meal_time as string) || undefined,
    notes: (body.notes as string) || undefined,
  })

  if ("error" in result) return c.text(result.error, 400)

  await processUploads("food", result.entry.id, body)

  return c.html(
    <div class="alert alert-success">
      Logged {result.entry.quantity} {result.food.unit} of <strong>{result.food.name}</strong>.{" "}
      <a href="/">Dashboard</a> or <a href="/entries/new/meal">log another</a>.
    </div>
  )
})

// Treat submission
entriesRoutes.post("/entries/new/treat", async (c) => {
  const body = await c.req.parseBody({ all: true })

  const result = logTreat({
    food_id: (body.food_id as string) || undefined,
    food_name: (body.food_name as string) || undefined,
    quantity: body.quantity ? parseFloat(body.quantity as string) : undefined,
    meal_time: (body.meal_time as string) || undefined,
    notes: (body.notes as string) || undefined,
  })

  if ("error" in result) return c.text(result.error, 400)

  await processUploads("food", result.entry.id, body)

  return c.html(
    <div class="alert alert-success">
      Logged {result.entry.quantity} x <strong>{result.name}</strong>. <a href="/">Dashboard</a> or{" "}
      <a href="/entries/new/treat">log another</a>.
    </div>
  )
})

entriesRoutes.post("/entries/new/bowel", async (c) => {
  const body = await c.req.parseBody({ all: true })

  const entry = logBowel({
    consistency: parseInt(body.consistency as string, 10) as Consistency,
    color: (body.color as BowelColor) || undefined,
    has_blood: body.has_blood === "on",
    has_mucus: body.has_mucus === "on",
    straining: body.straining === "on",
    urgency: body.urgency ? (parseInt(body.urgency as string, 10) as Urgency) : undefined,
    occurred_at: (body.occurred_at as string) || undefined,
    notes: (body.notes as string) || undefined,
  })

  await processUploads("bowel", entry.id, body)

  return c.html(
    <div class="alert alert-success">
      Logged bowel movement (consistency: {entry.consistency}/7). <a href="/">Dashboard</a> or{" "}
      <a href="/entries/new/bowel">log another</a>.
    </div>
  )
})

entriesRoutes.post("/entries/new/symptom", async (c) => {
  const body = await c.req.parseBody({ all: true })

  const entry = logSymptom({
    symptom_type: body.symptom_type as SymptomType,
    severity: body.severity ? (parseInt(body.severity as string, 10) as Severity) : undefined,
    occurred_at: (body.occurred_at as string) || undefined,
    notes: (body.notes as string) || undefined,
  })

  await processUploads("symptom", entry.id, body)

  return c.html(
    <div class="alert alert-success">
      Logged {entry.symptom_type} (severity: {entry.severity}/5). <a href="/">Dashboard</a> or{" "}
      <a href="/entries/new/symptom">log another</a>.
    </div>
  )
})

entriesRoutes.post("/entries/new/event", async (c) => {
  const body = await c.req.parseBody({ all: true })

  const entry = logEvent({
    event_type: body.event_type as EventType,
    occurred_at: (body.occurred_at as string) || undefined,
    notes: (body.notes as string) || undefined,
    weight_kg: body.weight_kg ? parseFloat(body.weight_kg as string) : undefined,
    medication_name: (body.medication_name as string) || undefined,
    medication_dose: (body.medication_dose as string) || undefined,
  })

  await processUploads("event", entry.id, body)

  let detail = entry.event_type as string
  if (entry.medication_name) detail += ` — ${entry.medication_name}`
  if (entry.weight_kg != null) detail += ` — ${entry.weight_kg} kg`

  return c.html(
    <div class="alert alert-success">
      Logged {detail}. <a href="/">Dashboard</a> or <a href="/entries/new/event">log another</a>.
    </div>
  )
})

// HTMX partial: event-type-specific form fields
entriesRoutes.get("/entries/event-fields", (c) => {
  const eventType = c.req.query("event_type") || ""
  return c.html(<EventExtraFields eventType={eventType} />)
})

// Edit entry routes
entriesRoutes.get("/entries/meal/:id/edit", (c) => {
  const entry = getFoodEntry(c.req.param("id"))
  if (!entry) return c.text("Not found", 404)
  const foods = listFoods("meal")
  const uploads = listUploadsForEntry("food", entry.id)
  return c.render(
    <div>
      <h2>Edit Meal</h2>
      <div class="row">
        <div class="col-md-8">
          <MealEntryForm foods={foods} entry={entry} uploads={uploads} />
          <div id="form-result" class="mt-3"></div>
        </div>
      </div>
    </div>,
    { title: "Dogfood — Edit Meal" }
  )
})

entriesRoutes.post("/entries/meal/:id/edit", async (c) => {
  const id = c.req.param("id")
  const body = await c.req.parseBody({ all: true })
  const food = getFood(body.food_id as string)
  if (!food) return c.text("Food not found", 400)

  updateFoodEntry(id, {
    food_id: body.food_id as string,
    food_name: food.name,
    quantity: parseFloat(body.quantity as string),
    unit: food.unit,
    meal_time: (body.meal_time as string) || undefined,
    notes: (body.notes as string) || undefined,
  })

  await processUploads("food", id, body)

  c.header("HX-Redirect", "/?saved=1")
  return c.body(null, 200)
})

entriesRoutes.get("/entries/treat/:id/edit", (c) => {
  const entry = getFoodEntry(c.req.param("id"))
  if (!entry) return c.text("Not found", 404)
  const foods = listFoods("treat")
  const uploads = listUploadsForEntry("food", entry.id)
  return c.render(
    <div>
      <h2>Edit Treat</h2>
      <div class="row">
        <div class="col-md-8">
          <TreatEntryForm foods={foods} entry={entry} uploads={uploads} />
          <div id="form-result" class="mt-3"></div>
        </div>
      </div>
    </div>,
    { title: "Dogfood — Edit Treat" }
  )
})

entriesRoutes.post("/entries/treat/:id/edit", async (c) => {
  const id = c.req.param("id")
  const body = await c.req.parseBody({ all: true })
  const foodId = (body.food_id as string) || undefined

  let foodName: string
  let unit: string | undefined

  if (foodId) {
    const food = getFood(foodId)
    if (!food) return c.text("Food not found", 400)
    foodName = food.name
    unit = food.unit
  } else {
    foodName = (body.food_name as string) || "Treat"
  }

  updateFoodEntry(id, {
    food_id: foodId,
    food_name: foodName,
    quantity: body.quantity ? parseFloat(body.quantity as string) : undefined,
    unit,
    meal_time: (body.meal_time as string) || undefined,
    notes: (body.notes as string) || undefined,
  })

  await processUploads("food", id, body)

  c.header("HX-Redirect", "/?saved=1")
  return c.body(null, 200)
})

entriesRoutes.delete("/entries/food/:id", (c) => {
  deleteFoodEntry(c.req.param("id"))
  c.header("HX-Redirect", "/?saved=1")
  return c.body(null, 200)
})

entriesRoutes.get("/entries/bowel/:id/edit", (c) => {
  const entry = getBowelEntry(c.req.param("id"))
  if (!entry) return c.text("Not found", 404)
  const uploads = listUploadsForEntry("bowel", entry.id)
  return c.render(
    <div>
      <h2>Edit Bowel Movement</h2>
      <div class="row">
        <div class="col-md-8">
          <BowelEntryForm entry={entry} uploads={uploads} />
          <div id="form-result" class="mt-3"></div>
        </div>
      </div>
    </div>,
    { title: "Dogfood — Edit Bowel Movement" }
  )
})

entriesRoutes.post("/entries/bowel/:id/edit", async (c) => {
  const id = c.req.param("id")
  const body = await c.req.parseBody({ all: true })

  updateBowelEntry(id, {
    consistency: parseInt(body.consistency as string, 10) as Consistency,
    color: (body.color as BowelColor) || undefined,
    has_blood: body.has_blood === "on",
    has_mucus: body.has_mucus === "on",
    straining: body.straining === "on",
    urgency: body.urgency ? (parseInt(body.urgency as string, 10) as Urgency) : undefined,
    occurred_at: (body.occurred_at as string) || undefined,
    notes: (body.notes as string) || undefined,
  })

  await processUploads("bowel", id, body)

  c.header("HX-Redirect", "/?saved=1")
  return c.body(null, 200)
})

entriesRoutes.delete("/entries/bowel/:id", (c) => {
  deleteBowelEntry(c.req.param("id"))
  c.header("HX-Redirect", "/?saved=1")
  return c.body(null, 200)
})

entriesRoutes.get("/entries/symptom/:id/edit", (c) => {
  const entry = getSymptomEntry(c.req.param("id"))
  if (!entry) return c.text("Not found", 404)
  const uploads = listUploadsForEntry("symptom", entry.id)
  return c.render(
    <div>
      <h2>Edit Symptom</h2>
      <div class="row">
        <div class="col-md-8">
          <SymptomEntryForm entry={entry} uploads={uploads} />
          <div id="form-result" class="mt-3"></div>
        </div>
      </div>
    </div>,
    { title: "Dogfood — Edit Symptom" }
  )
})

entriesRoutes.post("/entries/symptom/:id/edit", async (c) => {
  const id = c.req.param("id")
  const body = await c.req.parseBody({ all: true })

  updateSymptomEntry(id, {
    symptom_type: body.symptom_type as SymptomType,
    severity: body.severity ? (parseInt(body.severity as string, 10) as Severity) : undefined,
    occurred_at: (body.occurred_at as string) || undefined,
    notes: (body.notes as string) || undefined,
  })

  await processUploads("symptom", id, body)

  c.header("HX-Redirect", "/?saved=1")
  return c.body(null, 200)
})

entriesRoutes.delete("/entries/symptom/:id", (c) => {
  deleteSymptomEntry(c.req.param("id"))
  c.header("HX-Redirect", "/?saved=1")
  return c.body(null, 200)
})

entriesRoutes.get("/entries/event/:id/edit", (c) => {
  const entry = getEventEntry(c.req.param("id"))
  if (!entry) return c.text("Not found", 404)
  const uploads = listUploadsForEntry("event", entry.id)
  return c.render(
    <div>
      <h2>Edit Event</h2>
      <div class="row">
        <div class="col-md-8">
          <EventEntryForm entry={entry} uploads={uploads} />
          <div id="form-result" class="mt-3"></div>
        </div>
      </div>
    </div>,
    { title: "Dogfood — Edit Event" }
  )
})

entriesRoutes.post("/entries/event/:id/edit", async (c) => {
  const id = c.req.param("id")
  const body = await c.req.parseBody({ all: true })

  updateEventEntry(id, {
    event_type: body.event_type as EventType,
    occurred_at: (body.occurred_at as string) || undefined,
    notes: (body.notes as string) || undefined,
    weight_kg: body.weight_kg ? parseFloat(body.weight_kg as string) : null,
    medication_name: (body.medication_name as string) || null,
    medication_dose: (body.medication_dose as string) || null,
  })

  await processUploads("event", id, body)

  c.header("HX-Redirect", "/?saved=1")
  return c.body(null, 200)
})

entriesRoutes.delete("/entries/event/:id", (c) => {
  deleteEventEntry(c.req.param("id"))
  c.header("HX-Redirect", "/?saved=1")
  return c.body(null, 200)
})

// Dog profile edit
entriesRoutes.get("/dog/edit", (c) => {
  const dog = getDefaultDog()

  return c.render(
    <div>
      <h2>Edit Dog Profile</h2>
      <div class="row">
        <div class="col-md-6">
          <form method="post" action="/dog/edit">
            <div class="mb-3">
              <label for="name" class="form-label">
                Name
              </label>
              <input
                type="text"
                class="form-control"
                id="name"
                name="name"
                value={dog.name}
                required
              />
            </div>
            <div class="mb-3">
              <label for="breed" class="form-label">
                Breed
              </label>
              <input
                type="text"
                class="form-control"
                id="breed"
                name="breed"
                value={dog.breed ?? ""}
              />
            </div>
            <div class="row mb-3">
              <div class="col-md-6">
                <label for="birth_date" class="form-label">
                  Birth Date
                </label>
                <input
                  type="date"
                  class="form-control"
                  id="birth_date"
                  name="birth_date"
                  value={dog.birth_date ?? ""}
                />
              </div>
              <div class="col-md-6">
                <label for="weight_kg" class="form-label">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  class="form-control"
                  id="weight_kg"
                  name="weight_kg"
                  value={dog.weight_kg ?? ""}
                />
              </div>
            </div>
            <div class="mb-3">
              <label for="notes" class="form-label">
                Notes
              </label>
              <textarea class="form-control" id="notes" name="notes" rows={3}>
                {dog.notes ?? ""}
              </textarea>
            </div>
            <button type="submit" class="btn btn-primary">
              Save
            </button>
            <a href="/" class="btn btn-outline-secondary ms-2">
              Cancel
            </a>
          </form>
        </div>
      </div>
    </div>,
    { title: "Dogfood — Edit Profile" }
  )
})

entriesRoutes.post("/dog/edit", async (c) => {
  const dog = getDefaultDog()
  const body = await c.req.parseBody({ all: true })

  updateDog(dog.id, {
    name: body.name as string,
    breed: (body.breed as string) || undefined,
    birth_date: (body.birth_date as string) || undefined,
    weight_kg: body.weight_kg ? parseFloat(body.weight_kg as string) : undefined,
    notes: (body.notes as string) || undefined,
  })

  return c.redirect("/")
})
