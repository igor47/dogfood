import type { HealthEntry } from "@src/db/health-entries"
import { HEALTH_ENTRY_TYPES, SEVERITY_LEVELS } from "@src/db/health-entries"
import { toLocalInputValue } from "@src/lib/dates"

interface HealthEntryFormProps {
  entry?: HealthEntry
}

export const HealthEntryForm = ({ entry }: HealthEntryFormProps) => {
  const action = entry ? `/entries/health/${entry.id}/edit` : "/entries/new/health"
  const submitLabel = entry ? "Save" : "Log Health Observation"

  return (
    <form hx-post={action} hx-target="#form-result" hx-swap="innerHTML">
      <div class="row mb-3">
        <div class="col-md-6">
          <label for="entry_type" class="form-label">
            Type
          </label>
          <select class="form-select" id="entry_type" name="entry_type" required>
            {HEALTH_ENTRY_TYPES.map((t) => (
              <option value={t.value} selected={entry?.entry_type === t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div class="col-md-6">
          <label for="severity" class="form-label">
            Severity / Level (1-5)
          </label>
          <select class="form-select" id="severity" name="severity">
            {SEVERITY_LEVELS.map((s) => (
              <option
                value={String(s.value)}
                selected={entry ? entry.severity === s.value : s.value === 3}
              >
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
        <input
          type="datetime-local"
          class="form-control"
          id="occurred_at"
          name="occurred_at"
          value={entry ? toLocalInputValue(entry.occurred_at) : ""}
        />
      </div>

      <div class="mb-3">
        <label for="notes" class="form-label">
          Notes
        </label>
        <textarea class="form-control" id="notes" name="notes" rows={2}>
          {entry?.notes ?? ""}
        </textarea>
      </div>

      <button type="submit" class="btn btn-info">
        {submitLabel}
      </button>
      {entry && (
        <>
          <a href="/" class="btn btn-outline-secondary ms-2">
            Cancel
          </a>
          <button
            type="button"
            hx-delete={`/entries/health/${entry.id}`}
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
