-- =====================================================
-- Popravi Egipt–Avstralija (Krog 32) + zakleni rezultat
--
-- V bazi: home_team='Avstralija', away_team='Egipt'
-- Cron je shranil zloženi fullTime 3:5 (Avstralija:Egipt) namesto
-- rezultata po 90 min, ker football-data.org ni vrnil penalty razčlenitve.
--
-- POTRJENO (vir: RTV SLO): 1:1 po 90 min (Egipt 13', Avstralija 55'),
--   podaljšek brez golov, kazenski streli Egipt 5:3, napreduje Egipt.
--   score_home/away sta v vrstnem redu baze → HOME=Avstralija, AWAY=Egipt.
-- =====================================================

UPDATE public.matches
SET
  actual_score_home     = 1,          -- Avstralija po 90 min
  actual_score_away     = 1,          -- Egipt po 90 min
  actual_penalty_home   = 3,          -- Avstralija k.s.
  actual_penalty_away   = 5,          -- Egipt k.s.
  actual_advancing_team = 'Egipt',    -- napreduje po k.s.
  actual_et_home        = NULL,       -- ni bilo golov v podaljšku (samo k.s.)
  actual_et_away        = NULL,
  status                = 'Finished',
  score_locked          = TRUE,       -- 🔒 cron tega ne prepiše več
  updated_at            = NOW()
WHERE home_team = 'Avstralija' AND away_team = 'Egipt';

-- Varnostna mreža: preračunaj točke (trigger to naredi samodejno pri UPDATE)
UPDATE public.predictions p
SET
  earned_points = public.calculate_points(
    p.pred_score_home, p.pred_score_away,
    m.actual_score_home, m.actual_score_away,
    m.is_knockout, p.pred_advancing_team, m.actual_advancing_team
  ),
  updated_at = NOW()
FROM public.matches m
WHERE p.match_id = m.id
  AND m.home_team = 'Avstralija' AND m.away_team = 'Egipt';

-- Preveri rezultat
SELECT home_team, away_team, actual_score_home, actual_score_away,
       actual_penalty_home, actual_penalty_away, actual_advancing_team, score_locked
FROM public.matches
WHERE home_team = 'Avstralija' AND away_team = 'Egipt';
