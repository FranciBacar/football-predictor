'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Match = {
  id: string
  home_team: string
  away_team: string
  match_time_utc: string
  stage: string
  is_knockout: boolean
  status: 'Upcoming' | 'Locked' | 'In Progress' | 'Finished'
  actual_score_home: number | null
  actual_score_away: number | null
}

type Prediction = {
  id?: string
  match_id: string
  pred_score_home: number
  pred_score_away: number
  pred_advancing_team: string | null
}

export default function MatchesClient({ 
  matches, 
  initialPredictions, 
  userId 
}: { 
  matches: Match[], 
  initialPredictions: Prediction[], 
  userId: string 
}) {
  const supabase = createClient()
  
  // Stanje napovedi spremenimo v lookup objekt (key = match_id)
  const [predictions, setPredictions] = useState<Record<string, Prediction>>(() => {
    const acc: Record<string, Prediction> = {}
    initialPredictions.forEach(p => {
      acc[p.match_id] = p
    })
    return acc
  })

  const [savingId, setSavingId] = useState<string | null>(null)

  const handleScoreChange = (matchId: string, team: 'home' | 'away', value: string) => {
    const numValue = value === '' ? 0 : parseInt(value)
    if (isNaN(numValue) || numValue < 0) return

    setPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        match_id: matchId,
        pred_score_home: team === 'home' ? numValue : (prev[matchId]?.pred_score_home || 0),
        pred_score_away: team === 'away' ? numValue : (prev[matchId]?.pred_score_away || 0),
        pred_advancing_team: prev[matchId]?.pred_advancing_team || null
      }
    }))
  }

  const handleAdvancingChange = (matchId: string, teamName: string) => {
    setPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        pred_advancing_team: teamName
      }
    }))
  }

  const savePrediction = async (matchId: string) => {
    const pred = predictions[matchId]
    if (!pred) return

    setSavingId(matchId)
    
    // Upsert logika v Supabase
    const { error } = await supabase
      .from('predictions')
      .upsert({
        user_id: userId,
        match_id: matchId,
        pred_score_home: pred.pred_score_home,
        pred_score_away: pred.pred_score_away,
        pred_advancing_team: pred.pred_advancing_team,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, match_id' })

    if (error) {
      alert('Napaka pri shranjevanju: ' + error.message)
    }
    
    setTimeout(() => setSavingId(null), 500)
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => {
        const pred = predictions[match.id] || { pred_score_home: '', pred_score_away: '' }
        const isLocked = match.status !== 'Upcoming'
        
        // Ali gre za izločilne boje in je napovedan remi?
        const isDraw = pred.pred_score_home !== '' && pred.pred_score_home === pred.pred_score_away
        const needsAdvancingTeam = match.is_knockout && isDraw

        // Format datuma
        const matchDate = new Date(match.match_time_utc)
        const dateStr = matchDate.toLocaleDateString('sl-SI', { weekday: 'short', day: '2-digit', month: '2-digit' })
        const timeStr = matchDate.toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' })

        return (
          <div key={match.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 font-medium flex justify-between border-b border-gray-100">
              <span>{match.stage} • {dateStr} ob {timeStr}</span>
              <span className={isLocked ? 'text-red-500 font-bold' : 'text-green-600'}>
                {isLocked ? 'ZAKLENJENO' : 'ODPRTO'}
              </span>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 text-right font-semibold text-lg">{match.home_team}</div>
                
                <div className="px-4 flex items-center gap-2">
                  <input 
                    type="number" 
                    min="0"
                    disabled={isLocked}
                    value={pred.pred_score_home}
                    onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                    className="w-12 h-12 text-center text-xl font-bold bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className="text-gray-400 font-bold">:</span>
                  <input 
                    type="number" 
                    min="0"
                    disabled={isLocked}
                    value={pred.pred_score_away}
                    onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                    className="w-12 h-12 text-center text-xl font-bold bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>

                <div className="flex-1 text-left font-semibold text-lg">{match.away_team}</div>
              </div>

              {needsAdvancingTeam && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm">
                  <p className="text-blue-800 font-medium mb-2">Ker si napovedal remi v izločilnih bojih, kdo napreduje (po podaljških/penalih)?</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAdvancingChange(match.id, match.home_team)}
                      disabled={isLocked}
                      className={`flex-1 py-2 rounded-md font-medium transition-colors ${pred.pred_advancing_team === match.home_team ? 'bg-blue-600 text-white' : 'bg-white border border-blue-200 text-blue-700'}`}
                    >
                      {match.home_team}
                    </button>
                    <button 
                      onClick={() => handleAdvancingChange(match.id, match.away_team)}
                      disabled={isLocked}
                      className={`flex-1 py-2 rounded-md font-medium transition-colors ${pred.pred_advancing_team === match.away_team ? 'bg-blue-600 text-white' : 'bg-white border border-blue-200 text-blue-700'}`}
                    >
                      {match.away_team}
                    </button>
                  </div>
                </div>
              )}

              {!isLocked && (
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={() => savePrediction(match.id)}
                    disabled={savingId === match.id || pred.pred_score_home === '' || pred.pred_score_away === '' || (needsAdvancingTeam && !pred.pred_advancing_team)}
                    className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors"
                  >
                    {savingId === match.id ? 'Shranjujem...' : 'Shrani napoved'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}