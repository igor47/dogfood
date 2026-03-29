import type { FoodCategory } from "@src/db/foods"
import { createFood, deleteFood, getFood, listFoods, updateFood } from "@src/db/foods"
import { Hono } from "hono"

export const foodsRoutes = new Hono()

foodsRoutes.get("/foods", (c) => {
  const foods = listFoods()
  const meals = foods.filter((f) => f.category === "meal")
  const treats = foods.filter((f) => f.category === "treat")

  return c.render(
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>Foods</h1>
        <a href="/foods/new" class="btn btn-sm btn-outline-success">
          <i class="bi bi-plus-lg"></i> Add Food
        </a>
      </div>

      <h4>Meals</h4>
      {meals.length === 0 ? (
        <p class="text-muted">
          No meal foods defined. <a href="/foods/new?category=meal">Add one</a>.
        </p>
      ) : (
        <div class="list-group mb-4">
          {meals.map((f) => (
            <div class="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <strong>{f.name}</strong>
                {f.brand && <span class="text-muted"> — {f.brand}</span>}
                <small class="text-muted d-block">
                  Unit: {f.unit}
                  {f.calories_per_unit != null && ` · ${f.calories_per_unit} cal/${f.unit}`}
                </small>
              </div>
              <a href={`/foods/${f.id}/edit`} class="btn btn-sm btn-outline-secondary">
                Edit
              </a>
            </div>
          ))}
        </div>
      )}

      <h4>Treats</h4>
      {treats.length === 0 ? (
        <p class="text-muted">
          No treats defined. <a href="/foods/new?category=treat">Add one</a>.
        </p>
      ) : (
        <div class="list-group mb-4">
          {treats.map((f) => (
            <div class="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <strong>{f.name}</strong>
                {f.brand && <span class="text-muted"> — {f.brand}</span>}
                <small class="text-muted d-block">
                  Unit: {f.unit}
                  {f.calories_per_unit != null && ` · ${f.calories_per_unit} cal/${f.unit}`}
                </small>
              </div>
              <a href={`/foods/${f.id}/edit`} class="btn btn-sm btn-outline-secondary">
                Edit
              </a>
            </div>
          ))}
        </div>
      )}
    </div>,
    { title: "Dogfood — Foods" }
  )
})

foodsRoutes.get("/foods/new", (c) => {
  const category = (c.req.query("category") as FoodCategory) || "meal"

  return c.render(
    <div>
      <h2>Add Food</h2>
      <div class="row">
        <div class="col-md-6">
          <form method="post" action="/foods/new">
            <div class="mb-3">
              <label for="name" class="form-label">
                Name
              </label>
              <input type="text" class="form-control" id="name" name="name" required />
            </div>
            <div class="row mb-3">
              <div class="col-md-6">
                <label for="brand" class="form-label">
                  Brand
                </label>
                <input type="text" class="form-control" id="brand" name="brand" />
              </div>
              <div class="col-md-6">
                <label for="category" class="form-label">
                  Category
                </label>
                <select class="form-select" id="category" name="category">
                  <option value="meal" selected={category === "meal"}>
                    Meal
                  </option>
                  <option value="treat" selected={category === "treat"}>
                    Treat
                  </option>
                </select>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6">
                <label for="unit" class="form-label">
                  Unit
                </label>
                <input
                  type="text"
                  class="form-control"
                  id="unit"
                  name="unit"
                  value="cups"
                  placeholder="cups, pieces, oz, etc."
                  required
                />
              </div>
              <div class="col-md-6">
                <label for="calories_per_unit" class="form-label">
                  Calories per unit
                </label>
                <input
                  type="number"
                  step="0.1"
                  class="form-control"
                  id="calories_per_unit"
                  name="calories_per_unit"
                />
              </div>
            </div>
            <div class="mb-3">
              <label for="notes" class="form-label">
                Notes
              </label>
              <textarea class="form-control" id="notes" name="notes" rows={2}></textarea>
            </div>
            <button type="submit" class="btn btn-success">
              Add Food
            </button>
            <a href="/foods" class="btn btn-outline-secondary ms-2">
              Cancel
            </a>
          </form>
        </div>
      </div>
    </div>,
    { title: "Dogfood — Add Food" }
  )
})

foodsRoutes.post("/foods/new", async (c) => {
  const body = await c.req.parseBody()

  createFood({
    name: body.name as string,
    brand: (body.brand as string) || undefined,
    category: (body.category as FoodCategory) || "meal",
    unit: (body.unit as string) || "cups",
    calories_per_unit: body.calories_per_unit
      ? parseFloat(body.calories_per_unit as string)
      : undefined,
    notes: (body.notes as string) || undefined,
  })

  return c.redirect("/foods")
})

foodsRoutes.get("/foods/:id/edit", (c) => {
  const food = getFood(c.req.param("id"))
  if (!food) return c.text("Not found", 404)

  return c.render(
    <div>
      <h2>Edit Food</h2>
      <div class="row">
        <div class="col-md-6">
          <form method="post" action={`/foods/${food.id}/edit`}>
            <div class="mb-3">
              <label for="name" class="form-label">
                Name
              </label>
              <input
                type="text"
                class="form-control"
                id="name"
                name="name"
                value={food.name}
                required
              />
            </div>
            <div class="row mb-3">
              <div class="col-md-6">
                <label for="brand" class="form-label">
                  Brand
                </label>
                <input
                  type="text"
                  class="form-control"
                  id="brand"
                  name="brand"
                  value={food.brand ?? ""}
                />
              </div>
              <div class="col-md-6">
                <label for="category" class="form-label">
                  Category
                </label>
                <select class="form-select" id="category" name="category">
                  <option value="meal" selected={food.category === "meal"}>
                    Meal
                  </option>
                  <option value="treat" selected={food.category === "treat"}>
                    Treat
                  </option>
                </select>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6">
                <label for="unit" class="form-label">
                  Unit
                </label>
                <input
                  type="text"
                  class="form-control"
                  id="unit"
                  name="unit"
                  value={food.unit}
                  required
                />
              </div>
              <div class="col-md-6">
                <label for="calories_per_unit" class="form-label">
                  Calories per unit
                </label>
                <input
                  type="number"
                  step="0.1"
                  class="form-control"
                  id="calories_per_unit"
                  name="calories_per_unit"
                  value={food.calories_per_unit ?? ""}
                />
              </div>
            </div>
            <div class="mb-3">
              <label for="notes" class="form-label">
                Notes
              </label>
              <textarea class="form-control" id="notes" name="notes" rows={2}>
                {food.notes ?? ""}
              </textarea>
            </div>
            <button type="submit" class="btn btn-primary">
              Save
            </button>
            <a href="/foods" class="btn btn-outline-secondary ms-2">
              Cancel
            </a>
            <button
              type="button"
              hx-delete={`/foods/${food.id}`}
              hx-confirm="Delete this food? Existing entries won't be affected."
              class="btn btn-outline-danger ms-2"
            >
              Delete
            </button>
          </form>
        </div>
      </div>
    </div>,
    { title: `Dogfood — Edit ${food.name}` }
  )
})

foodsRoutes.post("/foods/:id/edit", async (c) => {
  const id = c.req.param("id")
  const body = await c.req.parseBody()

  updateFood(id, {
    name: body.name as string,
    brand: (body.brand as string) || undefined,
    category: (body.category as FoodCategory) || "meal",
    unit: (body.unit as string) || "cups",
    calories_per_unit: body.calories_per_unit
      ? parseFloat(body.calories_per_unit as string)
      : undefined,
    notes: (body.notes as string) || undefined,
  })

  return c.redirect("/foods")
})

foodsRoutes.delete("/foods/:id", (c) => {
  deleteFood(c.req.param("id"))
  c.header("HX-Redirect", "/foods")
  return c.body(null, 200)
})
