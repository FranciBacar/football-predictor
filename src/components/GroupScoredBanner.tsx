'use client'

import { useState, useEffect } from 'react'

const BANNER_KEY = 'group_scored_banner_v1'
const BANNER_EXPIRES = new Date('2026-06-29T21:59:00Z')

export default function GroupScoredBanner() {
  const [visible, setVisible] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    if (new Date() >= BANNER_EXPIRES) return
    if (localStorage.getItem(BANNER_KEY) === 'dismissed') return
    setIsDesktop(window.innerWidth >= 768)
    setVisible(true)
  }, [])

  if (!visible) return null

  const dismiss = () => {
    localStorage.setItem(BANNER_KEY, 'dismissed')
    setVisible(false)
  }

  const wrapStyle: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    right: 0,
    zIndex: 9999,
    padding: isDesktop ? '0 24px' : '0 12px',
    pointerEvents: 'none',
    ...(isDesktop
      ? { top: 64, bottom: 'auto' }
      : { bottom: 72, top: 'auto' }),
  }

  return (
    <div style={wrapStyle}>
      <div style={{
        maxWidth: 640,
        margin: '0 auto',
        background: 'linear-gradient(135deg, #0f766e 0%, #0c5f58 100%)',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(15,118,110,0.35)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 14px',
        pointerEvents: 'all',
      }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>🏆</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
            Skupinski del zaključen — točke dodeljene!
          </div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
            Preveri napovedi zmagovalcev skupin.
          </div>
        </div>
        <a
          href="/dashboard?tab=posebne"
          onClick={dismiss}
          style={{
            flexShrink: 0,
            padding: '7px 12px',
            borderRadius: 9,
            background: 'rgba(255,255,255,0.18)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Preveri →
        </a>
        <button
          onClick={dismiss}
          style={{
            flexShrink: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.6)',
            fontSize: 18,
            lineHeight: 1,
            padding: '2px 4px',
          }}
          aria-label="Zapri"
        >
          ×
        </button>
      </div>
    </div>
  )
}
