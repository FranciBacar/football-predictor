'use client'

import { useState } from 'react'

interface MatchCardProps {
  match: {
    id: string
    competition: string
    home_team: string
    away_team: string
    home_flag: string
    away_flag: string
    time: string
    is_knockout: boolean
    status: 'open' | 'locked'
  }
}

export default function MatchCard({ match }: MatchCardProps) {
  const [homeScore, setHomeScore] = useState<string>('')
  const [awayScore, setAwayScore] = useState<string>('')
  const [advancingTeam, setAdvancingTeam] = useState<string | null>(null)

  const isTie = homeScore !== '' && awayScore !== '' && homeScore === awayScore
  const showKnockoutBox = match.is_knockout && isTie

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden mb-4">
      {/* Header */}
      <div className="px-4 py-3 flex justify-between items-center border-b border-gray-50">
        <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          {match.competition}
        </div>
        <div className="flex gap-2">
          {match.is_knockout && (
            <span className="bg-pink-50 text-pink-600 px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              Izločilni
            </span>
          )}
          {match.status === 'open' ? (
            <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-xs font-semibold">
              Odprto
            </span>
          ) : (
            <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Zaklenjeno
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          {/* Home Team */}
          <div className="flex flex-col gap-1 w-1/3">
            <span className="text-2xl">{match.home_flag}</span>
            <span className="font-bold text-gray-900 text-lg">{match.home_team}</span>
          </div>

          {/* Scores */}
          <div className="flex items-center gap-2 w-1/3 justify-center">
            <input
              type="number"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              disabled={match.status === 'locked'}
              className="w-14 h-12 text-center text-xl font-bold border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
            />
            <span className="text-gray-500 font-bold">:</span>
            <input
              type="number"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              disabled={match.status === 'locked'}
              className="w-14 h-12 text-center text-xl font-bold border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-end gap-1 w-1/3">
            <span className="text-2xl">{match.away_flag}</span>
            <span className="font-bold text-gray-900 text-lg">{match.away_team}</span>
          </div>
        </div>

        {/* Knockout Conditional Box */}
        {showKnockoutBox && (
          <div className="mt-4 bg-pink-50/50 border border-pink-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
            <p className="text-pink-800 text-sm font-medium mb-3 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              Napovedan remi — kdo napreduje?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setAdvancingTeam('home')}
                className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-2 font-medium transition-colors ${
                  advancingTeam === 'home' 
                    ? 'bg-white border-pink-500 text-pink-700 shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-700 hover:border-pink-300'
                }`}
              >
                {match.home_flag} {match.home_team}
              </button>
              <button
                onClick={() => setAdvancingTeam('away')}
                className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-2 font-medium transition-colors ${
                  advancingTeam === 'away' 
                    ? 'bg-white border-pink-500 text-pink-700 shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-700 hover:border-pink-300'
                }`}
              >
                {match.away_flag} {match.away_team}
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-4 flex items-center gap-1.5 text-gray-500 text-xs font-medium">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          {match.time}
        </div>
      </div>
    </div>
  )
}