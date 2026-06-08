'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function OnboardingCTA({ userId, nextUrl }: { userId: string; nextUrl: string }) {
  const [loading, setLoading] = useState(false)
  const [isUnderage, setIsUnderage] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleStart = async () => {
    setLoading(true)
    await supabase
      .from('users')
      .update({
        onboarding_completed: true,
        is_underage: isUnderage,
      })
      .eq('id', userId)
    router.push(nextUrl)
  }

  return (
    <div style={{ padding: '8px 0 16px' }}>

      {/* Checkbox otroška lestvica */}
      <label style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        background: '#fff', borderRadius: 16, padding: '18px 20px',
        marginBottom: 16, border: `2px solid ${isUnderage ? '#0f766e' : '#f0f0f0'}`,
        cursor: 'pointer', transition: 'border-color 0.15s',
      }}>
        <div style={{ position: 'relative', flexShrink: 0, marginTop: 1 }}>
          <input
            type="checkbox"
            checked={isUnderage}
            onChange={e => setIsUnderage(e.target.checked)}
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
          />
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            border: `2px solid ${isUnderage ? '#0f766e' : '#d1d5db'}`,
            background: isUnderage ? '#0f766e' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}>
            {isUnderage && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a', margin: 0 }}>
            Mlajši sem od 18 let
          </p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '3px 0 0', lineHeight: 1.4 }}>
            Pojavil/-a se bom tudi na posebni otroški lestvici.
          </p>
        </div>
      </label>

      {/* CTA gumb */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleStart}
          disabled={loading}
          style={{
            display: 'inline-block', padding: '16px 36px', borderRadius: 999,
            background: 'linear-gradient(115deg, #0f766e 0%, #2dd4bf 100%)',
            color: '#fff', fontWeight: 800, fontSize: 17, border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(15,118,110,0.35)',
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 0.2s',
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
