import { createClient } from '@/utils/supabase/server'
import DashboardWrapper from './DashboardWrapper'
import Navbar from '@/components/Navbar'
import OnboardingTour from '@/components/OnboardingTour'
import { redirect } from 'next/navigation'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { tab } = await searchParams
  const activeTab = tab === 'posebne' ? 'posebne' : 'napovedi'

  const { data: matches } = await supabase
    .from('matches').select('*').order('match_time_utc', { ascending: true })

  const { data: predictions } = await supabase
    .from('predictions').select('*').eq('user_id', user.id)

  const { data: specialPreds } = await supabase
    .from('special_predictions').select('*').eq('user_id', user.id)

  const firstName = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? 'Navijač').split(' ')[0]

  return (
    <div style={{ minHeight:'100vh', paddingBottom:80, fontFamily:'var(--font)' }} className="md:pb-0 md:pt-16">
      <Navbar activePath="/dashboard" />

      <OnboardingTour userId={user.id} />
      <div style={{ maxWidth:640, margin:'0 auto' }}>
        {/* Greeting */}
        <div style={{ padding:'16px 20px 14px' }}>
          <h1 style={{ fontSize:24, fontWeight:750, margin:0, letterSpacing:'-0.02em' }}>
            Pozdravljen, {firstName}!
          </h1>
          <p style={{ margin:'4px 0 0', fontSize:13.5, color:'var(--muted)', lineHeight:1.4 }}>
            Vnesi napovedi za prihajajoče tekme. Napovedi se zaklenejo 15 min pred začetkom.
          </p>
        </div>

        {/* Main tab switcher — segmentni kontrol */}
        <div style={{ padding:'0 16px 14px' }}>
          <div style={{ display:'flex', gap:4, background:'#eef2f1', borderRadius:13, padding:4 }}>
            <a
              href="/dashboard"
              data-tour="matches-tab"
              style={{
                flex:1, padding:'9px 0', borderRadius:10, fontSize:13, fontWeight:600,
                textDecoration:'none', textAlign:'center', transition:'background .18s, color .18s, box-shadow .18s',
                background: activeTab === 'napovedi' ? '#fff' : 'transparent',
                color: activeTab === 'napovedi' ? '#0f766e' : '#6b7280',
                boxShadow: activeTab === 'napovedi' ? '0 1px 3px rgba(16,24,40,0.10)' : 'none',
              }}
            >
              Napovedi tekem
            </a>
            <a
              href="/dashboard?tab=posebne"
              data-tour="special-tab"
              style={{
                flex:1, padding:'9px 0', borderRadius:10, fontSize:13, fontWeight:600,
                textDecoration:'none', textAlign:'center', transition:'background .18s, color .18s, box-shadow .18s',
                background: activeTab === 'posebne' ? '#fff' : 'transparent',
                color: activeTab === 'posebne' ? '#0f766e' : '#6b7280',
                boxShadow: activeTab === 'posebne' ? '0 1px 3px rgba(16,24,40,0.10)' : 'none',
              }}
            >
              Posebne napovedi
            </a>
          </div>
        </div>

        <DashboardWrapper
          parentUserId={user.id}
          matches={matches ?? []}
          initialPredictions={predictions ?? []}
          specialPreds={specialPreds ?? []}
          activeTab={activeTab}
        />
      </div>
    </div>
  )
}
