import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import ProfileClient from './ProfileClient'
import { redirect } from 'next/navigation'
import { User } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, email, avatar_url, is_global_opt_in')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="min-h-screen pb-20 md:pb-0 pt-0 md:pt-16" style={{ background: 'var(--page)' }}>
      <Navbar activePath="/profile" />

      <main className="max-w-3xl mx-auto px-4 md:px-0 mt-4 md:mt-0">
        <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User size={20} style={{ color: 'var(--teal)' }} />
            Moj profil
          </h2>
          <p className="text-sm text-gray-500 mt-1">Upravljaj z nastavitvami svojega računa.</p>
        </div>

        <ProfileClient profile={profile} />
      </main>
    </div>
  )
}
