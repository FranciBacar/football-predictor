-- =====================================================
-- Popravi ET tekme (podaljški brez kazenskih strelov)
--
-- Problem: sync je shranjeval fullTime rezultat (vključno z ET goli)
-- namesto 90-min rezultata. Po novem: actual_score = rezultat po 90 min.
--
-- Belgija vs Senegal:
--   - Po 90 min: 2:2 (remi)
--   - ET gol v 125. min → Belgija napreduje (3:2 skupaj)
--   - Pravilno v bazi: actual_score = 2:2, actual_advancing_team = 'Belgija'
--   - Napačno (trenutno): actual_score = 3:2, actual_advancing_team = NULL
-- =====================================================

-- 1. Popravi Belgija vs Senegal
UPDATE public.matches
SET
    actual_score_home      = 2,
    actual_score_away      = 2,
    actual_advancing_team  = 'Belgija',
    actual_penalty_home    = NULL,   -- ni bilo kazenskih strelov
    actual_penalty_away    = NULL,
    actual_et_home         = 1,      -- Belgija je zadela v podaljških
    actual_et_away         = 0,
    updated_at             = NOW()
WHERE home_team = 'Belgija'
  AND away_team = 'Senegal'
  AND status    = 'Finished';

-- Preveri ali je bil UPDATE uspešen
SELECT
    home_team, away_team,
    actual_score_home, actual_score_away,
    actual_advancing_team,
    actual_penalty_home, actual_penalty_away
FROM public.matches
WHERE home_team = 'Belgija' AND away_team = 'Senegal';

-- 2. Preračunaj točke za Belgija vs Senegal
--    (trigger se sproži avtomatsko pri UPDATE zgoraj — ta del je varnostna mreža)
UPDATE public.predictions p
SET
    earned_points = public.calculate_points(
        p.pred_score_home,
        p.pred_score_away,
        m.actual_score_home,
        m.actual_score_away,
        m.is_knockout,
        p.pred_advancing_team,
        m.actual_advancing_team
    ),
    updated_at = NOW()
FROM public.matches m
WHERE p.match_id = m.id
  AND m.home_team = 'Belgija'
  AND m.away_team = 'Senegal';

-- 3. Preveri rezultat — kdo je napovedal 2:2 in Belgijo → 8 točk
SELECT
    pr.name                                           AS ime,
    p.pred_score_home                                 AS pred_h,
    p.pred_score_away                                 AS pred_a,
    p.pred_advancing_team                             AS pred_adv,
    p.earned_points                                   AS točke
FROM public.predictions p
JOIN public.matches m ON p.match_id = m.id
JOIN public.profiles pr ON pr.id = p.user_id
WHERE m.home_team = 'Belgija'
  AND m.away_team = 'Senegal'
ORDER BY p.earned_points DESC;


-- =====================================================
-- SPLOŠNI PREGLED: vse ET tekme z napredovalcem
-- (za iskanje morebitnih dodatnih napak)
-- =====================================================
SELECT
    m.home_team, m.away_team,
    m.actual_score_home, m.actual_score_away,
    m.actual_penalty_home, m.actual_penalty_away,
    m.actual_advancing_team,
    m.is_knockout,
    COUNT(p.id)          AS napovedi,
    SUM(p.earned_points) AS skupaj_točk
FROM public.matches m
LEFT JOIN public.predictions p ON p.match_id = m.id
WHERE m.status = 'Finished'
  AND m.is_knockout = true
GROUP BY m.id
ORDER BY m.match_time_utc;
