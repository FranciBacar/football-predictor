import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import StatistikeView from '@/components/StatistikeView'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

function mkInitials(name: string): string {
  return name.split(' ').map((p) => (p[0] ?? '').toUpperCase()).join('').slice(0, 2) || '?'
}

export default async function StatistikePage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Globalna lestvica
  const [{ data: globalRpc }, { data: allUsers }] = await Promise.all([
    supabase.rpc('get_global_leaderboard'),
    admin.from('users').select('id, name, avatar_url').eq('is_global_opt_in', true),
  ])

  const pointsMap = new Map<string, any>((globalRpc ?? []).map((e: any) => [e.user_id, e]))
  const globalUsers: any[] = (allUsers ?? []).map((u) => {
    const e = pointsMap.get(u.id) as any
    return {
      user_id: u.id,
      name: u.name ?? '',
      avatar_url: u.avatar_url ?? null,
      total_points: e?.total_points ?? 0,
      exact_predictions: e?.exact_predictions ?? 0,
    }
  })
  globalUsers.sort((a, b) =>
    b.total_points - a.total_points || b.exact_predictions - a.exact_predictions || a.name.localeCompare(b.name)
  )

  const top3 = globalUsers.slice(0, 3).map((u, i) => ({
    rank: i + 1,
    userId: u.user_id,
    name: u.name,
    points: u.total_points,
    exact: u.exact_predictions,
    initials: mkInitials(u.name),
    avatarUrl: u.avatar_url as string | null,
    you: u.user_id === user.id,
  }))

  // 2. Pridobi vse napovedi + zaključene tekme
  const globalIds = new Set(globalUsers.map((u) => u.user_id))

  const [{ data: allPreds }, { data: finishedMatches }] = await Promise.all([
    admin.from('predictions').select('user_id, match_id, earned_points'),
    admin.from('matches').select('id, home_team, away_team, stage, is_knockout').eq('status', 'Finished'),
  ])

  const matchMap = new Map((finishedMatches ?? []).map((m) => [m.id, m]))

  // Statistike po uporabniku
  type UStats = { grpPts: number; grpN: number; kooPts: number; kooN: number; exact: number }
  const uStats: Record<string, UStats> = {}

  // Statistike po tekmi
  type MStats = { correct: number; total: number }
  const mStats: Record<string, MStats> = {}

  for (const p of (allPreds ?? [])) {
    if (!globalIds.has(p.user_id)) continue
    const m = matchMap.get(p.match_id)
    if (!m) continue

    const pts = p.earned_points ?? 0
    if (!uStats[p.user_id]) uStats[p.user_id] = { grpPts: 0, grpN: 0, kooPts: 0, kooN: 0, exact: 0 }

    if (m.is_knockout) {
      uStats[p.user_id].kooPts += pts
      uStats[p.user_id].kooN++
    } else {
      uStats[p.user_id].grpPts += pts
      uStats[p.user_id].grpN++
    }
    // exact = 3 ali 6 točk (točen rezultat)
    if (pts === 3 || pts === 6) uStats[p.user_id].exact++

    if (!mStats[p.match_id]) mStats[p.match_id] = { correct: 0, total: 0 }
    mStats[p.match_id].total++
    if (pts > 0) mStats[p.match_id].correct++
  }

  // Najboljši skupinski napovedi (avg pts / tekma, min 20 napovedi)
  const bestGroup = globalUsers
    .map((u) => {
      const s = uStats[u.user_id]
      return {
        name: u.name, initials: mkInitials(u.name), avatarUrl: u.avatar_url as string | null,
        you: u.user_id === user.id,
        avg: s && s.grpN >= 20 ? s.grpPts / s.grpN : -1,
        count: s?.grpN ?? 0,
      }
    })
    .filter((u) => u.avg >= 0)
    .sort((a, b) => b.avg - a.avg)[0] ?? null

  // Najboljši izločilni napovedi (avg pts / tekma, min 5 napovedi)
  const bestKnockout = globalUsers
    .map((u) => {
      const s = uStats[u.user_id]
      return {
        name: u.name, initials: mkInitials(u.name), avatarUrl: u.avatar_url as string | null,
        you: u.user_id === user.id,
        avg: s && s.kooN >= 5 ? s.kooPts / s.kooN : -1,
        count: s?.kooN ?? 0,
      }
    })
    .filter((u) => u.avg >= 0)
    .sort((a, b) => b.avg - a.avg)[0] ?? null

  // Nostradamus — največ točnih rezultatov
  const nostradamus = globalUsers
    .map((u) => ({
      name: u.name, initials: mkInitials(u.name), avatarUrl: u.avatar_url as string | null,
      you: u.user_id === user.id,
      exact: uStats[u.user_id]?.exact ?? 0,
    }))
    .sort((a, b) => b.exact - a.exact)[0] ?? null

  // Najtežja / najlažja tekma (min 3 napovedi)
  const matchesRanked = (finishedMatches ?? [])
    .map((m) => {
      const s = mStats[m.id]
      return {
        id: m.id, homeTeam: m.home_team, awayTeam: m.away_team,
        stage: m.stage, isKnockout: m.is_knockout,
        correct: s?.correct ?? 0, total: s?.total ?? 0,
        pct: s && s.total >= 3 ? s.correct / s.total : null,
      }
    })
    .filter((m) => m.pct !== null)
    .sort((a, b) => (a.pct ?? 1) - (b.pct ?? 1))

  const hardestMatch = matchesRanked[0] ?? null
  const easiestMatch = matchesRanked[matchesRanked.length - 1] ?? null

  // Skupne številke
  const filteredPreds = (allPreds ?? []).filter((p) => globalIds.has(p.user_id) && matchMap.has(p.match_id))
  const totalPredictions = filteredPreds.length
  const totalExact = filteredPreds.filter((p) => p.earned_points === 3 || p.earned_points === 6).length
  const totalMatches = finishedMatches?.length ?? 0

  return (
    <div className="min-h-screen pb-20 md:pb-0 pt-0 md:pt-16" style={{ background: 'var(--page)' }}>
      <Navbar activePath="/statistike" />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        <StatistikeView
          top3={top3}
          bestGroup={bestGroup}
          bestKnockout={bestKnockout}
          nostradamus={nostradamus}
          hardestMatch={hardestMatch}
          easiestMatch={easiestMatch}
          totalParticipants={globalUsers.length}
          totalPredictions={totalPredictions}
          totalExact={totalExact}
          totalMatches={totalMatches}
        />
      </div>
    </div>
  )
}
