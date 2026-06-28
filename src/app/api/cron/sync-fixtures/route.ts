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

// Brez status filtra — vzamemo vse tekme, filtriramo v kodi
// (status=TIMED,SCHEDULED ne deluje zanesljivo pri brezplačnem tier-u)
const FOOTBALL_DATA_URL =
  'https://api.football-data.org/v4/competitions/WC/matches'

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
    const SKIP_STATUSES = new Set(['FINISHED', 'IN_PLAY', 'PAUSED', 'SUSPENDED', 'POSTPONED'])
    const upcomingMatches: any[] = (data.matches ?? []).filter(
      (m: any) => !SKIP_STATUSES.has(m.status)
    )

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

    // Pridobi obstoječe poimenovane tekme (za preverjanje duplikatov)
    const { data: namedMatches } = await supabase
      .from('matches')
      .select('home_team, away_team, stage')
      .neq('home_team', 'TBD')
      .neq('away_team', 'TBD')
      .eq('status', 'Upcoming')

    const existingPairs = new Set(
      (namedMatches ?? []).map(m => `${m.stage}:${m.home_team}:${m.away_team}`)
    )

    // Mapiranje API stage → naš DB stage
    const STAGE_MAP: Record<string, string> = {
      'LAST_32': 'Round of 32',
      'LAST_16': 'Round of 16',
      'QUARTER_FINALS': 'Quarter-finals',
      'SEMI_FINALS': 'Semi-finals',
      'THIRD_PLACE': 'Third place play-off',
      'FINAL': 'Final',
    }

    // 3. Za vsako prihajoče tekmo iz API-ja → poiščemo ujemajočo TBD tekmo
    // Matchamo po stage + najbližji čas (naši DB časi so lahko napačni za več ur)
    upcomingMatches.sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    const usedIds = new Set<string>()

    for (const apiMatch of upcomingMatches) {
      const apiStageName = STAGE_MAP[apiMatch.stage]
      if (!apiStageName) {
        results.skipped++
        continue
      }

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

      // Preskoči če ta par že obstaja v DB (prepreči duplikate)
      if (existingPairs.has(`${apiStageName}:${apiHome}:${apiAway}`)) {
        results.skipped++
        continue
      }

      const apiDate = new Date(apiMatch.utcDate)

      // Poišči najbližjo neporabljeno TBD tekmo istega stage-a
      // Brez časovne limite — naši DB časi so napačni (do 14h zamik)
      let bestMatch: typeof tbdMatches[0] | null = null
      let bestDiff = Infinity

      for (const m of tbdMatches) {
        if (usedIds.has(m.id)) continue
        if (m.stage !== apiStageName) continue
        const diff = Math.abs(new Date(m.match_time_utc).getTime() - apiDate.getTime())
        if (diff < bestDiff) {
          bestDiff = diff
          bestMatch = m
        }
      }

      if (!bestMatch) {
        results.noMatch.push(`${apiHome} vs ${apiAway} (stage: ${apiStageName})`)
        results.skipped++
        continue
      }

      usedIds.add(bestMatch.id)

      // 4. Posodobi ekipe IN popravimo match_time_utc na dejanski čas iz API-ja
      const { error: updateError } = await supabase
        .from('matches')
        .update({
          home_team: apiHome,
          away_team: apiAway,
          match_time_utc: apiDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', bestMatch.id)

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
