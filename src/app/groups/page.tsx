import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import GroupsClient from './GroupsClient'
import { redirect } from 'next/navigation'

export default async function GroupsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, groups(id, name, invite_code, creator_user_id)')
    .eq('user_id', user.id)

  const myGroups = memberships?.map(m => m.groups).filter(Boolean) || []

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 pt-0 md:pt-16">
      <Navbar activePath="/groups" />
      
      <main className="max-w-3xl mx-auto px-4 md:px-0 mt-4 md:mt-0">
        <GroupsClient userId={user.id} initialGroups={myGroups as any[]} />
      </main>
    </div>
  )
}