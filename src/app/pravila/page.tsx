import Navbar from '@/components/Navbar'
import { createClient } from '@/utils/supabase/server'
import OnboardingCTA from './OnboardingCTA'
import PravilaContent from './PravilaContent'

export default async function PravilaPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string; next?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { onboarding, next } = await searchParams

  const isOnboarding = onboarding === '1'
  const nextUrl = next ?? '/dashboard'

  return (
    <div className="min-h-screen pb-24 md:pb-8 md:pt-16" style={{ background: 'var(--page)' }}>
      {user && !isOnboarding && <Navbar activePath="" />}

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
        {/* Onboarding welcome header */}
        {isOnboarding && (
          <div style={{
            background: 'linear-gradient(115deg, #0f766e 0%, #2dd4bf 100%)',
            borderRadius: 18, padding: '28px 24px 24px', marginBottom: 24, color: '#fff', textAlign: 'center',
          }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.03em' }}>
              Dobrodošel v Football Predictor!
            </h1>
            <p style={{ margin: 0, fontSize: 14, opacity: 0.9, lineHeight: 1.5 }}>
              Pred začetkom si preberi pravila igre. Traja 1 minuto.
            </p>
          </div>
        )}

        <PravilaContent nextUrl={nextUrl} isOnboarding={isOnboarding} hasUser={!!user} />

        {isOnboarding && user && (
          <div style={{ marginTop: 16 }}>
            <OnboardingCTA userId={user.id} nextUrl={nextUrl} />
          </div>
        )}
      </div>
    </div>
  )
}
