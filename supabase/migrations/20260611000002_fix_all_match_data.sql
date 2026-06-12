-- ============================================================
-- MIGRATION: Popravi vse čase in paire skupinskega dela
-- Vir: openfootball/worldcup.json + Al Jazeera (11. junij 2026)
-- Samo Upcoming tekme (Finished se ne dotikamo)
-- Vrstni red UPDATE-ov znotraj skupin je pomemben (izogni se konfliktom)
-- ============================================================

-- ── GROUP A ──────────────────────────────────────────────────────
-- Mehika vs Južna Afrika (11T19) je pravilen → ne dotikamo

UPDATE public.matches
  SET match_time_utc = '2026-06-12T02:00:00Z', updated_at = now()
  WHERE home_team = 'Južna Koreja' AND away_team = 'Češka'
    AND status = 'Upcoming';

-- Češka vs Južna Afrika: 12 UTC-4 = 16:00 UTC
UPDATE public.matches
  SET match_time_utc = '2026-06-18T16:00:00Z', updated_at = now()
  WHERE home_team = 'Češka' AND away_team = 'Južna Afrika'
    AND status = 'Upcoming';

-- Mehika vs Južna Koreja: 19 UTC-6 = 01:00 UTC naslednji dan
UPDATE public.matches
  SET match_time_utc = '2026-06-19T01:00:00Z', updated_at = now()
  WHERE home_team = 'Mehika' AND away_team = 'Južna Koreja'
    AND match_time_utc = '2026-06-17T22:00:00Z'
    AND status = 'Upcoming';

-- Mehika vs Češka → Češka vs Mehika (zamenjava doma/gosta), 19 UTC-6 = 01:00 UTC
UPDATE public.matches
  SET home_team = 'Češka', away_team = 'Mehika',
      match_time_utc = '2026-06-25T01:00:00Z', updated_at = now()
  WHERE home_team = 'Mehika' AND away_team = 'Češka'
    AND status = 'Upcoming';

-- Južna Afrika vs Južna Koreja: 19 UTC-6 = 01:00 UTC naslednji dan
UPDATE public.matches
  SET match_time_utc = '2026-06-25T01:00:00Z', updated_at = now()
  WHERE home_team = 'Južna Afrika' AND away_team = 'Južna Koreja'
    AND status = 'Upcoming';

-- ── GROUP B ──────────────────────────────────────────────────────
-- Kanada vs Bosna (12T19) je pravilen ✓

-- Švica vs Katar → Katar vs Švica, 12 UTC-7 = 19:00 UTC
UPDATE public.matches
  SET home_team = 'Katar', away_team = 'Švica',
      match_time_utc = '2026-06-13T19:00:00Z', updated_at = now()
  WHERE home_team = 'Švica' AND away_team = 'Katar'
    AND status = 'Upcoming';

-- Švica vs Bosna (18T19) ✓
-- Kanada vs Katar (18T22) ✓

-- Kanada vs Švica → Švica vs Kanada, 12 UTC-7 = 19:00 UTC
UPDATE public.matches
  SET home_team = 'Švica', away_team = 'Kanada',
      match_time_utc = '2026-06-24T19:00:00Z', updated_at = now()
  WHERE home_team = 'Kanada' AND away_team = 'Švica'
    AND status = 'Upcoming';

-- Bosna vs Katar, 12 UTC-7 = 19:00 UTC
UPDATE public.matches
  SET match_time_utc = '2026-06-24T19:00:00Z', updated_at = now()
  WHERE home_team = 'Bosna in Hercegovina' AND away_team = 'Katar'
    AND status = 'Upcoming';

-- ── GROUP C ──────────────────────────────────────────────────────
-- Brazilija vs Maroko (13T22) ✓
-- Haiti vs Škotska (14T01) ✓

-- Round 2: ekipe zamenjane (najprej B-H, ker H-S dobi prosti slot)
-- Brazilija vs Haiti → Škotska vs Maroko (enak čas 19T22)
UPDATE public.matches
  SET home_team = 'Škotska', away_team = 'Maroko', updated_at = now()
  WHERE home_team = 'Brazilija' AND away_team = 'Haiti'
    AND match_time_utc = '2026-06-19T22:00:00Z'
    AND status = 'Upcoming';

-- Maroko vs Škotska → Brazilija vs Haiti (enak čas 20T01)
UPDATE public.matches
  SET home_team = 'Brazilija', away_team = 'Haiti', updated_at = now()
  WHERE home_team = 'Maroko' AND away_team = 'Škotska'
    AND match_time_utc = '2026-06-20T01:00:00Z'
    AND status = 'Upcoming';

-- Round 3: datum napačen (26 → 24)
-- Brazilija vs Škotska → Škotska vs Brazilija, 18 UTC-4 = 22:00 UTC
UPDATE public.matches
  SET home_team = 'Škotska', away_team = 'Brazilija',
      match_time_utc = '2026-06-24T22:00:00Z', updated_at = now()
  WHERE home_team = 'Brazilija' AND away_team = 'Škotska'
    AND status = 'Upcoming';

-- Maroko vs Haiti, 18 UTC-4 = 22:00 UTC (24. junija)
UPDATE public.matches
  SET match_time_utc = '2026-06-24T22:00:00Z', updated_at = now()
  WHERE home_team = 'Maroko' AND away_team = 'Haiti'
    AND status = 'Upcoming';

-- ── GROUP D ──────────────────────────────────────────────────────
-- ZDA vs Paragvaj (13T01) ✓

-- Turčija vs Avstralija → Avstralija vs Turčija (zamenjava)
UPDATE public.matches
  SET home_team = 'Avstralija', away_team = 'Turčija', updated_at = now()
  WHERE home_team = 'Turčija' AND away_team = 'Avstralija'
    AND status = 'Upcoming';

-- ZDA vs Turčija → ZDA vs Avstralija (napačen nasprotnik, enak čas)
UPDATE public.matches
  SET away_team = 'Avstralija', updated_at = now()
  WHERE home_team = 'ZDA' AND away_team = 'Turčija'
    AND match_time_utc = '2026-06-19T19:00:00Z'
    AND status = 'Upcoming';

-- Avstralija vs Paragvaj → Turčija vs Paragvaj (napačen domači, enak čas)
UPDATE public.matches
  SET home_team = 'Turčija', updated_at = now()
  WHERE home_team = 'Avstralija' AND away_team = 'Paragvaj'
    AND match_time_utc = '2026-06-20T04:00:00Z'
    AND status = 'Upcoming';

-- ZDA vs Avstralija → Turčija vs ZDA, 19 UTC-7 = 02:00 UTC naslednji dan
UPDATE public.matches
  SET home_team = 'Turčija', away_team = 'ZDA',
      match_time_utc = '2026-06-26T02:00:00Z', updated_at = now()
  WHERE home_team = 'ZDA' AND away_team = 'Avstralija'
    AND match_time_utc = '2026-06-25T01:00:00Z'
    AND status = 'Upcoming';

-- Paragvaj vs Turčija → Paragvaj vs Avstralija, 19 UTC-7 = 02:00 UTC naslednji dan
UPDATE public.matches
  SET away_team = 'Avstralija',
      match_time_utc = '2026-06-26T02:00:00Z', updated_at = now()
  WHERE home_team = 'Paragvaj' AND away_team = 'Turčija'
    AND match_time_utc = '2026-06-25T01:00:00Z'
    AND status = 'Upcoming';

-- ── GROUP E ──────────────────────────────────────────────────────
-- Round 3 najprej (izogni se konfliktu z Nemčija vs Curaçao)

-- Nemčija vs Curaçao (round 3) → Curaçao vs Slonokoščena obala, 16 UTC-4 = 20:00 UTC
UPDATE public.matches
  SET home_team = 'Curaçao', away_team = 'Slonokoščena obala',
      match_time_utc = '2026-06-25T20:00:00Z', updated_at = now()
  WHERE home_team = 'Nemčija' AND away_team = 'Curaçao'
    AND match_time_utc = '2026-06-25T19:00:00Z'
    AND status = 'Upcoming';

-- Ekvador vs Slonokoščena obala (round 3) → Ekvador vs Nemčija, 16 UTC-4 = 20:00 UTC
UPDATE public.matches
  SET away_team = 'Nemčija',
      match_time_utc = '2026-06-25T20:00:00Z', updated_at = now()
  WHERE home_team = 'Ekvador' AND away_team = 'Slonokoščena obala'
    AND match_time_utc = '2026-06-25T19:00:00Z'
    AND status = 'Upcoming';

-- Nemčija vs Slonokoščena obala (round 2): 16 UTC-4 = 20:00 UTC
UPDATE public.matches
  SET match_time_utc = '2026-06-20T20:00:00Z', updated_at = now()
  WHERE home_team = 'Nemčija' AND away_team = 'Slonokoščena obala'
    AND status = 'Upcoming';

-- Ekvador vs Curaçao (round 2): 19 UTC-5 = 00:00 UTC naslednji dan
UPDATE public.matches
  SET match_time_utc = '2026-06-21T00:00:00Z', updated_at = now()
  WHERE home_team = 'Ekvador' AND away_team = 'Curaçao'
    AND match_time_utc = '2026-06-20T01:00:00Z'
    AND status = 'Upcoming';

-- Nemčija vs Ekvador (round 1) → Nemčija vs Curaçao, 12 UTC-5 = 17:00 UTC
UPDATE public.matches
  SET away_team = 'Curaçao',
      match_time_utc = '2026-06-14T17:00:00Z', updated_at = now()
  WHERE home_team = 'Nemčija' AND away_team = 'Ekvador'
    AND status = 'Upcoming';

-- Slonokoščena vs Curaçao (round 1) → Slonokoščena vs Ekvador, 19 UTC-4 = 23:00 UTC
UPDATE public.matches
  SET away_team = 'Ekvador',
      match_time_utc = '2026-06-14T23:00:00Z', updated_at = now()
  WHERE home_team = 'Slonokoščena obala' AND away_team = 'Curaçao'
    AND status = 'Upcoming';

-- ── GROUP F ──────────────────────────────────────────────────────
-- Round 2+3 najprej (izogni se konfliktu s Švedska)

-- Nizozemska vs Tunizija (round 2) → Nizozemska vs Švedska, 12 UTC-5 = 17:00 UTC
UPDATE public.matches
  SET away_team = 'Švedska',
      match_time_utc = '2026-06-20T17:00:00Z', updated_at = now()
  WHERE home_team = 'Nizozemska' AND away_team = 'Tunizija'
    AND status = 'Upcoming';

-- Japonska vs Švedska (round 2) → Tunizija vs Japonska, 22 UTC-6 = 04:00 UTC naslednji dan
UPDATE public.matches
  SET home_team = 'Tunizija', away_team = 'Japonska',
      match_time_utc = '2026-06-21T04:00:00Z', updated_at = now()
  WHERE home_team = 'Japonska' AND away_team = 'Švedska'
    AND match_time_utc = '2026-06-21T01:00:00Z'
    AND status = 'Upcoming';

-- Nizozemska vs Švedska (round 3) → Japonska vs Švedska, 18 UTC-5 = 23:00 UTC
UPDATE public.matches
  SET home_team = 'Japonska',
      match_time_utc = '2026-06-25T23:00:00Z', updated_at = now()
  WHERE home_team = 'Nizozemska' AND away_team = 'Švedska'
    AND match_time_utc = '2026-06-26T19:00:00Z'
    AND status = 'Upcoming';

-- Japonska vs Tunizija (round 3) → Tunizija vs Nizozemska, 18 UTC-5 = 23:00 UTC
UPDATE public.matches
  SET home_team = 'Tunizija', away_team = 'Nizozemska',
      match_time_utc = '2026-06-25T23:00:00Z', updated_at = now()
  WHERE home_team = 'Japonska' AND away_team = 'Tunizija'
    AND match_time_utc = '2026-06-26T19:00:00Z'
    AND status = 'Upcoming';

-- Nizozemska vs Japonska (round 1): 15 UTC-5 = 20:00 UTC
UPDATE public.matches
  SET match_time_utc = '2026-06-14T20:00:00Z', updated_at = now()
  WHERE home_team = 'Nizozemska' AND away_team = 'Japonska'
    AND status = 'Upcoming';

-- Švedska vs Tunizija (round 1): 20 UTC-6 = 02:00 UTC naslednji dan
UPDATE public.matches
  SET match_time_utc = '2026-06-15T02:00:00Z', updated_at = now()
  WHERE home_team = 'Švedska' AND away_team = 'Tunizija'
    AND status = 'Upcoming';

-- ── GROUP G ──────────────────────────────────────────────────────
-- Round 3 najprej (izogni se konfliktu z Egipt vs Iran)

-- Belgija vs Nova Zelandija (round 3) → Egipt vs Iran, 20 UTC-7 = 03:00 UTC naslednji dan
UPDATE public.matches
  SET home_team = 'Egipt', away_team = 'Iran',
      match_time_utc = '2026-06-27T03:00:00Z', updated_at = now()
  WHERE home_team = 'Belgija' AND away_team = 'Nova Zelandija'
    AND match_time_utc = '2026-06-27T01:00:00Z'
    AND status = 'Upcoming';

-- Egipt vs Iran (round 3) → Nova Zelandija vs Belgija, 20 UTC-7 = 03:00 UTC naslednji dan
UPDATE public.matches
  SET home_team = 'Nova Zelandija', away_team = 'Belgija',
      match_time_utc = '2026-06-27T03:00:00Z', updated_at = now()
  WHERE home_team = 'Egipt' AND away_team = 'Iran'
    AND match_time_utc = '2026-06-27T01:00:00Z'
    AND status = 'Upcoming';

-- Belgija vs Egipt (round 1): 12 UTC-7 = 19:00 UTC (15. junij, ne 14.)
UPDATE public.matches
  SET match_time_utc = '2026-06-15T19:00:00Z', updated_at = now()
  WHERE home_team = 'Belgija' AND away_team = 'Egipt'
    AND status = 'Upcoming';

-- Iran vs Nova Zelandija (round 1): 18 UTC-7 = 01:00 UTC naslednji dan (16. junij)
UPDATE public.matches
  SET match_time_utc = '2026-06-16T01:00:00Z', updated_at = now()
  WHERE home_team = 'Iran' AND away_team = 'Nova Zelandija'
    AND status = 'Upcoming';

-- Belgija vs Iran (round 2): 12 UTC-7 = 19:00 UTC (21. junij, ne 20.)
UPDATE public.matches
  SET match_time_utc = '2026-06-21T19:00:00Z', updated_at = now()
  WHERE home_team = 'Belgija' AND away_team = 'Iran'
    AND status = 'Upcoming';

-- Nova Zelandija vs Egipt (round 2): 18 UTC-7 = 01:00 UTC naslednji dan (22. junij)
UPDATE public.matches
  SET match_time_utc = '2026-06-22T01:00:00Z', updated_at = now()
  WHERE home_team = 'Nova Zelandija' AND away_team = 'Egipt'
    AND status = 'Upcoming';

-- ── GROUP H ──────────────────────────────────────────────────────
-- Savdska Arabija vs Urugvaj (15T22) ✓

-- Španija vs Zelenortski otoki (round 1): 12 UTC-4 = 16:00 UTC
UPDATE public.matches
  SET match_time_utc = '2026-06-15T16:00:00Z', updated_at = now()
  WHERE home_team = 'Španija' AND away_team = 'Zelenortski otoki'
    AND status = 'Upcoming';

-- Španija vs Savdska Arabija (round 2): 12 UTC-4 = 16:00 UTC (ne 22:00!)
UPDATE public.matches
  SET match_time_utc = '2026-06-21T16:00:00Z', updated_at = now()
  WHERE home_team = 'Španija' AND away_team = 'Savdska Arabija'
    AND status = 'Upcoming';

-- Urugvaj vs Zelenortski otoki (round 2): 18 UTC-4 = 22:00 UTC (21. junij, ne 22.)
UPDATE public.matches
  SET match_time_utc = '2026-06-21T22:00:00Z', updated_at = now()
  WHERE home_team = 'Urugvaj' AND away_team = 'Zelenortski otoki'
    AND status = 'Upcoming';

-- Round 3: ekipe zamenjane (Zelenortski otoki vs Savdska → Urugvaj vs Španija in obratno)
-- Zelenortski vs Savdska Arabija (round 3) → Urugvaj vs Španija, 18 UTC-6 = 00:00 UTC naslednji dan
UPDATE public.matches
  SET home_team = 'Urugvaj', away_team = 'Španija',
      match_time_utc = '2026-06-27T00:00:00Z', updated_at = now()
  WHERE home_team = 'Zelenortski otoki' AND away_team = 'Savdska Arabija'
    AND match_time_utc = '2026-06-26T22:00:00Z'
    AND status = 'Upcoming';

-- Španija vs Urugvaj (round 3) → Zelenortski otoki vs Savdska Arabija, 19 UTC-5 = 00:00 UTC naslednji dan
UPDATE public.matches
  SET home_team = 'Zelenortski otoki', away_team = 'Savdska Arabija',
      match_time_utc = '2026-06-27T00:00:00Z', updated_at = now()
  WHERE home_team = 'Španija' AND away_team = 'Urugvaj'
    AND match_time_utc = '2026-06-26T22:00:00Z'
    AND status = 'Upcoming';

-- ── GROUP I ──────────────────────────────────────────────────────
-- Round 3 najprej (izogni se konfliktu s Francija vs Senegal)

-- Francija vs Senegal (round 2 seed) → Francija vs Irak, 17 UTC-4 = 21:00 UTC
UPDATE public.matches
  SET away_team = 'Irak',
      match_time_utc = '2026-06-22T21:00:00Z', updated_at = now()
  WHERE home_team = 'Francija' AND away_team = 'Senegal'
    AND match_time_utc = '2026-06-18T22:00:00Z'
    AND status = 'Upcoming';

-- Francija vs Irak (round 1 seed) → Francija vs Senegal, 15 UTC-4 = 19:00 UTC
UPDATE public.matches
  SET away_team = 'Senegal',
      match_time_utc = '2026-06-16T19:00:00Z', updated_at = now()
  WHERE home_team = 'Francija' AND away_team = 'Irak'
    AND match_time_utc = '2026-06-14T22:00:00Z'
    AND status = 'Upcoming';

-- Norveška vs Irak (round 2 seed) → Norveška vs Senegal, 20 UTC-4 = 00:00 UTC naslednji dan
UPDATE public.matches
  SET away_team = 'Senegal',
      match_time_utc = '2026-06-23T00:00:00Z', updated_at = now()
  WHERE home_team = 'Norveška' AND away_team = 'Irak'
    AND status = 'Upcoming';

-- Senegal vs Norveška (round 1 seed) → Irak vs Norveška, 18 UTC-4 = 22:00 UTC
UPDATE public.matches
  SET home_team = 'Irak',
      match_time_utc = '2026-06-16T22:00:00Z', updated_at = now()
  WHERE home_team = 'Senegal' AND away_team = 'Norveška'
    AND status = 'Upcoming';

-- Francija vs Norveška (round 3) → Norveška vs Francija, 15 UTC-4 = 19:00 UTC (26. junij)
UPDATE public.matches
  SET home_team = 'Norveška', away_team = 'Francija',
      match_time_utc = '2026-06-26T19:00:00Z', updated_at = now()
  WHERE home_team = 'Francija' AND away_team = 'Norveška'
    AND status = 'Upcoming';

-- Irak vs Senegal (round 3) → Senegal vs Irak, 15 UTC-4 = 19:00 UTC (26. junij)
UPDATE public.matches
  SET home_team = 'Senegal', away_team = 'Irak',
      match_time_utc = '2026-06-26T19:00:00Z', updated_at = now()
  WHERE home_team = 'Irak' AND away_team = 'Senegal'
    AND status = 'Upcoming';

-- ── GROUP J ──────────────────────────────────────────────────────
-- Round 2/3 najprej (izogni se konfliktu z Argentina vs Alžirija)

-- Argentina vs Alžirija (round 2 seed) → Argentina vs Avstrija, 12 UTC-5 = 17:00 UTC
UPDATE public.matches
  SET away_team = 'Avstrija',
      match_time_utc = '2026-06-22T17:00:00Z', updated_at = now()
  WHERE home_team = 'Argentina' AND away_team = 'Alžirija'
    AND match_time_utc = '2026-06-21T22:00:00Z'
    AND status = 'Upcoming';

-- Argentina vs Avstrija (round 1 seed) → Argentina vs Alžirija, 20 UTC-5 = 01:00 UTC naslednji dan
UPDATE public.matches
  SET away_team = 'Alžirija',
      match_time_utc = '2026-06-17T01:00:00Z', updated_at = now()
  WHERE home_team = 'Argentina' AND away_team = 'Avstrija'
    AND match_time_utc = '2026-06-16T19:00:00Z'
    AND status = 'Upcoming';

-- Alžirija vs Jordanija (round 1 seed) → Avstrija vs Jordanija, 21 UTC-7 = 04:00 UTC naslednji dan
UPDATE public.matches
  SET home_team = 'Avstrija',
      match_time_utc = '2026-06-17T04:00:00Z', updated_at = now()
  WHERE home_team = 'Alžirija' AND away_team = 'Jordanija'
    AND match_time_utc = '2026-06-16T22:00:00Z'
    AND status = 'Upcoming';

-- Jordanija vs Avstrija (round 2 seed) → Jordanija vs Alžirija, 20 UTC-7 = 03:00 UTC naslednji dan
UPDATE public.matches
  SET away_team = 'Alžirija',
      match_time_utc = '2026-06-23T03:00:00Z', updated_at = now()
  WHERE home_team = 'Jordanija' AND away_team = 'Avstrija'
    AND status = 'Upcoming';

-- Argentina vs Jordanija (round 3) → Alžirija vs Avstrija, 21 UTC-5 = 02:00 UTC naslednji dan
UPDATE public.matches
  SET home_team = 'Alžirija', away_team = 'Avstrija',
      match_time_utc = '2026-06-28T02:00:00Z', updated_at = now()
  WHERE home_team = 'Argentina' AND away_team = 'Jordanija'
    AND match_time_utc = '2026-06-26T22:00:00Z'
    AND status = 'Upcoming';

-- Alžirija vs Avstrija (round 3 seed) → Jordanija vs Argentina, 21 UTC-5 = 02:00 UTC naslednji dan
UPDATE public.matches
  SET home_team = 'Jordanija', away_team = 'Argentina',
      match_time_utc = '2026-06-28T02:00:00Z', updated_at = now()
  WHERE home_team = 'Alžirija' AND away_team = 'Avstrija'
    AND match_time_utc = '2026-06-26T22:00:00Z'
    AND status = 'Upcoming';

-- ── GROUP K ──────────────────────────────────────────────────────
-- Round 2 najprej (izogni se konfliktu s Portugalska vs Uzbekistan)

-- Portugalska vs DR Kongo (round 2 seed) → Portugalska vs Uzbekistan, 12 UTC-5 = 17:00 UTC
UPDATE public.matches
  SET away_team = 'Uzbekistan',
      match_time_utc = '2026-06-23T17:00:00Z', updated_at = now()
  WHERE home_team = 'Portugalska' AND away_team = 'DR Kongo'
    AND match_time_utc = '2026-06-22T22:00:00Z'
    AND status = 'Upcoming';

-- Portugalska vs Uzbekistan (round 1 seed) → Portugalska vs DR Kongo, 12 UTC-5 = 17:00 UTC
UPDATE public.matches
  SET away_team = 'DR Kongo',
      match_time_utc = '2026-06-17T17:00:00Z', updated_at = now()
  WHERE home_team = 'Portugalska' AND away_team = 'Uzbekistan'
    AND match_time_utc = '2026-06-16T22:00:00Z'
    AND status = 'Upcoming';

-- DR Kongo vs Kolumbija (round 1 seed) → Uzbekistan vs Kolumbija, 20 UTC-6 = 02:00 UTC naslednji dan
UPDATE public.matches
  SET home_team = 'Uzbekistan',
      match_time_utc = '2026-06-18T02:00:00Z', updated_at = now()
  WHERE home_team = 'DR Kongo' AND away_team = 'Kolumbija'
    AND status = 'Upcoming';

-- Uzbekistan vs Kolumbija (round 2 seed) → Kolumbija vs DR Kongo, 20 UTC-6 = 02:00 UTC naslednji dan
UPDATE public.matches
  SET home_team = 'Kolumbija', away_team = 'DR Kongo',
      match_time_utc = '2026-06-24T02:00:00Z', updated_at = now()
  WHERE home_team = 'Uzbekistan' AND away_team = 'Kolumbija'
    AND match_time_utc = '2026-06-23T01:00:00Z'
    AND status = 'Upcoming';

-- Portugalska vs Kolumbija (round 3) → Kolumbija vs Portugalska, 19:30 UTC-4 = 23:30 UTC
UPDATE public.matches
  SET home_team = 'Kolumbija', away_team = 'Portugalska',
      match_time_utc = '2026-06-27T23:30:00Z', updated_at = now()
  WHERE home_team = 'Portugalska' AND away_team = 'Kolumbija'
    AND status = 'Upcoming';

-- DR Kongo vs Uzbekistan (round 3): 19:30 UTC-4 = 23:30 UTC
UPDATE public.matches
  SET match_time_utc = '2026-06-27T23:30:00Z', updated_at = now()
  WHERE home_team = 'DR Kongo' AND away_team = 'Uzbekistan'
    AND status = 'Upcoming';

-- ── GROUP L ──────────────────────────────────────────────────────
-- Anglija vs Hrvaška (17T20) ✓
-- Gana vs Panama (17T23) ✓
-- Anglija vs Gana (23T20) ✓

-- Hrvaška vs Panama → Panama vs Hrvaška (zamenjava doma/gosta)
UPDATE public.matches
  SET home_team = 'Panama', away_team = 'Hrvaška', updated_at = now()
  WHERE home_team = 'Hrvaška' AND away_team = 'Panama'
    AND status = 'Upcoming';

-- Anglija vs Panama → Panama vs Anglija (zamenjava doma/gosta)
UPDATE public.matches
  SET home_team = 'Panama', away_team = 'Anglija', updated_at = now()
  WHERE home_team = 'Anglija' AND away_team = 'Panama'
    AND status = 'Upcoming';

-- Hrvaška vs Gana (27T21) ✓
