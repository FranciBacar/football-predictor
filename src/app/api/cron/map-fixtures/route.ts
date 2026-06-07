/**
 * GET /api/cron/map-fixtures
 *
 * Enkratno mapiranje: poveže API-Football fixture ID-je z našimi tekme ID-ji.
 * Kliči ENKRAT po začetnem seeding-u. Po tem se sync-results sam zna orientirati.
 *
 * Zahteva: Authorization: Bearer {CRON_SECRET}
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { SL_TO_API } from '@/lib/teamNameMap'

const API_BASE = 'https://v3.football.api-sports.io'

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return authHeader === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // 1. Pridobi vse WC 2026 fixtures iz API-Football
  const res = await fetch(
    `${API_BASE}/fixtures?league=1&season=2026`,
    {
      headers: { 'x-apisports-key': process.env.FOOTBALL_API_KEY! },
      cache: 'no-store',
    }
  )
  const data = await res.json()
  const apiFixtures: any[] = data.response ?? []

  // 2. Pridobi naše tekme iz baze
  const { data: ourMatches } = await supabase
    .from('matches')
    .select('id, home_team, away_team, match_time_utc')
    .is('api_football_id', null)

  if (!ourMatches || ourMatches.length === 0) {
    return NextResponse.json({ message: 'Vse tekme so že mapirane.' })
  }

  const mapped: string[] = []
  const unmapped: string[] = []

  // 3. Za vsako našo tekmo najdi ujemajoč API fixture
  for (const match of ourMatches) {
    const homeEN = SL_TO_API[match.home_team]
    const awayEN = SL_TO_API[match.away_team]

    if (!homeEN || !awayEN) {
      unmapped.push(`${match.home_team} vs ${match.away_team} — ni v name map`)
      continue
    }

    const matchDate = new Date(match.match_time_utc)

    // Poišči fixture pri API ki se ujema po ekipah in datumu (±1 dan tolerance)
    const found = apiFixtures.find((f: any) => {
      const apiHome = f.teams?.home?.name ?? ''
      const apiAway = f.teams?.away?.name ?? ''
      const apiDate = new Date(f.fixture?.date ?? '')

      const namesMatch =
        apiHome.toLowerCase().includes(homeEN.toLowerCase()) ||
        homeEN.toLowerCase().includes(apiHome.toLowerCase())
        &&
        apiAway.toLowerCase().includes(awayEN.toLowerCase()) ||
        awayEN.toLowerCase().includes(apiAway.toLowerCase())

      const timeDiff = Math.abs(matchDate.getTime() - apiDate.getTime())
      const within24h = timeDiff < 24 * 60 * 60 * 1000

      return namesMatch && within24h
    })

    if (found) {
      await supabase
        .from('matches')
        .update({ api_football_id: found.fixture.id })
        .eq('id', match.id)
      mapped.push(`${match.home_team} vs ${match.away_team} → API ID ${found.fixture.id}`)
    } else {
      unmapped.push(`${match.home_team} vs ${match.away_team} — ni najdeno v API`)
    }
  }

  return NextResponse.json({ mapped, unmapped })
}
