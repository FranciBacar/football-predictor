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
  const { data: globalData } = await supabase.rpc('get_global_leaderboard')

  // Kids lestvica — samo is_kid = true uporabniki
  const { data: kidsRaw } = await supabase
    .from('users')
    .select('id, name, avatar_emoji')
    .eq('is_kid', true)

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
