-- ============================================================
-- Income Chase Buddy — Clean Schema (single migration)
-- Run this in the Supabase SQL Editor.
--
-- Philosophy:
--   • Supabase handles auth (auth.users) — we do NOT touch it.
--   • No trigger on auth.users for profile creation.
--   • The client app creates the profile row after signup.
--   • All app tables live in the public schema with RLS.
--   • Self-referencing RLS policies use SECURITY DEFINER
--     helper functions to avoid infinite recursion.
-- ============================================================


-- ── 0. Clean up broken trigger ────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();


-- ── 1. Helper functions (SECURITY DEFINER) ────────────────────
-- These bypass RLS internally so that policies on race_members
-- and income_records can check membership without recursion.

CREATE OR REPLACE FUNCTION public.is_race_member(p_race_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM race_members
    WHERE race_id = p_race_id
      AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.shares_race_with(p_user_id uuid, p_current_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM race_members rm1
    JOIN race_members rm2 ON rm1.race_id = rm2.race_id
    WHERE rm1.user_id = p_user_id
      AND rm2.user_id = p_current_user_id
  );
$$;


-- ── 2. profiles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      text UNIQUE NOT NULL,
  avatar_url    text,
  monthly_goal  numeric NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop old broad policy
DROP POLICY IF EXISTS "profiles: own write" ON profiles;

-- Anyone can read any profile (leaderboards, feed, etc.)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles: anyone read' AND tablename = 'profiles') THEN
    CREATE POLICY "profiles: anyone read"
      ON profiles FOR SELECT
      USING (true);
  END IF;
END $$;

-- Users can insert their own profile (signup)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles: self insert' AND tablename = 'profiles') THEN
    CREATE POLICY "profiles: self insert"
      ON profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Users can update their own profile (settings)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles: self update' AND tablename = 'profiles') THEN
    CREATE POLICY "profiles: self update"
      ON profiles FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Users can delete their own profile
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles: self delete' AND tablename = 'profiles') THEN
    CREATE POLICY "profiles: self delete"
      ON profiles FOR DELETE
      USING (auth.uid() = id);
  END IF;
END $$;


-- ── 3. races ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS races (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  description    text,
  invite_code    text UNIQUE NOT NULL,
  owner_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_amount  numeric NOT NULL DEFAULT 0,
  month_year     text NOT NULL,          -- "2026-06"
  is_active      boolean DEFAULT true,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE races ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "races: member read"          ON races;
DROP POLICY IF EXISTS "races: owner write"          ON races;
DROP POLICY IF EXISTS "races: public invite lookup" ON races;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'races: public read active' AND tablename = 'races') THEN
    CREATE POLICY "races: public read active"
      ON races FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'races: owner insert' AND tablename = 'races') THEN
    CREATE POLICY "races: owner insert"
      ON races FOR INSERT
      WITH CHECK (auth.uid() = owner_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'races: owner update' AND tablename = 'races') THEN
    CREATE POLICY "races: owner update"
      ON races FOR UPDATE
      USING (auth.uid() = owner_id)
      WITH CHECK (auth.uid() = owner_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'races: owner delete' AND tablename = 'races') THEN
    CREATE POLICY "races: owner delete"
      ON races FOR DELETE
      USING (auth.uid() = owner_id);
  END IF;
END $$;


-- ── 4. race_members ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS race_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id    uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at  timestamptz DEFAULT now(),
  UNIQUE (race_id, user_id)
);

ALTER TABLE race_members ENABLE ROW LEVEL SECURITY;

-- Uses is_race_member() helper to avoid infinite recursion
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'race_members: peer read' AND tablename = 'race_members') THEN
    CREATE POLICY "race_members: peer read"
      ON race_members FOR SELECT
      USING (
        user_id = auth.uid()
        OR public.is_race_member(race_id, auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'race_members: self join' AND tablename = 'race_members') THEN
    CREATE POLICY "race_members: self join"
      ON race_members FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'race_members: self leave' AND tablename = 'race_members') THEN
    CREATE POLICY "race_members: self leave"
      ON race_members FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'race_members: owner remove' AND tablename = 'race_members') THEN
    CREATE POLICY "race_members: owner remove"
      ON race_members FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM races
          WHERE races.id = race_members.race_id
            AND races.owner_id = auth.uid()
        )
      );
  END IF;
END $$;


-- ── 5. income_records ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS income_records (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount       numeric NOT NULL CHECK (amount > 0),
  description  text,
  recorded_at  timestamptz DEFAULT now()
);

ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;

-- Drop old broad policy
DROP POLICY IF EXISTS "income_records: own write" ON income_records;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'income_records: own read' AND tablename = 'income_records') THEN
    CREATE POLICY "income_records: own read"
      ON income_records FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Uses shares_race_with() helper to avoid recursion
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'income_records: race peer read' AND tablename = 'income_records') THEN
    CREATE POLICY "income_records: race peer read"
      ON income_records FOR SELECT
      USING (
        public.shares_race_with(user_id, auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'income_records: self insert' AND tablename = 'income_records') THEN
    CREATE POLICY "income_records: self insert"
      ON income_records FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'income_records: self update' AND tablename = 'income_records') THEN
    CREATE POLICY "income_records: self update"
      ON income_records FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'income_records: self delete' AND tablename = 'income_records') THEN
    CREATE POLICY "income_records: self delete"
      ON income_records FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;


-- ── 6. Storage: avatars bucket ────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'avatars: authenticated upload' AND tablename = 'objects') THEN
    CREATE POLICY "avatars: authenticated upload"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'avatars: public read' AND tablename = 'objects') THEN
    CREATE POLICY "avatars: public read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'avatars: authenticated update' AND tablename = 'objects') THEN
    CREATE POLICY "avatars: authenticated update"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
      )
      WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;


-- ── 7. Realtime ───────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE income_records;
