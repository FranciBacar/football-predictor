import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import LeaderboardClient from './LeaderboardClient'
import { redirect } from 'next/navigation'
import type { Player } from '@/components/Leaderboard'

export const dynamic = 'force-dynamic'

/** Pretvori Supabase vrstico v Player tip */
function toPlayer(e: any, currentUserId: string): Player {
  const nameParts = (e.name ?? '?').split(' ')
  const initials = nameParts
    .map((p: string) => (p[0] ?? '').toUpperCase())
    .join('')
    .slice(0, 2) || '?'
  return {
    id: e.user_id,
    name: e.name ?? '',
    sub: `${e.exact_predictions ?? 0} točnih`,
    exact: e.exact_predictions ?? 0,
    points: e.total_points ?? 0,
    avatarUrl: e.avatar_url ?? null,
    initials,
    you: e.user_id === currentUserId,
  }
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>
}) {
  const supabase = await createClient()
  const { group: groupId } = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  /* ── 1. Globalna lestvica ────────────────────────────────── */
  const { data: globalRpc } = await supabase.rpc('get_global_leaderboard')
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, name, avatar_url, is_kid, is_underage')
    .eq('is_global_opt_in', true)
    .order('name', { ascending: true })

  const pointsMap = new Map((globalRpc ?? []).map((e: any) => [e.user_id, e]))
  const globalRaw: any[] = (allUsers ?? []).map((u) => {
    const entry = pointsMap.get(u.id)
    return entry ?? {
      user_id: u.id,
      name: u.name,
      avatar_url: u.avatar_url ?? null,
      total_points: 0,
      exact_predictions: 0,
    }
  })
  globalRaw.sort((a, b) =>
    b.total_points - a.total_points ||
    b.exact_predictions - a.exact_predictions ||
    a.name.localeCompare(b.name)
  )

  /* ── 2. Otroci ───────────────────────────────────────────── */
  const { data: kidsRaw } = await supabase
    .from('users')
    .select('id, name, avatar_url, is_kid')
    .or('is_kid.eq.true,is_underage.eq.true')

  const kidsWithPoints = await Promise.all(
    (kidsRaw ?? []).map(async (kid) => {
      const { data: preds } = await supabase
        .from('predictions')
        .select('earned_points')
        .eq('user_id', kid.id)
      const { data: special } = await supabase
        .from('special_predictions')
        .select('earned_points')
        .eq('user_id', kid.id)
      const total = [
        ...(preds ?? []).map((p: any) => p.earned_points ?? 0),
        ...(special ?? []).map((s: any) => s.earned_points ?? 0),
      ].reduce((a: number, b: number) => a + b, 0)
      const exact = (preds ?? []).filter(
        (p: any) => p.earned_points === 3 || p.earned_points === 6
      ).length
      return {
        user_id: kid.id,
        name: kid.name,
        avatar_url: null,
        total_points: total,
        exact_predictions: exact,
      }
    })
  )
  kidsWithPoints.sort(
    (a, b) => b.total_points - a.total_points || b.exact_predictions - a.exact_predictions
  )

  /* ── 3. Skupine (eager server-side) ──────────────────────── */
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, groups(id, name)')
    .eq('user_id', user.id)

  const groups = (memberships ?? [])
    .map((m) => m.groups)
    .filter(Boolean)
    .map((g) => g as unknown as { id: string; name: string })

  const groupsWithData = await Promise.all(
    groups.map(async (g) => {
      // Direkten query brez RPC (izogni se auth.uid() problemu v Server Componentu)
      const { data: memberRows } = await supabase
        .from('group_members').select('user_id').eq('group_id', g.id)
      const userIds = (memberRows ?? []).map((m: any) => m.user_id)

      const { data: userRows } = userIds.length > 0
        ? await supabase.from('users').select('id, name, avatar_url').in('id', userIds)
        : { data: [] as any[] }

      const members = await Promise.all(
        (userRows ?? []).map(async (u: any) => {
          const [{ data: preds }, { data: special }] = await Promise.all([
            supabase.from('predictions').select('earned_points, pred_score_home, pred_score_away, match_id').eq('user_id', u.id),
            supabase.from('special_predictions').select('earned_points').eq('user_id', u.id),
          ])
          const total = [
            ...(preds ?? []).map((p: any) => p.earned_points ?? 0),
            ...(special ?? []).map((s: any) => s.earned_points ?? 0),
          ].reduce((a: number, b: number) => a + b, 0)
          const exact = (preds ?? []).filter((p: any) => p.earned_points === 3 || p.earned_points === 6).length
          return {
            user_id: u.id,
            name: u.name ?? '',
            avatar_url: u.avatar_url ?? null,
            total_points: total,
            exact_predictions: exact,
          }
        })
      )
      members.sort(
        (a, b) =>
          b.total_points - a.total_points ||
          b.exact_predictions - a.exact_predictions ||
          a.name.localeCompare(b.name)
      )
      return { id: g.id, name: g.name, data: members }
    })
  )

  /* ── Sestavi tabs + rowsByTab ─────────────────────────────── */
  const tabs: string[] = [
    'Globalna',
    ...(kidsWithPoints.length > 0 ? ['Otroci'] : []),
    ...groupsWithData.map((g) => g.name),
  ]

  const rowsByTab: Record<string, Player[]> = {
    Globalna: globalRaw.map((e) => toPlayer(e, user.id)),
    ...(kidsWithPoints.length > 0
      ? { Otroci: kidsWithPoints.map((e) => toPlayer(e, user.id)) }
      : {}),
    ...Object.fromEntries(
      groupsWithData.map((g) => [g.name, g.data.map((e: any) => toPlayer(e, user.id))])
    ),
  }

  const defaultTabGroup = groupId
    ? groupsWithData.find((g) => g.id === groupId)?.name
    : null
  const defaultTab = defaultTabGroup ?? 'Globalna'

  return (
    <div className="min-h-screen pb-20 md:pb-0 pt-0 md:pt-16" style={{ background: 'var(--page)' }}>
      <Navbar activePath="/leaderboard" />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        <LeaderboardClient tabs={tabs} rowsByTab={rowsByTab} defaultTab={defaultTab} />
      </div>
    </div>
  )
}
