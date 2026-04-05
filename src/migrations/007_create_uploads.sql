CREATE TABLE uploads (
  id TEXT PRIMARY KEY,
  original_filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE entry_uploads (
  entry_type TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  upload_id TEXT NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_type, entry_id, upload_id)
);

CREATE INDEX idx_entry_uploads_entry ON entry_uploads(entry_type, entry_id);
