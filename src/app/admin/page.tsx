import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import Navbar from '@/components/Navbar'
import AdminClient from './AdminClient'
import { redirect } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin, name')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--page)' }}>
        <div className="text-center p-8">
          <ShieldAlert size={48} className="mx-auto mb-4 text-red-400" />
          <h1 className="text-xl font-bold text-gray-800">Dostop zavrnjen</h1>
          <p className="text-gray-500 mt-2">Ta stran je dostopna samo administratorjem.</p>
        </div>
      </div>
    )
  }

  const adminClient = createAdminClient()

  // Podatki za tekme
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('match_time_utc', { ascending: true })

  // Vsi javni profili
  const { data: publicUsers } = await supabase
    .from('users')
    .select('id, name, email, avatar_url, is_admin, created_at')
    .order('created_at', { ascending: false })

  // Auth users za last_sign_in_at
  let authUsersMap: Record<string, string | null> = {}
  try {
    const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
    for (const au of authUsers) {
      authUsersMap[au.id] = au.last_sign_in_at ?? null
    }
  } catch (_) { /* service role key not set */ }

  // Število napovedi na uporabnika
  const { data: predCounts } = await supabase
    .from('predictions')
    .select('user_id')
  const predMap: Record<string, number> = {}
  for (const p of predCounts ?? []) {
    predMap[p.user_id] = (predMap[p.user_id] ?? 0) + 1
  }

  // Združi podatke
  const users = (publicUsers ?? []).map(u => ({
    ...u,
    last_sign_in_at: authUsersMap[u.id] ?? null,
    predictions_count: predMap[u.id] ?? 0,
  }))

  // Skupini z lastniki in člani (adminClient bypasses RLS)
  const { data: groups } = await adminClient
    .from('groups')
    .select(`
      id, name, invite_code, created_at,
      creator_user_id,
      users!groups_creator_user_id_fkey(name),
      group_members(count)
    `)
    .order('created_at', { ascending: false })

  // Posebne napovedi — povzetek po tipu in vrednosti
  const { data: rawSpecialPreds } = await adminClient
    .from('special_predictions')
    .select('prediction_type, prediction_value, correct_answer')
    .order('prediction_type')

  // Agregacija: tip → vrednost → { count, correct_answer }
  const typeMap: Record<string, Record<string, { count: number; correct_answer: string | null }>> = {}
  for (const row of rawSpecialPreds ?? []) {
    if (!typeMap[row.prediction_type]) typeMap[row.prediction_type] = {}
    const entry = typeMap[row.prediction_type][row.prediction_value]
    if (!entry) {
      typeMap[row.prediction_type][row.prediction_value] = { count: 1, correct_answer: row.correct_answer }
    } else {
      entry.count++
      if (!entry.correct_answer && row.correct_answer) entry.correct_answer = row.correct_answer
    }
  }

  const specialPredsSummary = Object.entries(typeMap).map(([type, vals]) => {
    const answers = Object.entries(vals)
      .map(([value, { count, correct_answer }]) => ({ value, count, correct_answer }))
      .sort((a, b) => b.count - a.count)
    const currentCorrect = answers.find(a => a.correct_answer)?.correct_answer ?? null
    return { type, answers, currentCorrect }
  })

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pt-16" style={{ background: 'var(--page)' }}>
      <Navbar activePath="/admin" />

      <main className="max-w-4xl mx-auto px-4 md:px-0 mt-4 md:mt-0">
        <AdminClient
          matches={matches ?? []}
          users={users}
          groups={groups ?? []}
          specialPredsSummary={specialPredsSummary}
          userName={profile?.name ?? ''}
        />
      </main>
    </div>
  )
}
