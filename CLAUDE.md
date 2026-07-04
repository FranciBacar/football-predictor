@AGENTS.md

## football-data.org — znane posebnosti imen ekip

Normalizacija: `name.toLowerCase().replace(/[^a-z]/g, '')` — odstrani vse znake razen a-z (š,č,ž,ñ,ç,presledki...).

Aliasi ki so potrebni (v `src/app/api/cron/sync-results/route.ts` → `EXTRA_ALIASES`):

| football-data.org vrne | normalize() → | alias → SL ime |
|---|---|---|
| `Cape Verde Islands` | `capeverdeislands` | `Zelenortski otoki` |
| `Cabo Verde` | `caboverde` | `Zelenortski otoki` |
| `Curaçao` | `curaao` (ç se odstrani) | `Curaçao` |
| `Bosnia & Herzegovina` | `bosniaherzegovina` | `Bosna in Hercegovina` |
| `Ivory Coast` | `ivorycoast` | `Slonokoščena obala` |
| `United States` | `unitedstates` | `ZDA` |
| `Czech Republic` | `czechrepublic` | `Češka` |

Ko dodajaš novo ekipo: vedno preveri ali football-data.org uporablja standardno angleško ime ali kakšno varianto. Debug polje `unmapped` v sync odgovoru pokaže točno katero ime API vrne.

## football-data.org — posebnosti `score` pri izločilnih tekmah

Cilj: `actual_score` = rezultat **po 90 min** (pravilo napovedi). Izločilne tekme, ki gredo v podaljške/strele, imajo v `score` polja `regularTime`, `extraTime`, `penalties`, `fullTime`, `duration`.

**API je NEKONSISTENTEN — zanesljivost polj (potrjeno na SP 2026):**

| polje | pomen | zanesljivost |
|---|---|---|
| `regularTime` | rezultat po 90 min | ✅ zanesljiv, **že v list endpointu** za ET/penalty tekme |
| `extraTime` | goli v podaljšku (samo ET, ne kumulativno) | ✅ zanesljiv |
| `fullTime` | **odvisno od tekme** (glej spodaj) | ⚠️ dvoumen |
| `penalties` | naj bi bili streli | ❌ pogosto smeti (npr. `4:4`) |
| `winner` | zmagovalec | ❌ pogosto `null` |
| `duration` | `REGULAR` \| `EXTRA_TIME` \| `PENALTY_SHOOTOUT` | ✅ zanesljiv |

**Ključna past — `fullTime` pri `PENALTY_SHOOTOUT` ni vedno isto:**

| tekma | regularTime | penalties | fullTime | `rt+pen==ft`? | pravi streli |
|---|---|---|---|---|---|
| Nemčija–Paragvaj | 1:1 | 3:4 | 4:5 | ✅ da (zložen) | **penalties** (3:4) |
| Egipt–Avstralija | 1:1 | 4:4 | 3:5 | ❌ ne | **fullTime** (3:5) |

Zato: rezultat strelov določi po **samo-konsistentnosti** — če `rt + penalties == fullTime`, so `penalties` pravi; sicer je `fullTime` surov rezultat strelov (`penalties` so smeti). Napredovalca določi ekipa z več streli. Za 90-min rezultat vedno najprej `regularTime`, šele nato `fullTime − extraTime` / `fullTime − penalties`.

Vsa ta logika je v `src/app/api/cron/sync-results/route.ts`. Za pregled surovih podatkov: `GET /api/cron/sync-results?debug=1` (dry-run, nič ne piše). Zasilni izhod: stolpec `matches.score_locked = true` → cron tekmo preskoči (za ročne popravke, ki jih avtomatika ne pokrije).
