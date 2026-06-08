-- Popravi default za is_global_opt_in: vsi so vidni na globalni lestvici privzeto
ALTER TABLE public.users ALTER COLUMN is_global_opt_in SET DEFAULT true;

-- Posodobi obstoječe uporabnike ki so false samo zato ker je bil napačen default
-- (ne tistih ki so ga ročno izklopili — ampak ker nimamo tega podatka, postavimo vse na true)
UPDATE public.users SET is_global_opt_in = true WHERE is_global_opt_in = false;
