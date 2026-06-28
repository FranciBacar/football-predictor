'use client'

import { useState, useEffect } from 'react'
import { useProfile } from '@/context/ProfileContext'
import { createClient } from '@/utils/supabase/client'
import MatchesClient from './MatchesClient'
import SpecialPredictions from './SpecialPredictions'
import ActiveProfileBanner from './ActiveProfileBanner'

// Prikaži do 29. jun. 2026 23:59 UTC (24h)
const BANNER_KEY = 'group_scored_banner_v1'
const BANNER_EXPIRES = new Date('2026-06-29T21:59:00Z')

function GroupScoredBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (new Date() >= BANNER_EXPIRES) return
    if (localStorage.getItem(BANNER_KEY) === 'dismissed') return
    setVisible(true)
  }, [])

  if (!visible) return null

  const dismiss = () => {
    localStorage.setItem(BANNER_KEY, 'dismissed')
    setVisible(false)
  }

  return (
    <>
      <style>{`
        .group-banner-wrap {
          position: fixed; bottom: 72px; left: 0; right: 0; z-index: 90;
          padding: 0 12px; pointer-events: none;
        }
        @media (min-width: 768px) {
          .group-banner-wrap {
            bottom: auto; top: 64px; padding: 0 24px;
          }
        }
      `}</style>
    <div className="group-banner-wrap">
      <div style={{
        maxWidth: 640, margin: '0 auto',
        background: 'linear-gradient(135deg, #0f766e 0%, #0c5f58 100%)',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(15,118,110,0.35)',
        display: 'flex', alignItems: 'center', gap: 12,
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
            flexShrink: 0, padding: '7px 12px', borderRadius: 9,
            background: 'rgba(255,255,255,0.18)', color: '#fff',
            fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
          }}
        >
          Preveri →
        </a>
        <button
          onClick={dismiss}
          style={{
            flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.6)', fontSize: 18, lineHeight: 1, padding: '2px 4px',
          }}
          aria-label="Zapri"
        >×</button>
      </div>
    </div>
    </>
  )
}

type Props = {
  parentUserId: string
  matches: any[]
  initialPredictions: any[]
  specialPreds: any[]
  activeTab: 'napovedi' | 'posebne'
}

export default function DashboardWrapper({
  parentUserId, matches, initialPredictions, specialPreds, activeTab,
}: Props) {
  const { activeKidId } = useProfile()
  const effectiveUserId = activeKidId ?? parentUserId

  const [predictions, setPredictions] = useState(initialPredictions)
  const [kidSpecialPreds, setKidSpecialPreds] = useState(specialPreds)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeKidId) {
      // Vrni se na starševske napovedi
      setPredictions(initialPredictions)
      setKidSpecialPreds(specialPreds)
      return
    }

    // Fetchaj otrokove napovedi
    setLoading(true)
    const supabase = createClient()
    Promise.all([
      supabase.from('predictions').select('*').eq('user_id', activeKidId),
      supabase.from('special_predictions').select('*').eq('user_id', activeKidId),
    ]).then(([{ data: preds }, { data: special }]) => {
      setPredictions(preds ?? [])
      setKidSpecialPreds(special ?? [])
      setLoading(false)
    })
  }, [activeKidId])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '4px solid #e5e7eb', borderTopColor: '#0f766e',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <>
      <GroupScoredBanner />
      <ActiveProfileBanner />
      {activeTab === 'napovedi' ? (
        <MatchesClient
          key={effectiveUserId}
          matches={matches}
          initialPredictions={predictions}
          userId={effectiveUserId}
        />
      ) : (
        <SpecialPredictions
          key={effectiveUserId}
          userId={effectiveUserId}
          initialPreds={kidSpecialPreds}
        />
      )}
    </>
  )
}
