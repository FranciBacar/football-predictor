-- Dodaj stolpca za gole v podaljških (ET = Extra Time)
-- actual_et_home/away = samo goli v podaljških (ne kumulativno)
-- Skupni rezultat za prikaz = actual_score + actual_et
-- (Za penalty tekme: skupaj = actual_score + actual_penalty)

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS actual_et_home integer,
  ADD COLUMN IF NOT EXISTS actual_et_away integer;
