'use client'

import Leaderboard, { type Player } from '@/components/Leaderboard'
import { ScoringSummary } from '@/components/GameRules'

export default function LeaderboardClient({
  tabs,
  rowsByTab,
  defaultTab,
}: {
  tabs: string[]
  rowsByTab: Record<string, Player[]>
  defaultTab: string
}) {
  return (
    <div className="flex flex-col gap-5">
      <Leaderboard tabs={tabs} rowsByTab={rowsByTab} defaultTab={defaultTab} />
      <ScoringSummary />
    </div>
  )
}
