import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import GroupsClient from './GroupsClient'
import { redirect } from 'next/navigation'

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user's groups with members
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, groups(id, name, invite_code, creator_user_id)')
    .eq('user_id', user.id)

  const groupIds = memberships?.map(m => (m.groups as any)?.id).filter(Boolean) || []

  // Fetch members for all groups at once
  const { data: allMembers } = groupIds.length > 0
    ? await supabase
        .from('group_members')
        .select('group_id, users(id, name, avatar_url)')
        .in('group_id', groupIds)
    : { data: [] }

  // Attach members to each group
  const myGroups = (memberships?.map(m => m.groups).filter(Boolean) || []).map((group: any) => ({
    ...group,
    members: (allMembers || [])
      .filter(m => m.group_id === group.id)
      .map(m => m.users)
      .filter(Boolean),
  }))

  return (
    <div className="min-h-screen pb-20 md:pb-0 pt-0 md:pt-16" style={{ background: 'var(--goodish-gray)' }}>
      <Navbar activePath="/groups" />
      <main className="max-w-3xl mx-auto px-4 md:px-0 mt-4 md:mt-0">
        <GroupsClient userId={user.id} initialGroups={myGroups} />
      </main>
    </div>
  )
}
