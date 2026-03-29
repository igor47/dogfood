CREATE TABLE food_entries (
  id TEXT PRIMARY KEY,
  dog_id TEXT NOT NULL REFERENCES dogs(id),
  food_name TEXT NOT NULL,
  brand TEXT,
  food_type TEXT NOT NULL DEFAULT 'kibble',
  amount TEXT,
  unit TEXT,
  meal_time TEXT NOT NULL DEFAULT (datetime('now')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_food_entries_dog_time ON food_entries(dog_id, meal_time);
