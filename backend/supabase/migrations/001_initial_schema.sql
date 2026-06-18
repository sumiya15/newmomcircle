-- ============================================================
-- NewMomCircle — Initial Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profiles ────────────────────────────────────────────────────────────────
-- Extends auth.users — created automatically after Auth signup via trigger.
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT        NOT NULL,
  display_name    TEXT        NOT NULL,
  photo_url       TEXT,
  baby_dob        TEXT,
  language        TEXT        NOT NULL DEFAULT 'en' CHECK (language IN ('en','hi','te','ta','kn')),
  role            TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('member','volunteer','admin')),
  allow_retraining            BOOLEAN NOT NULL DEFAULT FALSE,
  gdpr_delete_requested       BOOLEAN NOT NULL DEFAULT FALSE,
  gdpr_requested_at           TIMESTAMPTZ,
  deleted_at                  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile row when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Posts ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.posts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name     TEXT        NOT NULL,
  author_initials TEXT        NOT NULL,
  author_photo_url TEXT,
  content         TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  image_url       TEXT,
  like_count      INTEGER     NOT NULL DEFAULT 0 CHECK (like_count >= 0),
  comment_count   INTEGER     NOT NULL DEFAULT 0 CHECK (comment_count >= 0),
  liked_by        UUID[]      NOT NULL DEFAULT '{}',
  is_anonymous    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Comments ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id       UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name     TEXT        NOT NULL,
  author_initials TEXT        NOT NULL,
  content         TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Increment comment count when a comment is added
CREATE OR REPLACE FUNCTION public.increment_comment_count(post_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = post_id;
END;
$$;

-- ─── Journal Entries ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content           TEXT        NOT NULL CHECK (char_length(content) >= 10),
  mood              TEXT        CHECK (mood IN ('very_low','low','neutral','good','great')),
  word_count        INTEGER     NOT NULL DEFAULT 0,
  language          TEXT        NOT NULL DEFAULT 'en',
  sentiment         TEXT        CHECK (sentiment IN ('positive','neutral','negative')),
  sentiment_score   NUMERIC(5,2) CHECK (sentiment_score BETWEEN 0 AND 1),
  sentiment_advice  TEXT,
  suggested_coping  TEXT,
  allow_retraining  BOOLEAN     NOT NULL DEFAULT FALSE,
  analyzed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Guardians ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.guardians (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  phone        TEXT        NOT NULL CHECK (phone ~ '^\+?[1-9]\d{9,14}$'),
  relationship TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Resources ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resources (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL CHECK (char_length(title) BETWEEN 5 AND 200),
  content      TEXT        NOT NULL CHECK (char_length(content) >= 50),
  image_url    TEXT,
  category     TEXT        NOT NULL,
  language     TEXT        NOT NULL DEFAULT 'en' CHECK (language IN ('en','hi','te','ta','kn')),
  submitted_by UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_approved  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SOS Events (audit log — write only via Edge Function) ───────────────────
CREATE TABLE IF NOT EXISTS public.sos_events (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  triggered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recipient_count INTEGER    NOT NULL DEFAULT 0,
  method         TEXT        NOT NULL DEFAULT 'button' CHECK (method IN ('button','shake')),
  status         TEXT        NOT NULL CHECK (status IN ('sent','mocked','failed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Toolbox Progress ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.toolbox_progress (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  toolbox_id   TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  completed_at TIMESTAMPTZ,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, toolbox_id)
);

-- ─── Mentor Requests ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mentor_requests (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  phone       TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','connected','closed')),
  mentor_id   UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
