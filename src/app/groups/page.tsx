import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import GroupsClient from './GroupsClient'
import { redirect } from 'next/navigation'

export default async function GroupsPage() {
  const supabase = await createClient()

  // 1. Preverimo prijavo
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Potegnemo skupine, v katerih je uporabnik član
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, groups(id, name, invite_code, creator_user_id)')
    .eq('user_id', user.id)

  const myGroups = memberships?.map(m => m.groups).filter(Boolean) || []

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

      <Navbar activePath="/groups" />

      <main className="max-w-3xl mx-auto p-4 mt-4">
        <GroupsClient userId={user.id} initialGroups={myGroups as any[]} />
      </main>
    </div>
  )
}