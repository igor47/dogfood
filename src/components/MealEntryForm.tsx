import type { Food } from "@src/db/foods"

interface MealEntryFormProps {
  foods: Food[]
}

export const MealEntryForm = ({ foods }: MealEntryFormProps) => {
  return (
    <form hx-post="/entries/new/meal" hx-target="#form-result" hx-swap="innerHTML">
      {foods.length === 0 ? (
        <div class="alert alert-warning">
          No meal foods defined yet. <a href="/foods/new?category=meal">Add a food first</a>.
        </div>
      ) : (
        <>
          <div class="mb-3">
            <label for="food_id" class="form-label">
              Food
            </label>
            <select class="form-select" id="food_id" name="food_id" required>
              <option value="">-- select food --</option>
              {foods.map((f) => (
                <option value={f.id} data-unit={f.unit} data-cal={f.calories_per_unit ?? ""}>
                  {f.name}
                  {f.brand && ` (${f.brand})`} — per {f.unit}
                  {f.calories_per_unit != null && `, ${f.calories_per_unit} cal`}
                </option>
              ))}
            </select>
          </div>

          <div class="row mb-3">
            <div class="col-md-6">
              <label for="quantity" class="form-label">
                Quantity
              </label>
              <input
                type="number"
                step="0.1"
                class="form-control"
                id="quantity"
                name="quantity"
                required
              />
            </div>
            <div class="col-md-6">
              <label for="meal_time" class="form-label">
                When
              </label>
              <input type="datetime-local" class="form-control" id="meal_time" name="meal_time" />
            </div>
          </div>

          <div class="mb-3">
            <label for="notes" class="form-label">
              Notes
            </label>
            <textarea class="form-control" id="notes" name="notes" rows={2}></textarea>
          </div>

          <button type="submit" class="btn btn-success">
            <i class="bi bi-plus-lg"></i> Log Meal
          </button>
        </>
      )}
    </form>
  )
}
