-- ============================================================
-- FIX: group_members RLS self-referencing rekurzija
-- group_members_select preverjal samega sebe → PostgreSQL lockup → 0 rezultatov
-- Rešitev: vsak authenticated user vidi vse group_members (primerno za tekmovanje)
-- ============================================================

-- Helper za preverjanje skupinskega članstva (bypass RLS)
CREATE OR REPLACE FUNCTION public.is_group_member(target_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = target_group_id AND user_id = auth.uid()
  )
$$;

-- GROUP_MEMBERS: popravi self-referencing politiko
DROP POLICY IF EXISTS "group_members_select" ON public.group_members;
CREATE POLICY "group_members_select" ON public.group_members FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- GROUPS: popravi z SECURITY DEFINER helper
DROP POLICY IF EXISTS "groups_select" ON public.groups;
CREATE POLICY "groups_select" ON public.groups FOR SELECT USING (
  creator_user_id = auth.uid()
  OR public.is_group_member(id)
);

-- USERS: users_select policy se sklicuje na group_members — popravi z helperjem
DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users FOR SELECT USING (
  auth.uid() = id
  OR auth.uid() = parent_user_id
  OR is_global_opt_in = true
  OR EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.user_id = id
      AND public.is_group_member(gm.group_id)
  )
);
