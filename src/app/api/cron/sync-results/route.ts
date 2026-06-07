import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const API_BASE = 'https://v3.football.api-sports.io'
const WC_LEAGUE_ID = 1      // FIFA World Cup
const WC_SEASON = 2026

// Zaščita: samo avtoriziran klic (Vercel Cron ali ročni trigger)
function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return authHeader === `Bearer ${secret}`
}

async function fetchFromAPI(endpoint: string) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'x-apisports-key': process.env.FOOTBALL_API_KEY!,
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`API-Football error: ${res.status}`)
  return res.json()
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const results = { updated: 0, skipped: 0, errors: [] as string[] }

  try {
    // 1. Poišči tekme v naši bazi, ki imajo api_football_id (že mapirane) in niso Finished
    const { data: pendingMatches, error: dbError } = await supabase
      .from('matches')
      .select('id, api_football_id, home_team, away_team, match_time_utc, is_knockout, status')
      .not('api_football_id', 'is', null)
      .neq('status', 'Finished')
      .lt('match_time_utc', new Date(Date.now() - 105 * 60 * 1000).toISOString()) // 105 min po začetku

    if (dbError) throw new Error(dbError.message)
    if (!pendingMatches || pendingMatches.length === 0) {
      return NextResponse.json({ message: 'Ni tekem za posodobitev.', ...results })
    }

    // 2. Za vsako tekmo preveri status pri API-Football
    for (const match of pendingMatches) {
      try {
        const data = await fetchFromAPI(
          `/fixtures?id=${match.api_football_id}`
        )

        const fixture = data.response?.[0]
        if (!fixture) {
          results.skipped++
          continue
        }

        const statusShort = fixture.fixture?.status?.short
        const goalsHome = fixture.goals?.home
        const goalsAway = fixture.goals?.away

        // Statusi: FT = končana, AET = po podaljških, PEN = po penalih
        const isFinished = ['FT', 'AET', 'PEN'].includes(statusShort)
        const isInProgress = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(statusShort)

        if (isFinished && goalsHome !== null && goalsAway !== null) {
          // Določi advancing_team za izločilne boje z remijem po 90 min
          let actualAdvancingTeam: string | null = null

          if (match.is_knockout) {
            const penHome = fixture.score?.penalty?.home
            const penAway = fixture.score?.penalty?.away
            const ftHome = fixture.score?.fulltime?.home
            const ftAway = fixture.score?.fulltime?.away

            // Remi po 90 min → preveri penalties ali extra time
            if (ftHome === ftAway) {
              if (penHome !== null && penAway !== null) {
                actualAdvancingTeam = penHome > penAway ? match.home_team : match.away_team
              } else {
                // Extra time winner
                const etHome = fixture.score?.extratime?.home
                const etAway = fixture.score?.extratime?.away
                if (etHome !== null && etAway !== null && etHome !== etAway) {
                  actualAdvancingTeam = etHome > etAway ? match.home_team : match.away_team
                }
              }
            }
          }

          // Posodobi tekmo v bazi (trigger samodejno izračuna točke!)
          const { error: updateError } = await supabase
            .from('matches')
            .update({
              status: 'Finished',
              actual_score_home: goalsHome,
              actual_score_away: goalsAway,
              actual_advancing_team: actualAdvancingTeam,
              updated_at: new Date().toISOString(),
            })
            .eq('id', match.id)

          if (updateError) {
            results.errors.push(`Match ${match.id}: ${updateError.message}`)
          } else {
            results.updated++
          }

        } else if (isInProgress && match.status === 'Upcoming') {
          // Posodobi status na In Progress
          await supabase
            .from('matches')
            .update({ status: 'In Progress', updated_at: new Date().toISOString() })
            .eq('id', match.id)

        } else {
          results.skipped++
        }

      } catch (err) {
        results.errors.push(`Match ${match.id}: ${String(err)}`)
      }
    }

    return NextResponse.json({
      message: `Sync zaključen.`,
      ...results,
    })

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
