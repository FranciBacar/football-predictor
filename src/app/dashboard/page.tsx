import { createClient } from '@/utils/supabase/server'
import MatchesClient from './MatchesClient'
import Navbar from '@/components/Navbar'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Pridobimo trenutno prijavljenega uporabnika
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Potegnemo vse tekme (razvrščene po času)
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('match_time_utc', { ascending: true })

  // 3. Potegnemo uporabnikove obstoječe napovedi
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', user.id)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Football Predictor</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-400 overflow-hidden">
              {user.user_metadata?.avatar_url && (
                <img src={user.user_metadata.avatar_url} alt="Profil" className="w-full h-full object-cover" />
              )}
            </div>
          </div>
        </div>
      </header>

      <Navbar activePath="/dashboard" />

      <main className="max-w-3xl mx-auto p-4 mt-4">
        <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-blue-100">
          <h2 className="text-lg font-semibold mb-1">Pozdravljen, {user.user_metadata?.full_name || 'Navijač'}! ⚽</h2>
          <p className="text-sm text-gray-600">Vnesi svoje napovedi pred začetkom tekem. Izločilni boji imajo dodatno pravilo ob remiju!</p>
        </div>

        {/* Client komponenta za interaktivnost (vpisovanje in shranjevanje) */}
        <MatchesClient 
          matches={matches || []} 
          initialPredictions={predictions || []} 
          userId={user.id} 
        />
      </main>
    </div>
  )
}