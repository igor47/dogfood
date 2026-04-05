import type { FoodEntry } from "@src/db/food-entries"
import type { Food } from "@src/db/foods"
import type { Upload } from "@src/db/uploads"
import { toLocalInputValue } from "@src/lib/dates"
import { DatetimeInput } from "./DatetimeInput"
import { UploadSection } from "./UploadSection"

interface TreatEntryFormProps {
  foods: Food[]
  entry?: FoodEntry
  uploads?: Upload[]
}

export const TreatEntryForm = ({ foods, entry, uploads }: TreatEntryFormProps) => {
  const action = entry ? `/entries/treat/${entry.id}/edit` : "/entries/new/treat"
  const submitLabel = entry ? "Save" : "Log Treat"

  return (
    <form
      hx-post={action}
      hx-target="#form-result"
      hx-swap="innerHTML"
      hx-encoding="multipart/form-data"
    >
      <div class="mb-3">
        <label for="food_id" class="form-label">
          Treat
        </label>
        <select class="form-select" id="food_id" name="food_id">
          <option value="">-- free-form (enter below) --</option>
          {foods.map((f) => (
            <option value={f.id} selected={entry?.food_id === f.id}>
              {f.name}
              {f.brand && ` (${f.brand})`} — per {f.unit}
              {f.calories_per_unit != null && `, ${f.calories_per_unit} cal`}
            </option>
          ))}
        </select>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <label for="food_name" class="form-label">
            Name (if free-form)
          </label>
          <input
            type="text"
            class="form-control"
            id="food_name"
            name="food_name"
            value={entry && !entry.food_id ? entry.food_name : ""}
          />
        </div>
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
            value={entry?.quantity ?? "1"}
          />
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <DatetimeInput
            name="meal_time"
            value={entry ? toLocalInputValue(entry.meal_time) : undefined}
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
    </form>
  )
}
