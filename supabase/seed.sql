-- ============================================================
-- SEED: FIFA Svetovno Prvenstvo 2026 – Skupinska faza
-- Vsi časi so v UTC. App jih prikaže v lokalnem času naprave.
-- ============================================================
-- Vir skupin: uradni žreb FIFA, 5. december 2025
-- Skupina A: Mehika, Južna Koreja, Češka, Južna Afrika
-- Skupina B: Švica, Kanada, Katar, Bosna in Hercegovina
-- Skupina C: Brazilija, Maroko, Haiti, Škotska
-- Skupina D: ZDA, Turčija, Avstralija, Paragvaj
-- Skupina E: Nemčija, Ekvador, Slonokoščena obala, Curaçao
-- Skupina F: Nizozemska, Japonska, Švedska, Tunizija
-- Skupina G: Belgija, Egipt, Iran, Nova Zelandija
-- Skupina H: Španija, Zelenortski otoki, Savdska Arabija, Urugvaj
-- Skupina I: Francija, Senegal, Irak, Norveška
-- Skupina J: Argentina, Alžirija, Avstrija, Jordanija
-- Skupina K: Portugalska, DR Kongo, Uzbekistan, Kolumbija
-- Skupina L: Anglija, Hrvaška, Gana, Panama
-- ============================================================

-- Počisti obstoječe podatke (samo za dev)
TRUNCATE TABLE public.predictions CASCADE;
TRUNCATE TABLE public.matches CASCADE;


-- ============================================================
-- SKUPINA A
-- ============================================================
INSERT INTO public.matches (home_team, away_team, match_time_utc, stage, is_knockout, status) VALUES
('Mehika',       'Južna Afrika',  '2026-06-11T19:00:00Z', 'Group A', false, 'Upcoming'),
('Južna Koreja', 'Češka',         '2026-06-11T22:00:00Z', 'Group A', false, 'Upcoming'),
('Mehika',       'Južna Koreja',  '2026-06-17T22:00:00Z', 'Group A', false, 'Upcoming'),
('Češka',        'Južna Afrika',  '2026-06-18T01:00:00Z', 'Group A', false, 'Upcoming'),
('Mehika',       'Češka',         '2026-06-24T22:00:00Z', 'Group A', false, 'Upcoming'),
('Južna Afrika', 'Južna Koreja',  '2026-06-24T22:00:00Z', 'Group A', false, 'Upcoming');


-- ============================================================
-- SKUPINA B
-- ============================================================
INSERT INTO public.matches (home_team, away_team, match_time_utc, stage, is_knockout, status) VALUES
('Kanada',               'Bosna in Hercegovina', '2026-06-12T19:00:00Z', 'Group B', false, 'Upcoming'),
('Švica',                'Katar',                '2026-06-12T22:00:00Z', 'Group B', false, 'Upcoming'),
('Švica',                'Bosna in Hercegovina', '2026-06-18T19:00:00Z', 'Group B', false, 'Upcoming'),
('Kanada',               'Katar',                '2026-06-18T22:00:00Z', 'Group B', false, 'Upcoming'),
('Kanada',               'Švica',                '2026-06-25T22:00:00Z', 'Group B', false, 'Upcoming'),
('Bosna in Hercegovina', 'Katar',                '2026-06-25T22:00:00Z', 'Group B', false, 'Upcoming');


-- ============================================================
-- SKUPINA C
-- ============================================================
INSERT INTO public.matches (home_team, away_team, match_time_utc, stage, is_knockout, status) VALUES
('Brazilija', 'Maroko',   '2026-06-13T22:00:00Z', 'Group C', false, 'Upcoming'),
('Haiti',     'Škotska',  '2026-06-14T01:00:00Z', 'Group C', false, 'Upcoming'),
('Brazilija', 'Haiti',    '2026-06-19T22:00:00Z', 'Group C', false, 'Upcoming'),
('Maroko',    'Škotska',  '2026-06-20T01:00:00Z', 'Group C', false, 'Upcoming'),
('Brazilija', 'Škotska',  '2026-06-26T22:00:00Z', 'Group C', false, 'Upcoming'),
('Maroko',    'Haiti',    '2026-06-26T22:00:00Z', 'Group C', false, 'Upcoming');


-- ============================================================
-- SKUPINA D
-- ============================================================
INSERT INTO public.matches (home_team, away_team, match_time_utc, stage, is_knockout, status) VALUES
('ZDA',       'Paragvaj',   '2026-06-13T01:00:00Z', 'Group D', false, 'Upcoming'),
('Turčija',   'Avstralija', '2026-06-14T04:00:00Z', 'Group D', false, 'Upcoming'),
('ZDA',       'Turčija',    '2026-06-19T19:00:00Z', 'Group D', false, 'Upcoming'),
('Avstralija','Paragvaj',   '2026-06-20T04:00:00Z', 'Group D', false, 'Upcoming'),
('ZDA',       'Avstralija', '2026-06-25T01:00:00Z', 'Group D', false, 'Upcoming'),
('Paragvaj',  'Turčija',   '2026-06-25T01:00:00Z', 'Group D', false, 'Upcoming');


-- ============================================================
-- SKUPINA E
-- ============================================================
INSERT INTO public.matches (home_team, away_team, match_time_utc, stage, is_knockout, status) VALUES
('Nemčija',            'Ekvador',            '2026-06-13T19:00:00Z', 'Group E', false, 'Upcoming'),
('Slonokoščena obala', 'Curaçao',            '2026-06-13T22:00:00Z', 'Group E', false, 'Upcoming'),
('Nemčija',            'Slonokoščena obala', '2026-06-19T22:00:00Z', 'Group E', false, 'Upcoming'),
('Ekvador',            'Curaçao',            '2026-06-20T01:00:00Z', 'Group E', false, 'Upcoming'),
('Nemčija',            'Curaçao',            '2026-06-25T19:00:00Z', 'Group E', false, 'Upcoming'),
('Ekvador',            'Slonokoščena obala', '2026-06-25T19:00:00Z', 'Group E', false, 'Upcoming');


-- ============================================================
-- SKUPINA F
-- ============================================================
INSERT INTO public.matches (home_team, away_team, match_time_utc, stage, is_knockout, status) VALUES
('Nizozemska', 'Japonska', '2026-06-14T21:00:00Z', 'Group F', false, 'Upcoming'),
('Švedska',    'Tunizija', '2026-06-15T01:00:00Z', 'Group F', false, 'Upcoming'),
('Nizozemska', 'Tunizija', '2026-06-20T22:00:00Z', 'Group F', false, 'Upcoming'),
('Japonska',   'Švedska',  '2026-06-21T01:00:00Z', 'Group F', false, 'Upcoming'),
('Nizozemska', 'Švedska',  '2026-06-26T19:00:00Z', 'Group F', false, 'Upcoming'),
('Japonska',   'Tunizija', '2026-06-26T19:00:00Z', 'Group F', false, 'Upcoming');


-- ============================================================
-- SKUPINA G
-- ============================================================
INSERT INTO public.matches (home_team, away_team, match_time_utc, stage, is_knockout, status) VALUES
('Belgija',       'Egipt',          '2026-06-14T19:00:00Z', 'Group G', false, 'Upcoming'),
('Iran',          'Nova Zelandija', '2026-06-15T22:00:00Z', 'Group G', false, 'Upcoming'),
('Belgija',       'Iran',           '2026-06-20T19:00:00Z', 'Group G', false, 'Upcoming'),
('Nova Zelandija','Egipt',          '2026-06-21T22:00:00Z', 'Group G', false, 'Upcoming'),
('Belgija',       'Nova Zelandija', '2026-06-27T01:00:00Z', 'Group G', false, 'Upcoming'),
('Egipt',         'Iran',           '2026-06-27T01:00:00Z', 'Group G', false, 'Upcoming');


-- ============================================================
-- SKUPINA H
-- ============================================================
INSERT INTO public.matches (home_team, away_team, match_time_utc, stage, is_knockout, status) VALUES
('Španija',          'Zelenortski otoki', '2026-06-15T19:00:00Z', 'Group H', false, 'Upcoming'),
('Savdska Arabija',  'Urugvaj',           '2026-06-15T22:00:00Z', 'Group H', false, 'Upcoming'),
('Španija',          'Savdska Arabija',   '2026-06-21T22:00:00Z', 'Group H', false, 'Upcoming'),
('Urugvaj',          'Zelenortski otoki', '2026-06-22T01:00:00Z', 'Group H', false, 'Upcoming'),
('Španija',          'Urugvaj',           '2026-06-26T22:00:00Z', 'Group H', false, 'Upcoming'),
('Zelenortski otoki','Savdska Arabija',   '2026-06-26T22:00:00Z', 'Group H', false, 'Upcoming');


-- ============================================================
-- SKUPINA I
-- ============================================================
INSERT INTO public.matches (home_team, away_team, match_time_utc, stage, is_knockout, status) VALUES
('Francija', 'Irak',     '2026-06-14T22:00:00Z', 'Group I', false, 'Upcoming'),
('Senegal',  'Norveška', '2026-06-15T01:00:00Z', 'Group I', false, 'Upcoming'),
('Francija', 'Senegal',  '2026-06-18T22:00:00Z', 'Group I', false, 'Upcoming'),
('Norveška', 'Irak',     '2026-06-19T01:00:00Z', 'Group I', false, 'Upcoming'),
('Francija', 'Norveška', '2026-06-25T19:00:00Z', 'Group I', false, 'Upcoming'),
('Irak',     'Senegal',  '2026-06-25T19:00:00Z', 'Group I', false, 'Upcoming');


-- ============================================================
-- SKUPINA J
-- ============================================================
INSERT INTO public.matches (home_team, away_team, match_time_utc, stage, is_knockout, status) VALUES
('Argentina', 'Avstrija',  '2026-06-16T19:00:00Z', 'Group J', false, 'Upcoming'),
('Alžirija',  'Jordanija', '2026-06-16T22:00:00Z', 'Group J', false, 'Upcoming'),
('Argentina', 'Alžirija',  '2026-06-21T22:00:00Z', 'Group J', false, 'Upcoming'),
('Jordanija', 'Avstrija',  '2026-06-22T01:00:00Z', 'Group J', false, 'Upcoming'),
('Argentina', 'Jordanija', '2026-06-26T22:00:00Z', 'Group J', false, 'Upcoming'),
('Alžirija',  'Avstrija',  '2026-06-26T22:00:00Z', 'Group J', false, 'Upcoming');


-- ============================================================
-- SKUPINA K
-- ============================================================
INSERT INTO public.matches (home_team, away_team, match_time_utc, stage, is_knockout, status) VALUES
('Portugalska', 'Uzbekistan', '2026-06-16T22:00:00Z', 'Group K', false, 'Upcoming'),
('DR Kongo',    'Kolumbija',  '2026-06-17T01:00:00Z', 'Group K', false, 'Upcoming'),
('Portugalska', 'DR Kongo',   '2026-06-22T22:00:00Z', 'Group K', false, 'Upcoming'),
('Uzbekistan',  'Kolumbija',  '2026-06-23T01:00:00Z', 'Group K', false, 'Upcoming'),
('Portugalska', 'Kolumbija',  '2026-06-27T22:00:00Z', 'Group K', false, 'Upcoming'),
('DR Kongo',    'Uzbekistan', '2026-06-27T22:00:00Z', 'Group K', false, 'Upcoming');


-- ============================================================
-- SKUPINA L
-- ============================================================
INSERT INTO public.matches (home_team, away_team, match_time_utc, stage, is_knockout, status) VALUES
('Anglija', 'Hrvaška', '2026-06-17T20:00:00Z', 'Group L', false, 'Upcoming'),
('Gana',    'Panama',  '2026-06-17T23:00:00Z', 'Group L', false, 'Upcoming'),
('Anglija', 'Gana',    '2026-06-23T20:00:00Z', 'Group L', false, 'Upcoming'),
('Hrvaška', 'Panama',  '2026-06-23T23:00:00Z', 'Group L', false, 'Upcoming'),
('Anglija', 'Panama',  '2026-06-27T21:00:00Z', 'Group L', false, 'Upcoming'),
('Hrvaška', 'Gana',    '2026-06-27T21:00:00Z', 'Group L', false, 'Upcoming');
