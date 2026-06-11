-- ============================================================
-- RLS: vklopi Row Level Security na vseh javnih tabelah
-- Poženi v Supabase SQL Editor
-- ============================================================

-- ── 1. ENABLE RLS ────────────────────────────────────────────
ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_hints      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_elo         ENABLE ROW LEVEL SECURITY;

-- ── 2. MATCHES: vsi berejo, nihče ne piše iz fronta ──────────
DROP POLICY IF EXISTS "Matches are readable by everyone" ON public.matches;
CREATE POLICY "Matches are readable by everyone"
  ON public.matches FOR SELECT USING (true);

-- ── 3. MATCH_HINTS: berejo avtenticirani ─────────────────────
DROP POLICY IF EXISTS "match_hints_select" ON public.match_hints;
CREATE POLICY "match_hints_select"
  ON public.match_hints FOR SELECT USING (auth.role() = 'authenticated');

-- ── 4. TEAM_ELO: javno branje ────────────────────────────────
DROP POLICY IF EXISTS "team_elo_select" ON public.team_elo;
CREATE POLICY "team_elo_select"
  ON public.team_elo FOR SELECT USING (true);

-- ── 5. USERS ─────────────────────────────────────────────────
-- Brisanje starih/podvojenih politik
DROP POLICY IF EXISTS "Users can view opted-in users"            ON public.users;
DROP POLICY IF EXISTS "Users can update own profile"             ON public.users;
DROP POLICY IF EXISTS "Users can view cogroup member profiles"   ON public.users;
DROP POLICY IF EXISTS "Parent can manage their kids"             ON public.users;

-- SELECT: lastni profil + otroci starša + člani istih skupin + opted-in globalni
CREATE POLICY "users_select" ON public.users FOR SELECT USING (
  auth.uid() = id                          -- lastni profil
  OR auth.uid() = parent_user_id           -- starš vidi otroka
  OR is_global_opt_in = true               -- globalna lestvica
  OR id IN (                               -- sočlani skupin
    SELECT gm.user_id FROM public.group_members gm
    INNER JOIN public.group_members my ON gm.group_id = my.group_id
    WHERE my.user_id = auth.uid()
  )
);

-- INSERT: samo sistem (trigger handle_new_user) — ni politike za anon/auth INSERT
-- (service role bypasses RLS)

-- UPDATE: lastni profil ali starš za otroka
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (
  auth.uid() = id OR auth.uid() = parent_user_id
);

-- ── 6. PREDICTIONS ────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own predictions"                      ON public.predictions;
DROP POLICY IF EXISTS "Users can view other predictions if match is locked" ON public.predictions;
DROP POLICY IF EXISTS "Users can insert own predictions"                    ON public.predictions;
DROP POLICY IF EXISTS "Users can update own predictions"                    ON public.predictions;
DROP POLICY IF EXISTS "Users can insert own or kid predictions"             ON public.predictions;
DROP POLICY IF EXISTS "Users can update own or kid predictions"             ON public.predictions;

-- SELECT: lastne + otrokove + tekme ki so zaklenjene (za lestvico)
CREATE POLICY "predictions_select" ON public.predictions FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND parent_user_id = auth.uid()
  )
  OR match_id IN (
    SELECT id FROM public.matches WHERE status != 'Upcoming'
  )
);

-- INSERT: lastne ali otrokove, samo za Upcoming tekme
CREATE POLICY "predictions_insert" ON public.predictions FOR INSERT WITH CHECK (
  match_id IN (SELECT id FROM public.matches WHERE status = 'Upcoming')
  AND (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = user_id AND parent_user_id = auth.uid()
    )
  )
);

-- UPDATE: lastne ali otrokove, samo za Upcoming tekme
CREATE POLICY "predictions_update" ON public.predictions FOR UPDATE USING (
  match_id IN (SELECT id FROM public.matches WHERE status = 'Upcoming')
  AND (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = user_id AND parent_user_id = auth.uid()
    )
  )
);

-- ── 7. SPECIAL_PREDICTIONS ───────────────────────────────────
DROP POLICY IF EXISTS "Users can read own special predictions"      ON public.special_predictions;
DROP POLICY IF EXISTS "Users can insert own special predictions"    ON public.special_predictions;
DROP POLICY IF EXISTS "Users can update own special predictions"    ON public.special_predictions;
DROP POLICY IF EXISTS "Admins can read all special predictions"     ON public.special_predictions;
DROP POLICY IF EXISTS "Admins can update all special predictions"   ON public.special_predictions;
DROP POLICY IF EXISTS "Users can insert own or kid special predictions" ON public.special_predictions;
DROP POLICY IF EXISTS "Users can update own or kid special predictions" ON public.special_predictions;

CREATE POLICY "special_predictions_select" ON public.special_predictions FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND parent_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "special_predictions_insert" ON public.special_predictions FOR INSERT WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND parent_user_id = auth.uid()
  )
);

CREATE POLICY "special_predictions_update" ON public.special_predictions FOR UPDATE USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND parent_user_id = auth.uid()
  )
);

-- ── 8. GROUPS ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view groups they belong to"  ON public.groups;
DROP POLICY IF EXISTS "Users can create groups"               ON public.groups;
DROP POLICY IF EXISTS "Creator can update/delete group"       ON public.groups;

CREATE POLICY "groups_select" ON public.groups FOR SELECT USING (
  creator_user_id = auth.uid()
  OR id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);

CREATE POLICY "groups_insert" ON public.groups FOR INSERT WITH CHECK (
  auth.uid() = creator_user_id
);

CREATE POLICY "groups_update_delete" ON public.groups FOR ALL USING (
  creator_user_id = auth.uid()
);

-- ── 9. GROUP_MEMBERS ──────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups"                  ON public.group_members;
DROP POLICY IF EXISTS "Group creator can remove members"       ON public.group_members;

CREATE POLICY "group_members_select" ON public.group_members FOR SELECT USING (
  group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);

CREATE POLICY "group_members_insert" ON public.group_members FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "group_members_delete" ON public.group_members FOR DELETE USING (
  auth.uid() = user_id
  OR group_id IN (SELECT id FROM public.groups WHERE creator_user_id = auth.uid())
);
