# Football Predictor — Dev Log

## Stanje projekta (5. junij 2026)

### ✅ Zgrajeno in commitano (na GitHubu)
- Auth flow: login (Google/Facebook/GitHub), callback, middleware, signout
- Dashboard `/dashboard`: prikazuje realne tekme iz Supabase, vnos napovedi, shranjevanje
- Knockout UX: remi v izločilnih bojih → "kdo napreduje?" polje
- Groups `/groups`: ustvarjanje skupin, pridruži se s kodo, copy invite koda
- Leaderboard `/leaderboard`: globalna + skupinska lestvica, tab switcher
- Navbar: desktop + mobile, 4 zavihki (Napovedi, Lestvica, Skupine, Profil)
- SQL: celotna shema (users, matches, predictions, groups, group_members + RLS + trigger)
- SQL: scoring funkcija + `on_match_finished` trigger
- SQL: `get_global_leaderboard()` in `get_group_leaderboard()` RPC funkciji
- Seed: vseh 72 skupinskih tekem SP 2026 z resničnimi ekipami

### ⚠️ Zgrajeno LOKALNO — še NI commitano (staged, čaka commit)
Te 3 datoteke so staged in čakajo commit:
- `src/app/profile/page.tsx` — nova
- `src/app/profile/ProfileClient.tsx` — nova
- `src/components/Navbar.tsx` — dodан Profil zavihek

**Kako commitaš:** Zapri GitHub Desktop (Force Quit), nato v terminalu:
```bash
rm -f ~/Desktop/footbal_prediction/.git/HEAD.lock ~/Desktop/footbal_prediction/.git/index.lock ~/Desktop/footbal_prediction/.git/objects/maintenance.lock
cd ~/Desktop/footbal_prediction
git commit -m "feat: add Profile page with opt-in toggle, sign out, delete account"
git push origin main
```

### ⏳ TODO — naslednja seja
1. **API-Football integracija** — avtomatski sync rezultatov tekem
   - Registriraj se na https://dashboard.api-football.com/register (brezplačno, brez kartice)
   - Daj mi API ključ → zgradim cron route `/api/cron/sync-results`
   - Cron teče vsakih 30 min, posodablja status tekem, trigger izračuna točke

2. **Supabase migracije za zagon** — še ni apliciranih:
   - `supabase/migrations/20260605000002_update_stages_enum.sql` → dodaj Groups I-L + Round of 32
   - `supabase/seed.sql` → počisti stare tekme, vstavi 72 resničnih

3. **Onboarding flow** — ko se nov uporabnik prijavi prvič:
   - Redirect na stran kjer izbere opt-in za globalno lestvico
   - Nato napoti na dashboard ali group invite (če prišel z magic link)

4. **Admin stran** `/admin` — ročni vnos rezultatov (fallback ko API ne dela)

5. **Izločilne tekme** — po skupinski fazi dodati Round of 32 tekme v bazo

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
    leaderboard/        ← Lestvice
    groups/             ← Skupine
    profile/            ← Profil + nastavitve (⚠️ lokalno, ni commitano)
    auth/callback/      ← OAuth callback
    auth/signout/       ← Odjava
    login/              ← Prijava
  components/
    Navbar.tsx          ← Navigacija (⚠️ lokalno, ni commitano)
    MatchCard.tsx       ← Kartica tekme (stara verzija, ni več v uporabi)
  utils/supabase/       ← Server/client/middleware klienti
supabase/
  migrations/
    20260604000000_initial_schema.sql    ← ✅ apliciran
    20260605000001_scoring_and_leaderboard.sql  ← ✅ apliciran
    20260605000002_update_stages_enum.sql       ← ⚠️ NI apliciran
  seed.sql              ← ⚠️ NI apliciran (72 tekem SP 2026)
```
