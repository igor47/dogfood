import type { EventEntry } from "@src/db/event-entries"
import { EVENT_TYPES } from "@src/db/event-entries"
import { toLocalInputValue } from "@src/lib/dates"

interface EventEntryFormProps {
  entry?: EventEntry
}

export const EventEntryForm = ({ entry }: EventEntryFormProps) => {
  const action = entry ? `/entries/event/${entry.id}/edit` : "/entries/new/event"
  const submitLabel = entry ? "Save" : "Log Event"

  return (
    <form hx-post={action} hx-target="#form-result" hx-swap="innerHTML">
      <div class="mb-3">
        <label for="event_type" class="form-label">
          Event Type
        </label>
        <select
          class="form-select"
          id="event_type"
          name="event_type"
          required
          hx-get="/entries/event-fields"
          hx-target="#event-extra-fields"
          hx-swap="innerHTML"
          hx-include="[name='event_type']"
        >
          {EVENT_TYPES.map((t) => (
            <option value={t.value} selected={entry?.event_type === t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div id="event-extra-fields">
        <EventExtraFields eventType={entry?.event_type ?? "medication"} entry={entry} />
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

      <button type="submit" class="btn btn-primary">
        {submitLabel}
      </button>
      {entry && (
        <>
          <a href="/" class="btn btn-outline-secondary ms-2">
            Cancel
          </a>
          <button
            type="button"
            hx-delete={`/entries/event/${entry.id}`}
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

export const EventExtraFields = ({
  eventType,
  entry,
}: {
  eventType: string
  entry?: EventEntry
}) => {
  if (eventType === "weight_check") {
    return (
      <div class="mb-3">
        <label for="weight_kg" class="form-label">
          Weight (kg)
        </label>
        <input
          type="number"
          step="0.1"
          class="form-control"
          id="weight_kg"
          name="weight_kg"
          value={entry?.weight_kg ?? ""}
        />
      </div>
    )
  }

  if (eventType === "medication") {
    return (
      <div class="row mb-3">
        <div class="col-md-6">
          <label for="medication_name" class="form-label">
            Medication
          </label>
          <input
            type="text"
            class="form-control"
            id="medication_name"
            name="medication_name"
            value={entry?.medication_name ?? ""}
          />
        </div>
        <div class="col-md-6">
          <label for="medication_dose" class="form-label">
            Dose
          </label>
          <input
            type="text"
            class="form-control"
            id="medication_dose"
            name="medication_dose"
            value={entry?.medication_dose ?? ""}
          />
        </div>
      </div>
    )
  }

  return <></>
}
