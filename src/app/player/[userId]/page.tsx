/**
 * /player/[userId] — Pregled napovedi uporabnika
 *
 * Prikaže vse napovedi za zaključene tekme:
 * zeleno = točke, rdeče = 0 točk.
 * Dostopno vsem prijavljenim.
 */

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import Navbar from '@/components/Navbar'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTeam } from '@/lib/teamData'

export const dynamic = 'force-dynamic'

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

type QualityTone = 'hit' | 'diff' | 'zero'

function quality(
  predH: number, predA: number,
  actH: number, actA: number
): { text: string; tone: QualityTone } {
  const pd = predH - predA, ad = actH - actA
  if (predH === actH && predA === actA) return { text: 'točen rezultat', tone: 'hit' }
  if (pd === ad) return { text: ad === 0 ? 'pravilen remi' : 'pravilna razlika', tone: 'diff' }
  if (Math.sign(pd) === Math.sign(ad)) return { text: 'pravilen zmagovalec', tone: 'diff' }
  return { text: 'zgrešeno', tone: 'zero' }
}

const ptsWord = (n: number) => n === 1 ? 'točka' : n === 2 ? 'točki' : n === 3 || n === 4 ? 'točke' : 'točk'

export default async function PlayerHistoryPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Podatki o ciljnem uporabniku
  const { data: targetUser } = await admin
    .from('users')
    .select('id, name, avatar_url')
    .eq('id', userId)
    .single()

  if (!targetUser) {
    return (
      <div className="min-h-screen pb-20 md:pb-0 pt-0 md:pt-16" style={{ background: 'var(--page)' }}>
        <Navbar activePath="/leaderboard" />
        <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 16px', textAlign: 'center', color: '#9aa1ab' }}>
          Uporabnik ni najden.
        </div>
      </div>
    )
  }

  // 2. Napovedi tega uporabnika
  const { data: preds } = await admin
    .from('predictions')
    .select('pred_score_home, pred_score_away, pred_advancing_team, earned_points, match_id')
    .eq('user_id', userId)

  // 3. VSE zaključene tekme (ne samo tiste z napovedmi)
  const { data: finishedMatches } = await admin
    .from('matches')
    .select('id, home_team, away_team, actual_score_home, actual_score_away, actual_advancing_team, actual_penalty_home, actual_penalty_away, stage, match_time_utc, is_knockout, status')
    .eq('status', 'Finished')
    .order('match_time_utc', { ascending: true })

  // 4. Združi: tekme z napovedmi (pred = null če napovedi ni)
  const predMap = new Map((preds ?? []).map((p: any) => [p.match_id, p]))
  const combined = (finishedMatches ?? []).map(m => ({
    ...m,
    pred: (predMap.get(m.id) ?? null) as any,
  }))

  // 5. Statistike (samo tekme z napovedmi)
  const withPred = combined.filter(m => m.pred !== null)
  const totalPoints = withPred.reduce((s, m) => s + (m.pred.earned_points ?? 0), 0)
  const exactCount = withPred.filter(m =>
    m.pred.pred_score_home === m.actual_score_home &&
    m.pred.pred_score_away === m.actual_score_away
  ).length
  const scoredCount = withPred.filter(m => (m.pred.earned_points ?? 0) > 0).length

  // 6. Razvrsti po fazah
  const byStage: Record<string, typeof combined> = {}
  for (const m of combined) {
    const label = STAGE_LABELS[m.stage] ?? m.stage
    if (!byStage[label]) byStage[label] = []
    byStage[label].push(m)
  }
  const stageLabels = Object.keys(byStage).sort((a, b) => {
    const la = STAGE_LABELS[Object.keys(STAGE_LABELS).find(k => STAGE_LABELS[k] === a) ?? ''] ?? a
    const lb = STAGE_LABELS[Object.keys(STAGE_LABELS).find(k => STAGE_LABELS[k] === b) ?? ''] ?? b
    const ia = STAGE_ORDER.findIndex(s => STAGE_LABELS[s] === a)
    const ib = STAGE_ORDER.findIndex(s => STAGE_LABELS[s] === b)
    return (ia > -1 ? ia : 99) - (ib > -1 ? ib : 99)
  })

  // Initials za avatar
  const initials = (targetUser.name ?? '?').split(' ')
    .map((p: string) => (p[0] ?? '').toUpperCase()).join('').slice(0, 2) || '?'

  const isMe = user.id === userId

  return (
    <div className="min-h-screen pb-20 md:pb-0 pt-0 md:pt-16" style={{ background: 'var(--page)' }}>
      <Navbar activePath="/leaderboard" />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>

        {/* Nazaj */}
        <Link href="/leaderboard"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 600, color: '#6b7280',
            textDecoration: 'none', marginBottom: 20,
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Lestvica
        </Link>

        {/* Glava — avatar + ime + statistike */}
        <div style={{
          background: 'white', borderRadius: 20, border: '1px solid #ebeeec',
          boxShadow: '0 1px 2px rgba(16,24,40,0.03), 0 10px 26px rgba(16,24,40,0.05)',
          padding: '20px 20px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          {targetUser.avatar_url ? (
            <img src={targetUser.avatar_url} alt=""
              style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              background: isMe ? 'linear-gradient(140deg,#0f766e,#2dd4bf)' : '#eef1f0',
              color: isMe ? '#fff' : '#5b6470',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700,
            }}>
              {initials}
            </div>
          )}
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', color: '#15201d' }}>
              {targetUser.name}{isMe && <span style={{ fontSize: 12, fontWeight: 600, color: '#0f766e', marginLeft: 8 }}>ti</span>}
            </div>
            <div style={{ marginTop: 5, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>
                <b style={{ color: '#15201d', fontSize: 16, fontWeight: 800 }}>{totalPoints}</b> točk skupaj
              </span>
              <span style={{ fontSize: 13, color: '#6b7280' }}>
                <b style={{ color: '#15803d', fontWeight: 700 }}>{exactCount}</b> točnih rezultatov
              </span>
              <span style={{ fontSize: 13, color: '#6b7280' }}>
                <b style={{ color: '#0f766e', fontWeight: 700 }}>{scoredCount}</b> z točkami
              </span>
            </div>
          </div>
        </div>

        {combined.length === 0 && (
          <div style={{
            background: 'white', borderRadius: 16, border: '1px dashed #ebeeec',
            padding: '48px 24px', textAlign: 'center', color: '#9aa1ab', fontSize: 14,
          }}>
            Še ni zaključenih tekem z napovedmi.
          </div>
        )}

        {/* Napovedi po fazah */}
        {stageLabels.map(stageLabel => (
          <div key={stageLabel} style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.07em', color: '#9aa1ab', marginBottom: 8, paddingLeft: 4,
            }}>
              {stageLabel}
            </div>

            <div style={{
              background: 'white', borderRadius: 18, border: '1px solid #ebeeec',
              boxShadow: '0 1px 2px rgba(16,24,40,0.03), 0 8px 20px rgba(16,24,40,0.04)',
              overflow: 'hidden',
            }}>
              {byStage[stageLabel].map((m, idx) => {
                const pred = m.pred
                const homeTeam = getTeam(m.home_team)
                const awayTeam = getTeam(m.away_team)
                const isLast = idx === byStage[stageLabel].length - 1
                const hasAdv = !!m.actual_advancing_team

                // Brez napovedi — prikaži tekmo a brez točk
                if (!pred) {
                  return (
                    <div key={m.id} style={{
                      borderBottom: isLast ? 'none' : '1px solid #ebeeec',
                      padding: '13px 16px 13px 20px',
                      position: 'relative',
                      background: '#fafbfb',
                    }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#e5e7eb' }} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#9aa1ab', marginBottom: 4 }}>
                            <span>{homeTeam.flag} {m.home_team}</span>
                            <span style={{ color: '#d1d5db', margin: '0 6px' }}>vs</span>
                            <span>{awayTeam.flag} {m.away_team}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 10.5, color: '#c4cacc', fontWeight: 600 }}>
                              Rezultat: {m.actual_score_home}:{m.actual_score_away}
                              {hasAdv && ' po 90 min'}
                            </span>
                            {hasAdv && m.actual_penalty_home != null && (
                              <span style={{ fontSize: 10.5, color: '#c4cacc', fontWeight: 600 }}>
                                · penali: {m.actual_penalty_home}:{m.actual_penalty_away} · napreduje: {m.actual_advancing_team}
                              </span>
                            )}
                          </div>
                          <div style={{ marginTop: 3, fontSize: 11, color: '#d1d5db', fontWeight: 600 }}>
                            ni napovedi
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', color: '#d1d5db', fontSize: 13, fontWeight: 700 }}>—</div>
                      </div>
                    </div>
                  )
                }

                const q = quality(
                  pred.pred_score_home, pred.pred_score_away,
                  m.actual_score_home, m.actual_score_away
                )
                const pts = pred.earned_points ?? 0
                const predAdv = pred.pred_advancing_team
                const homeCode = m.home_team.slice(0, 3).toUpperCase()
                const awayCode = m.away_team.slice(0, 3).toUpperCase()
                const advCode = m.actual_advancing_team === m.home_team ? homeCode : awayCode
                const advTeamData = m.actual_advancing_team === m.home_team ? homeTeam : awayTeam
                const advCorrect = predAdv && advCode && predAdv === advCode
                const stripColor = pts > 0 ? (q.tone === 'hit' ? '#16a34a' : '#0f766e') : '#d1d5db'
                const penHome: number | null = m.actual_penalty_home ?? null
                const penAway: number | null = m.actual_penalty_away ?? null
                const hasPenScore = hasAdv && penHome !== null && penAway !== null

                return (
                  <div key={m.id} style={{
                    borderBottom: isLast ? 'none' : '1px solid #ebeeec',
                    padding: '13px 16px 13px 20px',
                    position: 'relative',
                    background: pts > 0 ? '#fff' : '#fafbfb',
                  }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: stripColor }} />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
                      <div>
                        {/* Ekipi */}
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#15201d', marginBottom: 6 }}>
                          <span>{homeTeam.flag} {m.home_team}</span>
                          <span style={{ color: '#c4cacc', margin: '0 6px' }}>vs</span>
                          <span>{awayTeam.flag} {m.away_team}</span>
                        </div>

                        {/* Napoved → Rezultat */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#b0b8c1' }}>Napoved</span>
                            <b style={{ fontSize: 15, fontWeight: 800, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                              {pred.pred_score_home} : {pred.pred_score_away}
                            </b>
                          </span>
                          <span style={{ color: '#d1d5db', fontSize: 12 }}>→</span>
                          <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#b0b8c1' }}>Rezultat</span>
                            <b style={{ fontSize: 15, fontWeight: 800, color: '#15201d', fontVariantNumeric: 'tabular-nums' }}>
                              {m.actual_score_home} : {m.actual_score_away}
                            </b>
                            {hasAdv && (
                              <span style={{
                                fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                                background: '#f3f4f6', color: '#9aa1ab', borderRadius: 4, padding: '1px 5px',
                              }}>po 90 min</span>
                            )}
                          </span>
                        </div>

                        {/* Penali blok */}
                        {hasAdv && (
                          <div style={{
                            marginTop: 7, padding: '7px 10px', borderRadius: 10,
                            background: '#f8f9fa', border: '1px solid #ebeeec',
                            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                          }}>
                            <span style={{
                              fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase',
                              letterSpacing: '0.06em', color: '#aab0b8',
                            }}>{hasPenScore ? 'Po penalih' : 'Po pod.'}</span>
                            {hasPenScore && (
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                                {penHome}:{penAway}
                              </span>
                            )}
                            <span style={{ color: '#d1d5db', fontSize: 11 }}>·</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                              {advTeamData.flag} {m.actual_advancing_team} napreduje
                            </span>
                            {predAdv && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                                background: advCorrect ? '#dcfce7' : '#fef3f2',
                                color: advCorrect ? '#15803d' : '#d92d20',
                                marginLeft: 2,
                              }}>
                                {advCorrect ? '✓ +bonus' : '✕ zgrešeno'}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Kakovost napovedi */}
                        <div style={{ marginTop: 6 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: q.tone === 'hit' ? '#15803d' : q.tone === 'diff' ? '#0f766e' : '#9aa1ab',
                          }}>
                            {q.tone === 'hit' ? '✓ ' : q.tone === 'zero' ? '✕ ' : '~ '}{q.text}
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                          fontSize: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                          letterSpacing: '-0.02em',
                          color: pts > 0 ? (q.tone === 'hit' ? '#15803d' : '#0f766e') : '#c2c7cd',
                        }}>
                          {pts > 0 ? `+${pts}` : '0'}
                        </div>
                        <div style={{ fontSize: 10.5, color: '#b0b8c1', fontWeight: 600 }}>
                          {ptsWord(pts)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
