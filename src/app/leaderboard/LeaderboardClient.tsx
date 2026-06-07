'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trophy, Medal } from 'lucide-react'
import Image from 'next/image'

type LeaderboardEntry = {
  user_id: string
  name: string
  avatar_url: string | null
  total_points: number
  exact_predictions: number
  rank: number
}

type Group = { id: string; name: string }

const MEDAL_COLORS: Record<number, string> = {
  1: 'text-yellow-500',
  2: 'text-gray-400',
  3: 'text-amber-600',
}

export default function LeaderboardClient({
  globalData, groups, currentUserId, initialGroupId,
}: {
  globalData: LeaderboardEntry[]
  groups: Group[]
  currentUserId: string
  initialGroupId: string | null
}) {
  const supabase = createClient()
  const initialTab = initialGroupId ? (groups.find(g => g.id === initialGroupId)?.id ?? 'global') : 'global'
  const [activeTab, setActiveTab] = useState<string>(initialTab)
  const [groupData, setGroupData] = useState<Record<string, LeaderboardEntry[]>>({})
  const [loading, setLoading] = useState(false)

  const loadGroup = async (groupId: string) => {
    if (groupData[groupId]) return
    setLoading(true)
    const { data, error } = await supabase.rpc('get_group_leaderboard', { p_group_id: groupId })
    if (!error && data) setGroupData(prev => ({ ...prev, [groupId]: data }))
    setLoading(false)
  }

  const handleTab = async (tabId: string) => {
    setActiveTab(tabId)
    if (tabId !== 'global') await loadGroup(tabId)
  }

  useState(() => { if (initialTab !== 'global') loadGroup(initialTab) })

  const entries: LeaderboardEntry[] = activeTab === 'global' ? globalData : (groupData[activeTab] ?? [])

  const tabStyle = (isActive: boolean) => isActive
    ? { background: 'var(--goodish-gradient)', color: 'white' }
    : {}

  const tabClass = (isActive: boolean) =>
    `whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-1.5 ${
      isActive ? 'shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
    }`

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        <button onClick={() => handleTab('global')} className={tabClass(activeTab === 'global')} style={tabStyle(activeTab === 'global')}>
          <Trophy size={14} />
          Globalna
        </button>
        {groups.map(group => (
          <button key={group.id} onClick={() => handleTab(group.id)} className={tabClass(activeTab === group.id)} style={tabStyle(activeTab === group.id)}>
            {group.name}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full" style={{ borderColor: 'var(--goodish-green)', borderTopColor: 'transparent' }} />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center bg-white border border-dashed border-gray-300 rounded-xl py-16 px-4 text-gray-500">
          <Trophy size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Lestvica je prazna</p>
          <p className="text-sm mt-1">Ko bodo tekme zaključene, se bodo točke pojavile tukaj.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-[3rem_1fr_5rem_5rem] items-center px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>#</span><span>Igralec</span><span className="text-right">Točne</span><span className="text-right">Točke</span>
          </div>
          {entries.map(entry => {
            const isMe = entry.user_id === currentUserId
            return (
              <div key={entry.user_id} className={`grid grid-cols-[3rem_1fr_5rem_5rem] items-center px-4 py-3 border-b border-gray-50 last:border-0 transition-colors ${isMe ? '' : 'hover:bg-gray-50'}`}
                style={isMe ? { background: 'var(--goodish-green-light)' } : {}}>
                <div className="flex items-center">
                  {entry.rank <= 3 ? (
                    <Medal size={20} className={MEDAL_COLORS[entry.rank] ?? 'text-gray-400'} />
                  ) : (
                    <span className="text-sm font-bold text-gray-500 w-5 text-center">{entry.rank}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 min-w-0">
                  {entry.avatar_url ? (
                    <Image src={entry.avatar_url} alt={entry.name} width={36} height={36} className="rounded-full flex-shrink-0 border border-gray-200" />
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm" style={{ background: 'var(--goodish-gradient)' }}>
                      {entry.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold truncate text-sm text-gray-900">
                      {entry.name}
                      {isMe && <span className="ml-1.5 text-xs font-normal text-gray-400">(ti)</span>}
                    </p>
                    <p className="text-xs text-gray-400">{entry.exact_predictions} točnih</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold" style={{ color: 'var(--goodish-green)' }}>{entry.exact_predictions}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold" style={isMe ? { color: 'var(--goodish-green)' } : { color: '#1a1a1a' }}>{entry.total_points}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Scoring rules */}
      <div className="rounded-xl p-4 text-sm text-gray-600 border" style={{ background: 'var(--goodish-green-light)', borderColor: '#99e6dd' }}>
        <p className="font-semibold mb-2" style={{ color: 'var(--goodish-green)' }}>Sistem točkovanja</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span>🎯 Točen rezultat</span><span className="font-bold text-right">3 točke</span>
          <span>📐 Pravilna razlika</span><span className="font-bold text-right">2 točki</span>
          <span>✅ Pravilen zmagovalec</span><span className="font-bold text-right">1 točka</span>
          <span>⚡ Bonus (izločilni)</span><span className="font-bold text-right">+1 točka</span>
        </div>
      </div>
    </div>
  )
}
