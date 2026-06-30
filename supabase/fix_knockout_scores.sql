-- =====================================================
-- PATCH: Popravi napačne zadetke izločilnih bojev
-- Vzrok: football-data.org score.fullTime za penalty
--        tekme sešteje regular + penalty gole.
-- Trigger bo avtomatsko preračunal točke za vse napovedi.
-- =====================================================

-- 1. Nemčija 1:1 Paragvaj (po k.s. 3:4, napreduje Paragvaj)
UPDATE public.matches
SET
  actual_score_home     = 1,
  actual_score_away     = 1,
  actual_advancing_team = 'Paragvaj',
  status                = 'Finished',
  updated_at            = NOW()
WHERE home_team = 'Nemčija' AND away_team = 'Paragvaj';

-- Preveriti vrstni red (če je Paragvaj home):
UPDATE public.matches
SET
  actual_score_home     = 1,
  actual_score_away     = 1,
  actual_advancing_team = 'Paragvaj',
  status                = 'Finished',
  updated_at            = NOW()
WHERE home_team = 'Paragvaj' AND away_team = 'Nemčija';


-- 2. Nizozemska 1:1 Maroko (po k.s. 2:3, napreduje Maroko)
UPDATE public.matches
SET
  actual_score_home     = 1,
  actual_score_away     = 1,
  actual_advancing_team = 'Maroko',
  status                = 'Finished',
  updated_at            = NOW()
WHERE home_team = 'Nizozemska' AND away_team = 'Maroko';

-- Preveriti vrstni red (če je Maroko home):
UPDATE public.matches
SET
  actual_score_home     = 1,
  actual_score_away     = 1,
  actual_advancing_team = 'Maroko',
  status                = 'Finished',
  updated_at            = NOW()
WHERE home_team = 'Maroko' AND away_team = 'Nizozemska';


-- =====================================================
-- PREVERI ali so se točke preračunale:
-- =====================================================
SELECT
  m.home_team, m.away_team,
  m.actual_score_home, m.actual_score_away,
  m.actual_advancing_team,
  p.pred_score_home, p.pred_score_away,
  p.pred_advancing_team,
  p.earned_points
FROM public.matches m
JOIN public.predictions p ON p.match_id = m.id
WHERE m.home_team IN ('Nemčija','Paragvaj','Nizozemska','Maroko')
   OR m.away_team IN ('Nemčija','Paragvaj','Nizozemska','Maroko')
ORDER BY m.home_team, p.earned_points DESC;
