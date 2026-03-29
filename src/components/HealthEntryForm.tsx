import { HEALTH_ENTRY_TYPES, SEVERITY_LEVELS } from "@src/db/health-entries"

export const HealthEntryForm = () => {
  return (
    <form hx-post="/entries/new/health" hx-target="#form-result" hx-swap="innerHTML">
      <div class="row mb-3">
        <div class="col-md-6">
          <label for="entry_type" class="form-label">
            Type
          </label>
          <select class="form-select" id="entry_type" name="entry_type" required>
            {HEALTH_ENTRY_TYPES.map((t) => (
              <option value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div class="col-md-6">
          <label for="severity" class="form-label">
            Severity / Level (1-5)
          </label>
          <select class="form-select" id="severity" name="severity">
            {SEVERITY_LEVELS.map((s) => (
              <option value={String(s.value)} selected={s.value === 3}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div class="mb-3">
        <label for="occurred_at" class="form-label">
          When
        </label>
        <input type="datetime-local" class="form-control" id="occurred_at" name="occurred_at" />
      </div>

      <div class="mb-3">
        <label for="notes" class="form-label">
          Notes
        </label>
        <textarea class="form-control" id="notes" name="notes" rows={2}></textarea>
      </div>

      <button type="submit" class="btn btn-info">
        <i class="bi bi-plus-lg"></i> Log Health Observation
      </button>
    </form>
  )
}
