-- ============================================================
-- FIX: cirkularna RLS referenca (predictions → users → group_members)
-- Rešitev: SECURITY DEFINER funkcija ki bypassa RLS pri preverjanju
-- ============================================================

-- Helper: preveri ali je target_user_id tvoj lastni ID ali otrokov ID
CREATE OR REPLACE FUNCTION public.is_own_or_kid(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    auth.uid() = target_user_id
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = target_user_id
        AND parent_user_id = auth.uid()
    )
$$;

-- Helper: preveri ali je user_id vidljiv za trenutnega uporabnika
CREATE OR REPLACE FUNCTION public.user_is_visible(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    auth.uid() = target_user_id
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = target_user_id
        AND (
          u.parent_user_id = auth.uid()
          OR u.is_global_opt_in = true
          OR u.id IN (
            SELECT gm.user_id FROM public.group_members gm
            INNER JOIN public.group_members my ON gm.group_id = my.group_id
            WHERE my.user_id = auth.uid()
          )
        )
    )
$$;

-- ── PREDICTIONS: zamenjaj policy z verzijo brez direktne subquery na users ──
DROP POLICY IF EXISTS "predictions_select" ON public.predictions;
CREATE POLICY "predictions_select" ON public.predictions FOR SELECT USING (
  public.is_own_or_kid(user_id)
  OR match_id IN (
    SELECT id FROM public.matches WHERE status != 'Upcoming'
  )
);

DROP POLICY IF EXISTS "predictions_insert" ON public.predictions;
CREATE POLICY "predictions_insert" ON public.predictions FOR INSERT WITH CHECK (
  public.is_own_or_kid(user_id)
  AND match_id IN (SELECT id FROM public.matches WHERE status = 'Upcoming')
);

DROP POLICY IF EXISTS "predictions_update" ON public.predictions;
CREATE POLICY "predictions_update" ON public.predictions FOR UPDATE USING (
  public.is_own_or_kid(user_id)
  AND match_id IN (SELECT id FROM public.matches WHERE status = 'Upcoming')
);

-- ── SPECIAL_PREDICTIONS: enako ───────────────────────────────────────────────
DROP POLICY IF EXISTS "special_predictions_select" ON public.special_predictions;
CREATE POLICY "special_predictions_select" ON public.special_predictions FOR SELECT USING (
  public.is_own_or_kid(user_id)
  OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);

DROP POLICY IF EXISTS "special_predictions_insert" ON public.special_predictions;
CREATE POLICY "special_predictions_insert" ON public.special_predictions FOR INSERT WITH CHECK (
  public.is_own_or_kid(user_id)
);

DROP POLICY IF EXISTS "special_predictions_update" ON public.special_predictions;
CREATE POLICY "special_predictions_update" ON public.special_predictions FOR UPDATE USING (
  public.is_own_or_kid(user_id)
);

-- ── USERS: zamenjaj policy z verzijo ki uporablja SECURITY DEFINER helper ────
DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users FOR SELECT USING (
  public.user_is_visible(id)
);
