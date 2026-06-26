-- ============================================================
-- Prevail Prayer — Prayer Updates (progress notes & praise reports)
-- Run once in Supabase → SQL Editor. Safe to re-run.
-- Lets users add updates to a prayer request without removing it
-- from their list (e.g., "moved to rehab — praise God for progress").
-- ============================================================
CREATE TABLE IF NOT EXISTS prayer_updates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id UUID NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note              TEXT NOT NULL,
  is_praise         BOOLEAN DEFAULT FALSE,   -- a thanksgiving / step in the right direction
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS prayer_updates_request_idx
  ON prayer_updates (prayer_request_id, created_at DESC);

ALTER TABLE prayer_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own prayer updates" ON prayer_updates;
CREATE POLICY "Users manage own prayer updates"
  ON prayer_updates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
