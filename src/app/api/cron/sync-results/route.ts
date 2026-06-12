/**
 * GET /api/cron/sync-results
 *
 * Brezplačen sync rezultatov SP 2026 iz openfootball GitHub repota.
 * Brez API ključa. Podatki se posodabljajo sproti med turnirjem.
 *
 * Zahteva: Authorization: Bearer {CRON_SECRET}
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { SL_TO_API } from '@/lib/teamNameMap'

const OPENFOOTBALL_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return authHeader === `Bearer ${secret}`
}

// Normalizira ime ekipe za primerjavo (male črke, brez presledkov)
function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '')
}

// Zgradi lookup: normalizirano EN ime → slovensko ime
const EN_NORM_TO_SL: Record<string, string> = {}
for (const [sl, en] of Object.entries(SL_TO_API)) {
  EN_NORM_TO_SL[normalize(en)] = sl
}

// Dodatni aliasi za variante imen (vključno z openfootball placeholder imeni)
const EXTRA_ALIASES: Record<string, string> = {
  'czechrepublic': 'Češka',
  'czechia': 'Češka',
  'unitedstates': 'ZDA',
  'usa': 'ZDA',
  'ivorycoast': 'Slonokoščena obala',
  'cotedivoire': 'Slonokoščena obala',
  'bosniaandherzegovina': 'Bosna in Hercegovina',
  'bosnia': 'Bosna in Hercegovina',
  'drcongodr': 'DR Kongo',
  'democraticrepublicofthecongo': 'DR Kongo',
  'drcongo': 'DR Kongo',
  'capeverde': 'Zelenortski otoki',
  'newzealand': 'Nova Zelandija',
  'southkorea': 'Južna Koreja',
  'korea': 'Južna Koreja',
  'korearePublic': 'Južna Koreja',
  'southafrica': 'Južna Afrika',
  'saudiarabia': 'Savdska Arabija',
  'curacao': 'Curaçao',
  // openfootball placeholder names (pred uradnimi kvalifikacijami)
  'uefapathdwinner': 'Češka',
  'uefapathawinner': 'Bosna in Hercegovina',
  'uefapathbwinner': 'Švedska',
  'uefapathcwinner': 'Turčija',
  'icpath1winner': 'DR Kongo',
  'icpath2winner': 'Irak',
}

function apiNameToSl(apiName: string): string | null {
  const norm = normalize(apiName)
  return EN_NORM_TO_SL[norm] ?? EXTRA_ALIASES[norm] ?? null
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const results = { updated: 0, skipped: 0, errors: [] as string[] }

  try {
    // 1. Pridobi podatke iz openfootball
    const res = await fetch(OPENFOOTBALL_URL, { cache: 'no-store' })
    if (!res.ok) throw new Error(`openfootball fetch failed: ${res.status}`)
    const data = await res.json()

    // Filtriraj samo zaključene tekme (imajo score1 in score2)
    const finishedMatches = (data.matches ?? []).filter(
      (m: any) => m.score1 !== undefined && m.score2 !== undefined
    )

    if (finishedMatches.length === 0) {
      return NextResponse.json({ message: 'Ni zaključenih tekem v viru.', ...results })
    }

    // 2. Pridobi naše tekme ki niso Finished
    const { data: ourMatches, error: dbError } = await supabase
      .from('matches')
      .select('id, home_team, away_team, match_time_utc, is_knockout, status')
      .neq('status', 'Finished')

    if (dbError) throw new Error(dbError.message)
    if (!ourMatches || ourMatches.length === 0) {
      return NextResponse.json({ message: 'Vse tekme so že zaključene.', ...results })
    }

    // 3. Za vsako zaključeno openfootball tekmo → poiščemo v naši bazi
    for (const apiMatch of finishedMatches) {
      const apiHome = apiNameToSl(apiMatch.team1)
      const apiAway = apiNameToSl(apiMatch.team2)

      if (!apiHome || !apiAway) {
        results.skipped++
        continue
      }

      const apiDate = new Date(apiMatch.date)

      // Poišči ujemajočo tekmo (isti ekipi + isti dan ±1 dan)
      const ourMatch = ourMatches.find(m => {
        const matchDate = new Date(m.match_time_utc)
        const dayDiff = Math.abs(matchDate.getTime() - apiDate.getTime())
        const within2Days = dayDiff < 2 * 24 * 60 * 60 * 1000
        return m.home_team === apiHome && m.away_team === apiAway && within2Days
      })

      if (!ourMatch) {
        results.skipped++
        continue
      }

      // 4. Določi advancing_team za izločilne boje (penalti)
      let actualAdvancingTeam: string | null = null
      if (ourMatch.is_knockout) {
        const ftHome = apiMatch.score1
        const ftAway = apiMatch.score2
        if (ftHome === ftAway) {
          // Remi po 90 min — preveri penalty rezultat (score1p/score2p)
          const penHome = apiMatch.score1p
          const penAway = apiMatch.score2p
          if (penHome !== undefined && penAway !== undefined) {
            actualAdvancingTeam = penHome > penAway ? ourMatch.home_team : ourMatch.away_team
          }
        }
      }

      // 5. Posodobi tekmo — trigger samodejno izračuna točke!
      const { error: updateError } = await supabase
        .from('matches')
        .update({
          status: 'Finished',
          actual_score_home: apiMatch.score1,
          actual_score_away: apiMatch.score2,
          actual_advancing_team: actualAdvancingTeam,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ourMatch.id)

      if (updateError) {
        results.errors.push(`${ourMatch.home_team} vs ${ourMatch.away_team}: ${updateError.message}`)
      } else {
        results.updated++
      }
    }

    return NextResponse.json({
      message: `Sync zaključen. Vir: openfootball GitHub`,
      zaključenihVViru: finishedMatches.length,
      ...results,
    })

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
