-- =====================================================
-- Fix: popravi actual_score nazaj na 1:1 za tekme
-- ki so šle v kazenski strele po 90 min remi.
-- Vzrok: extraTime bug v sync je prepisal 1:1 → 0:0.
-- =====================================================

-- Nemčija 1:1 Paragvaj (pen. 3:4)
UPDATE public.matches
SET actual_score_home = 1, actual_score_away = 1, updated_at = NOW()
WHERE home_team = 'Nemčija' AND away_team = 'Paragvaj'
AND status = 'Finished';

-- Nizozemska 1:1 Maroko (pen. 2:3)
UPDATE public.matches
SET actual_score_home = 1, actual_score_away = 1, updated_at = NOW()
WHERE home_team = 'Nizozemska' AND away_team = 'Maroko'
AND status = 'Finished';

-- Brazilija 1:1 Maroko (če je bila ta tekma v penaltih)
UPDATE public.matches
SET actual_score_home = 1, actual_score_away = 1, updated_at = NOW()
WHERE home_team = 'Brazilija' AND away_team = 'Maroko'
AND actual_advancing_team IS NOT NULL
AND status = 'Finished';

-- Preveri rezultat
SELECT home_team, away_team,
       actual_score_home, actual_score_away,
       actual_penalty_home, actual_penalty_away,
       actual_advancing_team, status
FROM public.matches
WHERE actual_advancing_team IS NOT NULL
ORDER BY match_time_utc;
