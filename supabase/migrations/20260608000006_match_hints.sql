-- Tabela za namige pri tekmah (odds + Poisson)
CREATE TABLE IF NOT EXISTS public.match_hints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,

  -- The-Odds-API podatki
  odds_home NUMERIC(5,2),        -- decimalna kvota za zmago domačih
  odds_draw NUMERIC(5,2),        -- kvota za remi
  odds_away NUMERIC(5,2),        -- kvota za zmago gostov
  odds_prob_home NUMERIC(5,3),   -- verjetnost zmage domačih (0-1)
  odds_prob_draw NUMERIC(5,3),   -- verjetnost remija
  odds_prob_away NUMERIC(5,3),   -- verjetnost zmage gostov
  odds_top_score TEXT,           -- najverjetnejši rezultat po stavnicah (npr. "1:0")
  odds_top_score_prob NUMERIC(5,3),

  -- Poisson model
  poisson_home_goals NUMERIC(4,2),  -- pričakovani goli domačih
  poisson_away_goals NUMERIC(4,2),  -- pričakovani goli gostov
  poisson_top_score TEXT,           -- najverjetnejši rezultat po Poissonu
  poisson_top_score_prob NUMERIC(5,3),
  poisson_prob_home NUMERIC(5,3),
  poisson_prob_draw NUMERIC(5,3),
  poisson_prob_away NUMERIC(5,3),

  -- ELO
  elo_home INTEGER,
  elo_away INTEGER,

  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(match_id)
);

-- RLS
ALTER TABLE public.match_hints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read hints" ON public.match_hints FOR SELECT USING (true);
CREATE POLICY "Service role can manage hints" ON public.match_hints FOR ALL USING (auth.role() = 'service_role');

-- ELO tabela za ekipe
CREATE TABLE IF NOT EXISTS public.team_elo (
  team_name TEXT PRIMARY KEY,
  elo_rating INTEGER NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.team_elo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read elo" ON public.team_elo FOR SELECT USING (true);
CREATE POLICY "Service role can manage elo" ON public.team_elo FOR ALL USING (auth.role() = 'service_role');
