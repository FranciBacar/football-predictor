-- Dodamo onboarding_completed polje na users tabelo
-- Obstoječi uporabniki: true (že so "v sistemu")
-- Novi uporabniki: false → jih pošljemo na /pravila

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Obstoječe uporabnike označi kot dokončane (ne silimo jih skozi onboarding)
UPDATE public.users SET onboarding_completed = true;
