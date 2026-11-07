CREATE TABLE IF NOT EXISTS community_books (
  id TEXT PRIMARY KEY,
  owner_uid TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  subject TEXT NOT NULL,
  track TEXT NOT NULL CHECK (track IN ('PCM', 'PCB', 'Commerce', 'Humanities')),
  grade TEXT NOT NULL CHECK (grade IN ('XI', 'XII', 'SUPPLEMENTAL')),
  description TEXT NOT NULL,
  license TEXT NOT NULL CHECK (license IN ('CC-BY', 'CC-BY-SA', 'PUBLIC-DOMAIN', 'OER')),
  object_key TEXT NOT NULL UNIQUE,
  file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 20971520),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewer_uid TEXT
);

CREATE INDEX IF NOT EXISTS idx_community_books_status_created
  ON community_books(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_books_owner_created
  ON community_books(owner_uid, created_at DESC);
