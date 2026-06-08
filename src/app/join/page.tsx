import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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

  // Check if already a member, add if not
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

  // Fetch members for the welcome screen
  const { data: members } = await supabase
    .from('group_members')
    .select('users(id, name, avatar_url, avatar_emoji)')
    .eq('group_id', group.id)
    .order('joined_at', { ascending: true })

  const memberList = (members ?? []).map((m: any) => m.users).filter(Boolean)
  const isAlreadyMember = !!existing

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--page)',
      padding: '24px 16px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 24,
        padding: '36px 28px',
        maxWidth: 420,
        width: '100%',
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
        textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0f766e 0%, #2dd4bf 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: 32,
        }}>
          {isAlreadyMember ? '👋' : '🎉'}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
          {isAlreadyMember ? 'Že si del skupine!' : 'Dobrodošel v skupini!'}
        </h1>
        <p style={{ fontSize: 15, color: '#6b7280', margin: '0 0 28px', lineHeight: 1.5 }}>
          {isAlreadyMember
            ? <>Si že član skupine <strong style={{ color: '#0f766e' }}>{group.name}</strong>.</>
            : <>Uspešno si se pridružil skupini <strong style={{ color: '#0f766e' }}>{group.name}</strong>.</>
          }
        </p>

        {/* Members */}
        {memberList.length > 0 && (
          <div style={{
            background: '#f8fafc',
            borderRadius: 16,
            padding: '16px',
            marginBottom: 24,
            textAlign: 'left',
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>
              Člani skupine · {memberList.length}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {memberList.map((member: any) => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Avatar */}
                  {member.avatar_emoji ? (
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0f766e20 0%, #2dd4bf20 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, flexShrink: 0,
                    }}>
                      {member.avatar_emoji}
                    </div>
                  ) : member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.name}
                      style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0f766e 0%, #2dd4bf 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {member.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
                    {member.name ?? 'Neznan'}
                    {member.id === user.id && (
                      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginLeft: 6 }}>ti</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Link href="/dashboard" style={{
          display: 'block',
          background: 'linear-gradient(115deg, #0f766e 0%, #2dd4bf 100%)',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: 12,
          padding: '14px 24px',
          fontSize: 15,
          fontWeight: 700,
          boxShadow: '0 4px 14px rgba(15,118,110,0.3)',
          marginBottom: 12,
        }}>
          Začni napovedovati ⚽
        </Link>
        <Link href="/groups" style={{
          display: 'block',
          fontSize: 13,
          color: '#9ca3af',
          textDecoration: 'none',
        }}>
          Poglej vse svoje skupine
        </Link>
      </div>
    </div>
  )
}
