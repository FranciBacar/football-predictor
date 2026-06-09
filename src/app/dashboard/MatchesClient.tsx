'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getTeam, hexAlpha } from '@/lib/teamData'
import MatchHint, { hintFromSupabase } from '@/components/MatchHint'
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

function ptLabel(pts: number): string {
  if (pts === 1) return '+1 točka'
  if (pts === 2) return '+2 točki'
  if (pts === 3 || pts === 4) return `+${pts} točke`
  return '0 točk'
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

// ── Stepper ────────────────────────────────────────────────────
function Stepper({ value, editable, onChange }: {
  value: number
  editable: boolean
  onChange?: (v: number) => void
}) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
      <div style={{
        width:50, height:52, borderRadius:14,
        background: editable ? 'var(--teal-light)' : '#f3f4f6',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:26, fontWeight:700, color: editable ? 'var(--teal)' : '#9aa1ab',
        fontVariantNumeric:'tabular-nums', letterSpacing:'-0.02em',
        border: editable ? '1.5px solid rgba(15,118,110,0.18)' : '1.5px solid transparent',
      }}>
        {value}
      </div>
      {editable && (
        <div style={{ display:'flex', gap:6 }}>
          {([[-1,'−'],[1,'+']] as [number,string][]).map(([delta, label]) => (
            <button key={label}
              disabled={delta < 0 ? value <= 0 : value >= 19}
              onClick={() => onChange?.(value + delta)}
              style={{
                width:30, height:26, borderRadius:8, border:'1px solid var(--line)',
                background:'#fff', color:'var(--teal)', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:16, fontWeight:700, lineHeight:1, padding:0,
                opacity: (delta < 0 && value <= 0) || (delta > 0 && value >= 19) ? 0.35 : 1,
                fontFamily:'var(--font)',
              }}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Team display ───────────────────────────────────────────────
function TeamDisplay({ name }: { name: string }) {
  const t = getTeam(name)
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:7, textAlign:'center' }}>
      <div style={{
        width:46, height:46, borderRadius:13,
        background: hexAlpha(t.color, 0.12),
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:26, lineHeight:1,
        boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.05)',
      }}>
        {t.flag}
      </div>
      <div style={{
        fontSize:12.5, fontWeight:600, lineHeight:1.2, letterSpacing:'-0.01em',
        maxWidth:92,
      }}>
        {name}
      </div>
    </div>
  )
}

// ── Match Card ─────────────────────────────────────────────────
function MatchCard({
  match, pred, savedPred, onPredChange, onSave, hint,
}: {
  match: Match
  pred: LocalPred
  savedPred: Prediction | null
  onPredChange: (p: LocalPred) => void
  onSave: () => void
  hint?: any
}) {
  const open = match.status === 'Upcoming'
  const locked = match.status === 'Locked' || match.status === 'In Progress'
  const finished = match.status === 'Finished'

  const isDraw = pred.home === pred.away
  const needsAdvancing = match.is_knockout && isDraw
  const dirty = !savedPred
    || savedPred.pred_score_home !== pred.home
    || savedPred.pred_score_away !== pred.away
    || savedPred.pred_advancing_team !== pred.advancing
  const canSave = open && dirty && (!needsAdvancing || !!pred.advancing)

  const displayHome = finished && match.actual_score_home !== null ? match.actual_score_home : pred.home
  const displayAway = finished && match.actual_score_away !== null ? match.actual_score_away : pred.away

  const earnedPts = savedPred?.earned_points ?? 0

  const sbClass = open
    ? { bg:'#e7f6ed', color:'var(--green)', ledBg:'var(--green)', label:'Odprto' }
    : locked
    ? { bg:'#fde8e8', color:'var(--red)', ledBg:'var(--red)', label:'Zaklenjeno' }
    : { bg:'#eef0f2', color:'#475467', ledBg:'#98a2b3', label:'Končano' }

  return (
    <div style={{
      background:'var(--card)', margin:'0 16px 12px',
      borderRadius:20, border:'1px solid var(--line)',
      boxShadow:'0 1px 2px rgba(16,24,40,0.04), 0 8px 24px rgba(16,24,40,0.05)',
      overflow:'hidden',
    }}>
      {/* Header */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'11px 16px', borderBottom:'1px solid var(--line)',
        fontSize:12, color:'var(--muted)',
      }}>
        <span style={{ fontWeight:500, letterSpacing:'-0.01em' }}>{fmtDate(match.match_time_utc)}</span>
        <span style={{
          fontSize:10.5, fontWeight:650, letterSpacing:'0.04em',
          padding:'4px 9px', borderRadius:999, textTransform:'uppercase',
          display:'inline-flex', alignItems:'center', gap:5,
          background:sbClass.bg, color:sbClass.color,
        }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:sbClass.ledBg, display:'inline-block' }} />
          {sbClass.label}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding:'16px 14px' }}>
        {/* Match row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:6 }}>
          <TeamDisplay name={match.home_team} />
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Stepper value={displayHome} editable={open}
              onChange={v => onPredChange({ ...pred, home:v })} />
            <span style={{ fontSize:22, fontWeight:700, color:'#cbd2d9' }}>:</span>
            <Stepper value={displayAway} editable={open}
              onChange={v => onPredChange({ ...pred, away:v })} />
          </div>
          <TeamDisplay name={match.away_team} />
        </div>

        {/* Match hint */}
        {SHOW_HINTS && open && hint && (() => {
          const data = hintFromSupabase(hint, match.home_team, match.away_team)
          return data ? <MatchHint data={data} /> : null
        })()}

        {/* Knockout advancing selector */}
        {open && needsAdvancing && (
          <div style={{
            marginTop:14, padding:'13px 14px', borderRadius:14,
            background:'#ecfdf5', border:'1px solid #b9e7d4',
          }}>
            <div style={{ fontSize:12.5, color:'#065f46', fontWeight:600, lineHeight:1.4, display:'flex', gap:7 }}>
              <span>🟢</span>
              <span>Napovedal si remi v izločilnih bojih — kdo napreduje?</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:11 }}>
              {[match.home_team, match.away_team].map(team => {
                const t = getTeam(team)
                const selected = pred.advancing === team
                return (
                  <button key={team}
                    onClick={() => onPredChange({ ...pred, advancing: team })}
                    style={{
                      border: selected ? '1.5px solid var(--teal)' : '1.5px solid #cdeadd',
                      background: selected ? 'var(--teal-light)' : '#fff',
                      borderRadius:11, padding:'9px 8px', cursor:'pointer',
                      fontFamily:'var(--font)',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                      fontSize:12.5, fontWeight:600,
                      color: selected ? 'var(--teal)' : '#374151',
                    }}>
                    <span>{t.flag}</span>{team}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Finished result strip */}
        {finished && savedPred && (
          <div style={{
            marginTop:14, padding:'11px 14px', borderRadius:13,
            background:'#f7f9f9', border:'1px solid var(--line)',
            display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
          }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:8, minWidth:0 }}>
              <span style={{ fontSize:11.5, color:'var(--muted)', fontWeight:500, whiteSpace:'nowrap' }}>
                Tvoja napoved
              </span>
              <span style={{ fontSize:15, fontWeight:700, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>
                {savedPred.pred_score_home} : {savedPred.pred_score_away}
              </span>
            </div>
            <div style={{
              fontSize:12, fontWeight:700, padding:'6px 11px', borderRadius:999, whiteSpace:'nowrap',
              background: earnedPts > 0 ? 'var(--teal-light)' : '#f3f4f6',
              color: earnedPts > 0 ? 'var(--teal)' : '#9aa1ab',
            }}>
              {ptLabel(earnedPts)}
            </div>
          </div>
        )}

        {/* Save button */}
        {open && (
          <button
            disabled={!canSave}
            onClick={onSave}
            style={{
              marginTop:16, width:'100%', height:46, border:'none', borderRadius:13,
              background: !dirty ? '#e7f6ed' : 'var(--grad)',
              color: !dirty ? 'var(--green)' : '#fff',
              cursor: canSave ? 'pointer' : 'default',
              fontFamily:'var(--font)', fontSize:14.5, fontWeight:650, letterSpacing:'-0.01em',
              boxShadow: !dirty || !canSave ? 'none' : '0 6px 16px rgba(15,118,110,0.28)',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              opacity: needsAdvancing && !pred.advancing && dirty ? 0.75 : 1,
              transition:'all .15s',
            }}>
            {!dirty
              ? <><CheckIcon /> Napoved shranjena</>
              : needsAdvancing && !pred.advancing
              ? 'Izberi, kdo napreduje'
              : 'Shrani napoved'}
          </button>
        )}

        {locked && (
          <div style={{
            marginTop:16, width:'100%', height:46, borderRadius:13,
            background:'#f3f4f6', color:'#9aa1ab',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:14.5, fontWeight:650, fontFamily:'var(--font)', letterSpacing:'-0.01em',
          }}>
            🔒 Napovedi zaklenjene
          </div>
        )}
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
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

      {/* ── Mode switcher ─────────────────────────────────────── */}
      <div style={{ display:'flex', gap:6, padding:'0 16px 14px' }}>
        <button
          onClick={() => setMode('groups')}
          style={{
            flex:'0 0 auto', padding:'7px 14px', borderRadius:999,
            fontSize:13, fontWeight:600, fontFamily:'var(--font)', cursor:'pointer',
            transition:'all .15s',
            border: mode === 'groups' ? 'none' : '1px solid var(--line)',
            background: mode === 'groups' ? 'var(--grad)' : '#fff',
            color: mode === 'groups' ? '#fff' : '#374151',
            boxShadow: mode === 'groups' ? '0 4px 14px rgba(15,118,110,0.30)' : 'none',
          }}>
          🏟️ Po skupinah
        </button>
        <button
          onClick={() => setMode('days')}
          style={{
            flex:'0 0 auto', display:'flex', alignItems:'center', gap:6,
            padding:'7px 14px', borderRadius:999,
            fontSize:13, fontWeight:600, fontFamily:'var(--font)', cursor:'pointer',
            transition:'all .15s',
            border: mode === 'days' ? 'none' : '1px solid var(--line)',
            background: mode === 'days' ? 'var(--grad)' : '#fff',
            color: mode === 'days' ? '#fff' : '#374151',
            boxShadow: mode === 'days' ? '0 4px 14px rgba(15,118,110,0.30)' : 'none',
          }}>
          🗓️ Po dnevih
          {openUnpredicted > 0 && (
            <span style={{
              display:'inline-flex', alignItems:'center', justifyContent:'center',
              minWidth:18, height:18, borderRadius:999, padding:'0 5px',
              fontSize:10, fontWeight:800,
              background: mode === 'days' ? 'rgba(255,255,255,0.3)' : '#f59e0b',
              color: '#fff',
            }}>
              {openUnpredicted}
            </span>
          )}
        </button>
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
          {/* ── Stage pill selector ──────────────────────────── */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, padding:'6px 16px 14px' }}>
            {availableStages.map(stage => {
              const active = stage === activeStage
              return (
                <button key={stage}
                  onClick={() => setActiveStage(stage)}
                  style={{
                    flex:'0 0 auto',
                    border: active ? 'none' : '1px solid var(--line)',
                    background: active ? 'var(--grad)' : '#fff',
                    color: active ? '#fff' : '#374151',
                    fontFamily:'var(--font)', fontSize:13, fontWeight:550,
                    padding:'8px 14px', borderRadius:999, cursor:'pointer',
                    whiteSpace:'nowrap', letterSpacing:'-0.01em',
                    boxShadow: active ? '0 4px 14px rgba(15,118,110,0.30)' : 'none',
                    transition:'all .15s',
                  }}>
                  {STAGE_LABELS[stage] ?? stage}
                </button>
              )
            })}
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
            filteredMatches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                pred={local[match.id] ?? { home:0, away:0, advancing:null }}
                savedPred={saved[match.id] ?? null}
                onPredChange={p => setLocal(prev => ({ ...prev, [match.id]: p }))}
                onSave={() => handleSave(match.id)}
                hint={hints[match.id]}
              />
            ))
          )}
        </>
      )}

      <Toast msg={toast} />
    </div>
  )
}
