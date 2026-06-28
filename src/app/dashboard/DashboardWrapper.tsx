'use client'

import { useState, useEffect } from 'react'
import { useProfile } from '@/context/ProfileContext'
import { createClient } from '@/utils/supabase/client'
import MatchesClient from './MatchesClient'
import SpecialPredictions from './SpecialPredictions'
import ActiveProfileBanner from './ActiveProfileBanner'
import GroupScoredBanner from '@/components/GroupScoredBanner'

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
