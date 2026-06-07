'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Prikaži samo če še niso sprejeli
    if (!localStorage.getItem('cookie_consent')) {
      setVisible(true)
    }
  }, [])

  const accept = () => {
    localStorage.setItem('cookie_consent', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: 0, right: 0, zIndex: 100,
      display: 'flex', justifyContent: 'center', padding: '0 16px',
      pointerEvents: 'none',
    }}>
      <div style={{
        background: '#1a1a1a', color: '#fff', borderRadius: 16,
        padding: '14px 18px', maxWidth: 560, width: '100%',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        pointerEvents: 'all',
      }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>🍪</span>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, flex: 1, color: '#e5e7eb' }}>
          Uporabljamo piškotke za prijavo (Supabase Auth). Shranjujemo tvoje ime, e-mail in avatar.{' '}
          <Link href="/zasebnost" style={{ color: '#2dd4bf', textDecoration: 'none', fontWeight: 600 }}>
            Zasebnost →
          </Link>
        </p>
        <button
          onClick={accept}
          style={{
            background: 'linear-gradient(115deg, #0f766e 0%, #2dd4bf 100%)',
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '8px 16px', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          Razumem
        </button>
      </div>
    </div>
  )
}
