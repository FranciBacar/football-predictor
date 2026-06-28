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
