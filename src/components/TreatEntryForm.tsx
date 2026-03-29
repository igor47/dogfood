import type { Food } from "@src/db/foods"

interface TreatEntryFormProps {
  foods: Food[]
}

export const TreatEntryForm = ({ foods }: TreatEntryFormProps) => {
  return (
    <form hx-post="/entries/new/treat" hx-target="#form-result" hx-swap="innerHTML">
      <div class="mb-3">
        <label for="food_id" class="form-label">
          Treat
        </label>
        <select class="form-select" id="food_id" name="food_id">
          <option value="">-- free-form (enter below) --</option>
          {foods.map((f) => (
            <option value={f.id}>
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
          <input type="text" class="form-control" id="food_name" name="food_name" />
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
            value="1"
          />
        </div>
      </div>

      <div class="row mb-3">
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
        <i class="bi bi-plus-lg"></i> Log Treat
      </button>
    </form>
  )
}
