import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { calculatePoisson, oddsToProbs } from '@/lib/poisson'

const ODDS_API_KEY = process.env.ODDS_API_KEY!
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4'

// Mapiranje naših (slovenskih) imen → The-Odds-API ime
const TEAM_NAME_MAP: Record<string, string> = {
  'Brazilija': 'Brazil',
  'Nemčija': 'Germany',
  'Argentina': 'Argentina',
  'Francija': 'France',
  'Španija': 'Spain',
  'Anglija': 'England',
  'Portugalska': 'Portugal',
  'Nizozemska': 'Netherlands',
  'Belgija': 'Belgium',
  'Hrvaška': 'Croatia',
  'Švica': 'Switzerland',
  'Urugvaj': 'Uruguay',
  'Kolumbija': 'Colombia',
  'Maroko': 'Morocco',
  'Senegal': 'Senegal',
  'ZDA': 'United States',
  'Mehika': 'Mexico',
  'Japonska': 'Japan',
  'Južna Koreja': 'South Korea',
  'Avstralija': 'Australia',
  'Iran': 'Iran',
  'Turčija': 'Turkey',
  'Ekvador': 'Ecuador',
  'Kanada': 'Canada',
  'Slonokoščena obala': "Ivory Coast",
  'Južna Afrika': 'South Africa',
  'Savdska Arabija': 'Saudi Arabia',
  'Panama': 'Panama',
  'Bosna in Hercegovina': 'Bosnia & Herzegovina',
  'DR Kongo': 'Congo DR',
  'Nova Zelandija': 'New Zealand',
  'Paragvaj': 'Paraguay',
  'Škotska': 'Scotland',
  'Norveška': 'Norway',
  'Avstrija': 'Austria',
  'Alžirija': 'Algeria',
  'Jordanija': 'Jordan',
  'Uzbekistan': 'Uzbekistan',
  'Gana': 'Ghana',
  'Tunizija': 'Tunisia',
  'Egipt': 'Egypt',
  'Irak': 'Iraq',
  'Zelenortski otoki': 'Cape Verde',
  'Češka': 'Czech Republic',
  'Švedska': 'Sweden',
  'Haiti': 'Haiti',
  'Katar': 'Qatar',
  'Curaçao': 'Curaçao',
}

function normalizeTeam(name: string): string {
  return TEAM_NAME_MAP[name] ?? name
}

// Povprečni goli za ekipe (slovenska imena)
const TEAM_GOALS: Record<string, { scored: number; conceded: number }> = {
  'Argentina': { scored: 2.4, conceded: 0.8 },
  'Francija': { scored: 2.2, conceded: 0.9 },
  'Brazilija': { scored: 2.1, conceded: 0.8 },
  'Španija': { scored: 2.3, conceded: 0.7 },
  'Anglija': { scored: 2.0, conceded: 0.9 },
  'Nemčija': { scored: 2.1, conceded: 1.1 },
  'Portugalska': { scored: 2.2, conceded: 0.9 },
  'Nizozemska': { scored: 1.9, conceded: 1.0 },
  'Belgija': { scored: 1.8, conceded: 1.0 },
  'Hrvaška': { scored: 1.6, conceded: 0.9 },
  'Švica': { scored: 1.6, conceded: 0.9 },
  'Urugvaj': { scored: 1.8, conceded: 1.0 },
  'Kolumbija': { scored: 1.7, conceded: 0.9 },
  'Maroko': { scored: 1.4, conceded: 0.8 },
  'Senegal': { scored: 1.5, conceded: 1.0 },
  'ZDA': { scored: 1.6, conceded: 1.1 },
  'Mehika': { scored: 1.5, conceded: 1.1 },
  'Japonska': { scored: 1.5, conceded: 1.0 },
  'Južna Koreja': { scored: 1.4, conceded: 1.1 },
  'Avstralija': { scored: 1.3, conceded: 1.2 },
  'Iran': { scored: 1.3, conceded: 1.0 },
  'Turčija': { scored: 1.5, conceded: 1.2 },
  'Ekvador': { scored: 1.4, conceded: 1.2 },
  'Paragvaj': { scored: 1.3, conceded: 1.3 },
  'Kanada': { scored: 1.4, conceded: 1.2 },
  'Slonokoščena obala': { scored: 1.2, conceded: 1.2 },
  'Južna Afrika': { scored: 1.1, conceded: 1.3 },
  'Savdska Arabija': { scored: 1.2, conceded: 1.3 },
  'Panama': { scored: 1.1, conceded: 1.2 },
  'Bosna in Hercegovina': { scored: 1.2, conceded: 1.3 },
  'DR Kongo': { scored: 1.1, conceded: 1.3 },
  'Nova Zelandija': { scored: 1.0, conceded: 1.4 },
  'Škotska': { scored: 1.3, conceded: 1.1 },
  'Norveška': { scored: 1.6, conceded: 1.1 },
  'Avstrija': { scored: 1.5, conceded: 1.1 },
  'Alžirija': { scored: 1.3, conceded: 1.2 },
  'Jordanija': { scored: 1.0, conceded: 1.4 },
  'Uzbekistan': { scored: 1.1, conceded: 1.3 },
  'Gana': { scored: 1.2, conceded: 1.3 },
  'Tunizija': { scored: 1.2, conceded: 1.2 },
  'Egipt': { scored: 1.2, conceded: 1.2 },
  'Irak': { scored: 1.1, conceded: 1.3 },
  'Zelenortski otoki': { scored: 1.0, conceded: 1.4 },
  'Češka': { scored: 1.3, conceded: 1.2 },
  'Švedska': { scored: 1.5, conceded: 1.1 },
  'Haiti': { scored: 0.9, conceded: 1.5 },
  'Katar': { scored: 0.9, conceded: 1.5 },
  'Curaçao': { scored: 0.8, conceded: 1.6 },
}

const DEFAULT_GOALS = { scored: 1.2, conceded: 1.3 }

export async function GET(req: NextRequest) {
  // Preveri secret
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Pridobi VSE prihodnje tekme ki še nimajo izida (celotno obdobje prvenstva)
  const now = new Date()
  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_team, away_team, match_time_utc')
    .is('actual_score_home', null)
    .gte('match_time_utc', now.toISOString())
    .order('match_time_utc', { ascending: true })

  if (!matches || matches.length === 0) {
    return NextResponse.json({ message: 'No upcoming matches', updated: 0 })
  }

  // Pridobi ELO ratings
  const { data: eloRows } = await supabase.from('team_elo').select('team_name, elo_rating')
  const eloMap: Record<string, number> = {}
  for (const row of eloRows ?? []) eloMap[row.team_name] = row.elo_rating

  // Fetch odds iz The-Odds-API (soccer_fifa_world_cup)
  let oddsMap: Record<string, { home: number; draw: number; away: number }> = {}
  try {
    const oddsRes = await fetch(
      `${ODDS_API_BASE}/sports/soccer_fifa_world_cup/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`,
      { next: { revalidate: 0 } }
    )
    if (oddsRes.ok) {
      const oddsData = await oddsRes.json()
      for (const event of oddsData) {
        const homeTeam = event.home_team
        const awayTeam = event.away_team
        // Povpreči kvote vseh stavnic
        const bookmakers = event.bookmakers ?? []
        let sumHome = 0, sumDraw = 0, sumAway = 0, count = 0
        for (const bm of bookmakers) {
          const market = bm.markets?.find((m: any) => m.key === 'h2h')
          if (!market) continue
          const h = market.outcomes?.find((o: any) => o.name === homeTeam)?.price
          const d = market.outcomes?.find((o: any) => o.name === 'Draw')?.price
          const a = market.outcomes?.find((o: any) => o.name === awayTeam)?.price
          if (h && d && a) { sumHome += h; sumDraw += d; sumAway += a; count++ }
        }
        if (count > 0) {
          const key = `${homeTeam}|${awayTeam}`
          oddsMap[key] = { home: sumHome/count, draw: sumDraw/count, away: sumAway/count }
        }
      }
    }
  } catch (e) {
    console.error('Odds API error:', e)
  }

  let updated = 0
  for (const match of matches) {
    const { home_team, away_team } = match

    // ELO
    const eloHome = eloMap[home_team] ?? 1700
    const eloAway = eloMap[away_team] ?? 1700

    // Poisson
    const homeStats = TEAM_GOALS[home_team] ?? DEFAULT_GOALS
    const awayStats = TEAM_GOALS[away_team] ?? DEFAULT_GOALS
    const poisson = calculatePoisson(
      homeStats.scored, awayStats.scored,
      homeStats.conceded, awayStats.conceded,
      eloHome, eloAway
    )

    // Odds (poskusi z normaliziranim imenom)
    const oddsKey = `${normalizeTeam(home_team)}|${normalizeTeam(away_team)}`
    const odds = oddsMap[oddsKey]
    const oddsProbs = odds ? oddsToProbs(odds.home, odds.draw, odds.away) : null

    // Najverjetnejši score po odds: preprosto vzamemo poisson score (odds ne dajejo score)
    await supabase
      .from('match_hints')
      .upsert({
        match_id: match.id,
        elo_home: eloHome,
        elo_away: eloAway,
        poisson_home_goals: poisson.lambdaHome,
        poisson_away_goals: poisson.lambdaAway,
        poisson_top_score: poisson.topScore,
        poisson_top_score_prob: poisson.topScoreProb,
        poisson_prob_home: poisson.probHome,
        poisson_prob_draw: poisson.probDraw,
        poisson_prob_away: poisson.probAway,
        odds_home: odds?.home ?? null,
        odds_draw: odds?.draw ?? null,
        odds_away: odds?.away ?? null,
        odds_prob_home: oddsProbs?.probHome ?? null,
        odds_prob_draw: oddsProbs?.probDraw ?? null,
        odds_prob_away: oddsProbs?.probAway ?? null,
        odds_top_score: poisson.topScore, // odds API nima correct score market
        odds_top_score_prob: null,
        fetched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'match_id' })

    updated++
  }

  return NextResponse.json({ message: 'Hints updated', updated })
}
