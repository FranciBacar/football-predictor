import { createClient } from '@/utils/supabase/server'
import MatchesClient from './MatchesClient'
import Navbar from '@/components/Navbar'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: matches } = await supabase
    .from('matches').select('*').order('match_time_utc', { ascending: true })

  const { data: predictions } = await supabase
    .from('predictions').select('*').eq('user_id', user.id)

  const firstName = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? 'Navijač').split(' ')[0]
  const avatar = user.user_metadata?.avatar_url ?? null

  return (
    <div style={{ minHeight:'100vh', paddingBottom:80, fontFamily:'var(--font)' }} className="md:pb-0 md:pt-16">
      <Navbar activePath="/dashboard" />

      <div style={{ maxWidth:640, margin:'0 auto' }}>
        {/* Greeting */}
        <div style={{ padding:'16px 20px 14px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
          <div>
            <h1 style={{ fontSize:25, fontWeight:700, margin:0, letterSpacing:'-0.02em' }}>
              Pozdravljen, {firstName}! ⚽
            </h1>
            <p style={{ margin:'4px 0 0', fontSize:13.5, color:'var(--muted)', lineHeight:1.4 }}>
              Vnesi napovedi za prihajajoče tekme. Zaklene se 15 min pred začetkom.
            </p>
          </div>
          <div style={{
            width:44, height:44, borderRadius:'50%', flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            background:'var(--grad)', color:'#fff', fontSize:22,
            boxShadow:'0 4px 12px rgba(15,118,110,0.28)', overflow:'hidden',
          }}>
            {avatar
              ? <img src={avatar} alt={firstName} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : '⚽'}
          </div>
        </div>

        <MatchesClient
          matches={matches ?? []}
          initialPredictions={predictions ?? []}
          userId={user.id}
        />
      </div>
    </div>
  )
}
