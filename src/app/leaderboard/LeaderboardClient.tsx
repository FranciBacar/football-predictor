'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trophy, Medal } from 'lucide-react'
import Image from 'next/image'

type LeaderboardEntry = {
  user_id: string
  name: string
  avatar_url: string | null
  avatar_emoji?: string | null
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
  globalData, kidsData, groups, currentUserId, initialGroupId,
}: {
  globalData: LeaderboardEntry[]
  kidsData: LeaderboardEntry[]
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

    // Fetch točke + vse člane vzporedno
    const [{ data: rpcData }, { data: members }] = await Promise.all([
      supabase.rpc('get_group_leaderboard', { p_group_id: groupId }),
      supabase
        .from('group_members')
        .select('users(id, name, avatar_url, avatar_emoji)')
        .eq('group_id', groupId),
    ])

    const pointsMap = new Map((rpcData ?? []).map((e: any) => [e.user_id, e]))
    const allMembers = (members ?? []).map((m: any) => m.users).filter(Boolean)

    const merged: LeaderboardEntry[] = allMembers.map((u: any) => {
      const entry = pointsMap.get(u.id)
      return entry ?? {
        user_id: u.id,
        name: u.name,
        avatar_url: u.avatar_url,
        avatar_emoji: u.avatar_emoji,
        total_points: 0,
        exact_predictions: 0,
        rank: 0,
      }
    })
    merged.sort((a, b) => b.total_points - a.total_points || b.exact_predictions - a.exact_predictions || a.name.localeCompare(b.name))
    merged.forEach((e, i) => { e.rank = i + 1 })

    setGroupData(prev => ({ ...prev, [groupId]: merged }))
    setLoading(false)
  }

  const handleTab = async (tabId: string) => {
    setActiveTab(tabId)
    if (tabId !== 'global' && tabId !== 'kids') await loadGroup(tabId)
  }

  useState(() => { if (initialTab !== 'global' && initialTab !== 'kids') loadGroup(initialTab) })

  const entries: LeaderboardEntry[] =
    activeTab === 'global' ? globalData :
    activeTab === 'kids' ? kidsData :
    (groupData[activeTab] ?? [])

  const tabStyle = (isActive: boolean) => isActive
    ? { background: 'linear-gradient(115deg, #0f766e 0%, #2dd4bf 100%)', color: '#ffffff' }
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
        {kidsData.length > 0 && (
          <button onClick={() => handleTab('kids')} className={tabClass(activeTab === 'kids')} style={tabStyle(activeTab === 'kids')}>
            👦 Otroci
          </button>
        )}
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
                  {(entry as any).avatar_emoji ? (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-2xl bg-gray-50 border border-gray-100">
                      {(entry as any).avatar_emoji}
                    </div>
                  ) : entry.avatar_url ? (
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
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <span>🎯 Točen rezultat (2:1 → 2:1)</span><span className="font-bold text-right">3 točke</span>
          <span>📐 Pravilen tip + zadetki ene ekipe (3:1 → 2:1)</span><span className="font-bold text-right">2 točki</span>
          <span>✅ Pravilen tip (zmagovalec ali remi)</span><span className="font-bold text-right">1 točka</span>
          <span>⚡ Od 1/8 finala naprej</span><span className="font-bold text-right">× 2 točke</span>
        </div>
        <p className="mt-3 text-xs text-gray-500">Točke vključujejo posebne napovedi: zmagovalec SP, strelec, MVP (+10 vsak) in zmagovalci skupin (+3 vsaka).</p>
      </div>
    </div>
  )
}
