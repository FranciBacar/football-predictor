'use client';

/**
 * ScheduleRow — vrstica v "Po dnevih" pogledu (Football Predictor).
 *
 * Dve stanji:
 *  • ClosedRow — kompaktna vrstica za hiter pregled (čas, faza, ekipi, stanje)
 *  • OpenRow   — razširjena: ± števci za rezultat + predictor (MatchHint) + Shrani
 *
 * Predictor (algoritem) je v OpenRow, ne v kompaktni vrstici — timeline ostane
 * čist za skeniranje, namig se pokaže ob vnosu napovedi.
 *
 * Odvisnost: MatchHint.tsx (glej ločen handoff "design_handoff_match_hint").
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
  actual?: Score | null;       // dejanski rezultat (finished)
  actualAdvancingTeam?: string | null;  // ekipa ki napreduje po penaltih
  actualPenaltyHome?: number | null;    // penalty score (home)
  actualPenaltyAway?: number | null;    // penalty score (away)
  actualEtHome?: number | null;         // goli v podaljških (home)
  actualEtAway?: number | null;         // goli v podaljških (away)
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

const LockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
);

/** kakovost zadetka iz napovedi vs dejanski rezultat */
function quality(pred: Score, act: Score): { text: string; tone: 'hit' | 'diff' | 'zero' } {
  const pd = pred.home - pred.away, ad = act.home - act.away;
  if (pred.home === act.home && pred.away === act.away) return { text: '✓ točen rezultat', tone: 'hit' };
  if (pd === ad) return { text: ad === 0 ? 'pravilen remi' : 'pravilna razlika', tone: 'diff' };
  if (Math.sign(pd) === Math.sign(ad)) return { text: 'pravilen zmagovalec', tone: 'diff' };
  return { text: '✕ zgrešeno', tone: 'zero' };
}

/* ── CLOSED (kompaktna vrstica) ────────────────────────────── */
export function ClosedRow({ match, saved, onOpen }: { match: Match; saved: Score | null; onOpen: () => void }) {
  const open = match.status === 'open';
  const finished = match.status === 'finished';
  const locked = match.status === 'locked';
  const predicted = !!saved;
  const needs = open && !predicted;
  const earned = match.earned ?? 0;

  // scores ob ekipah: finished → dejanski rezultat (ink); prihajaj. → napoved (teal / siv)
  let hs: number | '' = '', as: number | '' = '', scoreColor = 'text-[#cfd5d3]';
  if (finished && match.actual) { hs = match.actual.home; as = match.actual.away; scoreColor = 'text-[#15201d]'; }
  else if (predicted && saved) { hs = saved.home; as = saved.away; scoreColor = locked ? 'text-[#b3bac3]' : 'text-[#0f766e]'; }

  const homeWin = !!(finished && match.actual && match.actual.home > match.actual.away);
  const awayWin = !!(finished && match.actual && match.actual.away > match.actual.home);

  let tag: React.ReactNode;
  if (finished) {
    tag = <span className={`rounded-full px-2.5 py-[5px] text-[11px] font-bold ${earned === 0 ? 'bg-[#f1f3f2] text-[#9aa1ab]' : 'bg-[#eaf6f0] text-[#15803d]'}`}>{earned === 0 ? '0 t.' : `+${earned} t.`}</span>;
  } else if (locked) {
    tag = <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fbeceb] px-2.5 py-[5px] text-[11px] font-bold text-[#c0392b]"><LockIcon /> zaklenjeno</span>;
  } else if (predicted) {
    tag = <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e9f7f5] px-2.5 py-[5px] text-[11px] font-bold text-[#0f766e]"><CheckIcon /> napovedano</span>;
  } else {
    tag = <span className="rounded-full bg-[#0f766e] px-3 py-[5px] text-[11px] font-bold text-white">Napovej →</span>;
  }

  const TeamLine = ({ t, score, win }: { t: TeamLite; score: number | ''; win: boolean }) => (
    <div className="grid grid-cols-[20px_1fr_auto] items-center gap-[9px]">
      <span className="text-center text-[16px] leading-none">{t.flag}</span>
      <span className={`truncate text-[13.5px] tracking-tight ${win ? 'font-bold' : 'font-semibold'}`}>{t.name}</span>
      <span className={`min-w-[14px] text-right text-[15px] font-extrabold tabular-nums ${score === '' ? 'text-[#cfd5d3]' : scoreColor}`}>{score === '' ? '–' : score}</span>
    </div>
  );

  const hasPenalty = !!(finished && match.actualAdvancingTeam);
  const q = finished && saved && match.actual ? quality(saved, match.actual) : null;
  const toneCls = q?.tone === 'hit' ? 'text-[#15803d]' : q?.tone === 'diff' ? 'text-[#0f766e]' : 'text-[#9aa1ab]';

  // Knockout advancing team
  const advTeam = match.actualAdvancingTeam === match.home.name ? match.home
    : match.actualAdvancingTeam === match.away.name ? match.away : null;
  const advCode = match.actualAdvancingTeam === match.home.name ? match.home.code
    : match.actualAdvancingTeam === match.away.name ? match.away.code : null;
  const userAdvCode = saved?.advancing;
  const userAdvTeam = userAdvCode === match.home.code ? match.home : userAdvCode === match.away.code ? match.away : null;
  const advCorrect = !!(userAdvCode && advCode && userAdvCode === advCode);

  // Za prikaz skupnega (končnega) rezultata:
  // - Penalty shootout: actual + penalty goli
  // - ET (brez shootout): actual + ET goli
  const totalHome = hasPenalty && match.actual
    ? (match.actualPenaltyHome != null
        ? match.actual.home + match.actualPenaltyHome
        : (match.actualEtHome != null ? match.actual.home + match.actualEtHome : null))
    : null;
  const totalAway = hasPenalty && match.actual
    ? (match.actualPenaltyAway != null
        ? match.actual.away + match.actualPenaltyAway
        : (match.actualEtAway != null ? match.actual.away + match.actualEtAway : null))
    : null;

  return (
    <button type="button" onClick={onOpen}
      className={`relative grid w-full grid-cols-[52px_1fr_auto] items-center gap-3 overflow-hidden rounded-2xl border px-3.5 py-3 text-left shadow-[0_1px_2px_rgba(16,24,40,0.03)] transition active:scale-[0.992] ${
        finished ? 'border-[#e3e8e6] bg-[#f5f7f7] pl-[17px]' : needs ? 'border-[#f3d8b0] bg-white pl-[17px]' : 'border-[#ebeeec] bg-white'
      }`}>
      {finished && <span className={`absolute inset-y-0 left-0 w-1 ${earned > 0 ? 'bg-[#15803d]' : 'bg-[#cbd2d0]'}`} />}
      {needs && <span className="absolute inset-y-0 left-0 w-1 bg-[#f59e0b]" />}

      <div className="flex flex-col items-start gap-0.5">
        <span className="text-[14.5px] font-bold tabular-nums tracking-tight text-[#15201d]">{fmtTime(match.kickoffUtc)}</span>
        <span className="whitespace-nowrap text-[9.5px] font-semibold text-[#9aa1ab]">{match.stage}</span>
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <TeamLine t={match.home} score={hs} win={homeWin} />
        <TeamLine t={match.away} score={as} win={awayWin} />

        {/* Za penalty tekme: oznaka "po 90 min" + končni rezultat s penalti */}
        {hasPenalty && (
          <div className="mt-0.5 flex items-center justify-between">
            <span className="rounded-full bg-[#eef1f0] px-[7px] py-[2px] text-[9px] font-bold uppercase tracking-wide text-[#aab0b8]">
              po 90 min
            </span>
            {totalHome !== null && totalAway !== null && (
              <span className="text-[10px] font-semibold text-[#9aa1ab] tabular-nums">
                skupaj: <b className="text-[#374151]">{totalHome}:{totalAway}</b>
              </span>
            )}
          </div>
        )}

        {finished && (
          <div className="mt-1.5 flex flex-col gap-1.5 border-t border-dashed border-[#dde3e1] pt-2">
            {/* Kazenski streli: kdo napreduje + bonus */}
            {hasPenalty && advTeam && (
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="flex items-center gap-1 text-[#6b7280]">
                  <span className="text-[#c4cacc]">
                    {match.actualPenaltyHome != null ? 'po penalih napreduje' : 'po pod. napreduje'}
                  </span>
                  <span className="font-semibold text-[#374151]">{advTeam.flag} {match.actualAdvancingTeam}</span>
                  {totalHome !== null && (
                    <span className="rounded bg-[#f4f7f6] px-[5px] py-[1px] text-[9.5px] font-bold tabular-nums text-[#6b7280]">
                      {totalHome}:{totalAway}
                    </span>
                  )}
                </span>
                {userAdvTeam && (
                  <span className={`font-bold ${advCorrect ? 'text-[#15803d]' : 'text-[#d92d20]'}`}>
                    {advCorrect ? `✓ ${userAdvTeam.flag} +bonus` : `✕ ${userAdvTeam.flag}`}
                  </span>
                )}
              </div>
            )}
            {/* Napoved + kakovost */}
            <div className="flex items-center justify-between gap-2.5">
              <span className="flex items-center gap-1.5 whitespace-nowrap text-[11.5px] text-[#6b7280]">
                <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#9aa1ab]">Napoved</span>
                <b className="text-[13px] font-bold tabular-nums text-[#15201d]">{saved ? `${saved.home} : ${saved.away}` : '—'}</b>
                {hasPenalty && <span className="text-[9.5px] font-semibold text-[#c4cacc]">po 90 min</span>}
              </span>
              {q && <span className={`whitespace-nowrap text-[11px] font-bold ${toneCls}`}>{q.text}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 self-start pt-0.5">{tag}</div>
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
          <span className="flex-1 text-[11.5px] font-semibold text-[#065f46]">Remi — kdo napreduje?</span>
          {[match.home, match.away].map((t) => (
            <button key={t.code} type="button" onClick={() => onChange({ ...draft, advancing: t.code })}
              className={`inline-flex items-center gap-1.5 rounded-lg border-[1.5px] px-2.5 py-1.5 text-[11.5px] font-semibold transition ${draft.advancing === t.code ? 'border-[#0f766e] bg-[#e6faf8] text-[#0f766e]' : 'border-[#cdeadd] bg-white text-[#374151]'}`}>
              <span>{t.flag}</span>{t.name}
            </button>
          ))}
        </div>
      )}

      {match.hint && <div className="mt-3.5"><MatchHint data={match.hint} /></div>}

      <button type="button" disabled={!canSave} onClick={onSave}
        className={`mt-3.5 flex h-[46px] w-full items-center justify-center gap-2 rounded-[13px] text-[14.5px] font-semibold transition active:translate-y-px ${
          !dirty
            ? 'bg-[#e7f6ed] text-[#15803d]'
            : canSave
              ? 'bg-[#0f766e] text-white hover:bg-[#0c5f58]'
              : 'cursor-default bg-[#f3f4f6] text-[#9aa1ab]'
        }`}>
        {!dirty ? <><CheckIcon /> Napoved shranjena</> : needsAdvancing && !draft.advancing ? 'Izberi, kdo napreduje' : 'Shrani napoved'}
      </button>
    </div>
  );
}
