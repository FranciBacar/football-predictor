/**
 * GET /api/cron/sync-results
 *
 * Sync rezultatov SP 2026 iz football-data.org (brezplačen tier).
 * API ključ: FOOTBALL_DATA_API_KEY (env var)
 *
 * Zahteva: Authorization: Bearer {CRON_SECRET}
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { SL_TO_API } from '@/lib/teamNameMap'

const FOOTBALL_DATA_URL =
  'https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED'

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return authHeader === `Bearer ${secret}`
}

// Normalizira ime ekipe za primerjavo (male črke, samo črke)
function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '')
}

// Zgradi lookup: normalizirano EN ime → slovensko ime
const EN_NORM_TO_SL: Record<string, string> = {}
for (const [sl, en] of Object.entries(SL_TO_API)) {
  EN_NORM_TO_SL[normalize(en)] = sl
}

// Dodatni aliasi za variante imen (football-data.org + openfootball variante)
const EXTRA_ALIASES: Record<string, string> = {
  // Češka
  'czechrepublic': 'Češka',
  'czechia': 'Češka',
  // ZDA
  'unitedstates': 'ZDA',
  'usa': 'ZDA',
  // Slonokoščena obala
  'ivorycoast': 'Slonokoščena obala',
  'cotedivoire': 'Slonokoščena obala',
  'cotedivoire': 'Slonokoščena obala',
  // Bosna
  'bosniaandherzegovina': 'Bosna in Hercegovina',
  'bosnia': 'Bosna in Hercegovina',
  // DR Kongo
  'drcongodr': 'DR Kongo',
  'democraticrepublicofthecongo': 'DR Kongo',
  'drcongo': 'DR Kongo',
  'congodr': 'DR Kongo',
  'congodrc': 'DR Kongo',
  // Zelenortski otoki
  'capeverde': 'Zelenortski otoki',
  'caboverde': 'Zelenortski otoki',
  // Nova Zelandija
  'newzealand': 'Nova Zelandija',
  // Južna Koreja
  'southkorea': 'Južna Koreja',
  'korearepublic': 'Južna Koreja',
  'korea': 'Južna Koreja',
  // Južna Afrika
  'southafrica': 'Južna Afrika',
  // Savdska Arabija
  'saudiarabia': 'Savdska Arabija',
  // Curaçao
  'curacao': 'Curaçao',
}

function apiNameToSl(apiName: string): string | null {
  const norm = normalize(apiName)
  return EN_NORM_TO_SL[norm] ?? EXTRA_ALIASES[norm] ?? null
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'FOOTBALL_DATA_API_KEY ni nastavljen' }, { status: 500 })
  }

  const supabase = createAdminClient()
  const results = { updated: 0, skipped: 0, noMatch: [] as string[], errors: [] as string[] }

  try {
    // 1. Pridobi zaključene tekme iz football-data.org
    const res = await fetch(FOOTBALL_DATA_URL, {
      headers: { 'X-Auth-Token': apiKey },
      cache: 'no-store',
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`football-data.org ${res.status}: ${body.slice(0, 200)}`)
    }
    const data = await res.json()

    const finishedMatches: any[] = data.matches ?? []

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

    // 3. Za vsako zaključeno tekmo → poiščemo v naši bazi
    for (const apiMatch of finishedMatches) {
      const apiHome = apiNameToSl(apiMatch.homeTeam?.name ?? '')
      const apiAway = apiNameToSl(apiMatch.awayTeam?.name ?? '')

      if (!apiHome || !apiAway) {
        results.skipped++
        continue
      }

      const scoreHome: number | null = apiMatch.score?.fullTime?.home ?? null
      const scoreAway: number | null = apiMatch.score?.fullTime?.away ?? null

      if (scoreHome === null || scoreAway === null) {
        results.skipped++
        continue
      }

      // football-data.org vrne utcDate kot ISO string → direktna primerjava
      const apiDate = new Date(apiMatch.utcDate)

      // Poišči ujemajočo tekmo (isti ekipi + isti dan ±2 dni)
      const ourMatch = ourMatches.find(m => {
        const matchDate = new Date(m.match_time_utc)
        const dayDiff = Math.abs(matchDate.getTime() - apiDate.getTime())
        const within2Days = dayDiff < 2 * 24 * 60 * 60 * 1000
        return m.home_team === apiHome && m.away_team === apiAway && within2Days
      })

      if (!ourMatch) {
        results.noMatch.push(`${apiHome} vs ${apiAway}`)
        results.skipped++
        continue
      }

      // 4. Določi advancing_team za izločilne boje (penalti)
      let actualAdvancingTeam: string | null = null
      if (ourMatch.is_knockout && scoreHome === scoreAway) {
        const penHome: number | null = apiMatch.score?.penalties?.home ?? null
        const penAway: number | null = apiMatch.score?.penalties?.away ?? null
        if (penHome !== null && penAway !== null) {
          actualAdvancingTeam = penHome > penAway ? ourMatch.home_team : ourMatch.away_team
        }
      }

      // 5. Posodobi tekmo — trigger samodejno izračuna točke!
      const { error: updateError } = await supabase
        .from('matches')
        .update({
          status: 'Finished',
          actual_score_home: scoreHome,
          actual_score_away: scoreAway,
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
      message: 'Sync zaključen. Vir: football-data.org',
      zaključenihVViru: finishedMatches.length,
      ...results,
    })

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
