-- Dodamo onboarding_visits: šteje koliko krat je uporabnik videl onboarding tour
-- Onboarding se prikaže max MAX_VISITS (3) krat
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_visits INT NOT NULL DEFAULT 0;

-- Obstoječi uporabniki, ki so že zaključili onboarding → nastavi na 3 (preskoči)
UPDATE public.users SET onboarding_visits = 3 WHERE onboarding_completed = true;
