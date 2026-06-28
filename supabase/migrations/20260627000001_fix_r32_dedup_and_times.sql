-- ============================================================
-- Fix R32 matches: deduplicate + popravi UTC čase
-- Vir časov: RTVSlo izlocilni boji (CEST = UTC+2)
-- ============================================================

-- STEP 1: Odstrani duplicate R32 vrstice (isti home_team + away_team + stage)
-- Ohrani vrstico z največ napovedmi, med enakimi pa tisto z zgodnejšim match_time_utc
DELETE FROM public.matches
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY LEAST(home_team, away_team), GREATEST(home_team, away_team), stage
        ORDER BY
          (SELECT COUNT(*) FROM public.predictions WHERE match_id = matches.id) DESC,
          match_time_utc ASC
      ) AS rn
    FROM public.matches
    WHERE stage = 'Round of 32'
      AND home_team != 'TBD'
      AND away_team != 'TBD'
  ) ranked
  WHERE rn > 1
);

-- STEP 2: Popravi UTC čase za znane tekme (vir: RTVSlo, CEST → UTC)
-- Jun 28 21:00 CEST = Jun 28 19:00 UTC
UPDATE public.matches
SET match_time_utc = '2026-06-28T19:00:00+00:00', updated_at = NOW()
WHERE stage = 'Round of 32' AND home_team = 'Južna Afrika' AND away_team = 'Kanada';

-- Jun 29 19:00 CEST = Jun 29 17:00 UTC
UPDATE public.matches
SET match_time_utc = '2026-06-29T17:00:00+00:00', updated_at = NOW()
WHERE stage = 'Round of 32' AND home_team = 'Brazilija' AND away_team = 'Japonska';

-- Jun 29 22:30 CEST = Jun 29 20:30 UTC
UPDATE public.matches
SET match_time_utc = '2026-06-29T20:30:00+00:00', home_team = 'Nemčija', away_team = 'Paragvaj', updated_at = NOW()
WHERE stage = 'Round of 32' AND home_team = 'Nemčija';

-- Jun 30 03:00 CEST = Jun 30 01:00 UTC
UPDATE public.matches
SET match_time_utc = '2026-06-30T01:00:00+00:00', updated_at = NOW()
WHERE stage = 'Round of 32' AND home_team = 'Nizozemska' AND away_team = 'Maroko';

-- Jun 30 19:00 CEST = Jun 30 17:00 UTC
UPDATE public.matches
SET match_time_utc = '2026-06-30T17:00:00+00:00', home_team = 'Slonokoščena obala', away_team = 'Norveška', updated_at = NOW()
WHERE stage = 'Round of 32' AND home_team = 'Slonokoščena obala';

-- Jun 30 22:30 CEST = Jun 30 20:30 UTC
UPDATE public.matches
SET match_time_utc = '2026-06-30T20:30:00+00:00', home_team = 'Francija', away_team = 'Švedska', updated_at = NOW()
WHERE stage = 'Round of 32' AND home_team = 'Francija';

-- Jul 1 03:00 CEST = Jul 1 01:00 UTC
UPDATE public.matches
SET match_time_utc = '2026-07-01T01:00:00+00:00', home_team = 'Mehika', updated_at = NOW()
WHERE stage = 'Round of 32' AND home_team = 'Mehika';

-- Jul 2 02:00 CEST = Jul 2 00:00 UTC
UPDATE public.matches
SET match_time_utc = '2026-07-02T00:00:00+00:00', home_team = 'ZDA', away_team = 'Bosna in Hercegovina', updated_at = NOW()
WHERE stage = 'Round of 32' AND home_team = 'ZDA';

-- Jul 2 21:00 CEST = Jul 2 19:00 UTC
UPDATE public.matches
SET match_time_utc = '2026-07-02T19:00:00+00:00', home_team = 'Španija', updated_at = NOW()
WHERE stage = 'Round of 32' AND home_team = 'Španija';

-- Jul 3 05:00 CEST = Jul 3 03:00 UTC
UPDATE public.matches
SET match_time_utc = '2026-07-03T03:00:00+00:00', home_team = 'Švica', updated_at = NOW()
WHERE stage = 'Round of 32' AND home_team = 'Švica';

-- Jul 3 22:00 CEST = Jul 3 20:00 UTC
UPDATE public.matches
SET match_time_utc = '2026-07-03T20:00:00+00:00', home_team = 'Avstralija', updated_at = NOW()
WHERE stage = 'Round of 32' AND home_team = 'Avstralija';

-- Jul 4 00:01 CEST = Jul 3 22:01 UTC
UPDATE public.matches
SET match_time_utc = '2026-07-03T22:01:00+00:00', home_team = 'Argentina', updated_at = NOW()
WHERE stage = 'Round of 32' AND home_team = 'Argentina';

-- STEP 3: Preostale TBD vrstice — popravimo čase na pravilne slote
-- (sync-fixtures bo dopolnil ekipe ko bo API vedel)
-- Razvrstimo obstoječe TBD vrstice po match_time_utc in jim dodelimo pravilne slote
-- Znani TBD sloti (po CEST → UTC):
--   Jul 1 18:00 CEST = Jul 1 16:00 UTC  (slot L1 vs Z3)
--   Jul 1 22:00 CEST = Jul 1 20:00 UTC  (slot G1 vs Z3)
--   Jul 3 01:00 CEST = Jul 2 23:00 UTC  (slot K2 vs L2)
--   Jul 4 03:30 CEST = Jul 4 01:30 UTC  (slot K1 vs Z3)

DO $$
DECLARE
  tbd_ids UUID[];
  target_times TIMESTAMPTZ[] := ARRAY[
    '2026-07-01T16:00:00+00:00'::TIMESTAMPTZ,
    '2026-07-01T20:00:00+00:00'::TIMESTAMPTZ,
    '2026-07-02T23:00:00+00:00'::TIMESTAMPTZ,
    '2026-07-04T01:30:00+00:00'::TIMESTAMPTZ
  ];
  i INT;
BEGIN
  -- Pridobi ID-je preostalih TBD vrstic za Round of 32, urejene po match_time_utc
  SELECT ARRAY(
    SELECT id FROM public.matches
    WHERE stage = 'Round of 32' AND home_team = 'TBD' AND away_team = 'TBD'
    ORDER BY match_time_utc ASC
  ) INTO tbd_ids;

  -- Posodobi vsak TBD na pravilen čas (po vrstnem redu)
  FOR i IN 1..LEAST(array_length(tbd_ids, 1), array_length(target_times, 1)) LOOP
    UPDATE public.matches
    SET match_time_utc = target_times[i], updated_at = NOW()
    WHERE id = tbd_ids[i];
  END LOOP;
END $$;

-- STEP 4: Enako popravi čase za R16, QF, SF, 3rd place, Final
-- (RTVSlo: vsi ob 21:00 CEST = 19:00 UTC, razen kar je drugače navedeno)

-- Round of 16: Jul 4-7, 21:00 CEST = 19:00 UTC
-- Sobota Jul 4: 2 tekmi (21:00 CEST each → 19:00 UTC)
-- Nedelja Jul 5: 2 tekmi (21:00 CEST each → 19:00 UTC)
-- Ponedeljek Jul 6: 2 tekmi (21:00 CEST each → 19:00 UTC)
-- Torek Jul 7: 2 tekmi (21:00 CEST each → 19:00 UTC)

DO $$
DECLARE
  r16_ids UUID[];
  r16_times TIMESTAMPTZ[] := ARRAY[
    '2026-07-04T19:00:00+00:00'::TIMESTAMPTZ,
    '2026-07-04T19:00:00+00:00'::TIMESTAMPTZ,
    '2026-07-05T19:00:00+00:00'::TIMESTAMPTZ,
    '2026-07-05T19:00:00+00:00'::TIMESTAMPTZ,
    '2026-07-06T19:00:00+00:00'::TIMESTAMPTZ,
    '2026-07-06T19:00:00+00:00'::TIMESTAMPTZ,
    '2026-07-07T19:00:00+00:00'::TIMESTAMPTZ,
    '2026-07-07T19:00:00+00:00'::TIMESTAMPTZ
  ];
  i INT;
BEGIN
  SELECT ARRAY(
    SELECT id FROM public.matches
    WHERE stage = 'Round of 16' AND home_team = 'TBD' AND away_team = 'TBD'
    ORDER BY match_time_utc ASC
  ) INTO r16_ids;

  FOR i IN 1..LEAST(COALESCE(array_length(r16_ids, 1), 0), array_length(r16_times, 1)) LOOP
    UPDATE public.matches
    SET match_time_utc = r16_times[i], updated_at = NOW()
    WHERE id = r16_ids[i];
  END LOOP;
END $$;

-- Quarter-finals: Jul 9 21:00 CEST (19:00 UTC), Jul 10 21:00 CEST (19:00 UTC),
--                Jul 11 21:00 CEST (19:00 UTC) x2
DO $$
DECLARE
  qf_ids UUID[];
  qf_times TIMESTAMPTZ[] := ARRAY[
    '2026-07-09T19:00:00+00:00'::TIMESTAMPTZ,
    '2026-07-10T19:00:00+00:00'::TIMESTAMPTZ,
    '2026-07-11T19:00:00+00:00'::TIMESTAMPTZ,
    '2026-07-11T19:00:00+00:00'::TIMESTAMPTZ
  ];
  i INT;
BEGIN
  SELECT ARRAY(
    SELECT id FROM public.matches
    WHERE stage = 'Quarter-finals' AND home_team = 'TBD' AND away_team = 'TBD'
    ORDER BY match_time_utc ASC
  ) INTO qf_ids;

  FOR i IN 1..LEAST(COALESCE(array_length(qf_ids, 1), 0), array_length(qf_times, 1)) LOOP
    UPDATE public.matches
    SET match_time_utc = qf_times[i], updated_at = NOW()
    WHERE id = qf_ids[i];
  END LOOP;
END $$;

-- Semi-finals: Jul 14 21:00 CEST (19:00 UTC), Jul 15 21:00 CEST (19:00 UTC)
DO $$
DECLARE
  sf_ids UUID[];
  sf_times TIMESTAMPTZ[] := ARRAY[
    '2026-07-14T19:00:00+00:00'::TIMESTAMPTZ,
    '2026-07-15T19:00:00+00:00'::TIMESTAMPTZ
  ];
  i INT;
BEGIN
  SELECT ARRAY(
    SELECT id FROM public.matches
    WHERE stage = 'Semi-finals' AND home_team = 'TBD' AND away_team = 'TBD'
    ORDER BY match_time_utc ASC
  ) INTO sf_ids;

  FOR i IN 1..LEAST(COALESCE(array_length(sf_ids, 1), 0), array_length(sf_times, 1)) LOOP
    UPDATE public.matches
    SET match_time_utc = sf_times[i], updated_at = NOW()
    WHERE id = sf_ids[i];
  END LOOP;
END $$;

-- Third place play-off: Jul 18 21:00 CEST (19:00 UTC)
UPDATE public.matches
SET match_time_utc = '2026-07-18T19:00:00+00:00', updated_at = NOW()
WHERE stage = 'Third place play-off' AND home_team = 'TBD' AND away_team = 'TBD';

-- Final: Jul 19 21:00 CEST (19:00 UTC)
UPDATE public.matches
SET match_time_utc = '2026-07-19T19:00:00+00:00', updated_at = NOW()
WHERE stage = 'Final' AND home_team = 'TBD' AND away_team = 'TBD';
