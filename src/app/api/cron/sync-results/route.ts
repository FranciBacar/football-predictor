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
  // Bosna (football-data.org vrne "Bosnia & Herzegovina" → & se odstrani → bosniaherzegovina)
  'bosniaandherzegovina': 'Bosna in Hercegovina',
  'bosniaherzegovina': 'Bosna in Hercegovina',
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
  'capeverdeislands': 'Zelenortski otoki',
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
  // Curaçao (football-data.org vrne "Curaçao" z ç → normalize odstrani ç → "curaao")
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
  const results = { updated: 0, skipped: 0, noMatch: [] as string[], errors: [] as string[], unmapped: [] as string[], nullScore: [] as string[] }

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

    // 2. Pridobi VSE naše tekme — API filtrira FINISHED, mi pa lovimo tudi Upcoming knockout tekme
    // ki so v bazi še Upcoming čeprav so bile že odigrane (+ Finished za VAR korekcije)
    const { data: ourMatches, error: dbError } = await supabase
      .from('matches')
      .select('id, home_team, away_team, match_time_utc, is_knockout, status, actual_score_home, actual_score_away, actual_penalty_home, actual_advancing_team, actual_et_home')

    if (dbError) throw new Error(dbError.message)
    if (!ourMatches || ourMatches.length === 0) {
      return NextResponse.json({ message: 'Ni tekem v bazi.', ...results })
    }

    // 3. Za vsako zaključeno tekmo → poiščemo v naši bazi
    for (const apiMatch of finishedMatches) {
      const apiHome = apiNameToSl(apiMatch.homeTeam?.name ?? '')
      const apiAway = apiNameToSl(apiMatch.awayTeam?.name ?? '')

      if (!apiHome || !apiAway) {
        results.unmapped.push(`${apiMatch.homeTeam?.name ?? '?'} vs ${apiMatch.awayTeam?.name ?? '?'}`)
        results.skipped++
        continue
      }

      // CILJ: shraniti rezultat po 90 minutah (ne vključujoč ET ali penaltev).
      //
      // Pravilo napovedi = rezultat po 90 min. Izločilne tekme lahko gredo v:
      //   a) Podaljški + kazenski streli (PENALTY_SHOOTOUT):
      //      fullTime = 90min + ET + penalty goli (kumulativno)
      //      score.penalties = samo penalty goli → 90min = fullTime − penalties
      //      Npr. Nemčija 1:1 po 90 min, pen. 3:4 → fullTime={4,5} − pen={3,4} = {1,1}
      //
      //   b) Podaljški brez kazenskih strelov (ET only):
      //      fullTime = 90min + ET goli (kumulativno)
      //      score.extraTime = samo ET goli → 90min = fullTime − extraTime
      //      Npr. Belgija 2:2 po 90 min, ET gol → fullTime={3,2}, extraTime={1,0} → {2,2}
      //
      // Vrstni red: najprej preveri penalties (prioriteta), nato extraTime.
      const ftHome: number | null = apiMatch.score?.fullTime?.home ?? null
      const ftAway: number | null = apiMatch.score?.fullTime?.away ?? null
      let scoreHome: number | null = ftHome
      let scoreAway: number | null = ftAway

      const penDataHome: number | null = apiMatch.score?.penalties?.home ?? null
      const penDataAway: number | null = apiMatch.score?.penalties?.away ?? null
      const etDataHome: number | null = apiMatch.score?.extraTime?.home ?? null
      const etDataAway: number | null = apiMatch.score?.extraTime?.away ?? null

      if (penDataHome !== null && penDataAway !== null && ftHome !== null && ftAway !== null) {
        // KAZENSKI STRELI: odštej penalty gole za 90-min rezultat
        const computed90Home = ftHome - penDataHome
        const computed90Away = ftAway - penDataAway
        if (computed90Home >= 0 && computed90Away >= 0 && computed90Home === computed90Away) {
          scoreHome = computed90Home
          scoreAway = computed90Away
        }
      } else if (etDataHome !== null && etDataAway !== null && ftHome !== null && ftAway !== null) {
        // PODALJŠKI (brez kazenskih strelov): odštej ET gole za 90-min rezultat
        const computed90Home = ftHome - etDataHome
        const computed90Away = ftAway - etDataAway
        if (computed90Home >= 0 && computed90Away >= 0 && computed90Home === computed90Away) {
          scoreHome = computed90Home
          scoreAway = computed90Away
        }
      }

      if (scoreHome === null || scoreAway === null) {
        results.nullScore.push(`${apiHome} vs ${apiAway}`)
        results.skipped++
        continue
      }

      // football-data.org vrne utcDate kot ISO string → direktna primerjava
      const apiDate = new Date(apiMatch.utcDate)

      // Poišči ujemajočo tekmo (isti ekipi + isti dan ±2 dni)
      // Preizkusi oba vrstna reda home/away (API in naša baza se lahko razlikujeta)
      let ourMatch = ourMatches.find(m => {
        const matchDate = new Date(m.match_time_utc)
        const dayDiff = Math.abs(matchDate.getTime() - apiDate.getTime())
        const within2Days = dayDiff < 2 * 24 * 60 * 60 * 1000
        return m.home_team === apiHome && m.away_team === apiAway && within2Days
      })
      let scoresReversed = false
      if (!ourMatch) {
        // Poizkusi z obrnjenim vrstnim redom
        ourMatch = ourMatches.find(m => {
          const matchDate = new Date(m.match_time_utc)
          const dayDiff = Math.abs(matchDate.getTime() - apiDate.getTime())
          const within2Days = dayDiff < 2 * 24 * 60 * 60 * 1000
          return m.home_team === apiAway && m.away_team === apiHome && within2Days
        })
        if (ourMatch) scoresReversed = true
      }

      if (!ourMatch) {
        results.noMatch.push(`${apiHome} vs ${apiAway}`)
        results.skipped++
        continue
      }

      // Pravilni score glede na vrstni red v bazi
      const finalScoreHome = scoresReversed ? scoreAway : scoreHome
      const finalScoreAway = scoresReversed ? scoreHome : scoreAway

      // 4. Določi advancing_team in penalty score za izločilne boje
      let actualAdvancingTeam: string | null = null
      let actualPenaltyHome: number | null = null
      let actualPenaltyAway: number | null = null
      let actualEtHome: number | null = null
      let actualEtAway: number | null = null
      if (ourMatch.is_knockout && finalScoreHome === finalScoreAway) {
        const penHome: number | null = apiMatch.score?.penalties?.home ?? null
        const penAway: number | null = apiMatch.score?.penalties?.away ?? null
        if (penHome !== null && penAway !== null) {
          // KAZENSKI STRELI: zmagovalec = tisti z več penalty goli
          const finalPenHome = scoresReversed ? penAway : penHome
          const finalPenAway = scoresReversed ? penHome : penAway
          actualAdvancingTeam = finalPenHome > finalPenAway ? ourMatch.home_team : ourMatch.away_team
          actualPenaltyHome = finalPenHome
          actualPenaltyAway = finalPenAway
        } else if (etDataHome !== null && etDataAway !== null && ftHome !== null && ftAway !== null) {
          // PODALJŠKI (brez kazenskih strelov): napredovalec = zmagovalec po ET (fullTime)
          // ftHome/ftAway = kumulativni rezultat vključno z ET goli
          const finalFtHome = scoresReversed ? ftAway : ftHome
          const finalFtAway = scoresReversed ? ftHome : ftAway
          if (finalFtHome > finalFtAway) {
            actualAdvancingTeam = ourMatch.home_team
          } else if (finalFtAway > finalFtHome) {
            actualAdvancingTeam = ourMatch.away_team
          }
          // Shrani ET gole za prikaz skupnega rezultata (actual_score + et = skupaj)
          actualEtHome = scoresReversed ? (etDataAway ?? null) : (etDataHome ?? null)
          actualEtAway = scoresReversed ? (etDataHome ?? null) : (etDataAway ?? null)
        }
      }

      // 5. Preskoči če je score že enak IN advancing/penalty stolpci so že izpolnjeni
      const penaltyMissing = ourMatch.is_knockout && actualPenaltyHome !== null && ourMatch.actual_penalty_home === null
      const advancingMissing = ourMatch.is_knockout && actualAdvancingTeam !== null && ourMatch.actual_advancing_team === null
      const etMissing = ourMatch.is_knockout && actualEtHome !== null && ourMatch.actual_et_home === null
      if (
        ourMatch.status === 'Finished' &&
        ourMatch.actual_score_home === finalScoreHome &&
        ourMatch.actual_score_away === finalScoreAway &&
        !penaltyMissing &&
        !advancingMissing &&
        !etMissing
      ) {
        results.skipped++
        continue
      }

      // Posodobi tekmo — trigger samodejno izračuna točke!
      const { error: updateError } = await supabase
        .from('matches')
        .update({
          status: 'Finished',
          actual_score_home: finalScoreHome,
          actual_score_away: finalScoreAway,
          actual_advancing_team: actualAdvancingTeam,
          actual_penalty_home: actualPenaltyHome,
          actual_penalty_away: actualPenaltyAway,
          actual_et_home: actualEtHome,
          actual_et_away: actualEtAway,
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
