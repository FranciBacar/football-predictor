'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function OnboardingCTA({ userId, nextUrl }: { userId: string; nextUrl: string }) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleStart = async () => {
    setLoading(true)
    await supabase
      .from('users')
      .update({ onboarding_completed: true })
      .eq('id', userId)
    router.push(nextUrl)
  }

  return (
    <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
      <button
        onClick={handleStart}
        disabled={loading}
        style={{
          display: 'inline-block', padding: '16px 36px', borderRadius: 999,
          background: 'linear-gradient(115deg, #0f766e 0%, #2dd4bf 100%)',
          color: '#fff', fontWeight: 800, fontSize: 17, border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(15,118,110,0.35)',
          opacity: loading ? 0.7 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        {loading ? 'Nalagam...' : '⚽ Razumem, začni z napovedmi →'}
      </button>
      <p style={{ marginTop: 10, fontSize: 12, color: '#9ca3af' }}>
        Pravila so dostopna tudi kasneje v nogi strani.
      </p>
    </div>
  )
}
