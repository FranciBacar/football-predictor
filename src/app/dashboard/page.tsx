import { createClient } from '@/utils/supabase/server'
import MatchesClient from './MatchesClient'
import Navbar from '@/components/Navbar'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('match_time_utc', { ascending: true })

  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', user.id)

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 pt-0 md:pt-16">
      <Navbar activePath="/dashboard" />
      
      <main className="max-w-3xl mx-auto px-4 md:px-0">
        <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-blue-100 mt-4 md:mt-0">
          <h2 className="text-lg font-semibold mb-1 flex items-center justify-between">
            <span>Pozdravljen, {user.user_metadata?.full_name?.split(' ')[0] || 'Navijač'}! ⚽</span>
            {user.user_metadata?.avatar_url && (
              <img src={user.user_metadata.avatar_url} alt="Profil" className="w-8 h-8 rounded-full border border-gray-200 md:hidden" />
            )}
          </h2>
          <p className="text-sm text-gray-600">Vnesi svoje napovedi pred začetkom tekem. Izločilni boji imajo dodatno pravilo ob remiju!</p>
        </div>

        <MatchesClient 
          matches={matches || []} 
          initialPredictions={predictions || []} 
          userId={user.id} 
        />
      </main>
    </div>
  )
}