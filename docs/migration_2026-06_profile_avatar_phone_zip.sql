-- ============================================================
-- Prevail Prayer — Migration: profile fields, avatars, signup metadata
-- Run this ONCE in Supabase → SQL Editor → New Query → Paste → Run.
-- Safe to re-run (idempotent).
-- ============================================================

-- ── 1. Profile columns: phone, zip_code, avatar_url, last_active_at ─────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone           TEXT,
  ADD COLUMN IF NOT EXISTS zip_code        TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url      TEXT,
  ADD COLUMN IF NOT EXISTS last_active_at  TIMESTAMPTZ;

-- ── 2. handle_new_user: copy display_name / phone / zip from signup metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, phone, zip_code)
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data ->> 'display_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'zip_code', '')
  )
  ON CONFLICT (id) DO UPDATE
    SET display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
        phone        = COALESCE(EXCLUDED.phone,        profiles.phone),
        zip_code     = COALESCE(EXCLUDED.zip_code,     profiles.zip_code);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 3. Avatars storage bucket (public read) ─────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;
CREATE POLICY "Avatar images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ── 4. Admin access ─────────────────────────────────────────────────────────
-- The admin web panel reads all profiles using the SERVICE ROLE key
-- (set SUPABASE_SERVICE_ROLE_KEY in Vercel), which bypasses RLS safely.
-- We intentionally do NOT add an is_admin RLS policy on profiles here,
-- because a policy that subqueries profiles causes infinite recursion.

-- ============================================================
-- DONE.  New columns: phone, zip_code, avatar_url, last_active_at
--        New bucket: avatars (+ 4 storage policies)
--        Updated: handle_new_user()
-- ============================================================
