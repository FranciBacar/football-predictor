-- Popravek datumov izločilnih bojev SP 2026
-- Prejšnja migracija je imela napačne datume (julij namesto junij/julij po urniku)
-- Pravilni datumi po uradu FIFA / RTV SLO (ura: 21:00 CEST = 19:00 UTC)

-- ============================================================
-- ROUND OF 32 (16 tekem): 28. junij – 3. julij 2026
-- ============================================================

-- 28. junij — 1 tekma
UPDATE matches SET match_time_utc = '2026-06-28 19:00:00+00'
WHERE stage = 'Round of 32' AND match_time_utc = '2026-07-03 14:00:00+00';

-- 29. junij — 3 tekme
UPDATE matches SET match_time_utc = '2026-06-29 15:00:00+00'
WHERE stage = 'Round of 32' AND match_time_utc = '2026-07-03 18:00:00+00';

UPDATE matches SET match_time_utc = '2026-06-29 18:00:00+00'
WHERE stage = 'Round of 32' AND match_time_utc = '2026-07-04 14:00:00+00';

UPDATE matches SET match_time_utc = '2026-06-29 21:00:00+00'
WHERE stage = 'Round of 32' AND match_time_utc = '2026-07-04 18:00:00+00';

-- 30. junij — 3 tekme
UPDATE matches SET match_time_utc = '2026-06-30 15:00:00+00'
WHERE stage = 'Round of 32' AND match_time_utc = '2026-07-05 14:00:00+00';

UPDATE matches SET match_time_utc = '2026-06-30 18:00:00+00'
WHERE stage = 'Round of 32' AND match_time_utc = '2026-07-05 18:00:00+00';

UPDATE matches SET match_time_utc = '2026-06-30 21:00:00+00'
WHERE stage = 'Round of 32' AND match_time_utc = '2026-07-06 14:00:00+00';

-- 1. julij — 3 tekme
UPDATE matches SET match_time_utc = '2026-07-01 15:00:00+00'
WHERE stage = 'Round of 32' AND match_time_utc = '2026-07-06 18:00:00+00';

UPDATE matches SET match_time_utc = '2026-07-01 18:00:00+00'
WHERE stage = 'Round of 32' AND match_time_utc = '2026-07-07 14:00:00+00';

UPDATE matches SET match_time_utc = '2026-07-01 21:00:00+00'
WHERE stage = 'Round of 32' AND match_time_utc = '2026-07-07 18:00:00+00';

-- 2. julij — 3 tekme
UPDATE matches SET match_time_utc = '2026-07-02 15:00:00+00'
WHERE stage = 'Round of 32' AND match_time_utc = '2026-07-08 14:00:00+00';

UPDATE matches SET match_time_utc = '2026-07-02 18:00:00+00'
WHERE stage = 'Round of 32' AND match_time_utc = '2026-07-08 18:00:00+00';

UPDATE matches SET match_time_utc = '2026-07-02 21:00:00+00'
WHERE stage = 'Round of 32' AND match_time_utc = '2026-07-09 14:00:00+00';

-- 3. julij — 3 tekme
UPDATE matches SET match_time_utc = '2026-07-03 15:00:00+00'
WHERE stage = 'Round of 32' AND match_time_utc = '2026-07-09 18:00:00+00';

UPDATE matches SET match_time_utc = '2026-07-03 18:00:00+00'
WHERE stage = 'Round of 32' AND match_time_utc = '2026-07-10 14:00:00+00';

UPDATE matches SET match_time_utc = '2026-07-03 21:00:00+00'
WHERE stage = 'Round of 32' AND match_time_utc = '2026-07-10 18:00:00+00';

-- ============================================================
-- ROUND OF 16 (8 tekem): 4.–7. julij 2026
-- ============================================================

-- 4. julij — 2 tekmi
UPDATE matches SET match_time_utc = '2026-07-04 18:00:00+00'
WHERE stage = 'Round of 16' AND match_time_utc = '2026-07-12 14:00:00+00';

UPDATE matches SET match_time_utc = '2026-07-04 21:00:00+00'
WHERE stage = 'Round of 16' AND match_time_utc = '2026-07-12 18:00:00+00';

-- 5. julij — 2 tekmi
UPDATE matches SET match_time_utc = '2026-07-05 18:00:00+00'
WHERE stage = 'Round of 16' AND match_time_utc = '2026-07-13 14:00:00+00';

UPDATE matches SET match_time_utc = '2026-07-05 21:00:00+00'
WHERE stage = 'Round of 16' AND match_time_utc = '2026-07-13 18:00:00+00';

-- 6. julij — 2 tekmi
UPDATE matches SET match_time_utc = '2026-07-06 18:00:00+00'
WHERE stage = 'Round of 16' AND match_time_utc = '2026-07-14 14:00:00+00';

UPDATE matches SET match_time_utc = '2026-07-06 21:00:00+00'
WHERE stage = 'Round of 16' AND match_time_utc = '2026-07-14 18:00:00+00';

-- 7. julij — 2 tekmi
UPDATE matches SET match_time_utc = '2026-07-07 18:00:00+00'
WHERE stage = 'Round of 16' AND match_time_utc = '2026-07-15 14:00:00+00';

UPDATE matches SET match_time_utc = '2026-07-07 21:00:00+00'
WHERE stage = 'Round of 16' AND match_time_utc = '2026-07-15 18:00:00+00';

-- ============================================================
-- ČETRTFINALE (4 tekme): 9.–11. julij 2026
-- ============================================================

-- 9. julij — 1 tekma
UPDATE matches SET match_time_utc = '2026-07-09 19:00:00+00'
WHERE stage = 'Quarter-finals' AND match_time_utc = '2026-07-17 14:00:00+00';

-- 10. julij — 1 tekma
UPDATE matches SET match_time_utc = '2026-07-10 19:00:00+00'
WHERE stage = 'Quarter-finals' AND match_time_utc = '2026-07-17 18:00:00+00';

-- 11. julij — 2 tekmi
UPDATE matches SET match_time_utc = '2026-07-11 18:00:00+00'
WHERE stage = 'Quarter-finals' AND match_time_utc = '2026-07-18 14:00:00+00';

UPDATE matches SET match_time_utc = '2026-07-11 21:00:00+00'
WHERE stage = 'Quarter-finals' AND match_time_utc = '2026-07-18 18:00:00+00';

-- ============================================================
-- POLFINALE (2 tekmi): 14.–15. julij 2026
-- ============================================================

UPDATE matches SET match_time_utc = '2026-07-14 19:00:00+00'
WHERE stage = 'Semi-finals' AND match_time_utc = '2026-07-20 18:00:00+00';

UPDATE matches SET match_time_utc = '2026-07-15 19:00:00+00'
WHERE stage = 'Semi-finals' AND match_time_utc = '2026-07-21 18:00:00+00';

-- ============================================================
-- TEKMA ZA 3. MESTO: 18. julij 2026
-- ============================================================

UPDATE matches SET match_time_utc = '2026-07-18 19:00:00+00'
WHERE stage = 'Third place play-off' AND match_time_utc = '2026-07-24 14:00:00+00';

-- ============================================================
-- FINALE: 19. julij 2026
-- ============================================================

UPDATE matches SET match_time_utc = '2026-07-19 19:00:00+00'
WHERE stage = 'Final' AND match_time_utc = '2026-07-25 18:00:00+00';
