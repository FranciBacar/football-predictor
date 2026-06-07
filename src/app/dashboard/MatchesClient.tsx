'use client'

import { useState, useMemo } from 'react'
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

const STAGE_ORDER = [
  'Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F',
  'Group G', 'Group H', 'Group I', 'Group J', 'Group K', 'Group L',
  'Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Third place play-off', 'Final'
]

const STAGE_LABELS: Record<string, string> = {
  'Group A': 'Skupina A', 'Group B': 'Skupina B', 'Group C': 'Skupina C',
  'Group D': 'Skupina D', 'Group E': 'Skupina E', 'Group F': 'Skupina F',
  'Group G': 'Skupina G', 'Group H': 'Skupina H', 'Group I': 'Skupina I',
  'Group J': 'Skupina J', 'Group K': 'Skupina K', 'Group L': 'Skupina L',
  'Round of 32': 'Krog 32', 'Round of 16': 'Osmina finala',
  'Quarter-finals': 'Četrtfinale', 'Semi-finals': 'Polfinale',
  'Third place play-off': '3. mesto', 'Final': 'Finale',
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
  
  const [predictions, setPredictions] = useState<Record<string, Prediction>>(() => {
    const acc: Record<string, Prediction> = {}
    initialPredictions.forEach(p => {
      acc[p.match_id] = p
    })
    return acc
  })

  const [savingId, setSavingId] = useState<string | null>(null)

  const availableStages = useMemo(() => {
    const stages = Array.from(new Set(matches.map(m => m.stage)))
    return stages.sort((a, b) => {
      const indexA = STAGE_ORDER.indexOf(a)
      const indexB = STAGE_ORDER.indexOf(b)
      return (indexA > -1 ? indexA : 99) - (indexB > -1 ? indexB : 99)
    })
  }, [matches])

  const [activeStage, setActiveStage] = useState<string>(availableStages[0] || 'Group A')

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

  const filteredMatches = matches.filter(m => m.stage === activeStage)

  return (
    <div className="space-y-4">
      
      <div className="flex flex-wrap gap-2 mb-4">
        {availableStages.map(stage => (
          <button
            key={stage}
            onClick={() => setActiveStage(stage)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              activeStage === stage
                ? 'text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            style={activeStage === stage ? { background: 'var(--goodish-gradient)' } : {}}
          >
            {STAGE_LABELS[stage] ?? stage}
          </button>
        ))}
      </div>

      {filteredMatches.length === 0 ? (
        <div className="text-center bg-white border border-dashed border-gray-300 rounded-xl py-12 px-4 text-gray-500">
          V tej fazi trenutno ni tekem.
        </div>
      ) : (
        filteredMatches.map((match) => {
          const pred = predictions[match.id] || { pred_score_home: '', pred_score_away: '' }
          const isLocked = match.status !== 'Upcoming'
          
          const isDraw = pred.pred_score_home !== '' && pred.pred_score_home === pred.pred_score_away
          const needsAdvancingTeam = match.is_knockout && isDraw

          const matchDate = new Date(match.match_time_utc)
          const dateStr = matchDate.toLocaleDateString('sl-SI', { weekday: 'short', day: '2-digit', month: '2-digit' })
          const timeStr = matchDate.toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' })

          return (
            <div key={match.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 font-medium flex justify-between border-b border-gray-100">
                <span>{dateStr} ob {timeStr}</span>
                <span className={isLocked ? 'text-red-500 font-bold' : 'text-green-600'}>
                  {isLocked ? 'ZAKLENJENO' : 'ODPRTO'}
                </span>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1 text-right font-semibold text-lg md:text-xl">{match.home_team}</div>
                  
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

                  <div className="flex-1 text-left font-semibold text-lg md:text-xl">{match.away_team}</div>
                </div>

                {needsAdvancingTeam && (
                  <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: 'var(--goodish-green-light)', border: '1px solid #99e6dd' }}>
                    <p className="font-medium mb-2" style={{ color: 'var(--goodish-green)' }}>Ker si napovedal remi v izločilnih bojih, kdo napreduje?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAdvancingChange(match.id, match.home_team)}
                        disabled={isLocked}
                        className="flex-1 py-2 rounded-md font-medium transition-colors text-sm"
                        style={pred.pred_advancing_team === match.home_team
                          ? { background: 'var(--goodish-gradient)', color: 'white' }
                          : { background: 'white', border: '1px solid #99e6dd', color: 'var(--goodish-green)' }}
                      >
                        {match.home_team}
                      </button>
                      <button
                        onClick={() => handleAdvancingChange(match.id, match.away_team)}
                        disabled={isLocked}
                        className="flex-1 py-2 rounded-md font-medium transition-colors text-sm"
                        style={pred.pred_advancing_team === match.away_team
                          ? { background: 'var(--goodish-gradient)', color: 'white' }
                          : { background: 'white', border: '1px solid #99e6dd', color: 'var(--goodish-green)' }}
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
                      className="text-white px-6 py-2 rounded-lg font-medium text-sm disabled:opacity-50 transition-colors w-full md:w-auto" style={{ background: 'var(--goodish-gradient)' }}
                    >
                      {savingId === match.id ? 'Shranjujem...' : 'Shrani napoved'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}