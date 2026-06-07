# Football Predictor — Dev Log

## Stanje projekta — posodobljeno 5. junij 2026 (konec seje)

### ✅ Vse zgrajeno, commitano in na GitHubu (clean working tree)
- Auth flow: login (Google/Facebook/GitHub), callback, middleware, signout
- Dashboard `/dashboard`: realne tekme iz Supabase, vnos in shranjevanje napovedi
- Knockout UX: remi v izločilnih bojih → "kdo napreduje?" polje
- Groups `/groups`: ustvarjanje skupin, pridruži se s kodo, copy invite koda, "Poglej Lestvico" gumb
- Leaderboard `/leaderboard`: globalna + skupinska lestvica z tab switcherjem
- Profile `/profile`: prikaz profila, opt-in toggle za globalno lestvico, odjava, brisanje računa
- Navbar: desktop + mobile, 4 zavihki (Napovedi, Lestvica, Skupine, Profil)
- SQL migracije vse aplicirane v Supabase:
  - Shema: users, matches, predictions, groups, group_members + RLS + trigger za novega uporabnika
  - Scoring: `calculate_points()`, `on_match_finished` trigger, `get_global_leaderboard()`, `get_group_leaderboard()`
  - Enum: Groups A–L + Round of 32
- Seed: vseh 72 skupinskih tekem SP 2026 z resničnimi ekipami in UTC časi

### ⏳ TODO — naslednja seja (prioritetno)

**1. API-Football cron sync** ← NAJPOMEMBNEJŠE
   - Uporabnik se mora registrirati: https://dashboard.api-football.com/register (brezplačno)
   - Ko ima API ključ → zgradim `/api/cron/sync-results` route
   - Cron teče vsakih 30 min, kliče API-Football za rezultate
   - Ko tekma = Finished → trigger samodejno izračuna točke → lestvica se posodobi
   - Dodati `FOOTBALL_API_KEY` v `.env.local` in Vercel env vars

**2. Onboarding flow** — za nove uporabnike
   - Ob prvi prijavi → redirect na stran za opt-in globalne lestvice
   - Povabljeni uporabnik (magic link) → direktno v skupino

**3. Admin stran** `/admin` — fallback za ročni vnos rezultatov
   - Dostopna samo za `is_admin = true` uporabnike
   - Vnos actual_score_home/away in status = Finished

**4. Izločilne tekme** — po skupinski fazi (od 28. junija)
   - Dodati Round of 32 tekme ko so znani pari

---

## Tech Stack
- **Frontend:** Next.js 16.2.7, React 19, TypeScript, Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Auth:** Google, Facebook, GitHub SSO
- **Repo:** https://github.com/FranciBacar/football-predictor
- **Supabase URL:** https://klqouvktvhsghfyqnvax.supabase.co

## Struktura projekta
```
src/
  app/
    dashboard/          ← Napovedi (glavna stran)
    leaderboard/        ← Lestvice (globalna + skupinska)
    groups/             ← Skupine (ustvari, pridruži, lestvica)
    profile/            ← Profil, opt-in, odjava, brisanje računa
    auth/callback/      ← OAuth callback
    auth/signout/       ← Odjava
    login/              ← Prijava
  components/
    Navbar.tsx          ← Desktop + mobile navigacija
  utils/supabase/       ← Server/client/middleware klienti
supabase/
  migrations/
    20260604000000_initial_schema.sql             ← ✅ apliciran
    20260605000001_scoring_and_leaderboard.sql     ← ✅ apliciran
    20260605000002_update_stages_enum.sql          ← ✅ apliciran
  seed.sql              ← ✅ apliciran (72 tekem SP 2026)
```
