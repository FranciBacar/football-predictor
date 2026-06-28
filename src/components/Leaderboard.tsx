'use client';

/**
 * Leaderboard — "Lestvica" (Football Predictor).
 *
 * Premium, brez emojijev: metalne medalje za top 3 (številka mesta v zlatem/srebrnem/
 * bronastem krogcu), nevtralni cohesive avatarji, poudarek na točkah, tvoja vrstica v teal.
 *
 * Brand: teal #0f766e · ink #15201d · line #ebeeec.
 */

import { useState, useMemo } from 'react';

export type Player = {
  id: string;
  name: string;
  sub?: string;          // npr. "9 napovedi"
  exact: number;         // točni rezultati (3-točkovni) — tie-break
  points: number;
  matchPoints?: number;    // točke iz napovedi tekem
  specialPoints?: number;  // točke iz posebnih napovedi
  avatarUrl?: string | null;
  initials: string;      // fallback, če ni slike
  you?: boolean;
};

export type LeaderboardProps = {
  title?: string;
  subtitle?: string;
  tabs: string[];
  rowsByTab: Record<string, Player[]>;
  defaultTab?: string;
};

const MEDAL = [
  'bg-[linear-gradient(140deg,#f3d989,#d8b24a)] text-[#7a5a12]',
  'bg-[linear-gradient(140deg,#eef1f4,#bdc4cd)] text-[#5a626c]',
  'bg-[linear-gradient(140deg,#ecca9f,#c08a55)] text-[#6e4824]',
];

function Avatar({ p }: { p: Player }) {
  if (p.avatarUrl) {
    return <img src={p.avatarUrl} alt="" className="h-[38px] w-[38px] flex-none rounded-full object-cover" />;
  }
  return (
    <div className={`flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full text-[14.5px] font-bold tracking-tight ${p.you ? 'bg-[linear-gradient(140deg,#0f766e,#2dd4bf)] text-white' : 'bg-[#eef1f0] text-[#5b6470]'}`}>
      {p.initials}
    </div>
  );
}

function Row({ p, rank, matchOnly }: { p: Player; rank: number; matchOnly: boolean }) {
  const displayPoints = matchOnly ? (p.matchPoints ?? p.points) : p.points;
  const showBreakdown = !matchOnly && p.matchPoints !== undefined && p.specialPoints !== undefined;

  return (
    <div className={`relative grid grid-cols-[58px_1fr_44px_104px] items-center border-b border-[#ebeeec] px-5 py-[13px] transition-colors last:border-b-0 max-[520px]:grid-cols-[46px_1fr_36px_90px] max-[520px]:px-3.5 ${p.you ? 'bg-[#e9f7f5]' : 'hover:bg-[#fafbfb]'}`}>
      {p.you && <span className="absolute inset-y-0 left-0 w-[3px] bg-[#0f766e]" />}
      <div className="flex items-center justify-center">
        {rank <= 3
          ? <div className={`flex h-[30px] w-[30px] items-center justify-center rounded-full text-[13px] font-extrabold tabular-nums shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_2px_4px_rgba(16,24,40,0.12)] ${MEDAL[rank - 1]}`}>{rank}</div>
          : <span className="text-[15px] font-bold tabular-nums text-[#aeb4bb]">{rank}</span>}
      </div>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar p={p} />
        <div className="min-w-0">
          <div className="truncate text-[14.5px] font-semibold tracking-tight">
            {p.name}{p.you && <span className="ml-1.5 text-[12px] font-semibold text-[#0f766e]">ti</span>}
          </div>
          {p.sub && <div className="mt-0.5 text-[11.5px] text-[#9aa1ab] max-[520px]:hidden">{p.sub}</div>}
        </div>
      </div>
      <div className="text-center text-[14px] font-semibold tabular-nums text-[#475467]">{p.exact}</div>
      <div className="text-right">
        <div className={`text-[18px] font-extrabold tabular-nums tracking-[-0.02em] leading-none ${p.you ? 'text-[#0f766e]' : displayPoints === 0 ? 'text-[#c2c7cd]' : 'text-[#15201d]'}`}>
          {displayPoints}
        </div>
        {showBreakdown && (
          <div className="mt-[4px] text-[10px] font-medium tabular-nums text-[#b0b8c1] leading-none whitespace-nowrap">
            tek. {p.matchPoints} · pos. {p.specialPoints}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Leaderboard({
  title = 'Lestvica',
  subtitle = 'Razvrščeni po skupnih točkah. Pri izenačitvi odloča število točnih rezultatov.',
  tabs,
  rowsByTab,
  defaultTab,
}: LeaderboardProps) {
  const [tab, setTab] = useState(defaultTab ?? tabs[0]);
  const [matchOnly, setMatchOnly] = useState(false);

  const rows = useMemo(() => {
    const base = rowsByTab[tab] ?? [];
    if (!matchOnly) return base;
    return [...base]
      .sort((a, b) =>
        (b.matchPoints ?? b.points) - (a.matchPoints ?? a.points) ||
        b.exact - a.exact ||
        a.name.localeCompare(b.name)
      );
  }, [tab, rowsByTab, matchOnly]);

  // Preverimo ali imamo matchPoints podatke (ne pri vseh zavihkih nujno)
  const hasBreakdownData = (rowsByTab[tab] ?? []).some(p => p.matchPoints !== undefined);

  return (
    <div className="mx-auto max-w-[680px]">
      <div className="mb-[18px]">
        <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.025em]">{title}</h1>
        <p className="mt-[7px] text-[13.5px] text-[#6b7280]">
          {matchOnly
            ? 'Samo točke napovedi tekem (brez posebnih napovedi).'
            : subtitle}
        </p>
      </div>

      <div className="mb-[14px] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`cursor-pointer rounded-[10px] border px-4 py-[9px] text-[13px] font-semibold tracking-tight transition ${t === tab ? 'border-[#15201d] bg-[#15201d] text-white' : 'border-[#ebeeec] bg-white text-[#475467] hover:border-[#d8dddb]'}`}>
              {t}
            </button>
          ))}
        </div>

        {hasBreakdownData && (
          <button
            type="button"
            onClick={() => setMatchOnly(v => !v)}
            className={`cursor-pointer rounded-[10px] border px-4 py-[9px] text-[13px] font-semibold tracking-tight transition whitespace-nowrap ${matchOnly ? 'border-[#0f766e] bg-[#0f766e] text-white' : 'border-[#ebeeec] bg-white text-[#475467] hover:border-[#d8dddb]'}`}
          >
            {matchOnly ? '✓ Brez posebnih' : 'Brez posebnih'}
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-[18px] border border-[#ebeeec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03),0_12px_30px_rgba(16,24,40,0.05)]">
        <div className="grid grid-cols-[58px_1fr_44px_104px] border-b border-[#ebeeec] bg-[#fcfdfd] px-5 py-[13px] text-[10.5px] font-bold uppercase tracking-[0.07em] text-[#9aa1ab] max-[520px]:grid-cols-[46px_1fr_36px_90px] max-[520px]:px-3.5">
          <div className="text-center">#</div>
          <div>Igralec</div>
          <div className="text-center">Točni</div>
          <div className="text-right">{matchOnly ? 'Točke tekem' : 'Točke skupaj'}</div>
        </div>
        {rows.map((p, i) => <Row key={p.id} p={p} rank={i + 1} matchOnly={matchOnly} />)}
        {rows.length === 0 && (
          <div className="px-5 py-10 text-center text-[13.5px] text-[#9aa1ab]">Še ni razvrstitve za to skupino.</div>
        )}
      </div>
    </div>
  );
}
