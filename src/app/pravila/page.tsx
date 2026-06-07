import Navbar from '@/components/Navbar'
import { createClient } from '@/utils/supabase/server'
import OnboardingCTA from './OnboardingCTA'
import Link from 'next/link'

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
        {isOnboarding ? (
          <div style={{
            background: 'linear-gradient(115deg, #0f766e 0%, #2dd4bf 100%)',
            borderRadius: 18, padding: '28px 24px 24px', marginBottom: 24, color: '#fff', textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>👋</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.03em' }}>
              Dobrodošel v Football Predictor!
            </h1>
            <p style={{ margin: 0, fontSize: 14, opacity: 0.9, lineHeight: 1.5 }}>
              Pred začetkom si preberi pravila igre. Traja 1 minuto.
            </p>
          </div>
        ) : (
          <div style={{
            background: 'linear-gradient(115deg, #0f766e 0%, #2dd4bf 100%)',
            borderRadius: 18, padding: '24px 24px 20px', marginBottom: 24, color: '#fff',
          }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>⚽</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>Pravila igre</h1>
            <p style={{ margin: '6px 0 0', fontSize: 14, opacity: 0.85 }}>
              Goodish Football Predictor — Svetovno Prvenstvo 2026
            </p>
          </div>
        )}

        {/* Osnovno točkovanje */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px', marginBottom: 16, border: '1px solid #f0f0f0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: '#1a1a1a' }}>
            📊 Točkovanje tekem
          </h2>
          <p style={{ fontSize: 13.5, color: '#6b7280', margin: '0 0 14px', lineHeight: 1.5 }}>
            Napoveduješ točne rezultate tekem <strong>po 90 minutah</strong> (brez podaljškov in penalt).
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { emoji: '🎯', pts: '3 točke', title: 'Točen rezultat', desc: 'Napoveš 2:1 in tekma se konča z 2:1.' },
              { emoji: '📐', pts: '2 točki', title: 'Pravilen tip + zadetki ene ekipe', desc: 'Napoveš 3:1, tekma 2:1 — zmaga pravilna in away gol (1) se ujema.' },
              { emoji: '✅', pts: '1 točka', title: 'Pravilen tip tekme', desc: 'Pravilno napoveš zmagovalca ali remi, ampak zadetki se ne ujemajo.' },
              { emoji: '❌', pts: '0 točk', title: 'Napačen tip', desc: 'Napoveš zmago domačih, pa izgubijo ali je remi.' },
            ].map(row => (
              <div key={row.title} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 14px', borderRadius: 12,
                background: '#f9fafb', border: '1px solid #f0f0f0',
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{row.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>{row.title}</span>
                    <span style={{ fontWeight: 800, fontSize: 14, color: '#0f766e', whiteSpace: 'nowrap', marginLeft: 8 }}>{row.pts}</span>
                  </div>
                  <span style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.4 }}>{row.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 14, padding: '12px 14px', borderRadius: 12,
            background: 'rgba(15,118,110,0.08)', border: '1px solid rgba(15,118,110,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#0f766e' }}>⚡ Od 1/8 finala naprej</span>
              <span style={{ fontWeight: 800, fontSize: 14, color: '#0f766e' }}>× 2 točke</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#0f766e', opacity: 0.8 }}>
              Vse napovedi v izločilnem delu so vredne dvojno: 6, 4 ali 2 točki.
            </p>
          </div>
        </div>

        {/* Izločilni boji */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px', marginBottom: 16, border: '1px solid #f0f0f0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: '#1a1a1a' }}>
            ⚔️ Izločilni boji — remi
          </h2>
          <p style={{ fontSize: 13.5, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
            Ko napoveš remi v izločilni tekmi, se pojavi dodatno vprašanje: <strong>kdo napreduje?</strong>
            Pravilen napredovalec ti prinese <strong>+2 bonus točki</strong>.
          </p>
        </div>

        {/* Posebne napovedi */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px', marginBottom: 16, border: '1px solid #f0f0f0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: '#1a1a1a' }}>
            🔮 Posebne napovedi (bonus točke)
          </h2>
          <p style={{ fontSize: 13.5, color: '#6b7280', margin: '0 0 14px', lineHeight: 1.5 }}>
            Pred začetkom SP (<strong>zaklepanje 11. junija ob 20:00</strong>) napoveš:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { emoji: '🏆', title: 'Zmagovalec SP', pts: '+10 točk' },
              { emoji: '⚽', title: 'Najboljši strelec', pts: '+10 točk' },
              { emoji: '🌟', title: 'Najboljši igralec (MVP)', pts: '+10 točk' },
              { emoji: '🥇', title: 'Zmagovalec vsake od 12 skupin (A–L)', pts: '+3 točke vsaka' },
            ].map(row => (
              <div key={row.title} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: 10, background: '#f9fafb', border: '1px solid #f0f0f0',
              }}>
                <span style={{ fontSize: 14, color: '#374151' }}>{row.emoji} {row.title}</span>
                <span style={{ fontWeight: 800, fontSize: 14, color: '#0f766e', marginLeft: 12, whiteSpace: 'nowrap' }}>{row.pts}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#fef9ec', border: '1px solid #fde68a' }}>
            <span style={{ fontSize: 13, color: '#92400e' }}>
              💡 Skupaj možnih bonus točk: <strong>10 + 10 + 10 + (12 × 3) = 66 točk</strong>
            </span>
          </div>
        </div>

        {/* Zaklepanje */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px', marginBottom: 16, border: '1px solid #f0f0f0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: '#1a1a1a' }}>🔒 Zaklepanje napovedi</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f9fafb', fontSize: 13.5, color: '#374151', lineHeight: 1.5 }}>
              <strong>Napovedi tekem</strong> — zaklenejo se <strong>15 minut pred začetkom</strong> vsake tekme.
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f9fafb', fontSize: 13.5, color: '#374151', lineHeight: 1.5 }}>
              <strong>Posebne napovedi</strong> — zaklenejo se <strong>11. junija ob 20:00</strong>.
            </div>
          </div>
        </div>

        {/* Izenačeno */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px', marginBottom: 24, border: '1px solid #f0f0f0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: '#1a1a1a' }}>🏅 Izenačeno število točk</h2>
          <p style={{ fontSize: 13.5, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
            Pri enakem številu točk odloča <strong>število točnih rezultatov</strong> (3-točkovnih zadetkov). Kdor jih ima več, je višje na lestvici.
          </p>
        </div>

        {/* CTA */}
        {isOnboarding && user ? (
          <OnboardingCTA userId={user.id} nextUrl={nextUrl} />
        ) : user ? (
          <div style={{ textAlign: 'center' }}>
            <Link href="/dashboard" style={{
              display: 'inline-block', padding: '14px 32px', borderRadius: 999,
              background: 'linear-gradient(115deg, #0f766e 0%, #2dd4bf 100%)',
              color: '#fff', fontWeight: 700, fontSize: 16, textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(15,118,110,0.30)',
            }}>
              ⚽ Na napovedi →
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  )
}
