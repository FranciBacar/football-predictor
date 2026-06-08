'use client'

import { useState } from 'react'
import { useProfile, KidProfile } from '@/context/ProfileContext'
import { ChevronDown } from 'lucide-react'

type Props = {
  parentName: string
  parentAvatar: string | null
  kids: KidProfile[]
}

export default function ProfileSwitcher({ parentName, parentAvatar, kids }: Props) {
  const { activeKidId, activeKidName, setActiveKid, isPlayingAsKid } = useProfile()
  const [open, setOpen] = useState(false)

  const currentName = isPlayingAsKid ? activeKidName : parentName
  const currentEmoji = isPlayingAsKid
    ? kids.find(k => k.id === activeKidId)?.avatar_emoji ?? '👦'
    : null

  if (kids.length === 0) return null

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', borderRadius: 999,
          background: isPlayingAsKid ? 'rgba(15,118,110,0.1)' : '#f3f4f6',
          border: isPlayingAsKid ? '1.5px solid rgba(15,118,110,0.3)' : '1.5px solid #e5e7eb',
          cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151',
        }}
      >
        {currentEmoji ? (
          <span style={{ fontSize: 16 }}>{currentEmoji}</span>
        ) : parentAvatar ? (
          <img src={parentAvatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 16 }}>👤</span>
        )}
        <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentName}
        </span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 6,
            background: '#fff', borderRadius: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            border: '1px solid #f0f0f0', minWidth: 180, zIndex: 50, overflow: 'hidden',
          }}>
            <div style={{ padding: '8px 0' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', padding: '4px 14px 6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Profil
              </p>

              {/* Parent */}
              <button
                onClick={() => { setActiveKid(null); setOpen(false) }}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: !isPlayingAsKid ? 'rgba(15,118,110,0.06)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                }}
              >
                {parentAvatar
                  ? <img src={parentAvatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 22 }}>👤</span>
                }
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{parentName}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>Moj profil</div>
                </div>
                {!isPlayingAsKid && <span style={{ marginLeft: 'auto', fontSize: 14, color: '#0f766e' }}>✓</span>}
              </button>

              {kids.length > 0 && (
                <div style={{ borderTop: '1px solid #f3f4f6', marginTop: 4, paddingTop: 4 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', padding: '4px 14px 6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Otroci
                  </p>
                  {kids.map(kid => (
                    <button
                      key={kid.id}
                      onClick={() => { setActiveKid(kid); setOpen(false) }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '8px 14px',
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: activeKidId === kid.id ? 'rgba(15,118,110,0.06)' : 'transparent',
                        border: 'none', cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{kid.avatar_emoji}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{kid.name}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>Otroški profil</div>
                      </div>
                      {activeKidId === kid.id && <span style={{ marginLeft: 'auto', fontSize: 14, color: '#0f766e' }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ borderTop: '1px solid #f3f4f6', marginTop: 4, padding: '6px 14px' }}>
                <a href="/profile#kids" style={{ fontSize: 12, color: '#0f766e', fontWeight: 600, textDecoration: 'none' }}>
                  + Dodaj otroka
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
