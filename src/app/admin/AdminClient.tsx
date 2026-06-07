'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { RefreshCw, Link2, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

type Match = {
  id: string
  home_team: string
  away_team: string
  match_time_utc: string
  stage: string
  is_knockout: boolean
  status: string
  api_football_id: number | null
  actual_score_home: number | null
  actual_score_away: number | null
}

const CRON_SECRET = 'fp2026secret'

export default function AdminClient({ matches }: { matches: Match[] }) {
  const supabase = createClient()

  const [mapLog, setMapLog] = useState<string[] | null>(null)
  const [syncLog, setSyncLog] = useState<string | null>(null)
  const [loading, setLoading] = useState<'map' | 'sync' | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [scoreHome, setScoreHome] = useState('')
  const [scoreAway, setScoreAway] = useState('')
  const [advancing, setAdvancing] = useState('')
  const [saving, setSaving] = useState(false)

  const [localMatches, setLocalMatches] = useState(matches)

  // Korak 1: map-fixtures
  const runMapFixtures = async () => {
    setLoading('map')
    setMapLog(null)
    try {
      const res = await fetch('/api/cron/map-fixtures', {
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      })
      const data = await res.json()
      const lines = [
        ...(data.mapped ?? []).map((l: string) => `✅ ${l}`),
        ...(data.unmapped ?? []).map((l: string) => `⚠️ ${l}`),
        data.message ?? '',
      ].filter(Boolean)
      setMapLog(lines)
      // Osveži seznam (api_football_id se je posodobil)
      const { data: fresh } = await supabase.from('matches').select('*').order('match_time_utc')
      if (fresh) setLocalMatches(fresh as Match[])
    } catch (e) {
      setMapLog([`❌ Napaka: ${e}`])
    }
    setLoading(null)
  }

  // Korak 2: sync-results
  const runSync = async () => {
    setLoading('sync')
    setSyncLog(null)
    try {
      const res = await fetch('/api/cron/sync-results', {
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      })
      const data = await res.json()
      setSyncLog(
        `Posodobljeno: ${data.updated ?? 0} | Preskočeno: ${data.skipped ?? 0} | Napake: ${data.errors?.length ?? 0}`
      )
      const { data: fresh } = await supabase.from('matches').select('*').order('match_time_utc')
      if (fresh) setLocalMatches(fresh as Match[])
    } catch (e) {
      setSyncLog(`❌ Napaka: ${e}`)
    }
    setLoading(null)
  }

  // Ročni vnos rezultata
  const saveResult = async (match: Match) => {
    if (scoreHome === '' || scoreAway === '') return
    setSaving(true)

    const homeGoals = parseInt(scoreHome)
    const awayGoals = parseInt(scoreAway)
    const isDraw = homeGoals === awayGoals

    const { error } = await supabase
      .from('matches')
      .update({
        status: 'Finished',
        actual_score_home: homeGoals,
        actual_score_away: awayGoals,
        actual_advancing_team: (match.is_knockout && isDraw && advancing) ? advancing : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', match.id)

    if (error) {
      alert('Napaka: ' + error.message)
    } else {
      setLocalMatches(prev => prev.map(m =>
        m.id === match.id
          ? { ...m, status: 'Finished', actual_score_home: homeGoals, actual_score_away: awayGoals }
          : m
      ))
      setEditingId(null)
    }
    setSaving(false)
  }

  const startEdit = (match: Match) => {
    setEditingId(match.id)
    setScoreHome(match.actual_score_home?.toString() ?? '')
    setScoreAway(match.actual_score_away?.toString() ?? '')
    setAdvancing(match.actual_advancing_team ?? '')
  }

  const pendingMatches = localMatches.filter(m => m.status !== 'Finished')
  const finishedMatches = localMatches.filter(m => m.status === 'Finished')
  const mappedCount = localMatches.filter(m => m.api_football_id !== null).length

  return (
    <div className="space-y-6">

      {/* Korak 1: Map Fixtures */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Link2 size={18} className="text-blue-600" />
              Korak 1 — Poveži tekme z API-Football
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Enkratna akcija. Mapirano: {mappedCount}/{localMatches.length} tekem.
            </p>
          </div>
          {mappedCount === localMatches.length && (
            <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
          )}
        </div>
        <button
          onClick={runMapFixtures}
          disabled={loading === 'map'}
          className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <RefreshCw size={16} className={loading === 'map' ? 'animate-spin' : ''} />
          {loading === 'map' ? 'Mapiram...' : 'Poženi mapiranje'}
        </button>
        {mapLog && (
          <div className="mt-3 bg-gray-50 rounded-lg p-3 text-xs font-mono space-y-1 max-h-48 overflow-y-auto">
            {mapLog.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        )}
      </div>

      {/* Korak 2: Sync Results */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="mb-3">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <RefreshCw size={18} className="text-emerald-600" />
            Korak 2 — Sync rezultatov (avtomatsko vsakih 30 min)
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Pridobi zaključene tekme iz API-Football in izračuna točke.
          </p>
        </div>
        <button
          onClick={runSync}
          disabled={loading === 'sync'}
          className="w-full bg-emerald-600 text-white font-medium py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <RefreshCw size={16} className={loading === 'sync' ? 'animate-spin' : ''} />
          {loading === 'sync' ? 'Syncam...' : 'Ročni sync zdaj'}
        </button>
        {syncLog && (
          <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm font-mono">{syncLog}</div>
        )}
      </div>

      {/* Korak 3: Ročni vnos rezultatov */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-900 mb-1">
          Korak 3 — Ročni vnos rezultatov (fallback)
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Zaključenih: {finishedMatches.length} | Čaka: {pendingMatches.length}
        </p>

        <div className="space-y-2">
          {pendingMatches.map(match => {
            const isEditing = editingId === match.id
            const isDraw = scoreHome !== '' && scoreAway !== '' && scoreHome === scoreAway
            const date = new Date(match.match_time_utc).toLocaleDateString('sl-SI', {
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
            })

            return (
              <div key={match.id} className="border border-gray-100 rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => isEditing ? setEditingId(null) : startEdit(match)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {match.home_team} vs {match.away_team}
                    </p>
                    <p className="text-xs text-gray-400">{date} · {match.stage}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!match.api_football_id && (
                      <AlertCircle size={14} className="text-orange-400" title="Ni API ID" />
                    )}
                    {isEditing ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {isEditing && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 text-right text-sm font-medium text-gray-700 truncate">
                        {match.home_team}
                      </div>
                      <input
                        type="number" min="0"
                        value={scoreHome}
                        onChange={e => setScoreHome(e.target.value)}
                        className="w-14 h-10 text-center text-lg font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <span className="text-gray-400 font-bold">:</span>
                      <input
                        type="number" min="0"
                        value={scoreAway}
                        onChange={e => setScoreAway(e.target.value)}
                        className="w-14 h-10 text-center text-lg font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <div className="flex-1 text-left text-sm font-medium text-gray-700 truncate">
                        {match.away_team}
                      </div>
                    </div>

                    {match.is_knockout && isDraw && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-2">Izločilni boj — remi po 90 min, kdo napreduje?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setAdvancing(match.home_team)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${advancing === match.home_team ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-700'}`}
                          >
                            {match.home_team}
                          </button>
                          <button
                            onClick={() => setAdvancing(match.away_team)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${advancing === match.away_team ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-700'}`}
                          >
                            {match.away_team}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium"
                      >
                        Prekliči
                      </button>
                      <button
                        onClick={() => saveResult(match)}
                        disabled={saving || scoreHome === '' || scoreAway === ''}
                        className="flex-1 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                      >
                        {saving ? 'Shranjujem...' : 'Shrani rezultat'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
