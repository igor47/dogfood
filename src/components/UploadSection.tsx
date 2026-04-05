import type { Upload } from "@src/db/uploads"

interface UploadSectionProps {
  uploads?: Upload[]
}

function isImage(contentType: string): boolean {
  return contentType.startsWith("image/")
}

export const UploadSection = ({ uploads }: UploadSectionProps) => {
  const hasUploads = uploads && uploads.length > 0

  return (
    <div class="mb-3">
      <label class="form-label" for="files">
        Attachments
      </label>

      {hasUploads && (
        <div class="mb-2">
          {uploads.map((u) => (
            <div class="d-flex align-items-center gap-2 mb-1 p-2 border rounded">
              {isImage(u.content_type) ? (
                <a href={`/uploads/${u.id}`} target="_blank" rel="noopener">
                  <img
                    src={`/uploads/${u.id}`}
                    alt={u.original_filename}
                    style="max-width: 80px; max-height: 60px; object-fit: cover;"
                    class="rounded"
                  />
                </a>
              ) : (
                <i class="bi bi-file-earmark-pdf fs-4 text-danger"></i>
              )}
              <div class="flex-grow-1">
                <a href={`/uploads/${u.id}`} target="_blank" rel="noopener" class="text-break">
                  {u.original_filename}
                </a>
                <small class="text-muted d-block">{Math.round(u.size_bytes / 1024)} KB</small>
              </div>
              <button
                type="button"
                hx-delete={`/uploads/${u.id}`}
                hx-confirm="Delete this attachment?"
                class="btn btn-sm btn-outline-danger"
              >
                <i class="bi bi-trash"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        type="file"
        class="form-control"
        id="files"
        name="files"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heif,application/pdf"
      />
      <small class="text-muted">Images or PDF, max 10MB each</small>
    </div>
  )
}
