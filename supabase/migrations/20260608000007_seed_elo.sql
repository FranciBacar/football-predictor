-- ELO ratings za SP 2026 ekipe — slovenska imena (vir: eloratings.net, junij 2026)
INSERT INTO public.team_elo (team_name, elo_rating) VALUES
  -- Skupina A
  ('Mehika',                1876),
  ('Južna Koreja',          1828),
  ('Češka',                 1820),
  ('Južna Afrika',          1689),
  -- Skupina B
  ('Kanada',                1801),
  ('Bosna in Hercegovina',  1742),
  ('Švica',                 1920),
  ('Katar',                 1580),
  -- Skupina C
  ('Brazilija',             2079),
  ('Maroko',                1942),
  ('Haiti',                 1420),
  ('Škotska',               1782),
  -- Skupina D
  ('ZDA',                   1834),
  ('Turčija',               1858),
  ('Avstralija',            1790),
  ('Paragvaj',              1731),
  -- Skupina E
  ('Nemčija',               2030),
  ('Ekvador',               1774),
  ('Slonokoščena obala',    1823),
  ('Curaçao',               1400),
  -- Skupina F
  ('Nizozemska',            1998),
  ('Japonska',              1888),
  ('Švedska',               1850),
  ('Tunizija',              1740),
  -- Skupina G
  ('Belgija',               1965),
  ('Egipt',                 1730),
  ('Iran',                  1787),
  ('Nova Zelandija',        1647),
  -- Skupina H
  ('Španija',               2045),
  ('Zelenortski otoki',     1550),
  ('Savdska Arabija',       1726),
  ('Urugvaj',               1892),
  -- Skupina I
  ('Francija',              2068),
  ('Senegal',               1886),
  ('Irak',                  1650),
  ('Norveška',              1880),
  -- Skupina J
  ('Argentina',             2105),
  ('Alžirija',              1760),
  ('Avstrija',              1830),
  ('Jordanija',             1580),
  -- Skupina K
  ('Portugalska',           2010),
  ('DR Kongo',              1677),
  ('Uzbekistan',            1640),
  ('Kolumbija',             1882),
  -- Skupina L
  ('Anglija',               1976),
  ('Hrvaška',               1930),
  ('Gana',                  1710),
  ('Panama',                1701)
ON CONFLICT (team_name) DO UPDATE SET elo_rating = EXCLUDED.elo_rating, updated_at = NOW();
