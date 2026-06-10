'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useProfile, type KidProfile } from '@/context/ProfileContext'

export default function MobileProfileSwitcher() {
  const supabase = createClient()
  const { activeKidId, activeKidName, setActiveKid, isPlayingAsKid } = useProfile()
  const [kids, setKids] = useState<KidProfile[]>([])
  const [parentName, setParentName] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('users').select('name').eq('id', user.id).single()
      if (profile) setParentName(profile.name)

      const { data: kidRows } = await supabase
        .from('users').select('id, name, avatar_emoji')
        .eq('parent_user_id', user.id).eq('is_kid', true)

      const loadedKids = (kidRows ?? []) as KidProfile[]
      setKids(loadedKids)

      if (activeKidId && !loadedKids.some(k => k.id === activeKidId)) {
        setActiveKid(null)
      }
    }
    load()
  }, [])

  // Ne pokaži če ni otrok
  if (kids.length === 0) return null

  const currentEmoji = isPlayingAsKid
    ? kids.find(k => k.id === activeKidId)?.avatar_emoji ?? '👦'
    : null

  return (
    <>
      {/* Trigger button — zgoraj desno */}
      <button
        onPointerDown={(e) => { e.stopPropagation(); setOpen(true) }}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: 999,
          background: isPlayingAsKid ? 'rgba(15,118,110,0.12)' : 'rgba(255,255,255,0.9)',
          border: isPlayingAsKid ? '1.5px solid rgba(15,118,110,0.35)' : '1.5px solid #e5e7eb',
          boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
          cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151',
        }}
      >
        <span style={{ fontSize: 15 }}>{currentEmoji ?? '👤'}</span>
        <span style={{ maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isPlayingAsKid ? activeKidName : parentName}
        </span>
        <span style={{ fontSize: 10, color: '#9ca3af' }}>▼</span>
      </button>

      {/* Bottom sheet overlay */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          onPointerDown={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />

          {/* Sheet */}
          <div
            style={{
              position: 'relative', background: '#fff',
              borderRadius: '20px 20px 0 0',
              padding: '8px 0 32px',
              boxShadow: '0 -8px 30px rgba(0,0,0,0.15)',
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div style={{ width: 36, height: 4, background: '#e5e7eb', borderRadius: 999, margin: '6px auto 16px' }} />

            <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', padding: '0 20px 8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Preklopi profil
            </p>

            {/* Parent */}
            <button
              onPointerDown={() => { setActiveKid(null); setOpen(false) }}
              style={{
                width: '100%', textAlign: 'left', padding: '12px 20px',
                display: 'flex', alignItems: 'center', gap: 12,
                background: !isPlayingAsKid ? 'rgba(15,118,110,0.06)' : 'transparent',
                border: 'none', cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 26 }}>👤</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{parentName}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Moj profil</div>
              </div>
              {!isPlayingAsKid && <span style={{ marginLeft: 'auto', fontSize: 16, color: '#0f766e' }}>✓</span>}
            </button>

            {kids.map(kid => (
              <button
                key={kid.id}
                onPointerDown={() => { setActiveKid(kid); setOpen(false) }}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px 20px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: activeKidId === kid.id ? 'rgba(15,118,110,0.06)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 26 }}>{kid.avatar_emoji}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{kid.name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Otroški profil</div>
                </div>
                {activeKidId === kid.id && <span style={{ marginLeft: 'auto', fontSize: 16, color: '#0f766e' }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
