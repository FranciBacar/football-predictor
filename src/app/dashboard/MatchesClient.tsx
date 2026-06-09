'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getTeam } from '@/lib/teamData'
import { hintFromSupabase } from '@/components/MatchHint'
import MatchCard from '@/components/MatchCard'
import type { Match as CardMatch } from '@/components/MatchCard'
import ScheduleView from '@/components/ScheduleView'
import type { Match as ScheduleMatch, Score } from '@/components/ScheduleRow'

const SHOW_HINTS = process.env.NEXT_PUBLIC_SHOW_HINTS === 'true'

// ── Types ──────────────────────────────────────────────────────
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
  actual_advancing_team: string | null
}

type Prediction = {
  id?: string
  match_id: string
  pred_score_home: number
  pred_score_away: number
  pred_advancing_team: string | null
  earned_points?: number
}

type LocalPred = { home: number; away: number; advancing: string | null }
type ToastMsg = { icon: string; text: string } | null

// ── Stage ordering & labels ────────────────────────────────────
const STAGE_ORDER = [
  'Group A','Group B','Group C','Group D','Group E','Group F',
  'Group G','Group H','Group I','Group J','Group K','Group L',
  'Round of 32','Round of 16','Quarter-finals','Semi-finals','Third place play-off','Final',
]
const STAGE_LABELS: Record<string, string> = {
  'Group A':'Skupina A','Group B':'Skupina B','Group C':'Skupina C',
  'Group D':'Skupina D','Group E':'Skupina E','Group F':'Skupina F',
  'Group G':'Skupina G','Group H':'Skupina H','Group I':'Skupina I',
  'Group J':'Skupina J','Group K':'Skupina K','Group L':'Skupina L',
  'Round of 32':'Krog 32','Round of 16':'Osmina finala',
  'Quarter-finals':'Četrtfinale','Semi-finals':'Polfinale',
  'Third place play-off':'3. mesto','Final':'Finale',
}

// ── Helpers ────────────────────────────────────────────────────
function fmtDate(utc: string): string {
  const d = new Date(utc)
  const days = ['ned.','pon.','tor.','sre.','čet.','pet.','sob.']
  const day = days[d.getDay()]
  const dd = String(d.getDate()).padStart(2,'0')
  const mm = String(d.getMonth()+1).padStart(2,'0')
  const hh = String(d.getHours()).padStart(2,'0')
  const min = String(d.getMinutes()).padStart(2,'0')
  return `${day}, ${dd}. ${mm}. ob ${hh}:${min}`
}

// ── Adapter: Supabase Match → ScheduleRow Match ────────────────
function toScheduleMatch(
  m: Match,
  savedPred: Prediction | null,
  hint: any,
): ScheduleMatch {
  const homeTeam = getTeam(m.home_team)
  const awayTeam = getTeam(m.away_team)

  let status: ScheduleMatch['status']
  if (m.status === 'Finished') status = 'finished'
  else if (m.status === 'Locked' || m.status === 'In Progress') status = 'locked'
  else status = 'open'

  const hintData =
    hint && SHOW_HINTS && status === 'open'
      ? hintFromSupabase(hint, m.home_team, m.away_team)
      : null

  return {
    id: m.id,
    stage: STAGE_LABELS[m.stage] ?? m.stage,
    kickoffUtc: new Date(m.match_time_utc).getTime(),
    home: { code: m.home_team.slice(0, 3).toUpperCase(), name: m.home_team, flag: homeTeam.flag },
    away: { code: m.away_team.slice(0, 3).toUpperCase(), name: m.away_team, flag: awayTeam.flag },
    isKnockout: m.is_knockout,
    status,
    actual:
      m.actual_score_home !== null && m.actual_score_away !== null
        ? { home: m.actual_score_home, away: m.actual_score_away }
        : null,
    earned: savedPred?.earned_points ?? null,
    hint: hintData,
  }
}

// ── Adapter: Supabase Match → CardMatch ───────────────────────
function toCardMatch(m: Match, savedPred: Prediction | null, hint: any): CardMatch {
  const home = getTeam(m.home_team)
  const away = getTeam(m.away_team)
  const status: CardMatch['status'] =
    m.status === 'Finished' ? 'finished' :
    (m.status === 'Locked' || m.status === 'In Progress') ? 'locked' : 'open'
  return {
    id: m.id,
    whenLabel: fmtDate(m.match_time_utc),
    home: { code: m.home_team.slice(0, 3).toUpperCase(), name: m.home_team, flag: home.flag },
    away: { code: m.away_team.slice(0, 3).toUpperCase(), name: m.away_team, flag: away.flag },
    isKnockout: m.is_knockout,
    status,
    actual:
      m.actual_score_home !== null && m.actual_score_away !== null
        ? { home: m.actual_score_home, away: m.actual_score_away }
        : null,
    earned: savedPred?.earned_points ?? null,
    hint: SHOW_HINTS && status === 'open' && hint
      ? hintFromSupabase(hint, m.home_team, m.away_team) : null,
  }
}

// ── Toast ──────────────────────────────────────────────────────
function Toast({ msg }: { msg: ToastMsg }) {
  return (
    <div style={{
      position:'fixed', left:'50%', bottom:96,
      transform: msg ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(20px)',
      background:'#1f2937', color:'#fff', padding:'11px 18px', borderRadius:999,
      fontSize:13, fontWeight:600, zIndex:200, whiteSpace:'nowrap',
      boxShadow:'0 10px 30px rgba(0,0,0,0.25)',
      opacity: msg ? 1 : 0, pointerEvents:'none',
      transition:'opacity .25s, transform .25s',
      display:'flex', alignItems:'center', gap:8,
      fontFamily:'var(--font)',
    }}>
      {msg?.icon && <span style={{ color:'var(--teal-mint)', fontWeight:800 }}>{msg.icon}</span>}
      {msg?.text}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function MatchesClient({
  matches, initialPredictions, userId,
}: {
  matches: Match[]
  initialPredictions: Prediction[]
  userId: string
}) {
  const supabase = createClient()

  // Saved predictions keyed by match_id
  const [saved, setSaved] = useState<Record<string, Prediction>>(() => {
    const acc: Record<string, Prediction> = {}
    initialPredictions.forEach(p => { acc[p.match_id] = p })
    return acc
  })

  // Local (potentially dirty) state keyed by match_id (skupinski pogled)
  const [local, setLocal] = useState<Record<string, LocalPred>>(() => {
    const acc: Record<string, LocalPred> = {}
    initialPredictions.forEach(p => {
      acc[p.match_id] = {
        home: p.pred_score_home,
        away: p.pred_score_away,
        advancing: p.pred_advancing_team ?? null,
      }
    })
    matches.forEach(m => {
      if (!acc[m.id]) acc[m.id] = { home: 0, away: 0, advancing: null }
    })
    return acc
  })

  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastMsg>(null)
  const [hints, setHints] = useState<Record<string, any>>({})
  const [mode, setMode] = useState<'groups' | 'days'>('days')

  // Fetch hints
  useEffect(() => {
    if (!SHOW_HINTS) return
    const matchIds = matches.map(m => m.id)
    supabase
      .from('match_hints')
      .select('*')
      .in('match_id', matchIds)
      .then(({ data }) => {
        const map: Record<string, any> = {}
        for (const h of data ?? []) map[h.match_id] = h
        setHints(map)
      })
  }, [matches.map(m => m.id).join(',')])

  const showToast = useCallback((msg: ToastMsg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }, [])

  // Stage tabs
  const availableStages = useMemo(() => {
    const stages = Array.from(new Set(matches.map(m => m.stage)))
    return stages.sort((a, b) => {
      const ia = STAGE_ORDER.indexOf(a), ib = STAGE_ORDER.indexOf(b)
      return (ia > -1 ? ia : 99) - (ib > -1 ? ib : 99)
    })
  }, [matches])

  const [activeStage, setActiveStage] = useState(availableStages[0] ?? 'Group A')

  const filteredMatches = useMemo(
    () => matches.filter(m => m.stage === activeStage),
    [matches, activeStage]
  )

  // Število nenapovedanih odprtih tekem (za značko)
  const openUnpredicted = useMemo(
    () => matches.filter(m => m.status === 'Upcoming' && !saved[m.id]).length,
    [matches, saved]
  )

  // Napovedi za ScheduleView (Record<match_id, Score>)
  const schedPredictions = useMemo<Record<string, Score>>(() => {
    const out: Record<string, Score> = {}
    Object.entries(saved).forEach(([id, p]) => {
      out[id] = {
        home: p.pred_score_home,
        away: p.pred_score_away,
        advancing: p.pred_advancing_team ?? undefined,
      }
    })
    return out
  }, [saved])

  // Tekme za ScheduleView
  const schedMatches = useMemo<ScheduleMatch[]>(
    () => matches.map(m => toScheduleMatch(m, saved[m.id] ?? null, hints[m.id])),
    [matches, saved, hints]
  )

  // Shranjevanje v skupinskem pogledu
  const handleSave = async (matchId: string) => {
    const pred = local[matchId]
    if (!pred || saving) return
    setSaving(matchId)

    const { error } = await supabase.from('predictions').upsert({
      user_id: userId,
      match_id: matchId,
      pred_score_home: pred.home,
      pred_score_away: pred.away,
      pred_advancing_team: pred.advancing,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id, match_id' })

    if (error) {
      showToast({ icon: '❌', text: 'Napaka pri shranjevanju' })
    } else {
      setSaved(prev => ({
        ...prev,
        [matchId]: {
          match_id: matchId,
          pred_score_home: pred.home,
          pred_score_away: pred.away,
          pred_advancing_team: pred.advancing,
          earned_points: prev[matchId]?.earned_points ?? 0,
        }
      }))
      showToast({ icon: '✓', text: 'Napoved shranjena' })
    }
    setSaving(null)
  }

  // Shranjevanje v "Po dnevih" pogledu
  const handleScheduleSave = useCallback(async (matchId: string, score: Score) => {
    const { error } = await supabase.from('predictions').upsert({
      user_id: userId,
      match_id: matchId,
      pred_score_home: score.home,
      pred_score_away: score.away,
      pred_advancing_team: score.advancing ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id, match_id' })

    if (error) {
      showToast({ icon: '❌', text: 'Napaka pri shranjevanju' })
    } else {
      setSaved(prev => ({
        ...prev,
        [matchId]: {
          match_id: matchId,
          pred_score_home: score.home,
          pred_score_away: score.away,
          pred_advancing_team: score.advancing ?? null,
          earned_points: prev[matchId]?.earned_points ?? 0,
        }
      }))
      setLocal(prev => ({
        ...prev,
        [matchId]: { home: score.home, away: score.away, advancing: score.advancing ?? null },
      }))
      showToast({ icon: '✓', text: 'Napoved shranjena' })
    }
  }, [supabase, userId, showToast])

  return (
    <div style={{ fontFamily: 'var(--font)' }}>

      {/* ── Mode switcher — segmentni kontrol ────────────────── */}
      <div style={{ padding:'0 16px 12px' }}>
        <div style={{ display:'flex', gap:4, background:'#eef2f1', borderRadius:13, padding:4 }}>
          <button
            onClick={() => setMode('days')}
            style={{
              flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              padding:'9px 0', borderRadius:10, border:'none', cursor:'pointer',
              fontFamily:'var(--font)', fontSize:13, fontWeight:600,
              transition:'background .18s, color .18s, box-shadow .18s',
              background: mode === 'days' ? '#fff' : 'transparent',
              color: mode === 'days' ? '#0f766e' : '#6b7280',
              boxShadow: mode === 'days' ? '0 1px 3px rgba(16,24,40,0.10)' : 'none',
            }}>
            Po dnevih
            {openUnpredicted > 0 && (
              <span style={{
                display:'inline-flex', alignItems:'center', justifyContent:'center',
                minWidth:17, height:17, borderRadius:999, padding:'0 4px',
                fontSize:10, fontWeight:700,
                background: mode === 'days' ? '#e6faf8' : '#dfe4e3',
                color: mode === 'days' ? '#0f766e' : '#5b6470',
              }}>
                {openUnpredicted}
              </span>
            )}
          </button>
          <button
            onClick={() => setMode('groups')}
            style={{
              flex:1, padding:'9px 0', borderRadius:10, border:'none', cursor:'pointer',
              fontFamily:'var(--font)', fontSize:13, fontWeight:600,
              transition:'background .18s, color .18s, box-shadow .18s',
              background: mode === 'groups' ? '#fff' : 'transparent',
              color: mode === 'groups' ? '#0f766e' : '#6b7280',
              boxShadow: mode === 'groups' ? '0 1px 3px rgba(16,24,40,0.10)' : 'none',
            }}>
            Po skupinah
          </button>
        </div>
      </div>

      {/* ── Po dnevih ─────────────────────────────────────────── */}
      {mode === 'days' ? (
        <ScheduleView
          matches={schedMatches}
          predictions={schedPredictions}
          onSave={handleScheduleSave}
        />
      ) : (
        <>
          {/* ── Stage selector — vodoravni drsnik (varianta A) ── */}
          <div style={{
            position:'relative', padding:'6px 0 10px',
            maskImage:'linear-gradient(90deg, black 0%, black 90%, transparent 100%)',
            WebkitMaskImage:'linear-gradient(90deg, black 0%, black 90%, transparent 100%)',
          }}>
            <div style={{
              display:'flex', gap:8, overflowX:'auto', padding:'2px 16px 4px',
              scrollbarWidth:'none', msOverflowStyle:'none',
            }}
            className="hide-scrollbar">
              {availableStages.map(stage => {
                const active = stage === activeStage
                return (
                  <button key={stage}
                    onClick={() => setActiveStage(stage)}
                    style={{
                      flexShrink:0,
                      border: active ? '1px solid #0f766e' : '1px solid #e6e9e8',
                      background: active ? '#0f766e' : '#fff',
                      color: active ? '#fff' : '#374151',
                      fontFamily:'var(--font)', fontSize:13, fontWeight:600,
                      padding:'8px 15px', borderRadius:10, cursor:'pointer',
                      whiteSpace:'nowrap', letterSpacing:'-0.01em',
                      transition:'background .15s, color .15s, border-color .15s',
                    }}>
                    {STAGE_LABELS[stage] ?? stage}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Match cards ──────────────────────────────────── */}
          {filteredMatches.length === 0 ? (
            <div style={{
              margin:'0 16px', padding:'48px 16px', textAlign:'center',
              border:'1px dashed var(--line)', borderRadius:20, color:'var(--muted)', fontSize:14,
            }}>
              V tej fazi trenutno ni tekem.
            </div>
          ) : (
            <div className="flex flex-col gap-3 px-4">
              {filteredMatches.map(match => {
                const lp = local[match.id] ?? { home: 0, away: 0, advancing: null }
                const sp = saved[match.id] ?? null
                return (
                  <MatchCard
                    key={match.id}
                    match={toCardMatch(match, sp, hints[match.id])}
                    pred={{ home: lp.home, away: lp.away, advancing: lp.advancing ?? undefined }}
                    saved={sp ? { home: sp.pred_score_home, away: sp.pred_score_away, advancing: sp.pred_advancing_team ?? undefined } : null}
                    onChange={p => setLocal(prev => ({ ...prev, [match.id]: { home: p.home, away: p.away, advancing: p.advancing ?? null } }))}
                    onSave={() => handleSave(match.id)}
                  />
                )
              })}
            </div>
          )}
        </>
      )}

      <Toast msg={toast} />
    </div>
  )
}
