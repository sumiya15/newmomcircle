-- ============================================================
-- NewMomCircle — Row Level Security Policies
-- ============================================================

-- ─── Profiles ────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"    ON public.profiles FOR SELECT  USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"    ON public.profiles FOR UPDATE  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- Prevent role escalation: users cannot set themselves to admin/volunteer
CREATE POLICY "profiles_no_role_escalation" ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Public read of display_name + photo_url for community features
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- ─── Posts ───────────────────────────────────────────────────────────────────
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select_auth"   ON public.posts FOR SELECT  USING (auth.role() = 'authenticated');
CREATE POLICY "posts_insert_own"    ON public.posts FOR INSERT  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update_own"    ON public.posts FOR UPDATE  USING (auth.uid() = author_id);
CREATE POLICY "posts_delete_own"    ON public.posts FOR DELETE  USING (auth.uid() = author_id);
-- Allow like updates (liked_by array) from any authenticated user
CREATE POLICY "posts_update_likes"  ON public.posts FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ─── Comments ────────────────────────────────────────────────────────────────
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_auth"  ON public.comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "comments_insert_own"   ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_delete_own"   ON public.comments FOR DELETE USING (auth.uid() = author_id);

-- ─── Journal Entries ─────────────────────────────────────────────────────────
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_all_own"   ON public.journal_entries FOR ALL USING (auth.uid() = user_id);

-- ─── Guardians ───────────────────────────────────────────────────────────────
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guardians_all_own" ON public.guardians FOR ALL USING (auth.uid() = user_id);

-- ─── Resources ───────────────────────────────────────────────────────────────
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resources_select_approved" ON public.resources FOR SELECT
  USING (is_approved = TRUE AND auth.role() = 'authenticated');
CREATE POLICY "resources_select_own_pending" ON public.resources FOR SELECT
  USING (auth.uid() = submitted_by);
CREATE POLICY "resources_insert_auth" ON public.resources FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
-- Only admins/volunteers can approve resources
CREATE POLICY "resources_update_admin" ON public.resources FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'volunteer')
  );
CREATE POLICY "resources_select_admin" ON public.resources FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'volunteer')
  );

-- ─── SOS Events ──────────────────────────────────────────────────────────────
ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own SOS history
CREATE POLICY "sos_select_own"   ON public.sos_events FOR SELECT  USING (auth.uid() = user_id);
-- NO client write access — Edge Function uses service role key
CREATE POLICY "sos_no_client_write" ON public.sos_events FOR INSERT WITH CHECK (FALSE);
CREATE POLICY "sos_no_client_update" ON public.sos_events FOR UPDATE USING (FALSE);

-- ─── Toolbox Progress ────────────────────────────────────────────────────────
ALTER TABLE public.toolbox_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "toolbox_all_own" ON public.toolbox_progress FOR ALL USING (auth.uid() = user_id);

-- ─── Mentor Requests ─────────────────────────────────────────────────────────
ALTER TABLE public.mentor_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mentor_all_own" ON public.mentor_requests FOR ALL USING (auth.uid() = user_id);
-- Volunteers/admins can read all requests
CREATE POLICY "mentor_select_admin" ON public.mentor_requests FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'volunteer')
  );
