-- Omogoči vidnost profila znotraj skupin
-- Brez tega člani ne vidijo drug drugega v skupinski lestvici

CREATE POLICY "Users can view cogroup member profiles" ON public.users FOR SELECT USING (
  id IN (
    SELECT gm.user_id FROM public.group_members gm
    INNER JOIN public.group_members my ON gm.group_id = my.group_id
    WHERE my.user_id = auth.uid()
  )
);
