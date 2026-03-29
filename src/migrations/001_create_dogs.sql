CREATE TABLE dogs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  breed TEXT,
  birth_date TEXT,
  weight_kg REAL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
