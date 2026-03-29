CREATE TABLE foods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL DEFAULT 'meal',
  unit TEXT NOT NULL DEFAULT 'cups',
  calories_per_unit REAL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

ALTER TABLE food_entries ADD COLUMN food_id TEXT REFERENCES foods(id);
ALTER TABLE food_entries ADD COLUMN entry_kind TEXT NOT NULL DEFAULT 'meal';
ALTER TABLE food_entries ADD COLUMN quantity REAL;
ALTER TABLE food_entries ADD COLUMN calories REAL;
