-- ============================================================
-- NewMomCircle — Initial Schema
-- Apply via: Supabase Dashboard → SQL Editor → Run
-- Or:        npx supabase db push --db-url "$DATABASE_URL"
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Shared: auto-update updated_at ──────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ════════════════════════════════════════════════════════════
-- PROFILES
-- One row per auth.users row. Created automatically on signup.
-- ════════════════════════════════════════════════════════════
CREATE TABLE public.profiles (
  id                    UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT        NOT NULL,
  display_name          TEXT        NOT NULL,
  photo_url             TEXT,
  baby_dob              TEXT,
  language              TEXT        NOT NULL DEFAULT 'en',
  role                  TEXT        NOT NULL DEFAULT 'member',
  allow_retraining      BOOLEAN     NOT NULL DEFAULT false,
  gdpr_delete_requested BOOLEAN     NOT NULL DEFAULT false,
  gdpr_requested_at     TIMESTAMPTZ,
  deleted_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"  ON public.profiles FOR SELECT  TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"  ON public.profiles FOR INSERT  TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE  TO authenticated USING (auth.uid() = id);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile row when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, language, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ════════════════════════════════════════════════════════════
-- POSTS
-- Community feed. liked_by stores user IDs as text array.
-- Any authenticated user can update (needed for likes).
-- Author-only delete is enforced by the API (.eq author_id).
-- ════════════════════════════════════════════════════════════
CREATE TABLE public.posts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name     TEXT        NOT NULL,
  author_initials TEXT        NOT NULL,
  author_photo_url TEXT,
  content         TEXT        NOT NULL,
  image_url       TEXT,
  like_count      INTEGER     NOT NULL DEFAULT 0,
  comment_count   INTEGER     NOT NULL DEFAULT 0,
  liked_by        TEXT[]      NOT NULL DEFAULT '{}',
  is_anonymous    BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select_all"        ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "posts_insert_own"        ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update_any_authed" ON public.posts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "posts_delete_own"        ON public.posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE INDEX idx_posts_author_id  ON public.posts(author_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);

CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ════════════════════════════════════════════════════════════
-- COMMENTS
-- ════════════════════════════════════════════════════════════
CREATE TABLE public.comments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name     TEXT        NOT NULL,
  author_initials TEXT        NOT NULL,
  content         TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_all"  ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert_own"  ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_delete_own"  ON public.comments FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE INDEX idx_comments_post_id ON public.comments(post_id);


-- ════════════════════════════════════════════════════════════
-- JOURNAL ENTRIES
-- Private per-user. Sentiment fields filled by Edge Function.
-- ════════════════════════════════════════════════════════════
CREATE TABLE public.journal_entries (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content          TEXT        NOT NULL,
  mood             TEXT,
  word_count       INTEGER     NOT NULL DEFAULT 0,
  language         TEXT        NOT NULL DEFAULT 'en',
  sentiment        TEXT,
  sentiment_score  NUMERIC,
  sentiment_advice TEXT,
  suggested_coping TEXT,
  allow_retraining BOOLEAN     NOT NULL DEFAULT false,
  analyzed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_select_own"  ON public.journal_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "journal_insert_own"  ON public.journal_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journal_update_own"  ON public.journal_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "journal_delete_own"  ON public.journal_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_journal_user_id    ON public.journal_entries(user_id);
CREATE INDEX idx_journal_created_at ON public.journal_entries(created_at DESC);


-- ════════════════════════════════════════════════════════════
-- GUARDIANS
-- Safety circle contacts for SOS alerts.
-- ════════════════════════════════════════════════════════════
CREATE TABLE public.guardians (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  phone        TEXT        NOT NULL,
  relationship TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guardians_select_own" ON public.guardians FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "guardians_insert_own" ON public.guardians FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "guardians_delete_own" ON public.guardians FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_guardians_user_id ON public.guardians(user_id);


-- ════════════════════════════════════════════════════════════
-- RESOURCES
-- Wellness library. Submissions are always pending until an
-- admin (service role) sets is_approved = true.
-- ════════════════════════════════════════════════════════════
CREATE TABLE public.resources (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  content      TEXT        NOT NULL,
  image_url    TEXT,
  category     TEXT        NOT NULL,
  language     TEXT        NOT NULL DEFAULT 'en',
  submitted_by TEXT        NOT NULL,
  is_approved  BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resources_select_approved"  ON public.resources FOR SELECT TO authenticated USING (is_approved = true);
CREATE POLICY "resources_insert_authed"    ON public.resources FOR INSERT TO authenticated WITH CHECK (true);

-- Force is_approved = false on all non-service-role inserts
CREATE OR REPLACE FUNCTION public.ensure_resource_pending()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF auth.role() != 'service_role' THEN
    NEW.is_approved = false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_resource_pending
  BEFORE INSERT ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.ensure_resource_pending();

CREATE INDEX idx_resources_approved  ON public.resources(is_approved);
CREATE INDEX idx_resources_category  ON public.resources(category);
CREATE INDEX idx_resources_language  ON public.resources(language);

CREATE TRIGGER trg_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ════════════════════════════════════════════════════════════
-- SOS EVENTS
-- Log of triggered SOS alerts. Writes come from the
-- send-sos-alert Edge Function (service role) or directly
-- from the client when the Edge Function is not yet deployed.
-- ════════════════════════════════════════════════════════════
CREATE TABLE public.sos_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  triggered_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  recipient_count INTEGER     NOT NULL DEFAULT 0,
  method          TEXT        NOT NULL DEFAULT 'button',
  status          TEXT        NOT NULL DEFAULT 'sent',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sos_select_own" ON public.sos_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sos_insert_own" ON public.sos_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_sos_user_id ON public.sos_events(user_id);


-- ════════════════════════════════════════════════════════════
-- TOOLBOX PROGRESS
-- Tracks completion of wellness toolbox items per user.
-- ════════════════════════════════════════════════════════════
CREATE TABLE public.toolbox_progress (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  toolbox_id   TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'not_started',
  completed_at TIMESTAMPTZ,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, toolbox_id)
);

ALTER TABLE public.toolbox_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "toolbox_select_own" ON public.toolbox_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "toolbox_insert_own" ON public.toolbox_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "toolbox_update_own" ON public.toolbox_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_toolbox_user_id ON public.toolbox_progress(user_id);


-- ════════════════════════════════════════════════════════════
-- MENTOR REQUESTS
-- Peer support connection requests. Assignment is done by
-- admin via service role (mentor_id set server-side).
-- ════════════════════════════════════════════════════════════
CREATE TABLE public.mentor_requests (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  phone       TEXT        NOT NULL,
  message     TEXT        NOT NULL DEFAULT '',
  status      TEXT        NOT NULL DEFAULT 'pending',
  mentor_id   UUID        REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.mentor_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mentor_req_select_own" ON public.mentor_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "mentor_req_insert_own" ON public.mentor_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_mentor_req_user_id ON public.mentor_requests(user_id);
CREATE INDEX idx_mentor_req_status  ON public.mentor_requests(status);


-- ════════════════════════════════════════════════════════════
-- REALTIME
-- Enable realtime events for feed and comments.
-- ════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;


-- ════════════════════════════════════════════════════════════
-- STORAGE
-- post-images bucket: public read, authenticated write.
-- ════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_post_images_select"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'post-images');

CREATE POLICY "storage_post_images_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-images');

CREATE POLICY "storage_post_images_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'post-images');
