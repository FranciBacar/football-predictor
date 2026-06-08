import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import LeaderboardClient from './LeaderboardClient'
import { redirect } from 'next/navigation'
import { Trophy } from 'lucide-react'

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>
}) {
  const supabase = await createClient()
  const { group: groupId } = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Pridobi globalno lestvico
  const { data: globalRpc } = await supabase.rpc('get_global_leaderboard')

  // Vsi uporabniki na globalni lestvici (is_global_opt_in = true, ni otrok)
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, name, avatar_url, avatar_emoji, is_kid, is_underage')
    .eq('is_kid', false)
    .eq('is_global_opt_in', true)
    .order('name', { ascending: true })

  // Mergaj: tisti brez točk dobijo rank = 0 (sortiramo spodaj)
  const pointsMap = new Map((globalRpc ?? []).map((e: any) => [e.user_id, e]))
  const globalData: any[] = (allUsers ?? []).map((u) => {
    const entry = pointsMap.get(u.id)
    return entry ?? {
      user_id: u.id,
      name: u.name,
      avatar_url: u.avatar_url ?? null,
      avatar_emoji: u.avatar_emoji ?? null,
      total_points: 0,
      exact_predictions: 0,
      rank: 0,
    }
  })
  // Sortiraj in dodeli rank
  globalData.sort((a: any, b: any) =>
    b.total_points - a.total_points || b.exact_predictions - a.exact_predictions || a.name.localeCompare(b.name)
  )
  globalData.forEach((e: any, i: number) => { e.rank = i + 1 })

  // Kids lestvica — is_kid = true (dodani s strani starša) ALI is_underage = true (sami prijavili)
  const { data: kidsRaw } = await supabase
    .from('users')
    .select('id, name, avatar_url, avatar_emoji, is_kid')
    .or('is_kid.eq.true,is_underage.eq.true')

  // Za vsak kid izračunaj točke
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
        ...(preds ?? []).map(p => p.earned_points ?? 0),
        ...(special ?? []).map(s => s.earned_points ?? 0),
      ].reduce((a, b) => a + b, 0)
      const exact = (preds ?? []).filter(p => p.earned_points === 3 || p.earned_points === 6).length
      return { user_id: kid.id, name: kid.name, avatar_url: null, avatar_emoji: kid.avatar_emoji, total_points: total, exact_predictions: exact, rank: 0 }
    })
  )
  const kidsData = kidsWithPoints
    .sort((a, b) => b.total_points - a.total_points || b.exact_predictions - a.exact_predictions)
    .map((k, i) => ({ ...k, rank: i + 1 }))

  // Pridobi skupin, v katerih je prijavljen uporabnik
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, groups(id, name)')
    .eq('user_id', user.id)

  const groups =
    memberships
      ?.map((m) => m.groups)
      .filter(Boolean)
      .map((g) => g as unknown as { id: string; name: string }) ?? []

  return (
    <div className="min-h-screen pb-20 md:pb-0 pt-0 md:pt-16" style={{ background: 'var(--page)' }}>
      <Navbar activePath="/leaderboard" />

      <main className="max-w-3xl mx-auto px-4 md:px-0 mt-4 md:mt-0">
        <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Trophy size={20} className="text-yellow-500" />
            Lestvica
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Razvrščeni po skupnih točkah. Pri izenačitvi odloča število točnih rezultatov.
          </p>
        </div>

        <LeaderboardClient
          globalData={globalData ?? []}
          kidsData={kidsData}
          groups={groups}
          currentUserId={user.id}
          initialGroupId={groupId ?? null}
        />
      </main>
    </div>
  )
}
