interface DatetimeInputProps {
  name: string
  value?: string
  id?: string
}

export const DatetimeInput = ({ name, value, id }: DatetimeInputProps) => {
  const inputId = id || name

  return (
    <div>
      <label for={inputId} class="form-label">
        When
      </label>
      <div class="input-group">
        <input
          type="datetime-local"
          class="form-control"
          id={inputId}
          name={name}
          value={value || ""}
        />
        <button
          type="button"
          class="btn btn-outline-secondary"
          onclick={`document.getElementById('${inputId}').value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)`}
        >
          Now
        </button>
      </div>
    </div>
  )
}
