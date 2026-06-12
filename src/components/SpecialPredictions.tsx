'use client';

/**
 * SpecialPredictions — "Posebne napovedi" (Football Predictor), premium slog.
 *
 * Glavne napovedi (+10): zmagovalec prvenstva (select), najboljši strelec (input),
 * najboljši igralec (input). Zmagovalci 12 skupin (+3 vsaka, select).
 * Brez okrasnih emojijev (le zastave v opcijah). En sam sticky gumb za shranjevanje.
 */

import { useMemo, useState } from 'react';

export type TeamOption = { code: string; name: string; flag?: string };

export type SpecialState = {
  champion?: string;        // team code
  topScorer?: string;       // ime
  bestPlayer?: string;      // ime
  groupWinners: Record<string, string>; // groupId -> team name/code
};

export type SpecialPredictionsProps = {
  championOptions: TeamOption[];
  groups: { id: string; teams: TeamOption[] }[];   // 12 skupin
  value: SpecialState;
  savedCount: number;       // koliko oddanih
  totalCount: number;       // skupaj (npr. 15)
  lockLabel?: string;       // npr. "11. junija ob 20:00"
  maxBonus?: number;        // npr. 66
  locked?: boolean;
  onChange: (next: SpecialState) => void;
  onSave: () => void;
};

const Chevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9aa1ab]">
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const fieldCls = 'w-full rounded-xl border border-[#ebeeec] bg-[#fbfcfc] px-3.5 text-[14px] text-[#15201d] outline-none transition focus:border-[#0f766e] focus:shadow-[0_0_0_3px_rgba(15,118,110,0.10)]';

function PredCard({ title, q, children }: { title: string; q: string; children: React.ReactNode }) {
  return (
    <div className="mb-[11px] rounded-2xl border border-[#ebeeec] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-[15px] font-bold tracking-tight">{title}</div>
          <div className="mt-[3px] text-[12.5px] leading-snug text-[#6b7280]">{q}</div>
        </div>
        <span className="flex-none whitespace-nowrap rounded-full bg-[#e9f7f5] px-[11px] py-[5px] text-[12px] font-bold text-[#0f766e]">+10</span>
      </div>
      {children}
    </div>
  );
}

export default function SpecialPredictions(p: SpecialPredictionsProps) {
  const [v, setV] = useState<SpecialState>(p.value);
  const set = (patch: Partial<SpecialState>) => { const n = { ...v, ...patch }; setV(n); p.onChange(n); };
  const setGroup = (gid: string, team: string) => set({ groupWinners: { ...v.groupWinners, [gid]: team } });

  return (
    <div className="mx-auto max-w-[600px] pb-[90px]">
      {/* summary */}
      <div className="mb-2 flex items-center justify-between gap-4 rounded-2xl border border-[#ebeeec] border-l-[3px] border-l-[#0f766e] bg-white px-[18px] py-4 shadow-[0_1px_2px_rgba(16,24,40,0.03),0_10px_26px_rgba(16,24,40,0.05)]">
        <div>
          <div className="text-[15px] font-bold tracking-tight">Posebne napovedi</div>
          <div className="mt-1 text-[12.5px] leading-snug text-[#6b7280]">Zaklep {p.lockLabel ?? '11. junija ob 20:00'} — do takrat lahko spreminjaš.</div>
        </div>
        <div className="flex-none text-right">
          <div className="text-[26px] font-extrabold leading-none tracking-[-0.03em] text-[#0f766e]">{p.maxBonus ?? 66}</div>
          <div className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#9aa1ab]">možnih bonus točk</div>
        </div>
      </div>

      {/* glavne napovedi */}
      <div className="mb-[11px] mt-[26px] px-0.5 text-[11px] font-bold uppercase tracking-[0.07em] text-[#9aa1ab]">Glavne napovedi · +10 točk vsaka</div>

      <PredCard title="Zmagovalec prvenstva" q="Katera ekipa bo zmagala SP 2026?">
        <div className="relative">
          <select value={v.champion ?? ''} onChange={(e) => set({ champion: e.target.value })} className={`${fieldCls} h-[46px] cursor-pointer appearance-none pr-10`}>
            <option value="" disabled>Izberi ekipo…</option>
            {p.championOptions.map((t) => <option key={t.code} value={t.code}>{t.flag ? `${t.flag} ${t.name}` : t.name}</option>)}
          </select>
          <Chevron />
        </div>
      </PredCard>

      <PredCard title="Najboljši strelec" q="Kdo bo dosegel največ zadetkov na SP?">
        <input value={v.topScorer ?? ''} onChange={(e) => set({ topScorer: e.target.value })} placeholder="Ime igralca…" className={`${fieldCls} h-[46px]`} />
      </PredCard>

      <PredCard title="Najboljši igralec — Zlata žoga" q="Kdo bo razglašen za najboljšega igralca?">
        <input value={v.bestPlayer ?? ''} onChange={(e) => set({ bestPlayer: e.target.value })} placeholder="Ime igralca…" className={`${fieldCls} h-[46px]`} />
      </PredCard>

      {/* zmagovalci skupin */}
      <div className="mb-[11px] mt-[26px] px-0.5 text-[11px] font-bold uppercase tracking-[0.07em] text-[#9aa1ab]">Zmagovalci skupin · +3 točke vsaka</div>
      <div className="overflow-hidden rounded-2xl border border-[#ebeeec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
        {p.groups.map((g) => (
          <div key={g.id} className="grid grid-cols-[1fr_168px] items-center gap-3.5 border-t border-[#ebeeec] px-4 py-[13px] first:border-t-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 text-[14px] font-bold">Skupina {g.id}<span className="rounded-full bg-[#e9f7f5] px-[7px] py-0.5 text-[10.5px] font-bold text-[#0f766e]">+3</span></div>
              <div className="mt-[3px] truncate text-[11px] text-[#9aa1ab]">{g.teams.map((t) => t.name).join(' · ')}</div>
            </div>
            <div className="relative">
              <select value={v.groupWinners[g.id] ?? ''} onChange={(e) => setGroup(g.id, e.target.value)} className={`${fieldCls} h-10 cursor-pointer appearance-none pr-9 text-[13px]`}>
                <option value="" disabled>Izberi…</option>
                {g.teams.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
              </select>
              <Chevron />
            </div>
          </div>
        ))}
      </div>

      {/* sticky save */}
      <div className="fixed inset-x-0 bottom-0 border-t border-[#ebeeec] bg-white/90 px-5 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-[600px] items-center justify-between gap-3.5">
          <div className="text-[12.5px] text-[#6b7280]"><b className="font-bold text-[#0f766e]">{p.savedCount}</b> od {p.totalCount} napovedi oddanih</div>
          <button type="button" onClick={p.onSave} className="h-[46px] rounded-[13px] bg-[#0f766e] px-[26px] text-[14.5px] font-semibold text-white transition hover:bg-[#0c5f58] active:translate-y-px">
            Shrani posebne napovedi
          </button>
        </div>
      </div>
    </div>
  );
}
