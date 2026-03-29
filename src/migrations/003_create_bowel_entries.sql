CREATE TABLE bowel_entries (
  id TEXT PRIMARY KEY,
  dog_id TEXT NOT NULL REFERENCES dogs(id),
  consistency INTEGER NOT NULL,
  color TEXT,
  has_blood INTEGER NOT NULL DEFAULT 0,
  has_mucus INTEGER NOT NULL DEFAULT 0,
  straining INTEGER NOT NULL DEFAULT 0,
  urgency INTEGER NOT NULL DEFAULT 0,
  occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_bowel_entries_dog_time ON bowel_entries(dog_id, occurred_at);
