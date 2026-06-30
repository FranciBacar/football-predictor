'use client';

/**
 * MatchCard — napovedna kartica (Football Predictor), premium slog.
 *
 * Stanja: open (vnos + algoritem + shrani) · locked (zaklenjeno) · finished (rezultat + točke).
 * Izločilni remi → inline izbor "kdo napreduje?".
 * Algoritem (predictor) se prikaže pri odprtih tekmah prek <MatchHint>.
 *
 * Brez okrasnih emojijev — le zastave ekip. Solid teal za primarni gumb.
 */

import MatchHint, { type MatchHintData } from './MatchHint';

export type TeamLite = { code: string; name: string; flag: string };
export type Score = { home: number; away: number; advancing?: string };

export type Match = {
  id: string;
  whenLabel: string;        // npr. "čet., 11. 06. ob 21:00"
  home: TeamLite;
  away: TeamLite;
  isKnockout: boolean;
  status: 'open' | 'locked' | 'finished';
  actual?: { home: number; away: number } | null;
  actualAdvancingTeam?: string | null;  // ekipa ki napreduje po penaltih
  actualPenaltyHome?: number | null;    // goli na penaltih (home)
  actualPenaltyAway?: number | null;    // goli na penaltih (away)
  earned?: number | null;
  hint?: MatchHintData | null;
};

const ptsWord = (n: number) => (n === 1 ? 'točka' : n === 2 ? 'točki' : n === 3 || n === 4 ? 'točke' : 'točk');

function Stepper({ value, onChange, editable, readValue }: { value: number; onChange?: (v: number) => void; editable: boolean; readValue?: number }) {
  const v = editable ? value : (readValue ?? value);
  return (
    <div className="flex flex-col items-center gap-[7px]">
      <div className={`flex h-[56px] w-[54px] items-center justify-center rounded-[14px] border text-[27px] font-extrabold tabular-nums tracking-[-0.02em] ${editable ? 'border-[#e7ebea] bg-[#f4f7f6] text-[#0f766e]' : 'border-[#ebeeec] bg-white text-[#15201d]'}`}>{v}</div>
      {editable && onChange && (
        <div className="flex gap-1.5">
          <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="flex h-[26px] w-[30px] items-center justify-center rounded-lg border border-[#ebeeec] bg-white text-[16px] font-bold text-[#0f766e] active:scale-90">−</button>
          <button type="button" onClick={() => onChange(Math.min(19, value + 1))} className="flex h-[26px] w-[30px] items-center justify-center rounded-lg border border-[#ebeeec] bg-white text-[16px] font-bold text-[#0f766e] active:scale-90">+</button>
        </div>
      )}
    </div>
  );
}

function Team({ t }: { t: TeamLite }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-[13px] border border-[#e7ebea] bg-[#f4f7f6] text-[27px] leading-none">{t.flag}</div>
      <div className="max-w-[96px] text-[13px] font-semibold tracking-tight">{t.name}</div>
    </div>
  );
}

export default function MatchCard({ match, pred, saved, onChange, onSave }: {
  match: Match;
  pred: Score;
  saved: Score | null;
  onChange: (s: Score) => void;
  onSave: () => void;
}) {
  const open = match.status === 'open';
  const finished = match.status === 'finished';
  const locked = match.status === 'locked';
  const isDraw = pred.home === pred.away;
  const needsAdvancing = open && match.isKnockout && isDraw;
  const dirty = !saved || saved.home !== pred.home || saved.away !== pred.away || saved.advancing !== pred.advancing;
  const canSave = open && dirty && (!needsAdvancing || !!pred.advancing);

  // Knockout advancing team info (za finished stanje)
  const advTeam = match.actualAdvancingTeam === match.home.name ? match.home
    : match.actualAdvancingTeam === match.away.name ? match.away : null;
  const advCode = match.actualAdvancingTeam === match.home.name ? match.home.code
    : match.actualAdvancingTeam === match.away.name ? match.away.code : null;
  const userAdvCode = saved?.advancing;
  const userAdvTeam = userAdvCode === match.home.code ? match.home
    : userAdvCode === match.away.code ? match.away : null;
  const advancingCorrect = !!(userAdvCode && advCode && userAdvCode === advCode);

  const badge = open
    ? { c: 'bg-[#eaf6f0] text-[#15803d]', d: 'bg-[#15803d]', t: 'Odprto' }
    : locked
      ? { c: 'bg-[#fbeceb] text-[#c0392b]', d: 'bg-[#c0392b]', t: 'Zaklenjeno' }
      : { c: 'bg-[#eef1f0] text-[#5b6470]', d: 'bg-[#aab0b8]', t: 'Končano' };

  return (
    <div className="overflow-hidden rounded-[18px] border border-[#ebeeec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03),0_10px_26px_rgba(16,24,40,0.05)]">
      <div className="flex items-center justify-between border-b border-[#ebeeec] px-4 py-[13px]">
        <span className="text-[12.5px] font-medium text-[#6b7280]">{match.whenLabel}</span>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-[10px] font-bold uppercase tracking-[0.07em] ${badge.c}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${badge.d}`} />{badge.t}
        </span>
      </div>

      <div className="px-4 pb-4 pt-[18px]">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Team t={match.home} />
          <div className="flex flex-col items-center gap-[6px]">
            <div className="flex items-center gap-[9px]">
              <Stepper editable={open} value={pred.home} readValue={finished ? match.actual?.home : saved?.home ?? pred.home} onChange={(v) => onChange({ ...pred, home: v })} />
              <span className="text-[22px] font-bold text-[#cfd5d3]">:</span>
              <Stepper editable={open} value={pred.away} readValue={finished ? match.actual?.away : saved?.away ?? pred.away} onChange={(v) => onChange({ ...pred, away: v })} />
            </div>
            {finished && match.actualAdvancingTeam && (
              <div className="flex flex-col items-center gap-[3px]">
                <span className="rounded-full bg-[#eef1f0] px-[7px] py-[2px] text-[9.5px] font-bold tracking-wide text-[#6b7280]">po 90 min</span>
                {match.actualPenaltyHome !== null && match.actualPenaltyHome !== undefined && (
                  <span className="text-[11px] font-bold text-[#9aa1ab] tabular-nums">
                    pen. {match.actualPenaltyHome}:{match.actualPenaltyAway}
                  </span>
                )}
              </div>
            )}
          </div>
          <Team t={match.away} />
        </div>

        {needsAdvancing && (
          <div className="mt-3.5 flex flex-wrap items-center gap-2 rounded-xl border border-[#b9e7d4] bg-[#ecfdf5] px-3 py-2.5">
            <span className="flex-1 text-[11.5px] font-semibold text-[#065f46]">Remi — kdo napreduje?</span>
            {[match.home, match.away].map((t) => (
              <button key={t.code} type="button" onClick={() => onChange({ ...pred, advancing: t.code })}
                className={`inline-flex items-center gap-1.5 rounded-lg border-[1.5px] px-2.5 py-1.5 text-[11.5px] font-semibold ${pred.advancing === t.code ? 'border-[#0f766e] bg-[#e9f7f5] text-[#0f766e]' : 'border-[#cdeadd] bg-white text-[#374151]'}`}>
                <span>{t.flag}</span>{t.name}
              </button>
            ))}
          </div>
        )}

        {open && match.hint && <div className="mt-3.5"><MatchHint data={match.hint} /></div>}

        {finished && (
          <div className="mt-3.5 flex flex-col gap-[8px] rounded-[13px] border border-[#ebeeec] bg-[#fafbfb] px-3.5 py-3">
            {/* Kazenski streli: kdo napreduje */}
            {match.actualAdvancingTeam && advTeam && (
              <div className="flex items-center justify-between border-b border-[#ebeeec] pb-[8px] text-[11.5px]">
                <span className="text-[#9aa1ab]">Kazenski streli — napreduje</span>
                <div className="flex items-center gap-[7px]">
                  <span className="font-bold text-[#15201d]">{advTeam.flag} {match.actualAdvancingTeam}</span>
                  {userAdvTeam && (
                    <span className={`rounded-full px-[7px] py-[2px] text-[10px] font-bold ${advancingCorrect ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fef3f2] text-[#d92d20]'}`}>
                      {advancingCorrect ? '✓ +bonus' : `✕ ${userAdvTeam.flag}`}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <div className="text-[12px] text-[#6b7280]">
                Tvoja napoved{' '}
                <b className="ml-1 text-[14.5px] font-bold tabular-nums text-[#15201d]">{saved?.home ?? '–'} : {saved?.away ?? '–'}</b>
              </div>
              <div className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-bold ${(match.earned ?? 0) === 0 ? 'bg-[#eef1f0] text-[#9aa1ab]' : 'bg-[#e9f7f5] text-[#0f766e]'}`}>
                {(match.earned ?? 0) === 0 ? '0 točk' : `+${match.earned} ${ptsWord(match.earned ?? 0)}`}
              </div>
            </div>
          </div>
        )}

        {open && (
          <button type="button" disabled={!canSave} onClick={onSave}
            className={`mt-4 h-[46px] w-full rounded-[13px] text-[14.5px] font-semibold transition ${!dirty ? 'bg-[#e7f6ed] text-[#15803d]' : canSave ? 'bg-[#0f766e] text-white hover:bg-[#0c5f58] active:translate-y-px' : 'cursor-default bg-[#f1f3f2] text-[#9aa1ab]'}`}>
            {!dirty ? '✓ Napoved shranjena' : needsAdvancing && !pred.advancing ? 'Izberi, kdo napreduje' : 'Shrani napoved'}
          </button>
        )}
        {locked && <div className="mt-4 flex h-[46px] w-full items-center justify-center rounded-[13px] bg-[#f1f3f2] text-[14px] font-semibold text-[#9aa1ab]">Napovedi zaklenjene</div>}
      </div>
    </div>
  );
}
