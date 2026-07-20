/**
 * StatistikeView — zaključna stran SP 2026
 * Podij za top 3 + statistične kartice
 */

type TopPlayer = {
  rank: number
  userId: string
  name: string
  points: number
  exact: number
  initials: string
  avatarUrl: string | null
  you: boolean
}

type StatPerson = {
  name: string
  initials: string
  avatarUrl: string | null
  you: boolean
  avg?: number
  exact?: number
  correct?: number
  special?: number
  count?: number
}

type StatMatch = {
  id: string
  homeTeam: string
  awayTeam: string
  stage: string
  isKnockout: boolean
  correct: number
  total: number
  pct: number | null
}

type Props = {
  top3: TopPlayer[]
  bestGroup: StatPerson | null
  bestKnockout: StatPerson | null
  mostExact: StatPerson | null          // največ točnih rezultatov (3/6 točk)
  mostCorrect: StatPerson | null        // največ pravilnih napovedi (> 0 točk)
  bestSpecial: StatPerson | null        // največ točk iz posebnih napovedi
  hardestMatch: StatMatch | null
  easiestMatch: StatMatch | null
  totalParticipants: number
  totalPredictions: number
  totalExact: number
  totalMatches: number
}

const MEDAL_BG = [
  'linear-gradient(140deg,#f3d989,#d8b24a)',
  'linear-gradient(140deg,#eef1f4,#bdc4cd)',
  'linear-gradient(140deg,#ecca9f,#c08a55)',
]
const MEDAL_TEXT = ['#7a5a12', '#5a626c', '#6e4824']
const PODIUM_HEIGHT = ['96px', '64px', '48px']

function Avatar({ initials, avatarUrl, you, size = 56 }: {
  initials: string; avatarUrl: string | null; you: boolean; size?: number
}) {
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt=""
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.3, fontWeight: 700,
      background: you ? 'linear-gradient(140deg,#0f766e,#2dd4bf)' : '#eef1f0',
      color: you ? '#fff' : '#5b6470',
    }}>
      {initials}
    </div>
  )
}

function StatCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1px solid #ebeeec',
      padding: '20px', display: 'flex', flexDirection: 'column', gap: 12,
      boxShadow: '0 1px 2px rgba(16,24,40,0.03), 0 6px 16px rgba(16,24,40,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9aa1ab' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function PersonStat({ person, value, sub }: { person: StatPerson; value: string; sub: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Avatar initials={person.initials} avatarUrl={person.avatarUrl} you={person.you} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#15201d', display: 'flex', alignItems: 'center', gap: 6 }}>
          {person.name}
          {person.you && <span style={{ fontSize: 11, fontWeight: 600, color: '#0f766e' }}>ti</span>}
        </div>
        <div style={{ fontSize: 12, color: '#9aa1ab', marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#0f766e', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value}
      </div>
    </div>
  )
}

function MatchStat({ match, label }: { match: StatMatch; label: string }) {
  const pct = match.pct !== null ? Math.round(match.pct * 100) : 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#15201d' }}>
          {match.homeTeam} – {match.awayTeam}
        </span>
        <span style={{ fontSize: 24, fontWeight: 800, color: '#0f766e', lineHeight: 1 }}>{pct}%</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 6, borderRadius: 99, background: '#f0f2f1', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: pct === 0 ? '#e5e7eb' : '#0f766e' }} />
        </div>
        <span style={{ fontSize: 11.5, color: '#9aa1ab', whiteSpace: 'nowrap' }}>
          {match.correct} / {match.total} pravilnih
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#b0b8c1' }}>{label}</div>
    </div>
  )
}

function Podium({ top3 }: { top3: TopPlayer[] }) {
  const order = [top3[1], top3[0], top3[2]].filter(Boolean)

  return (
    <div style={{
      background: '#fff', borderRadius: 20, border: '1px solid #ebeeec',
      padding: '28px 24px 0', marginBottom: 24,
      boxShadow: '0 1px 2px rgba(16,24,40,0.03), 0 12px 30px rgba(16,24,40,0.05)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9aa1ab', marginBottom: 6 }}>
          SP 2026 · Zaključna lestvica
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.025em', color: '#15201d' }}>
          Zmagovalci
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 0 }}>
        {order.map((p) => {
          if (!p) return null
          const ri = p.rank - 1
          const isFirst = p.rank === 1
          return (
            <div key={p.userId} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: MEDAL_BG[ri], color: MEDAL_TEXT[ri],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800,
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.6), 0 2px 4px rgba(16,24,40,0.12)',
              }}>{p.rank}</div>

              <Avatar initials={p.initials} avatarUrl={p.avatarUrl} you={p.you} size={isFirst ? 68 : 52} />

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: isFirst ? 15 : 13.5, fontWeight: 700, color: '#15201d', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  {p.name.split(' ')[0]}
                  {p.you && <span style={{ fontSize: 10, color: '#0f766e', fontWeight: 600 }}>ti</span>}
                </div>
                <div style={{ fontSize: isFirst ? 22 : 18, fontWeight: 800, color: isFirst ? '#0f766e' : '#15201d', letterSpacing: '-0.02em', lineHeight: 1.1, marginTop: 2 }}>
                  {p.points}
                </div>
                <div style={{ fontSize: 10.5, color: '#b0b8c1', marginTop: 1 }}>točk</div>
              </div>

              <div style={{
                width: '100%', height: PODIUM_HEIGHT[ri],
                background: isFirst ? 'linear-gradient(180deg,#e9f7f5 0%,#d0f0ea 100%)' : 'linear-gradient(180deg,#f4f7f6 0%,#ebeeec 100%)',
                borderRadius: '10px 10px 0 0', border: '1px solid #ebeeec', borderBottom: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: isFirst ? '#0f766e' : '#aeb4bb' }}>#{p.rank}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function StatistikeView({
  top3, bestGroup, bestKnockout, mostExact, mostCorrect, bestSpecial,
  hardestMatch, easiestMatch,
  totalParticipants, totalPredictions, totalExact, totalMatches,
}: Props) {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {top3.length > 0 && <Podium top3={top3} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {bestGroup && (
          <StatCard title="Skupinski mojster" icon="⚽">
            <PersonStat person={bestGroup}
              value={bestGroup.avg !== undefined ? bestGroup.avg.toFixed(2) : '–'}
              sub={`povp. točk/tekmo · ${bestGroup.count} tekem`} />
          </StatCard>
        )}

        {bestKnockout && (
          <StatCard title="Izločilni specialist" icon="🏆">
            <PersonStat person={bestKnockout}
              value={bestKnockout.avg !== undefined ? bestKnockout.avg.toFixed(2) : '–'}
              sub={`povp. točk/tekmo · ${bestKnockout.count} tekem`} />
          </StatCard>
        )}

        {mostCorrect && (
          <StatCard title="Zanesljivec" icon="✓">
            <PersonStat person={mostCorrect}
              value={String(mostCorrect.correct ?? 0)}
              sub="tekem z vsaj 1 točko (pravilna smer)" />
          </StatCard>
        )}

        {mostExact && (
          <StatCard title="Točen rezultat" icon="🎯">
            <PersonStat person={mostExact}
              value={String(mostExact.exact ?? 0)}
              sub="točnih izidov (3 ali 6 točk)" />
          </StatCard>
        )}

        {bestSpecial && (
          <StatCard title="Posebne napovedi" icon="🔮">
            <PersonStat person={bestSpecial}
              value={String(bestSpecial.special ?? 0)}
              sub="točk iz posebnih napovedi" />
          </StatCard>
        )}

        {/* Skupne številke */}
        <StatCard title="Skupaj" icon="📊">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Udeležencev', value: totalParticipants },
              { label: 'Tekem', value: totalMatches },
              { label: 'Napovedi', value: totalPredictions },
              { label: 'Točnih izidov', value: totalExact },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#15201d', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 10.5, color: '#9aa1ab', marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </StatCard>

        {hardestMatch && (
          <div style={{ gridColumn: '1 / -1' }}>
            <StatCard title="Najtežja tekma" icon="😬">
              <MatchStat match={hardestMatch} label="Najmanj udeležencev je napovedalo pravilno" />
            </StatCard>
          </div>
        )}

        {easiestMatch && (
          <div style={{ gridColumn: '1 / -1' }}>
            <StatCard title="Najlažja tekma" icon="✅">
              <MatchStat match={easiestMatch} label="Največ udeležencev je napovedalo pravilno" />
            </StatCard>
          </div>
        )}
      </div>

      <p style={{ textAlign: 'center', fontSize: 11, color: '#c4cacc', marginTop: 24 }}>
        Hvala vsem za igranje! · SP 2026
      </p>
    </div>
  )
}
