'use client';

import { getTeam } from '@/lib/teamData';

/**
 * MatchHint — "Kaj je izračunal algoritem"
 * Diskreten analitični namig pred zaklepom napovedi.
 *
 * Lean-meter (konsenz stavnic + modela) je vedno viden; "Podrobnosti"
 * razkrije oba vira ločeno + λ / ELO / kvote.
 *
 * Prikaži SAMO ko je tekma odprta (status === 'open').
 * Brand: home = teal #0f766e · draw = slate #94a3b8 · away = orange #f97316
 */

import { useState, type ReactNode } from 'react';

/* ── tipi ─────────────────────────────────────────────────── */
export type Probs = { home: number; draw: number; away: number }; // %, vsota ~100

export type TeamLite = { name: string; flag: string }; // flag = emoji ali ISO koda za <Flag>

export type MatchHintData = {
  home: TeamLite;
  away: TeamLite;
  /** Verjetnosti stavnic + decimalne kvote [1, X, 2] */
  book: (Probs & { odds?: [number, number, number] }) | null;
  /** Verjetnosti matematičnega modela (Poisson + ELO) */
  model: Probs & {
    likely: string;        // npr. "1:0"
    lambdaHome: number;    // pričakovani goli doma
    lambdaAway: number;    // pričakovani goli gosti
    eloHome: number;
    eloAway: number;
  };
};

export type MatchHintProps = {
  data: MatchHintData;
  /** Podrobnosti privzeto odprte (npr. za snapshote). Default: false */
  defaultOpen?: boolean;
  className?: string;
};

/* ── barve verjetnosti (data-driven → inline) ─────────────── */
const PC = { home: '#0f766e', draw: '#94a3b8', away: '#f97316' } as const;

/* ── konsenz = povprečje stavnic in modela ────────────────── */
function consensus(d: MatchHintData): Probs {
  if (!d.book) return { home: d.model.home, draw: d.model.draw, away: d.model.away };
  const avg = (a: number, b: number) => Math.round((a + b) / 2);
  return {
    home: avg(d.book.home, d.model.home),
    draw: avg(d.book.draw, d.model.draw),
    away: avg(d.book.away, d.model.away),
  };
}

/* ── segmentni bar ────────────────────────────────────────── */
function SegBar({ p, height = 9 }: { p: Probs; height?: number }) {
  const segs = [
    { pct: p.home, color: PC.home },
    { pct: p.draw, color: PC.draw },
    { pct: p.away, color: PC.away },
  ];
  return (
    <div className="flex w-full gap-[3px]" style={{ height }}>
      {segs.map((s, i) => (
        <div
          key={i}
          className="rounded-full transition-[flex-grow] duration-500 ease-out"
          style={{ flexGrow: s.pct, flexBasis: 0, minWidth: 4, background: s.color }}
        />
      ))}
    </div>
  );
}

/* ── pill z najverjetnejšim rezultatom ────────────────────── */
function LikelyPill({ score }: { score: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#e6faf8] px-2.5 py-[5px] text-[12.5px] font-bold text-[#0f766e]">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
      </svg>
      {score}
    </span>
  );
}

/* ── komponenta ───────────────────────────────────────────── */
export default function MatchHint({ data, defaultOpen = false, className = '' }: MatchHintProps) {
  const [open, setOpen] = useState(defaultOpen);
  const c = consensus(data);
  const diff = c.home - c.away;
  const favHome = diff >= 0;
  const fav = favHome ? data.home : data.away;
  const favPct = Math.max(c.home, c.away);
  const pos = Math.round((c.away / (c.home + c.away)) * 100); // 0 = home(levo) … 100 = away(desno)

  let verdict: ReactNode;
  if (Math.abs(diff) <= 6) {
    verdict = (
      <>
        Po izračunu <b className="text-[#475467]">izenačena tekma</b> ({c.draw}% za remi).
      </>
    );
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

  const sources = [
    ...(data.book ? [{ key: 'book', label: 'Stavnice', icon: '📊', p: data.book }] : []),
    { key: 'model', label: 'Model', icon: '🧮', p: data.model },
  ];

  const chips = [
    `λ ${data.model.lambdaHome}–${data.model.lambdaAway}`,
    `ELO ${data.model.eloHome}·${data.model.eloAway}`,
    ...(data.book?.odds ? [`kvote ${data.book.odds.join(' · ')}`] : []),
  ];

  return (
    <div
      className={`flex flex-col gap-[11px] rounded-2xl border border-[#e6e9e8] p-[14px] pb-3 ${className}`}
      style={{ background: 'linear-gradient(160deg,#fff,#f7faf9)' }}
    >
      {/* headline */}
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold text-[#374151]">
          💡 Kaj je izračunal algoritem
        </span>
        <LikelyPill score={data.model.likely} />
      </div>

      {/* lean os */}
      <div className="relative mt-px h-[30px]">
        <div
          className="absolute inset-x-0 top-3 h-[7px] rounded-full opacity-85"
          style={{ background: `linear-gradient(90deg, ${PC.home} 0%, #d7dee2 50%, ${PC.away} 100%)` }}
        />
        <div className="absolute left-1/2 top-2 h-[15px] w-0.5 -translate-x-1/2 bg-white" />
        <div
          className="absolute top-[5px] h-[21px] w-[21px] -translate-x-1/2 rounded-full border-[3px] bg-white shadow-[0_2px_8px_rgba(16,24,40,.18)] transition-[left] duration-500 ease-out"
          style={{ left: `${pos}%`, borderColor: favHome ? PC.home : PC.away }}
        />
      </div>

      {/* konci */}
      <div className="-mt-0.5 flex items-center justify-between text-[11.5px] font-semibold">
        <span className="flex items-center gap-1.5 whitespace-nowrap" style={{ color: PC.home }}>
          {data.home.flag} {c.home}%
        </span>
        <span className="whitespace-nowrap font-semibold text-[#9aa1ab]">remi {c.draw}%</span>
        <span className="flex items-center gap-1.5 whitespace-nowrap" style={{ color: PC.away }}>
          {c.away}% {data.away.flag}
        </span>
      </div>

      {/* verdict */}
      <p className="text-[12.5px] font-medium leading-[1.45] text-[#374151]">
        {verdict} <span className="text-[#9aa1ab]">Ti odločaš. 🤖</span>
      </p>

      {/* razkritje */}
      <div className="mt-px border-t border-[#e9edec] pt-2.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center justify-center gap-1.5"
        >
          <span className="text-[11.5px] font-semibold text-[#0f766e]">
            {open ? 'Skrij podrobnosti' : 'Podrobnosti'}
          </span>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden
            className="text-[#0f766e] transition-transform duration-300"
            style={{ transform: open ? 'rotate(180deg)' : 'none' }}
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <div className="mt-3 flex flex-col gap-[11px]">
            {sources.map((r) => (
              <div key={r.key} className="flex flex-col gap-[7px]">
                <div className="flex items-center justify-between gap-2 text-[11.5px]">
                  <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap font-semibold text-[#6b7280]">
                    {r.icon} {r.label}
                  </span>
                  <span className="flex shrink-0 gap-[9px] font-semibold tabular-nums">
                    <span style={{ color: PC.home }}>{r.p.home}%</span>
                    <span style={{ color: PC.draw }}>{r.p.draw}%</span>
                    <span style={{ color: PC.away }}>{r.p.away}%</span>
                  </span>
                </div>
                <SegBar p={r.p} height={8} />
              </div>
            ))}

            <div className="flex flex-wrap gap-x-[7px] gap-y-[5px] pt-px">
              {chips.map((t, i) => (
                <span key={i} className="whitespace-nowrap rounded-full bg-[#eef2f1] px-2 py-[3px] text-[10.5px] font-medium text-[#6b7280]">
                  {t}
                </span>
              ))}
            </div>

            <p className="text-[10.5px] font-medium leading-[1.4] text-[#9aa1ab]">
              Stavnice + matematični model (Poisson · ELO). Samo algoritem za zabavo — prihodnosti seveda ne poznamo. 🤖
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── adapter: Supabase match_hints → MatchHintData ─────────── */
export function hintFromSupabase(raw: any, homeTeam: string, awayTeam: string): MatchHintData | null {
  if (!raw) return null;
  const homeTeamData = getTeam(homeTeam);
  const awayTeamData = getTeam(awayTeam);

  const toP = (v: number | null) => v != null ? Math.round(v * 100) : 33;

  const bookHome = toP(raw.odds_prob_home);
  const bookDraw = toP(raw.odds_prob_draw);
  const bookAway = toP(raw.odds_prob_away);
  const modelHome = toP(raw.poisson_prob_home);
  const modelDraw = toP(raw.poisson_prob_draw);
  const modelAway = toP(raw.poisson_prob_away);

  const hasOdds = raw.odds_home != null;

  return {
    home: { name: homeTeam, flag: homeTeamData.flag },
    away: { name: awayTeam, flag: awayTeamData.flag },
    book: hasOdds ? {
      home: bookHome, draw: bookDraw, away: bookAway,
      odds: [
        Math.round(raw.odds_home * 100) / 100,
        Math.round(raw.odds_draw * 100) / 100,
        Math.round(raw.odds_away * 100) / 100,
      ],
    } : null,
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
