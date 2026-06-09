'use client';

/**
 * ScheduleRow — vrstica v "Po dnevih" pogledu (Football Predictor).
 *
 * Dve stanji:
 *  • ClosedRow — kompaktna vrstica za hiter pregled (čas, faza, ekipi, stanje)
 *  • OpenRow   — razširjena: ± števci za rezultat + predictor (MatchHint) + Shrani
 */

import { useState } from 'react';
import MatchHint, { type MatchHintData } from './MatchHint';

/* ── tipi ──────────────────────────────────────────────────── */
export type TeamLite = { code: string; name: string; flag: string };
export type Score = { home: number; away: number; advancing?: string };
export type MatchStatus = 'open' | 'locked' | 'finished';

export type Match = {
  id: string;
  stage: string;               // "Skupina E" | "Osmina finala" | "Finale" …
  kickoffUtc: number;          // epoch ms
  home: TeamLite;
  away: TeamLite;
  isKnockout: boolean;
  status: MatchStatus;
  actual?: { home: number; away: number } | null;   // dejanski rezultat (finished)
  earned?: number | null;      // dosežene točke (finished)
  hint?: MatchHintData | null; // podatki algoritma (open, pred zaklepom)
};

const TZ = 'Europe/Ljubljana';
const timeFmt = new Intl.DateTimeFormat('sl-SI', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
export const fmtTime = (ts: number) => timeFmt.format(ts);

/* ── horizontalni mini-stepper ─────────────────────────────── */
function HStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" disabled={value <= 0} onClick={() => onChange(value - 1)}
        className="flex h-[27px] w-[27px] items-center justify-center rounded-lg border border-[#e6e9e8] bg-white text-[16px] font-bold leading-none text-[#0f766e] disabled:opacity-30 active:scale-90 transition">−</button>
      <span className="min-w-[20px] text-center text-[16px] font-bold tabular-nums tracking-tight text-[#0f766e]">{value}</span>
      <button type="button" disabled={value >= 19} onClick={() => onChange(value + 1)}
        className="flex h-[27px] w-[27px] items-center justify-center rounded-lg border border-[#e6e9e8] bg-white text-[16px] font-bold leading-none text-[#0f766e] disabled:opacity-30 active:scale-90 transition">+</button>
    </div>
  );
}

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

/* ── CLOSED (kompaktna vrstica) ────────────────────────────── */
export function ClosedRow({ match, saved, onOpen }: { match: Match; saved: Score | null; onOpen: () => void }) {
  const open = match.status === 'open';
  const finished = match.status === 'finished';
  const locked = match.status === 'locked';
  const predicted = !!saved;
  const needs = open && !predicted;

  let hs: number | '' = '', as: number | '' = '', scoreColor = 'text-[#d4d9dd]';
  if (finished && match.actual) { hs = match.actual.home; as = match.actual.away; scoreColor = 'text-[#1a1a1a]'; }
  else if (predicted && saved) { hs = saved.home; as = saved.away; scoreColor = locked ? 'text-[#b3bac3]' : 'text-[#0f766e]'; }

  let tag: React.ReactNode;
  if (finished) {
    const e = match.earned ?? 0;
    tag = <span className={`rounded-full px-2.5 py-[5px] text-[11px] font-bold ${e === 0 ? 'bg-[#f3f4f6] text-[#9aa1ab]' : 'bg-[#e6faf8] text-[#0f766e]'}`}>{e === 0 ? '0 t.' : `+${e} t.`}</span>;
  } else if (locked) {
    tag = <span className="rounded-full bg-[#f3f4f6] px-2.5 py-[5px] text-[11px] font-bold text-[#9aa1ab]">🔒 zaklenjeno</span>;
  } else if (predicted) {
    tag = <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6faf8] px-2.5 py-[5px] text-[11px] font-bold text-[#0f766e]"><CheckIcon /> napovedano</span>;
  } else {
    tag = <span className="rounded-full bg-gradient-to-r from-[#0f766e] to-[#2dd4bf] px-3 py-[5px] text-[11px] font-bold text-white shadow-[0_3px_10px_rgba(15,118,110,0.25)]">Napovej →</span>;
  }

  const TeamLine = ({ t, score, win }: { t: TeamLite; score: number | ''; win: boolean }) => (
    <div className="grid grid-cols-[22px_1fr_auto] items-center gap-[9px]">
      <span className="text-center text-[18px] leading-none">{t.flag}</span>
      <span className={`truncate text-[13.5px] tracking-tight ${win ? 'font-bold' : 'font-semibold'}`}>{t.name}</span>
      <span className={`min-w-[14px] text-right text-[15px] font-bold tabular-nums ${score === '' ? 'text-[#d4d9dd]' : scoreColor}`}>{score === '' ? '–' : score}</span>
    </div>
  );

  return (
    <button type="button" onClick={onOpen}
      className={`relative grid w-full grid-cols-[50px_1fr_auto] items-center gap-[11px] overflow-hidden rounded-2xl border bg-white px-[14px] py-3 text-left shadow-[0_1px_2px_rgba(16,24,40,0.03)] transition active:scale-[0.992] ${needs ? 'border-[#f3d8b0]' : 'border-[#e6e9e8]'}`}>
      {needs && <span className="absolute inset-y-0 left-0 w-1 bg-[#f59e0b]" />}
      <div className="flex flex-col items-start gap-0.5">
        <span className="text-[14.5px] font-bold tabular-nums tracking-tight text-[#1a1a1a]">{fmtTime(match.kickoffUtc)}</span>
        <span className="whitespace-nowrap text-[9.5px] font-semibold text-[#9aa1ab]">{match.stage}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <TeamLine t={match.home} score={hs} win={!!(finished && match.actual && match.actual.home > match.actual.away)} />
        <TeamLine t={match.away} score={as} win={!!(finished && match.actual && match.actual.away > match.actual.home)} />
      </div>
      <div className="flex flex-col items-end gap-1">{tag}</div>
    </button>
  );
}

/* ── OPEN (vnos rezultata + algoritem) ─────────────────────── */
export function OpenRow({
  match, draft, saved, onChange, onSave, onCollapse,
}: {
  match: Match;
  draft: Score;
  saved: Score | null;
  onChange: (s: Score) => void;
  onSave: () => void;
  onCollapse: () => void;
}) {
  const isDraw = draft.home === draft.away;
  const needsAdvancing = match.isKnockout && isDraw;
  const dirty = !saved || saved.home !== draft.home || saved.away !== draft.away || saved.advancing !== draft.advancing;
  const canSave = dirty && (!needsAdvancing || !!draft.advancing);

  const TeamLine = ({ t, val, onV }: { t: TeamLite; val: number; onV: (v: number) => void }) => (
    <div className="grid grid-cols-[26px_1fr_auto] items-center gap-[11px]">
      <span className="text-center text-[22px] leading-none">{t.flag}</span>
      <span className="truncate text-[15px] font-semibold tracking-tight">{t.name}</span>
      <HStepper value={val} onChange={onV} />
    </div>
  );

  return (
    <div className="rounded-2xl border-[1.5px] border-[#0f766e] bg-white p-[14px] shadow-[0_8px_26px_rgba(15,118,110,0.12)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-[14.5px] font-bold tabular-nums tracking-tight text-[#1a1a1a]">{fmtTime(match.kickoffUtc)}</span>
          <span className="text-[11px] font-semibold text-[#9aa1ab]">{match.stage}</span>
        </div>
        <button type="button" onClick={onCollapse} aria-label="Strni"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e6e9e8] bg-white text-[#9aa1ab]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        <TeamLine t={match.home} val={draft.home} onV={(v) => onChange({ ...draft, home: v })} />
        <TeamLine t={match.away} val={draft.away} onV={(v) => onChange({ ...draft, away: v })} />
      </div>

      {needsAdvancing && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#b9e7d4] bg-[#ecfdf5] px-[11px] py-2.5">
          <span className="flex-1 text-[11.5px] font-semibold text-[#065f46]">🟢 Remi — kdo napreduje?</span>
          {[match.home, match.away].map((t) => (
            <button key={t.code} type="button" onClick={() => onChange({ ...draft, advancing: t.code })}
              className={`inline-flex items-center gap-1.5 rounded-lg border-[1.5px] px-2.5 py-1.5 text-[11.5px] font-semibold transition ${draft.advancing === t.code ? 'border-[#0f766e] bg-[#e6faf8] text-[#0f766e]' : 'border-[#cdeadd] bg-white text-[#374151]'}`}>
              <span>{t.flag}</span>{t.name}
            </button>
          ))}
        </div>
      )}

      {match.hint && (
        <div className="mt-3.5">
          <MatchHint data={match.hint} />
        </div>
      )}

      <button type="button" disabled={!canSave} onClick={onSave}
        className={`mt-3.5 flex h-[46px] w-full items-center justify-center gap-2 rounded-[13px] text-[14.5px] font-semibold transition active:translate-y-px ${
          !dirty
            ? 'bg-[#e7f6ed] text-[#15803d]'
            : canSave
              ? 'bg-gradient-to-r from-[#0f766e] to-[#2dd4bf] text-white shadow-[0_6px_16px_rgba(15,118,110,0.28)]'
              : 'cursor-default bg-[#f3f4f6] text-[#9aa1ab]'
        }`}>
        {!dirty ? <><CheckIcon /> Napoved shranjena</> : needsAdvancing && !draft.advancing ? 'Izberi, kdo napreduje' : 'Shrani napoved'}
      </button>
    </div>
  );
}
