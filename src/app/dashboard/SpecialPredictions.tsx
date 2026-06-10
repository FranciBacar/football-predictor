'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { TEAM_DATA } from '@/lib/teamData'
import SpecialPredictions, {
  type SpecialState,
  type TeamOption,
} from '@/components/SpecialPredictions'

// Zaklepanje: 11. junij 2026 ob 18:00 UTC
const LOCK_DATE = new Date('2026-06-11T18:00:00Z')

type SpecialPred = {
  prediction_type: string
  prediction_value: string
  earned_points: number
  correct_answer: string | null
}

// ── Skupinski zmagovalci ────────────────────────────────────────
const GROUP_TEAMS: Record<string, string[]> = {
  A: ['Mehika', 'Južna Koreja', 'Češka', 'Južna Afrika'],
  B: ['Kanada', 'Bosna in Hercegovina', 'Švica', 'Katar'],
  C: ['Brazilija', 'Maroko', 'Haiti', 'Škotska'],
  D: ['ZDA', 'Turčija', 'Avstralija', 'Paragvaj'],
  E: ['Nemčija', 'Ekvador', 'Slonokoščena obala', 'Curaçao'],
  F: ['Nizozemska', 'Japonska', 'Švedska', 'Tunizija'],
  G: ['Belgija', 'Egipt', 'Iran', 'Nova Zelandija'],
  H: ['Španija', 'Zelenortski otoki', 'Savdska Arabija', 'Urugvaj'],
  I: ['Francija', 'Senegal', 'Irak', 'Norveška'],
  J: ['Argentina', 'Alžirija', 'Avstrija', 'Jordanija'],
  K: ['Portugalska', 'DR Kongo', 'Uzbekistan', 'Kolumbija'],
  L: ['Anglija', 'Hrvaška', 'Gana', 'Panama'],
}

// ── Statični podatki za komponento ─────────────────────────────
const ALL_TEAMS = Object.keys(TEAM_DATA).sort()

const championOptions: TeamOption[] = ALL_TEAMS.map((name) => ({
  code: name,
  name,
  flag: TEAM_DATA[name]?.flag,
}))

const groups = Object.entries(GROUP_TEAMS).map(([id, teams]) => ({
  id,
  teams: teams.map((name): TeamOption => ({
    code: name,
    name,
    flag: TEAM_DATA[name]?.flag,
  })),
}))

const TOTAL_COUNT = 15 // 3 glavne + 12 skupin

// ── initialPreds → SpecialState ────────────────────────────────
function toSpecialState(preds: SpecialPred[]): SpecialState {
  const map: Record<string, string> = {}
  preds.forEach((p) => { map[p.prediction_type] = p.prediction_value })
  const groupWinners: Record<string, string> = {}
  Object.keys(GROUP_TEAMS).forEach((g) => {
    const v = map[`group_winner_${g}`]
    if (v) groupWinners[g] = v
  })
  return {
    champion: map['tournament_winner'] ?? '',
    topScorer: map['top_scorer'] ?? '',
    bestPlayer: map['best_player'] ?? '',
    groupWinners,
  }
}

function countSaved(state: SpecialState): number {
  let n = 0
  if (state.champion) n++
  if (state.topScorer) n++
  if (state.bestPlayer) n++
  Object.values(state.groupWinners).forEach((v) => { if (v) n++ })
  return n
}

// ── State → upsert rows ────────────────────────────────────────
function stateToRows(state: SpecialState, userId: string) {
  const rows: { user_id: string; prediction_type: string; prediction_value: string; updated_at: string }[] = []
  const now = new Date().toISOString()
  const push = (type: string, value: string | undefined) => {
    if (value) rows.push({ user_id: userId, prediction_type: type, prediction_value: value, updated_at: now })
  }
  push('tournament_winner', state.champion)
  push('top_scorer', state.topScorer)
  push('best_player', state.bestPlayer)
  Object.entries(state.groupWinners).forEach(([g, v]) => push(`group_winner_${g}`, v))
  return rows
}

// ── Toast ──────────────────────────────────────────────────────
function Toast({ msg }: { msg: string | null }) {
  return (
    <div style={{
      position: 'fixed', left: '50%', bottom: 96,
      transform: msg ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(20px)',
      background: '#1f2937', color: '#fff', padding: '11px 18px', borderRadius: 999,
      fontSize: 13, fontWeight: 600, zIndex: 200, whiteSpace: 'nowrap',
      boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
      opacity: msg ? 1 : 0, pointerEvents: 'none',
      transition: 'opacity .25s, transform .25s',
      fontFamily: 'var(--font)',
    }}>
      {msg}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────
export default function SpecialPredictionsContainer({
  userId,
  initialPreds,
}: {
  userId: string
  initialPreds: SpecialPred[]
}) {
  const supabase = createClient()
  const isLocked = new Date() >= LOCK_DATE

  const [localState, setLocalState] = useState<SpecialState>(() => toSpecialState(initialPreds))
  const [savedState, setSavedState] = useState<SpecialState>(() => toSpecialState(initialPreds))
  const [toast, setToast] = useState<string | null>(null)

  // Sync state when initialPreds changes after mount (profile switch timing issue:
  // component remounts before DashboardWrapper's effect updates kidSpecialPreds)
  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    const next = toSpecialState(initialPreds)
    setLocalState(next)
    setSavedState(next)
  }, [initialPreds])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  const handleChange = (next: SpecialState) => setLocalState(next)

  const handleSave = useCallback(async () => {
    const rows = stateToRows(localState, userId)
    if (rows.length === 0) return

    const { error } = await supabase
      .from('special_predictions')
      .upsert(rows, { onConflict: 'user_id,prediction_type' })

    if (error) {
      showToast('Napaka pri shranjevanju')
    } else {
      setSavedState(localState)
      showToast('✓ Napovedi shranjene')
    }
  }, [localState, userId, supabase])

  return (
    <div style={{ padding: '0 16px' }}>
      <SpecialPredictions
        championOptions={championOptions}
        groups={groups}
        value={localState}
        savedCount={countSaved(savedState)}
        totalCount={TOTAL_COUNT}
        lockLabel="11. junija ob 20:00"
        maxBonus={66}
        locked={isLocked}
        onChange={handleChange}
        onSave={handleSave}
      />
      <Toast msg={toast} />
    </div>
  )
}
