CREATE TABLE health_entries (
  id TEXT PRIMARY KEY,
  dog_id TEXT NOT NULL REFERENCES dogs(id),
  entry_type TEXT NOT NULL,
  severity INTEGER NOT NULL DEFAULT 1,
  occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_health_entries_dog_time ON health_entries(dog_id, occurred_at);
