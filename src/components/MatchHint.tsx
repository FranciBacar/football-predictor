'use client';

/**
 * MatchHint — "Kaj je izračunal algoritem"
 * Diskreten analitični namig pred zaklepom napovedi.
 * Prikaži SAMO ko je tekma odprta (status === 'Upcoming').
 */

import { type ReactNode } from 'react';
import { getTeam } from '@/lib/teamData';
// SegBar removed — no longer used after removing Podrobnosti accordion

export type Probs = { home: number; draw: number; away: number }; // %, vsota ~100

export type MatchHintData = {
  home: { name: string; flag: string };
  away: { name: string; flag: string };
  book: Probs & { odds?: [number, number, number] };
  model: Probs & {
    likely: string;
    lambdaHome: number;
    lambdaAway: number;
    eloHome: number;
    eloAway: number;
  };
};

const PC = { home: '#0f766e', draw: '#94a3b8', away: '#f97316' } as const;

function consensus(d: MatchHintData): Probs {
  const avg = (a: number, b: number) => Math.round((a + b) / 2);
  return {
    home: avg(d.book.home, d.model.home),
    draw: avg(d.book.draw, d.model.draw),
    away: avg(d.book.away, d.model.away),
  };
}


function LikelyPill({ score }: { score: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      borderRadius: 999, background: '#e6faf8',
      padding: '5px 10px', fontSize: 12.5, fontWeight: 700, color: '#0f766e',
      flexShrink: 0,
    }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
      </svg>
      {score}
    </span>
  );
}

/** Pretvori raw Supabase hint v MatchHintData */
export function hintFromSupabase(raw: any, homeTeam: string, awayTeam: string): MatchHintData | null {
  if (!raw) return null;
  const homeTeamData = getTeam(homeTeam);
  const awayTeamData = getTeam(awayTeam);

  // Verjetnosti so v bazi kot decimala (0–1), pretvorimo v %
  const toP = (v: number | null) => v != null ? Math.round(v * 100) : 33;

  const bookHome = toP(raw.odds_prob_home);
  const bookDraw = toP(raw.odds_prob_draw);
  const bookAway = toP(raw.odds_prob_away);
  const modelHome = toP(raw.poisson_prob_home);
  const modelDraw = toP(raw.poisson_prob_draw);
  const modelAway = toP(raw.poisson_prob_away);

  // Samo Poisson podatki — stavnice so opcijske
  const hasOdds = raw.odds_home != null;

  return {
    home: { name: homeTeam, flag: homeTeamData.flag },
    away: { name: awayTeam, flag: awayTeamData.flag },
    book: {
      home: hasOdds ? bookHome : modelHome,
      draw: hasOdds ? bookDraw : modelDraw,
      away: hasOdds ? bookAway : modelAway,
      odds: hasOdds ? [
        Math.round(raw.odds_home * 100) / 100,
        Math.round(raw.odds_draw * 100) / 100,
        Math.round(raw.odds_away * 100) / 100,
      ] : undefined,
    },
    model: {
      home: modelHome,
      draw: modelDraw,
      away: modelAway,
      likely: raw.poisson_top_score ?? '1:0',
      lambdaHome: raw.poisson_home_goals ?? 1.2,
      lambdaAway: raw.poisson_away_goals ?? 1.0,
      eloHome: raw.elo_home ?? 1700,
      eloAway: raw.elo_away ?? 1700,
    },
  };
}

export default function MatchHint({ data }: { data: MatchHintData }) {
  const c = consensus(data);
  const diff = c.home - c.away;
  const favHome = diff >= 0;
  const fav = favHome ? data.home : data.away;
  const favPct = Math.max(c.home, c.away);
  const pos = Math.round((c.away / (c.home + c.away)) * 100);

  let verdict: ReactNode;
  if (Math.abs(diff) <= 6) {
    verdict = <>Po izračunu <b style={{ color: '#475467' }}>izenačena tekma</b> ({c.draw}% za remi).</>;
  } else {
    verdict = (
      <>
        Favorit po izračunu:{' '}
        <b style={{ color: favHome ? PC.home : PC.away }}>
          {fav.flag} {fav.name}
        </b>{' '}
        ({favPct}%).
      </>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 11,
      borderRadius: 16, border: '1px solid #e6e9e8',
      padding: '14px 14px 12px',
      background: 'linear-gradient(160deg, #fff, #f7faf9)',
      marginTop: 10,
    }}>
      {/* Headline */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>
          💡 Kaj je izračunal algoritem
        </span>
        <LikelyPill score={data.model.likely} />
      </div>

      {/* Lean meter */}
      <div style={{ position: 'relative', height: 30, marginTop: 1 }}>
        <div style={{
          position: 'absolute', inset: '0 0 auto 0', top: 12,
          height: 7, borderRadius: 999, opacity: 0.85,
          background: `linear-gradient(90deg, ${PC.home} 0%, #d7dee2 50%, ${PC.away} 100%)`,
        }} />
        <div style={{
          position: 'absolute', left: '50%', top: 8,
          height: 15, width: 2, transform: 'translateX(-50%)', background: 'white',
        }} />
        <div style={{
          position: 'absolute', top: 5,
          height: 21, width: 21,
          transform: 'translateX(-50%)',
          borderRadius: '50%',
          border: `3px solid ${favHome ? PC.home : PC.away}`,
          background: 'white',
          boxShadow: '0 2px 8px rgba(16,24,40,0.18)',
          left: `${pos}%`,
          transition: 'left 0.5s ease-out',
        }} />
      </div>

      {/* Procenti */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 600, marginTop: -2 }}>
        <span style={{ color: PC.home, whiteSpace: 'nowrap' }}>{data.home.flag} {c.home}%</span>
        <span style={{ color: '#9aa1ab', whiteSpace: 'nowrap' }}>remi {c.draw}%</span>
        <span style={{ color: PC.away, whiteSpace: 'nowrap' }}>{c.away}% {data.away.flag}</span>
      </div>

      {/* Verdict */}
      <p style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.45, color: '#374151', margin: 0 }}>
        {verdict} <span style={{ color: '#9aa1ab' }}>Ti odločaš. 🤖</span>
      </p>
    </div>
  );
}
