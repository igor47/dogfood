import type { BowelColor, Consistency, Urgency } from "@src/db/bowel-entries"
import { createBowelEntry } from "@src/db/bowel-entries"
import { getDefaultDog, updateDog } from "@src/db/dogs"
import { createFoodEntry } from "@src/db/food-entries"
import { getFood, listFoods } from "@src/db/foods"
import type { HealthEntryType, Severity } from "@src/db/health-entries"
import { createHealthEntry } from "@src/db/health-entries"
import { Hono } from "hono"
import type { HtmlEscapedString } from "hono/utils/html"
import { BowelEntryForm } from "../components/BowelEntryForm"
import { HealthEntryForm } from "../components/HealthEntryForm"
import { MealEntryForm } from "../components/MealEntryForm"
import { TreatEntryForm } from "../components/TreatEntryForm"

export const entriesRoutes = new Hono()

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
    case "health":
      title = "Log Health Observation"
      form = <HealthEntryForm />
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
  const dog = getDefaultDog()
  const body = await c.req.parseBody()

  const foodId = body.food_id as string
  const food = getFood(foodId)
  if (!food) return c.text("Food not found", 400)

  const quantity = parseFloat(body.quantity as string)
  const calories =
    food.calories_per_unit != null ? Math.round(quantity * food.calories_per_unit) : null

  createFoodEntry({
    dog_id: dog.id,
    food_id: foodId,
    food_name: food.name,
    brand: food.brand ?? undefined,
    entry_kind: "meal",
    quantity,
    unit: food.unit,
    calories: calories ?? undefined,
    meal_time: (body.meal_time as string) || undefined,
    notes: (body.notes as string) || undefined,
  })

  const calStr = calories != null ? ` (${calories} cal)` : ""
  return c.html(
    <div class="alert alert-success">
      Logged {quantity} {food.unit} of <strong>{food.name}</strong>
      {calStr}. <a href="/">Dashboard</a> or <a href="/entries/new/meal">log another</a>.
    </div>
  )
})

// Treat submission
entriesRoutes.post("/entries/new/treat", async (c) => {
  const dog = getDefaultDog()
  const body = await c.req.parseBody()

  const foodId = (body.food_id as string) || undefined
  const quantity = body.quantity ? parseFloat(body.quantity as string) : 1

  let foodName: string
  let unit: string | undefined
  let calories: number | undefined

  if (foodId) {
    const food = getFood(foodId)
    if (!food) return c.text("Food not found", 400)
    foodName = food.name
    unit = food.unit
    if (food.calories_per_unit != null) {
      calories = Math.round(quantity * food.calories_per_unit)
    }
  } else {
    foodName = (body.food_name as string) || "Treat"
  }

  createFoodEntry({
    dog_id: dog.id,
    food_id: foodId,
    food_name: foodName,
    entry_kind: "treat",
    quantity,
    unit,
    calories,
    meal_time: (body.meal_time as string) || undefined,
    notes: (body.notes as string) || undefined,
  })

  const calStr = calories != null ? ` (${calories} cal)` : ""
  return c.html(
    <div class="alert alert-success">
      Logged {quantity} x <strong>{foodName}</strong>
      {calStr}. <a href="/">Dashboard</a> or <a href="/entries/new/treat">log another</a>.
    </div>
  )
})

entriesRoutes.post("/entries/new/bowel", async (c) => {
  const dog = getDefaultDog()
  const body = await c.req.parseBody()

  const entry = createBowelEntry({
    dog_id: dog.id,
    consistency: parseInt(body.consistency as string, 10) as Consistency,
    color: (body.color as BowelColor) || undefined,
    has_blood: body.has_blood === "on",
    has_mucus: body.has_mucus === "on",
    straining: body.straining === "on",
    urgency: body.urgency ? (parseInt(body.urgency as string, 10) as Urgency) : undefined,
    occurred_at: (body.occurred_at as string) || undefined,
    notes: (body.notes as string) || undefined,
  })

  return c.html(
    <div class="alert alert-success">
      Logged bowel movement (consistency: {entry.consistency}/7). <a href="/">Dashboard</a> or{" "}
      <a href="/entries/new/bowel">log another</a>.
    </div>
  )
})

entriesRoutes.post("/entries/new/health", async (c) => {
  const dog = getDefaultDog()
  const body = await c.req.parseBody()

  const entry = createHealthEntry({
    dog_id: dog.id,
    entry_type: body.entry_type as HealthEntryType,
    severity: body.severity ? (parseInt(body.severity as string, 10) as Severity) : undefined,
    occurred_at: (body.occurred_at as string) || undefined,
    notes: (body.notes as string) || undefined,
  })

  return c.html(
    <div class="alert alert-success">
      Logged {entry.entry_type} (severity: {entry.severity}/5). <a href="/">Dashboard</a> or{" "}
      <a href="/entries/new/health">log another</a>.
    </div>
  )
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
  const body = await c.req.parseBody()

  updateDog(dog.id, {
    name: body.name as string,
    breed: (body.breed as string) || undefined,
    birth_date: (body.birth_date as string) || undefined,
    weight_kg: body.weight_kg ? parseFloat(body.weight_kg as string) : undefined,
    notes: (body.notes as string) || undefined,
  })

  return c.redirect("/")
})
