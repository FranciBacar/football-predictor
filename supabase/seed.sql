-- Seed Data za MVP Svetovno Prvenstvo (Vzorec)
-- Ta datoteka se lahko požene v Supabase SQL Editorju, da napolni bazo s tekmami.

-- Očistimo tabele (Samo za dev okolje)
-- TRUNCATE TABLE public.predictions CASCADE;
-- TRUNCATE TABLE public.matches CASCADE;

-- 1. Skupina A
INSERT INTO public.matches (home_team, away_team, match_time_utc, stage, is_knockout, status) VALUES 
('ZDA', 'Mehika', '2026-06-11T12:00:00Z', 'Group A', false, 'Upcoming'),
('Slovenija', 'Senegal', '2026-06-12T15:00:00Z', 'Group A', false, 'Upcoming'),
('Slovenija', 'Mehika', '2026-06-16T18:00:00Z', 'Group A', false, 'Upcoming'),
('ZDA', 'Senegal', '2026-06-16T18:00:00Z', 'Group A', false, 'Upcoming');

-- 2. Skupina B
INSERT INTO public.matches (home_team, away_team, match_time_utc, stage, is_knockout, status) VALUES 
('Anglija', 'Japonska', '2026-06-12T12:00:00Z', 'Group B', false, 'Upcoming'),
('Argentina', 'Egipt', '2026-06-12T15:00:00Z', 'Group B', false, 'Upcoming'),
('Anglija', 'Argentina', '2026-06-17T18:00:00Z', 'Group B', false, 'Upcoming'),
('Japonska', 'Egipt', '2026-06-17T18:00:00Z', 'Group B', false, 'Upcoming');

-- 3. Primer Izločilne Tekme (Osmina finala)
INSERT INTO public.matches (home_team, away_team, match_time_utc, stage, is_knockout, status) VALUES 
('Zmagovalec A', 'Drugi B', '2026-06-28T16:00:00Z', 'Round of 16', true, 'Upcoming'),
('Zmagovalec B', 'Drugi A', '2026-06-28T20:00:00Z', 'Round of 16', true, 'Upcoming');