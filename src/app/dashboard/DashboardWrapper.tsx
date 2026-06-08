'use client'

import { useProfile } from '@/context/ProfileContext'
import MatchesClient from './MatchesClient'
import SpecialPredictions from './SpecialPredictions'
import ActiveProfileBanner from './ActiveProfileBanner'

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

  return (
    <>
      <ActiveProfileBanner />
      {activeTab === 'napovedi' ? (
        <MatchesClient
          matches={matches}
          initialPredictions={initialPredictions}
          userId={effectiveUserId}
        />
      ) : (
        <SpecialPredictions
          userId={effectiveUserId}
          initialPreds={specialPreds}
        />
      )}
    </>
  )
}
