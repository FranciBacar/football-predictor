-- Kid profiles: otroci so pravi user row-i z is_kid=true
-- Parent ustvari otroka, otrokov email je interni (ne pravi)

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_kid BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS avatar_emoji TEXT DEFAULT '⚽';

-- RLS: starš lahko bere/piše otrokove podatke
CREATE POLICY "Parent can manage their kids"
  ON public.users
  FOR ALL
  USING (
    auth.uid() = id OR
    auth.uid() = parent_user_id
  )
  WITH CHECK (
    auth.uid() = id OR
    auth.uid() = parent_user_id
  );

-- Starš lahko oddaja napovedi v imenu otroka
DROP POLICY IF EXISTS "Users can insert own predictions" ON public.predictions;
DROP POLICY IF EXISTS "Users can update own predictions" ON public.predictions;

CREATE POLICY "Users can insert own or kid predictions"
  ON public.predictions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = user_id AND parent_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own or kid predictions"
  ON public.predictions
  FOR UPDATE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = user_id AND parent_user_id = auth.uid()
    )
  );

-- Enako za special_predictions
DROP POLICY IF EXISTS "Users can insert own special predictions" ON public.special_predictions;
DROP POLICY IF EXISTS "Users can update own special predictions" ON public.special_predictions;

CREATE POLICY "Users can insert own or kid special predictions"
  ON public.special_predictions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = user_id AND parent_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own or kid special predictions"
  ON public.special_predictions
  FOR UPDATE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = user_id AND parent_user_id = auth.uid()
    )
  );
