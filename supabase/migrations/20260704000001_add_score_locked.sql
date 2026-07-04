-- =====================================================
-- score_locked: ročno zaklenjen rezultat
--
-- Football-data.org (free tier) za nekatere izločilne tekme ne vrne
-- score.penalties / score.extraTime / score.duration → cron shrani
-- zloženi fullTime (npr. Egipt–Avstralija 5:3 namesto 1:1 + pen 4:2).
-- Ker API nima razčlenitve, avtomatika ne more izračunati 90-min rezultata.
--
-- Rešitev: rezultat popraviš ročno in ga zakleneš (score_locked=true).
-- Cron sync-results tako tekmo preskoči in je ne prepiše več.
-- =====================================================

ALTER TABLE public.matches
    ADD COLUMN IF NOT EXISTS score_locked BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.matches.score_locked IS
    'Ko je TRUE, cron sync-results ne sme prepisati actual_score/advancing/penalty. Za ročno popravljene tekme, kjer API ne vrne penalty/ET razčlenitve.';
