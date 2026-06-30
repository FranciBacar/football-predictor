-- =====================================================
-- Dodaj stolpca za penalty score v matches tabelo
-- =====================================================

ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS actual_penalty_home INTEGER,
ADD COLUMN IF NOT EXISTS actual_penalty_away INTEGER;


-- =====================================================
-- Ročno nastavi penalty score za obstoječe tekme
-- (za prihodnje tekme bo sync samodejno shranil)
-- =====================================================

-- Nemčija 1:1 Paragvaj (pen. 3:4, napreduje Paragvaj)
UPDATE public.matches
SET actual_penalty_home = 3, actual_penalty_away = 4
WHERE home_team = 'Nemčija' AND away_team = 'Paragvaj';

-- Nizozemska 1:1 Maroko (pen. 2:3, napreduje Maroko)
UPDATE public.matches
SET actual_penalty_home = 2, actual_penalty_away = 3
WHERE home_team = 'Nizozemska' AND away_team = 'Maroko';


-- =====================================================
-- Preveri
-- =====================================================
SELECT home_team, away_team,
       actual_score_home, actual_score_away,
       actual_penalty_home, actual_penalty_away,
       actual_advancing_team
FROM public.matches
WHERE actual_advancing_team IS NOT NULL
ORDER BY match_time_utc;
