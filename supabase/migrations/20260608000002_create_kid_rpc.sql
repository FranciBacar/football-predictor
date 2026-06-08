-- RPC za ustvarjanje otroških profilov
-- Ker otroci nimajo auth accounta, jih ustvarimo direktno v public.users
-- Parent mora biti prijavljen (auth.uid() = p_parent_id)

CREATE OR REPLACE FUNCTION public.create_kid_profile(
  p_parent_id UUID,
  p_name TEXT,
  p_avatar_emoji TEXT DEFAULT '⚽'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_kid_id UUID;
BEGIN
  -- Preveri da je klicatelj starš
  IF auth.uid() != p_parent_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Ustvari otrokov profil
  v_kid_id := gen_random_uuid();

  INSERT INTO public.users (id, name, email, is_kid, parent_user_id, avatar_emoji, onboarding_completed)
  VALUES (
    v_kid_id,
    p_name,
    'kid_' || v_kid_id || '@internal.fp2026',
    true,
    p_parent_id,
    p_avatar_emoji,
    true  -- otroci preskočijo onboarding
  );

  RETURN v_kid_id;
END;
$$;

-- Grant execute na authenticated users
GRANT EXECUTE ON FUNCTION public.create_kid_profile TO authenticated;
