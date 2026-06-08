'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function OnboardingCTA({ userId, nextUrl }: { userId: string; nextUrl: string }) {
  const [loading, setLoading] = useState(false)
  const [ageChoice, setAgeChoice] = useState<'adult' | 'underage' | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleStart = async () => {
    if (!ageChoice) return
    setLoading(true)
    await supabase
      .from('users')
      .update({
        onboarding_completed: true,
        is_underage: ageChoice === 'underage',
      })
      .eq('id', userId)
    router.push(nextUrl)
  }

  return (
    <div style={{ padding: '8px 0 16px' }}>
      {/* Vprašanje o starosti */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: '20px',
        marginBottom: 16, border: '1px solid #f0f0f0',
      }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a', margin: '0 0 6px' }}>
          🎂 Kako star si?
        </p>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 14px', lineHeight: 1.5 }}>
          Mlajši od 18 let se pojavijo tudi na posebni otroški lestvici.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setAgeChoice('adult')}
            style={{
              flex: 1, padding: '12px', borderRadius: 12, border: '2px solid',
              borderColor: ageChoice === 'adult' ? '#0f766e' : '#e5e7eb',
              background: ageChoice === 'adult' ? 'rgba(15,118,110,0.08)' : '#f9fafb',
              color: ageChoice === 'adult' ? '#0f766e' : '#374151',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            👨 18 let ali več
          </button>
          <button
            onClick={() => setAgeChoice('underage')}
            style={{
              flex: 1, padding: '12px', borderRadius: 12, border: '2px solid',
              borderColor: ageChoice === 'underage' ? '#0f766e' : '#e5e7eb',
              background: ageChoice === 'underage' ? 'rgba(15,118,110,0.08)' : '#f9fafb',
              color: ageChoice === 'underage' ? '#0f766e' : '#374151',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            👦 Mlajši od 18
          </button>
        </div>
      </div>

      {/* CTA gumb */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleStart}
          disabled={loading || !ageChoice}
          style={{
            display: 'inline-block', padding: '16px 36px', borderRadius: 999,
            background: 'linear-gradient(115deg, #0f766e 0%, #2dd4bf 100%)',
            color: '#fff', fontWeight: 800, fontSize: 17, border: 'none', cursor: ageChoice ? 'pointer' : 'not-allowed',
            boxShadow: ageChoice ? '0 4px 20px rgba(15,118,110,0.35)' : 'none',
            opacity: loading || !ageChoice ? 0.5 : 1,
            transition: 'all 0.2s',
          }}
        >
          {loading ? 'Nalagam...' : '⚽ Razumem, začni z napovedmi →'}
        </button>
        <p style={{ marginTop: 10, fontSize: 12, color: '#9ca3af' }}>
          Pravila so dostopna tudi kasneje v nogi strani.
        </p>
      </div>
    </div>
  )
}
