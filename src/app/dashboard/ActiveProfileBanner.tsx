'use client'

import { useProfile } from '@/context/ProfileContext'

export default function ActiveProfileBanner() {
  const { isPlayingAsKid, activeKidName, setActiveKid } = useProfile()

  if (!isPlayingAsKid) return null

  return (
    <div style={{
      background: 'linear-gradient(115deg, #0f766e 0%, #2dd4bf 100%)',
      borderRadius: 14, padding: '10px 16px', marginBottom: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>👦</span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
          Napoveduješ kot: {activeKidName}
        </span>
      </div>
      <button
        onClick={() => setActiveKid(null as any)}
        style={{
          color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600,
          background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 999,
          padding: '4px 12px', cursor: 'pointer',
        }}
      >
        Preklopiti nazaj
      </button>
    </div>
  )
}
