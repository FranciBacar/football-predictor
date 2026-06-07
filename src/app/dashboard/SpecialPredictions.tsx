'use client'

import React, { useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { TEAM_DATA } from '@/lib/teamData'

// Zaklepanje: 11. junij 2026 ob 18:00 UTC (30 min pred prvo tekmo)
const LOCK_DATE = new Date('2026-06-11T18:00:00Z')

type SpecialPred = {
  prediction_type: string
  prediction_value: string
  earned_points: number
  correct_answer: string | null
}

const ALL_TEAMS = Object.keys(TEAM_DATA).sort()

// Skupinski zmagovalci — katera ekipa je v kateri skupini
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

function getTeamFlag(name: string) {
  return TEAM_DATA[name]?.flag ?? '🏳️'
}

function SelectInput({
  value, options, onChange, disabled, placeholder,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
  disabled: boolean
  placeholder: string
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: 10,
        border: value ? '1.5px solid #0f766e' : '1.5px solid #e5e7eb',
        background: disabled ? '#f9fafb' : '#fff',
        color: value ? '#1a1a1a' : '#9ca3af',
        fontSize: 14,
        fontWeight: value ? 600 : 400,
        cursor: disabled ? 'default' : 'pointer',
        outline: 'none',
        appearance: 'none',
        backgroundImage: disabled ? 'none' : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: 36,
      }}
    >
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt} value={opt}>
          {getTeamFlag(opt)} {opt}
        </option>
      ))}
    </select>
  )
}

function TextInput({
  value, onChange, disabled, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
  placeholder: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: 10,
        border: value ? '1.5px solid #0f766e' : '1.5px solid #e5e7eb',
        background: disabled ? '#f9fafb' : '#fff',
        color: '#1a1a1a',
        fontSize: 14,
        fontWeight: value ? 600 : 400,
        cursor: disabled ? 'default' : 'text',
        outline: 'none',
      }}
    />
  )
}

export default function SpecialPredictions({
  userId,
  initialPreds,
}: {
  userId: string
  initialPreds: SpecialPred[]
}) {
  const supabase = createClient()
  const isLocked = new Date() >= LOCK_DATE

  // Build initial state map
  const initMap = () => {
    const map: Record<string, string> = {}
    initialPreds.forEach(p => { map[p.prediction_type] = p.prediction_value })
    return map
  }
  const initPoints = () => {
    const map: Record<string, number> = {}
    initialPreds.forEach(p => { map[p.prediction_type] = p.earned_points })
    return map
  }
  const initCorrect = () => {
    const map: Record<string, string | null> = {}
    initialPreds.forEach(p => { map[p.prediction_type] = p.correct_answer })
    return map
  }

  const [values, setValues] = useState<Record<string, string>>(initMap)
  const [points, setPoints] = useState<Record<string, number>>(initPoints)
  const [correct, setCorrect] = useState<Record<string, string | null>>(initCorrect)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  const save = useCallback(async (type: string, value: string) => {
    if (!value.trim()) return
    setSaving(prev => ({ ...prev, [type]: true }))
    const { error } = await supabase
      .from('special_predictions')
      .upsert(
        { user_id: userId, prediction_type: type, prediction_value: value.trim(), updated_at: new Date().toISOString() },
        { onConflict: 'user_id,prediction_type' }
      )
    setSaving(prev => ({ ...prev, [type]: false }))
    if (!error) {
      setSaved(prev => ({ ...prev, [type]: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, [type]: false })), 2000)
    }
  }, [supabase, userId])

  const handleChange = (type: string, value: string) => {
    setValues(prev => ({ ...prev, [type]: value }))
    setSaved(prev => ({ ...prev, [type]: false }))
  }

  const correctAnswer = (type: string) => correct[type] ?? null
  const userPoints = (type: string) => points[type] ?? 0

  const renderSaveBtn = (type: string) => {
    const val = values[type]
    if (isLocked) return null
    if (!val) return null
    return (
      <button
        onClick={() => save(type, val)}
        disabled={saving[type]}
        style={{
          marginTop: 8,
          padding: '8px 18px',
          borderRadius: 8,
          background: saved[type] ? '#dcfce7' : 'linear-gradient(115deg, #0f766e 0%, #2dd4bf 100%)',
          color: saved[type] ? '#15803d' : '#fff',
          fontSize: 13,
          fontWeight: 600,
          border: 'none',
          cursor: saving[type] ? 'wait' : 'pointer',
        }}
      >
        {saving[type] ? 'Shranjujem...' : saved[type] ? '✓ Shranjeno' : 'Shrani'}
      </button>
    )
  }

  const renderResultBadge = (type: string) => {
    const ans = correctAnswer(type)
    if (!ans) return null
    const pts = userPoints(type)
    const isCorrect = pts > 0
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginTop: 6,
        padding: '6px 10px', borderRadius: 8,
        background: isCorrect ? '#dcfce7' : '#fef2f2',
        color: isCorrect ? '#15803d' : '#dc2626',
        fontSize: 13, fontWeight: 600,
      }}>
        {isCorrect ? '✅' : '❌'}
        <span>Pravilen odgovor: {ans}</span>
        {isCorrect && <span style={{ marginLeft: 'auto', background: '#15803d', color: '#fff', borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>+{pts} točk</span>}
      </div>
    )
  }

  const renderCard = (
    type: string,
    emoji: string,
    title: string,
    subtitle: string,
    pts: number,
    input: React.ReactElement
  ) => {
    const val = values[type]
    const hasResult = correctAnswer(type) !== null
    return (
      <div key={type} style={{
        background: '#fff', borderRadius: 14, padding: '16px 16px 14px',
        border: val ? '1.5px solid rgba(15,118,110,0.25)' : '1.5px solid #f0f0f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 18 }}>{emoji}</span> {title}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{subtitle}</div>
          </div>
          <div style={{
            padding: '3px 10px', borderRadius: 999,
            background: 'rgba(15,118,110,0.1)', color: '#0f766e',
            fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
          }}>
            +{pts} točk
          </div>
        </div>
        {input}
        {!isLocked && !hasResult && renderSaveBtn(type)}
        {renderResultBadge(type)}
        {isLocked && !hasResult && val && (
          <div style={{ marginTop: 6, fontSize: 12, color: '#9ca3af' }}>
            🔒 Napovedi zaklenjene — tvoja napoved: <strong>{val}</strong>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '0 16px 80px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(115deg, #0f766e 0%, #2dd4bf 100%)',
        borderRadius: 14, padding: '14px 16px', marginBottom: 20, color: '#fff',
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🔮 Posebne napovedi</div>
        <div style={{ fontSize: 13, opacity: 0.9 }}>
          {isLocked
            ? '🔒 Napovedi so zaklenjene (SP se je začel)'
            : 'Zaklene se 11. junija ob 20:00. Napovedi lahko do takrat spreminjaš.'}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, opacity: 0.95 }}>
          Možnih bonus točk: <strong>10 + 10 + 10 + (12 × 3) = 66 točk</strong>
        </div>
      </div>

      {/* SP napovedi */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        Napovedi SP (10 točk)
      </div>

      {renderCard('tournament_winner', '🏆', 'Zmagovalec SP', 'Katera ekipa bo zmagala Svetovno Prvenstvo 2026?', 10,
        <SelectInput
          value={values['tournament_winner'] ?? ''}
          options={ALL_TEAMS}
          onChange={v => handleChange('tournament_winner', v)}
          disabled={isLocked}
          placeholder="Izberi ekipo..."
        />
      )}

      {renderCard('top_scorer', '⚽', 'Najboljši strelec', 'Kdo bo dosegel največ zadetkov na SP?', 10,
        <TextInput
          value={values['top_scorer'] ?? ''}
          onChange={v => handleChange('top_scorer', v)}
          disabled={isLocked}
          placeholder="Ime in priimek (npr. Kylian Mbappé)"
        />
      )}

      {renderCard('best_player', '🌟', 'Najboljši igralec (MVP)', 'Kdo bo razglašen za najboljšega igralca SP?', 10,
        <TextInput
          value={values['best_player'] ?? ''}
          onChange={v => handleChange('best_player', v)}
          disabled={isLocked}
          placeholder="Ime in priimek (npr. Lionel Messi)"
        />
      )}

      {/* Skupinski zmagovalci */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '20px 0 12px' }}>
        Zmagovalci skupin (3 točke vsaka)
      </div>

      {Object.entries(GROUP_TEAMS).map(([group, teams]) =>
        renderCard(
          `group_winner_${group}`,
          '🥇',
          `Zmagovalec Skupine ${group}`,
          teams.map(t => `${getTeamFlag(t)} ${t}`).join(' · '),
          3,
          <SelectInput
            value={values[`group_winner_${group}`] ?? ''}
            options={teams}
            onChange={v => handleChange(`group_winner_${group}`, v)}
            disabled={isLocked}
            placeholder="Izberi ekipo..."
          />
        )
      )}
    </div>
  )
}
