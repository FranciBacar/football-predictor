'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { RefreshCw, Globe, AlertCircle, ChevronDown, ChevronUp, Users, Layers, Trophy, ShieldCheck, ShieldOff } from 'lucide-react'

// ── Posebne napovedi tipi ──────────────────────────────────────────
type SpecialPredAnswer = { value: string; count: number; correct_answer: string | null }
type SpecialPredSummary = { type: string; answers: SpecialPredAnswer[]; currentCorrect: string | null }

const GROUP_LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L']
const PRED_TYPE_META: Record<string, { label: string; icon: string; points: number }> = {
  tournament_winner: { label: 'Zmagovalec turnirja', icon: '🏆', points: 10 },
  top_scorer: { label: 'Najboljši strelec', icon: '⚽', points: 10 },
  best_player: { label: 'Najboljši igralec (MVP)', icon: '⭐', points: 10 },
  ...Object.fromEntries(GROUP_LETTERS.map(l => [
    `group_winner_${l}`, { label: `Skupina ${l}`, icon: '🏅', points: 3 }
  ])),
}
const PRED_TYPE_ORDER = [
  'tournament_winner', 'top_scorer', 'best_player',
  ...GROUP_LETTERS.map(l => `group_winner_${l}`),
]

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
  actual_advancing_team?: string | null
}

type AdminUser = {
  id: string
  name: string
  email: string
  avatar_url: string | null
  is_admin: boolean
  created_at: string
  last_sign_in_at: string | null
  predictions_count: number
}

type Group = {
  id: string
  name: string
  invite_code: string
  created_at: string
  creator_user_id: string
  users: { name: string }[] | { name: string } | null
  group_members: { count: number }[]
}

const CRON_SECRET = 'fp2026secret'

const TAB_STYLE_ACTIVE = {
  background: 'linear-gradient(115deg, #0f766e 0%, #2dd4bf 100%)',
  color: '#fff', fontWeight: 700, borderRadius: 10, padding: '8px 18px', fontSize: 14, border: 'none', cursor: 'pointer',
}
const TAB_STYLE_INACTIVE = {
  background: 'transparent', color: '#6b7280', fontWeight: 600,
  borderRadius: 10, padding: '8px 18px', fontSize: 14, border: 'none', cursor: 'pointer',
}

export default function AdminClient({
  matches, users, groups, specialPredsSummary, userName,
}: {
  matches: Match[]
  users: AdminUser[]
  groups: Group[]
  specialPredsSummary: SpecialPredSummary[]
  userName: string
}) {
  const supabase = createClient()
  const [tab, setTab] = useState<'tekme' | 'uporabniki' | 'skupine' | 'posebne'>('tekme')

  // ── Posebne napovedi state ─────────────────────────────────────
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {}
    for (const s of specialPredsSummary) {
      if (s.currentCorrect) {
        init[s.type] = s.answers
          .filter(a => a.value.toLowerCase().trim() === s.currentCorrect!.toLowerCase().trim())
          .map(a => a.value)
      } else {
        init[s.type] = []
      }
    }
    return init
  })
  const [canonicals, setCanonicals] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const s of specialPredsSummary) {
      init[s.type] = s.currentCorrect ?? ''
    }
    return init
  })
  const [scoring, setScoring] = useState<string | null>(null)
  const [scoreResults, setScoreResults] = useState<Record<string, { ok: boolean; message: string }>>({})

  const toggleAnswer = (type: string, value: string) => {
    setSelectedAnswers(prev => {
      const current = prev[type] ?? []
      const exists = current.includes(value)
      return { ...prev, [type]: exists ? current.filter(v => v !== value) : [...current, value] }
    })
  }

  const scoreType = async (type: string) => {
    const selected = selectedAnswers[type] ?? []
    const canonical = canonicals[type]?.trim()
    if (!canonical) {
      setScoreResults(prev => ({ ...prev, [type]: { ok: false, message: '⚠️ Vnesi kanonično ime' } }))
      return
    }
    setScoring(type)
    try {
      const res = await fetch('/api/admin/score-special', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prediction_type: type, correct_values: selected, canonical }),
      })
      const data = await res.json()
      if (data.ok) {
        setScoreResults(prev => ({ ...prev, [type]: { ok: true, message: `✅ ${data.awarded}/${data.total} napovedi · ${data.points} točk vsaka` } }))
      } else {
        setScoreResults(prev => ({ ...prev, [type]: { ok: false, message: `❌ ${data.error}` } }))
      }
    } catch (e) {
      setScoreResults(prev => ({ ...prev, [type]: { ok: false, message: `❌ Napaka: ${e}` } }))
    }
    setScoring(null)
  }

  // --- Match state ---
  const [syncLog, setSyncLog] = useState<string | null>(null)
  const [loading, setLoading] = useState<'sync' | 'fixtures' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [scoreHome, setScoreHome] = useState('')
  const [scoreAway, setScoreAway] = useState('')
  const [advancing, setAdvancing] = useState('')
  const [saving, setSaving] = useState(false)
  const [localMatches, setLocalMatches] = useState(matches)

  // --- Users state ---
  const [localUsers, setLocalUsers] = useState(users)
  const [togglingAdmin, setTogglingAdmin] = useState<string | null>(null)
  const [userSearch, setUserSearch] = useState('')

  const [fixtureLog, setFixtureLog] = useState<string | null>(null)

  const runFixtureSync = async () => {
    setLoading('fixtures')
    setFixtureLog(null)
    try {
      const res = await fetch('/api/admin/run-fixture-sync', { method: 'POST' })
      const data = await res.json()
      const noMatch = data.noMatch?.length ? `\nNi ujemanja: ${data.noMatch.join(', ')}` : ''
      const unmapped = data.unmapped?.length ? `\nNeznana imena (API): ${data.unmapped.join(', ')}` : ''
      setFixtureLog(`Posodobljeno: ${data.updated ?? 0} | Preskočeno: ${data.skipped ?? 0}${noMatch}${unmapped}`)
      const { data: fresh } = await supabase.from('matches').select('*').order('match_time_utc')
      if (fresh) setLocalMatches(fresh as Match[])
    } catch (e) {
      setFixtureLog(`❌ Napaka: ${e}`)
    }
    setLoading(null)
  }

  const runSync = async () => {
    setLoading('sync')
    setSyncLog(null)
    try {
      const res = await fetch('/api/admin/run-sync', { method: 'POST' })
      const data = await res.json()
      const noMatch = data.noMatch?.length ? `\nNi ujemanja: ${data.noMatch.join(', ')}` : ''
      const unmapped = data.unmapped?.length ? `\nNeznana imena (API): ${data.unmapped.join(', ')}` : ''
      const nullScore = data.nullScore?.length ? `\nBrez rezultata (API): ${data.nullScore.join(', ')}` : ''
      setSyncLog(`Posodobljeno: ${data.updated ?? 0} | Preskočeno: ${data.skipped ?? 0} | Napake: ${data.errors?.length ?? 0}${noMatch}${unmapped}${nullScore}`)
      const { data: fresh } = await supabase.from('matches').select('*').order('match_time_utc')
      if (fresh) setLocalMatches(fresh as Match[])
    } catch (e) {
      setSyncLog(`❌ Napaka: ${e}`)
    }
    setLoading(null)
  }

  const saveResult = async (match: Match) => {
    if (scoreHome === '' || scoreAway === '') return
    setSaving(true)
    const homeGoals = parseInt(scoreHome)
    const awayGoals = parseInt(scoreAway)
    const isDraw = homeGoals === awayGoals
    const { error } = await supabase.from('matches').update({
      status: 'Finished',
      actual_score_home: homeGoals,
      actual_score_away: awayGoals,
      actual_advancing_team: (match.is_knockout && isDraw && advancing) ? advancing : null,
      updated_at: new Date().toISOString(),
    }).eq('id', match.id)
    if (error) { alert('Napaka: ' + error.message) }
    else {
      setLocalMatches(prev => prev.map(m =>
        m.id === match.id ? { ...m, status: 'Finished', actual_score_home: homeGoals, actual_score_away: awayGoals } : m
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

  const toggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    setTogglingAdmin(userId)
    const { error } = await supabase
      .from('users')
      .update({ is_admin: !currentIsAdmin })
      .eq('id', userId)
    if (!error) {
      setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !currentIsAdmin } : u))
    }
    setTogglingAdmin(null)
  }

  const pendingMatches = localMatches.filter(m => m.status !== 'Finished')
  const finishedMatches = localMatches.filter(m => m.status === 'Finished')
  const filteredUsers = localUsers.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('sl-SI', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(115deg, #0f766e 0%, #2dd4bf 100%)',
        borderRadius: 18, padding: '20px 20px 16px', marginBottom: 16, color: '#fff',
      }}>
        <div style={{ fontSize: 22, marginBottom: 2 }}>🛡️</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>
          {userName ? `Živijo, ${userName}!` : 'Admin Panel'}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.85 }}>
          {localUsers.length} uporabnikov · {groups.length} skupin · {localMatches.length} tekem
        </p>
      </div>

      {/* Tabs */}
      <div style={{ background: '#f3f4f6', borderRadius: 12, padding: 4, display: 'flex', gap: 2, marginBottom: 16, flexWrap: 'wrap' }}>
        <button style={tab === 'tekme' ? TAB_STYLE_ACTIVE : TAB_STYLE_INACTIVE} onClick={() => setTab('tekme')}>
          ⚽ Tekme
        </button>
        <button style={tab === 'uporabniki' ? TAB_STYLE_ACTIVE : TAB_STYLE_INACTIVE} onClick={() => setTab('uporabniki')}>
          👤 Uporabniki
        </button>
        <button style={tab === 'skupine' ? TAB_STYLE_ACTIVE : TAB_STYLE_INACTIVE} onClick={() => setTab('skupine')}>
          🏅 Skupine
        </button>
        <button style={tab === 'posebne' ? TAB_STYLE_ACTIVE : TAB_STYLE_INACTIVE} onClick={() => setTab('posebne')}>
          🎯 Posebne
        </button>
      </div>

      {/* ── TAB: Tekme ── */}
      {tab === 'tekme' && (
        <div className="space-y-4">
          {/* Vir */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f0f0f0' }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={16} style={{ color: '#374151' }} /> Vir — football-data.org
            </h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
              Rezultati iz{' '}
              <a href="https://www.football-data.org" target="_blank" rel="noopener noreferrer"
                style={{ color: '#0f766e' }}>football-data.org</a>{' '}
              (zahteva <code>FOOTBALL_DATA_API_KEY</code>).
            </p>
          </div>

          {/* Sync */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f0f0f0' }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={16} style={{ color: '#059669' }} /> Sync rezultatov
            </h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>
              Zaključene: {finishedMatches.length} | Čaka: {pendingMatches.length}
            </p>
            <button onClick={runFixtureSync} disabled={!!loading}
              className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 mb-2">
              <RefreshCw size={16} className={loading === 'fixtures' ? 'animate-spin' : ''} />
              {loading === 'fixtures' ? 'Posodabljam tekmice...' : 'Sync tekmičev (TBD → ekipe)'}
            </button>
            {fixtureLog && <div style={{ marginBottom: 8, background: '#eff6ff', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontFamily: 'monospace' }}>{fixtureLog}</div>}
            <button onClick={runSync} disabled={!!loading}
              className="w-full bg-emerald-600 text-white font-medium py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <RefreshCw size={16} className={loading === 'sync' ? 'animate-spin' : ''} />
              {loading === 'sync' ? 'Syncam...' : 'Ročni sync zdaj'}
            </button>
            {syncLog && <div style={{ marginTop: 10, background: '#f9fafb', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontFamily: 'monospace' }}>{syncLog}</div>}
          </div>

          {/* Ročni vnos */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f0f0f0' }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>Ročni vnos rezultatov</h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>Fallback za tekme brez API podatkov</p>
            <div className="space-y-2">
              {pendingMatches.map(match => {
                const isEditing = editingId === match.id
                const isDraw = scoreHome !== '' && scoreAway !== '' && scoreHome === scoreAway
                const date = new Date(match.match_time_utc).toLocaleDateString('sl-SI', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                return (
                  <div key={match.id} style={{ border: '1px solid #f0f0f0', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer' }}
                      onClick={() => isEditing ? setEditingId(null) : startEdit(match)}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{match.home_team} vs {match.away_team}</p>
                        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{date} · {match.stage}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {!match.api_football_id && <AlertCircle size={14} style={{ color: '#f59e0b' }} />}
                        {isEditing ? <ChevronUp size={16} style={{ color: '#9ca3af' }} /> : <ChevronDown size={16} style={{ color: '#9ca3af' }} />}
                      </div>
                    </div>
                    {isEditing && (
                      <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f0f0f0', background: '#f9fafb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
                          <div style={{ flex: 1, textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#374151' }}>{match.home_team}</div>
                          <input type="number" min="0" value={scoreHome} onChange={e => setScoreHome(e.target.value)}
                            style={{ width: 52, height: 40, textAlign: 'center', fontSize: 18, fontWeight: 700, border: '1px solid #d1d5db', borderRadius: 8 }} />
                          <span style={{ color: '#9ca3af', fontWeight: 700 }}>:</span>
                          <input type="number" min="0" value={scoreAway} onChange={e => setScoreAway(e.target.value)}
                            style={{ width: 52, height: 40, textAlign: 'center', fontSize: 18, fontWeight: 700, border: '1px solid #d1d5db', borderRadius: 8 }} />
                          <div style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151' }}>{match.away_team}</div>
                        </div>
                        {match.is_knockout && isDraw && (
                          <div style={{ marginBottom: 12 }}>
                            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Kdo napreduje?</p>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {[match.home_team, match.away_team].map(team => (
                                <button key={team} onClick={() => setAdvancing(team)}
                                  style={{
                                    flex: 1, padding: '8px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid',
                                    ...(advancing === team
                                      ? { background: '#0f766e', borderColor: '#0f766e', color: '#fff' }
                                      : { background: '#fff', borderColor: '#e5e7eb', color: '#374151' }),
                                  }}>{team}</button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setEditingId(null)}
                            style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid #e5e7eb', color: '#6b7280', fontSize: 13, fontWeight: 600 }}>
                            Prekliči
                          </button>
                          <button onClick={() => saveResult(match)} disabled={saving || scoreHome === '' || scoreAway === ''}
                            style={{ flex: 1, padding: '8px', borderRadius: 8, background: '#111', color: '#fff', fontSize: 13, fontWeight: 600, opacity: (saving || scoreHome === '' || scoreAway === '') ? 0.5 : 1 }}>
                            {saving ? 'Shranjujem...' : 'Shrani'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              {pendingMatches.length === 0 && (
                <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14, padding: 20 }}>Vse tekme so zaključene ✅</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Uporabniki ── */}
      {tab === 'uporabniki' && (
        <div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'Skupaj', value: localUsers.length, icon: '👤' },
              { label: 'Adminov', value: localUsers.filter(u => u.is_admin).length, icon: '🛡️' },
              { label: 'Z napovedmi', value: localUsers.filter(u => u.predictions_count > 0).length, icon: '⚽' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '14px 12px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 20, marginBottom: 2 }}>{s.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <input
            type="text" placeholder="Išči po imenu ali e-pošti…"
            value={userSearch} onChange={e => setUserSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 16px', borderRadius: 12, border: '1px solid #e5e7eb',
              fontSize: 14, marginBottom: 12, boxSizing: 'border-box', outline: 'none',
            }}
          />

          {/* User list */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
            {filteredUsers.map((u, i) => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                borderBottom: i < filteredUsers.length - 1 ? '1px solid #f9fafb' : 'none',
              }}>
                {/* Avatar */}
                <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, overflow: 'hidden' }}>
                  {u.avatar_url
                    ? <img src={u.avatar_url} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(115deg, #0f766e 0%, #2dd4bf 100%)', color: '#fff', fontWeight: 700, fontSize: 16 }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                    {u.is_admin && <span style={{ fontSize: 10, background: 'rgba(15,118,110,0.1)', color: '#0f766e', borderRadius: 4, padding: '2px 6px', fontWeight: 700, whiteSpace: 'nowrap' }}>ADMIN</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>⚽ {u.predictions_count} napovedi</span>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>🕐 {formatDate(u.last_sign_in_at)}</span>
                  </div>
                </div>

                {/* Admin toggle */}
                <button
                  onClick={() => toggleAdmin(u.id, u.is_admin)}
                  disabled={togglingAdmin === u.id}
                  title={u.is_admin ? 'Odstrani admin pravice' : 'Dodeli admin pravice'}
                  style={{
                    padding: '6px 10px', borderRadius: 8, border: '1px solid', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
                    ...(u.is_admin
                      ? { background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }
                      : { background: 'rgba(15,118,110,0.06)', borderColor: 'rgba(15,118,110,0.2)', color: '#0f766e' }),
                    opacity: togglingAdmin === u.id ? 0.5 : 1,
                  }}
                >
                  {u.is_admin ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                </button>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14, padding: 24 }}>Ni rezultatov</p>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Posebne napovedi ── */}
      {tab === 'posebne' && (
        <div className="space-y-3">
          <div style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', border: '1px solid #f0f0f0' }}>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
              Označi pravilne odgovore → sistem dodeli točke vsem ujemajočim (brez razlike velikih/malih črk).
              Lahko označiš več variant (npr. "Harry Kane" in "Kane").
            </p>
          </div>

          {/* Glavni 3 tipi */}
          {(['tournament_winner', 'top_scorer', 'best_player'] as const).map(type => {
            const meta = PRED_TYPE_META[type]
            const summary = specialPredsSummary.find(s => s.type === type)
            const selected = selectedAnswers[type] ?? []
            const canonical = canonicals[type] ?? ''
            const result = scoreResults[type]
            return (
              <div key={type} style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #f0f0f0' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{meta.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>{meta.label}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{meta.points} točk za pravilen odgovor</div>
                    </div>
                  </div>
                  {summary?.currentCorrect && (
                    <span style={{ fontSize: 11, background: 'rgba(21,128,61,0.1)', color: '#15803d', borderRadius: 20, padding: '3px 10px', fontWeight: 700 }}>
                      ✓ {summary.currentCorrect}
                    </span>
                  )}
                </div>

                {/* Odgovori */}
                {!summary || summary.answers.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12, fontStyle: 'italic' }}>Ni oddanih napovedi</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    {summary.answers.map(a => {
                      const isSelected = selected.includes(a.value)
                      return (
                        <label key={a.value} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                          borderRadius: 10, cursor: 'pointer', border: '1px solid',
                          borderColor: isSelected ? '#0f766e' : '#f0f0f0',
                          background: isSelected ? 'rgba(15,118,110,0.05)' : '#f9fafb',
                        }}>
                          <input type="checkbox" checked={isSelected}
                            onChange={() => toggleAnswer(type, a.value)}
                            style={{ width: 16, height: 16, accentColor: '#0f766e' }} />
                          <span style={{ flex: 1, fontSize: 13, fontWeight: isSelected ? 700 : 500, color: '#1a1a1a' }}>
                            {a.value || <em style={{ color: '#9ca3af' }}>(prazno)</em>}
                          </span>
                          <span style={{ fontSize: 11, background: '#f0f0f0', borderRadius: 20, padding: '2px 8px', color: '#6b7280', fontWeight: 600 }}>
                            {a.count}×
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {/* Kanonično ime + shrani */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text" placeholder="Kanonično ime (npr. Harry Kane)"
                    value={canonical}
                    onChange={e => setCanonicals(prev => ({ ...prev, [type]: e.target.value }))}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, outline: 'none' }}
                  />
                  <button
                    onClick={() => scoreType(type)}
                    disabled={scoring === type}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: scoring === type ? '#e5e7eb' : 'linear-gradient(115deg, #0f766e, #2dd4bf)',
                      color: scoring === type ? '#9ca3af' : '#fff', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
                    }}>
                    {scoring === type ? '…' : 'Shrani'}
                  </button>
                </div>
                {result && (
                  <div style={{ marginTop: 8, fontSize: 12, color: result.ok ? '#15803d' : '#dc2626', fontWeight: 600 }}>
                    {result.message}
                  </div>
                )}
              </div>
            )
          })}

          {/* Skupina zmagovalci — 2-stolpčna mreža */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #f0f0f0' }}>
            <h3 style={{ fontWeight: 700, fontSize: 14, margin: '0 0 12px', color: '#1a1a1a' }}>🏅 Zmagovalci skupin (3 točke vsaka)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {GROUP_LETTERS.map(letter => {
                const type = `group_winner_${letter}`
                const meta = PRED_TYPE_META[type]
                const summary = specialPredsSummary.find(s => s.type === type)
                const selected = selectedAnswers[type] ?? []
                const canonical = canonicals[type] ?? ''
                const result = scoreResults[type]
                return (
                  <div key={type} style={{ borderRadius: 12, padding: 12, border: '1px solid #f0f0f0', background: '#f9fafb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#1a1a1a' }}>Skupina {letter}</span>
                      {summary?.currentCorrect && (
                        <span style={{ fontSize: 10, background: 'rgba(21,128,61,0.1)', color: '#15803d', borderRadius: 20, padding: '2px 7px', fontWeight: 700 }}>
                          ✓ {summary.currentCorrect}
                        </span>
                      )}
                    </div>

                    {!summary || summary.answers.length === 0 ? (
                      <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 8px', fontStyle: 'italic' }}>Ni napovedi</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                        {summary.answers.map(a => {
                          const isSelected = selected.includes(a.value)
                          return (
                            <label key={a.value} style={{
                              display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
                              borderRadius: 7, cursor: 'pointer', border: '1px solid',
                              borderColor: isSelected ? '#0f766e' : 'transparent',
                              background: isSelected ? 'rgba(15,118,110,0.06)' : 'transparent',
                            }}>
                              <input type="checkbox" checked={isSelected}
                                onChange={() => toggleAnswer(type, a.value)}
                                style={{ width: 13, height: 13, accentColor: '#0f766e' }} />
                              <span style={{ flex: 1, fontSize: 12, fontWeight: isSelected ? 700 : 500, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {a.value || <em style={{ color: '#9ca3af' }}>(prazno)</em>}
                              </span>
                              <span style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>{a.count}×</span>
                            </label>
                          )
                        })}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 5 }}>
                      <input
                        type="text" placeholder="Zmagovalec…"
                        value={canonical}
                        onChange={e => setCanonicals(prev => ({ ...prev, [type]: e.target.value }))}
                        style={{ flex: 1, padding: '6px 8px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 12, outline: 'none', minWidth: 0 }}
                      />
                      <button
                        onClick={() => scoreType(type)}
                        disabled={scoring === type}
                        style={{
                          padding: '6px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                          background: scoring === type ? '#e5e7eb' : '#0f766e',
                          color: scoring === type ? '#9ca3af' : '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
                        }}>
                        {scoring === type ? '…' : 'OK'}
                      </button>
                    </div>
                    {result && (
                      <div style={{ marginTop: 5, fontSize: 11, color: result.ok ? '#15803d' : '#dc2626', fontWeight: 600 }}>
                        {result.message}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Skupine ── */}
      {tab === 'skupine' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'Skupin skupaj', value: groups.length, icon: '🏅' },
              { label: 'Skupaj članov', value: groups.reduce((acc, g) => acc + (g.group_members?.[0]?.count ?? 0), 0), icon: '👥' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '14px 12px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 20, marginBottom: 2 }}>{s.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
            {groups.map((g, i) => {
              const memberCount = g.group_members?.[0]?.count ?? 0
              const createdAt = new Date(g.created_at).toLocaleDateString('sl-SI', { day: '2-digit', month: '2-digit', year: '2-digit' })
              return (
                <div key={g.id} style={{
                  padding: '14px 16px',
                  borderBottom: i < groups.length - 1 ? '1px solid #f9fafb' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>{g.name}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                        Ustvari: {(g.users as any)?.name ?? '?'} · {createdAt}
                      </div>
                    </div>
                    <div style={{
                      flexShrink: 0, marginLeft: 12, background: 'rgba(15,118,110,0.08)',
                      borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 700, color: '#0f766e',
                    }}>
                      👥 {memberCount}
                    </div>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>Koda:</span>
                    <code style={{ fontSize: 12, background: '#f3f4f6', padding: '2px 8px', borderRadius: 6, color: '#374151', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                      {g.invite_code}
                    </code>
                  </div>
                </div>
              )
            })}
            {groups.length === 0 && (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14, padding: 24 }}>Ni skupin</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
