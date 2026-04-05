-- Create symptom_entries table
CREATE TABLE symptom_entries (
  id TEXT PRIMARY KEY,
  dog_id TEXT NOT NULL REFERENCES dogs(id),
  symptom_type TEXT NOT NULL,
  severity INTEGER NOT NULL DEFAULT 3,
  occurred_at TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_symptom_entries_dog_time ON symptom_entries(dog_id, occurred_at);

-- Create event_entries table
CREATE TABLE event_entries (
  id TEXT PRIMARY KEY,
  dog_id TEXT NOT NULL REFERENCES dogs(id),
  event_type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  notes TEXT,
  weight_kg REAL,
  medication_name TEXT,
  medication_dose TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_event_entries_dog_time ON event_entries(dog_id, occurred_at);

-- Migrate symptom-like entries
INSERT INTO symptom_entries (id, dog_id, symptom_type, severity, occurred_at, notes, created_at)
SELECT id, dog_id,
  CASE entry_type
    WHEN 'energy' THEN 'energy_level'
    WHEN 'activity' THEN 'energy_level'
    WHEN 'lethargy' THEN 'energy_level'
    ELSE entry_type
  END,
  severity, occurred_at, notes, created_at
FROM health_entries
WHERE entry_type IN ('energy', 'activity', 'vomiting', 'gas', 'appetite_change', 'lethargy', 'other');

-- Migrate event-like entries
INSERT INTO event_entries (id, dog_id, event_type, occurred_at, notes, created_at)
SELECT id, dog_id,
  CASE entry_type
    WHEN 'weight' THEN 'weight_check'
    ELSE entry_type
  END,
  occurred_at, notes, created_at
FROM health_entries
WHERE entry_type IN ('weight', 'medication', 'vet_visit');

-- Drop old table
DROP TABLE health_entries;
