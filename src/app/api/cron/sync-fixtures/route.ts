/**
 * GET /api/cron/sync-fixtures
 *
 * Posodablja TBD tekme z dejanskimi imeni ekip iz football-data.org.
 * Ko se skupina zaključi, football-data.org zapolni tekmece izločilnih bojev.
 * Ta route poišče TBD tekme v naši bazi in jih posodobi.
 *
 * Zahteva: Authorization: Bearer {CRON_SECRET}
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { SL_TO_API } from '@/lib/teamNameMap'

const FOOTBALL_DATA_URL =
  'https://api.football-data.org/v4/competitions/WC/matches?status=TIMED,SCHEDULED'

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return authHeader === `Bearer ${secret}`
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '')
}

const EN_NORM_TO_SL: Record<string, string> = {}
for (const [sl, en] of Object.entries(SL_TO_API)) {
  EN_NORM_TO_SL[normalize(en)] = sl
}

const EXTRA_ALIASES: Record<string, string> = {
  'czechrepublic': 'Češka',
  'czechia': 'Češka',
  'unitedstates': 'ZDA',
  'usa': 'ZDA',
  'ivorycoast': 'Slonokoščena obala',
  'cotedivoire': 'Slonokoščena obala',
  'bosniaandherzegovina': 'Bosna in Hercegovina',
  'bosniaherzegovina': 'Bosna in Hercegovina',
  'bosnia': 'Bosna in Hercegovina',
  'drcongodr': 'DR Kongo',
  'democraticrepublicofthecongo': 'DR Kongo',
  'drcongo': 'DR Kongo',
  'congodr': 'DR Kongo',
  'congodrc': 'DR Kongo',
  'capeverde': 'Zelenortski otoki',
  'caboverde': 'Zelenortski otoki',
  'capeverdeislands': 'Zelenortski otoki',
  'newzealand': 'Nova Zelandija',
  'southkorea': 'Južna Koreja',
  'korearepublic': 'Južna Koreja',
  'korea': 'Južna Koreja',
  'southafrica': 'Južna Afrika',
  'saudiarabia': 'Savdska Arabija',
  'curacao': 'Curaçao',
  'curaao': 'Curaçao',
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
  const results = {
    updated: 0,
    skipped: 0,
    noMatch: [] as string[],
    unmapped: [] as string[],
    errors: [] as string[],
  }

  try {
    // 1. Pridobi prihajajoče tekme iz football-data.org
    const res = await fetch(FOOTBALL_DATA_URL, {
      headers: { 'X-Auth-Token': apiKey },
      cache: 'no-store',
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`football-data.org ${res.status}: ${body.slice(0, 200)}`)
    }
    const data = await res.json()
    const upcomingMatches: any[] = data.matches ?? []

    if (upcomingMatches.length === 0) {
      return NextResponse.json({ message: 'Ni prihajajočih tekem v viru.', ...results })
    }

    // 2. Pridobi TBD tekme iz naše baze
    const { data: tbdMatches, error: dbError } = await supabase
      .from('matches')
      .select('id, home_team, away_team, match_time_utc, stage')
      .or('home_team.eq.TBD,away_team.eq.TBD')
      .eq('status', 'Upcoming')

    if (dbError) throw new Error(dbError.message)
    if (!tbdMatches || tbdMatches.length === 0) {
      return NextResponse.json({ message: 'Ni TBD tekem v bazi.', ...results })
    }

    // 3. Za vsako prihajoče tekmo iz API-ja → poiščemo ujemajočo TBD tekmo
    for (const apiMatch of upcomingMatches) {
      const apiHomeName = apiMatch.homeTeam?.name ?? ''
      const apiAwayName = apiMatch.awayTeam?.name ?? ''

      // Preskoči če API še nima ekip (TBD na njihovi strani)
      if (!apiHomeName || !apiAwayName || apiHomeName === 'TBD' || apiAwayName === 'TBD') {
        results.skipped++
        continue
      }

      const apiHome = apiNameToSl(apiHomeName)
      const apiAway = apiNameToSl(apiAwayName)

      if (!apiHome || !apiAway) {
        results.unmapped.push(`${apiHomeName} vs ${apiAwayName}`)
        results.skipped++
        continue
      }

      // Poišči TBD tekmo po datumu (±2 dni)
      const apiDate = new Date(apiMatch.utcDate)
      const ourMatch = tbdMatches.find(m => {
        const matchDate = new Date(m.match_time_utc)
        const dayDiff = Math.abs(matchDate.getTime() - apiDate.getTime())
        return dayDiff < 2 * 24 * 60 * 60 * 1000
      })

      if (!ourMatch) {
        results.noMatch.push(`${apiHome} vs ${apiAway}`)
        results.skipped++
        continue
      }

      // 4. Posodobi ekipe (samo če je vsaj ena še TBD)
      if (ourMatch.home_team !== 'TBD' && ourMatch.away_team !== 'TBD') {
        results.skipped++
        continue
      }

      const { error: updateError } = await supabase
        .from('matches')
        .update({
          home_team: apiHome,
          away_team: apiAway,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ourMatch.id)

      if (updateError) {
        results.errors.push(`${apiHome} vs ${apiAway}: ${updateError.message}`)
      } else {
        results.updated++
      }
    }

    return NextResponse.json({ message: 'Sync tekmičev zaključen.', ...results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message, ...results }, { status: 500 })
  }
}
