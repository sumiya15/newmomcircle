-- ============================================================
-- NewMomCircle — Performance Indexes
-- ============================================================

-- Posts: feed query (most recent first)
CREATE INDEX IF NOT EXISTS idx_posts_created_at       ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_id        ON public.posts (author_id);

-- Comments: per-post thread query
CREATE INDEX IF NOT EXISTS idx_comments_post_id       ON public.comments (post_id, created_at ASC);

-- Journal: per-user entries (most recent first)
CREATE INDEX IF NOT EXISTS idx_journal_user_created   ON public.journal_entries (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_retraining     ON public.journal_entries (allow_retraining) WHERE allow_retraining = TRUE;

-- Guardians: per-user lookup
CREATE INDEX IF NOT EXISTS idx_guardians_user_id      ON public.guardians (user_id, created_at ASC);

-- Resources: approved + language filter
CREATE INDEX IF NOT EXISTS idx_resources_approved     ON public.resources (is_approved, language, created_at DESC);

-- SOS Events: user history
CREATE INDEX IF NOT EXISTS idx_sos_user_id            ON public.sos_events (user_id, triggered_at DESC);

-- Toolbox: user progress lookup
CREATE INDEX IF NOT EXISTS idx_toolbox_user           ON public.toolbox_progress (user_id);

-- Mentor Requests: user + status
CREATE INDEX IF NOT EXISTS idx_mentor_user_status     ON public.mentor_requests (user_id, status);
