-- Dodamo api_football_id kolono v matches tabelo
-- Ta ID se uporabi za zanesljivo ujemanje tekem z API-Football podatki

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS api_football_id INTEGER UNIQUE;

-- Indeks za hitro iskanje po API ID-ju
CREATE INDEX IF NOT EXISTS idx_matches_api_football_id
  ON public.matches(api_football_id);
