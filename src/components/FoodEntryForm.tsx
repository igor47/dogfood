import { FOOD_TYPES } from "@src/db/food-entries"

export const FoodEntryForm = () => {
  return (
    <form hx-post="/entries/new/food" hx-target="#form-result" hx-swap="innerHTML">
      <div class="mb-3">
        <label for="food_name" class="form-label">
          Food Name
        </label>
        <input type="text" class="form-control" id="food_name" name="food_name" required />
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <label for="food_type" class="form-label">
            Type
          </label>
          <select class="form-select" id="food_type" name="food_type">
            {FOOD_TYPES.map((t) => (
              <option value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div class="col-md-6">
          <label for="brand" class="form-label">
            Brand
          </label>
          <input type="text" class="form-control" id="brand" name="brand" />
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <label for="amount" class="form-label">
            Amount
          </label>
          <input
            type="text"
            class="form-control"
            id="amount"
            name="amount"
            placeholder='e.g. "1 cup", "3 pieces"'
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
        <i class="bi bi-plus-lg"></i> Log Food
      </button>
    </form>
  )
}
