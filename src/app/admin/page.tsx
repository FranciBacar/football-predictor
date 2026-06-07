import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import AdminClient from './AdminClient'
import { redirect } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Samo admin uporabniki
  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <ShieldAlert size={48} className="mx-auto mb-4 text-red-400" />
          <h1 className="text-xl font-bold text-gray-800">Dostop zavrnjen</h1>
          <p className="text-gray-500 mt-2">Ta stran je dostopna samo administratorjem.</p>
        </div>
      </div>
    )
  }

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('match_time_utc', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 pt-0 md:pt-16">
      <Navbar activePath="/admin" />

      <main className="max-w-3xl mx-auto px-4 md:px-0 mt-4 md:mt-0">
        <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-orange-100">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShieldAlert size={20} className="text-orange-500" />
            Admin Panel
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Sync rezultatov, mapiranje tekem in ročni vnos.
          </p>
        </div>

        <AdminClient matches={matches ?? []} />
      </main>
    </div>
  )
}
