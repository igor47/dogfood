import type { BowelEntry } from "@src/db/bowel-entries"
import { BOWEL_COLORS, CONSISTENCY_SCALE, URGENCY_LEVELS } from "@src/db/bowel-entries"
import { toLocalInputValue } from "@src/lib/dates"

interface BowelEntryFormProps {
  entry?: BowelEntry
}

export const BowelEntryForm = ({ entry }: BowelEntryFormProps) => {
  const action = entry ? `/entries/bowel/${entry.id}/edit` : "/entries/new/bowel"
  const submitLabel = entry ? "Save" : "Log Bowel Movement"

  return (
    <form hx-post={action} hx-target="#form-result" hx-swap="innerHTML">
      <fieldset class="mb-3">
        <legend class="form-label fs-6">Consistency (1-7)</legend>
        <div class="d-flex flex-column gap-1">
          {CONSISTENCY_SCALE.map((c) => (
            <div class="form-check">
              <input
                class="form-check-input"
                type="radio"
                name="consistency"
                id={`consistency-${c.value}`}
                value={String(c.value)}
                checked={entry?.consistency === c.value}
                required
              />
              <label class="form-check-label" for={`consistency-${c.value}`}>
                <strong>{c.value}</strong> &mdash; {c.label}
              </label>
            </div>
          ))}
        </div>
      </fieldset>

      <div class="row mb-3">
        <div class="col-md-6">
          <label for="color" class="form-label">
            Color
          </label>
          <select class="form-select" id="color" name="color">
            <option value="">-- select --</option>
            {BOWEL_COLORS.map((c) => (
              <option value={c.value} selected={entry?.color === c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div class="col-md-6">
          <label for="urgency" class="form-label">
            Urgency
          </label>
          <select class="form-select" id="urgency" name="urgency">
            {URGENCY_LEVELS.map((u) => (
              <option value={String(u.value)} selected={entry?.urgency === u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-md-4">
          <div class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              id="has_blood"
              name="has_blood"
              checked={entry?.has_blood === 1}
            />
            <label class="form-check-label" for="has_blood">
              Blood present
            </label>
          </div>
        </div>
        <div class="col-md-4">
          <div class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              id="has_mucus"
              name="has_mucus"
              checked={entry?.has_mucus === 1}
            />
            <label class="form-check-label" for="has_mucus">
              Mucus present
            </label>
          </div>
        </div>
        <div class="col-md-4">
          <div class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              id="straining"
              name="straining"
              checked={entry?.straining === 1}
            />
            <label class="form-check-label" for="straining">
              Straining
            </label>
          </div>
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
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
      </div>

      <div class="mb-3">
        <label for="notes" class="form-label">
          Notes
        </label>
        <textarea class="form-control" id="notes" name="notes" rows={2}>
          {entry?.notes ?? ""}
        </textarea>
      </div>

      <button type="submit" class="btn btn-warning">
        {submitLabel}
      </button>
      {entry && (
        <>
          <a href="/" class="btn btn-outline-secondary ms-2">
            Cancel
          </a>
          <button
            type="button"
            hx-delete={`/entries/bowel/${entry.id}`}
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
