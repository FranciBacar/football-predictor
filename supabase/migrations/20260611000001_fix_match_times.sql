-- Popravi napačen čas za Južna Koreja vs Češka
-- Tekma je ob 8 PM CST (Mexico) = 02:00 UTC, ne 22:00 UTC
UPDATE public.matches
SET match_time_utc = '2026-06-12T02:00:00Z',
    updated_at = now()
WHERE home_team = 'Južna Koreja'
  AND away_team = 'Češka'
  AND match_time_utc = '2026-06-11T22:00:00Z';
