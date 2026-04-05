import type { FoodEntry } from "@src/db/food-entries"
import type { Food } from "@src/db/foods"
import type { Upload } from "@src/db/uploads"
import { toLocalInputValue } from "@src/lib/dates"
import { UploadSection } from "./UploadSection"

interface MealEntryFormProps {
  foods: Food[]
  entry?: FoodEntry
  uploads?: Upload[]
}

export const MealEntryForm = ({ foods, entry, uploads }: MealEntryFormProps) => {
  const action = entry ? `/entries/meal/${entry.id}/edit` : "/entries/new/meal"
  const submitLabel = entry ? "Save" : "Log Meal"

  return (
    <form
      hx-post={action}
      hx-target="#form-result"
      hx-swap="innerHTML"
      hx-encoding="multipart/form-data"
    >
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
                <option
                  value={f.id}
                  selected={entry?.food_id === f.id}
                  data-unit={f.unit}
                  data-cal={f.calories_per_unit ?? ""}
                >
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
                value={entry?.quantity ?? ""}
                required
              />
            </div>
            <div class="col-md-6">
              <label for="meal_time" class="form-label">
                When
              </label>
              <input
                type="datetime-local"
                class="form-control"
                id="meal_time"
                name="meal_time"
                value={entry ? toLocalInputValue(entry.meal_time) : ""}
              />
            </div>
          </div>

          <div class="mb-3">
            <label for="notes" class="form-label">
              Notes
            </label>
            <textarea class="form-control" id="notes" name="notes" rows={2}>
              {entry?.notes ?? ""}
            </textarea>
          </div>

          <UploadSection uploads={uploads} />

          <button type="submit" class="btn btn-success">
            {submitLabel}
          </button>
          {entry && (
            <>
              <a href="/" class="btn btn-outline-secondary ms-2">
                Cancel
              </a>
              <button
                type="button"
                hx-delete={`/entries/food/${entry.id}`}
                hx-confirm="Delete this entry?"
                hx-target="#form-result"
                hx-swap="innerHTML"
                class="btn btn-outline-danger ms-2"
              >
                Delete
              </button>
            </>
          )}
        </>
      )}
    </form>
  )
}
