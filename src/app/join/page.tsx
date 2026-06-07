import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  if (!code) redirect('/groups')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in → redirect to login, preserve invite code
  if (!user) redirect(`/login?inviteCode=${code}`)

  // Find the group
  const { data: group } = await supabase
    .from('groups')
    .select('id, name')
    .eq('invite_code', code)
    .single()

  if (!group) redirect('/groups?error=invalid-code')

  // Check if already a member
  const { data: existing } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id })
  }

  redirect('/groups')
}
