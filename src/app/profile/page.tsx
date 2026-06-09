import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import ProfileClient from './ProfileClient'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, email, avatar_url, is_global_opt_in, is_admin')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: kids } = await supabase
    .from('users')
    .select('id, name')
    .eq('parent_user_id', user.id)
    .eq('is_kid', true)

  return (
    <div className="min-h-screen pb-20 md:pb-0 pt-0 md:pt-16" style={{ background: 'var(--page)' }}>
      <Navbar activePath="/profile" />
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
        <ProfileClient profile={profile} initialKids={kids ?? []} />
      </div>
    </div>
  )
}
