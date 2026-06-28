'use client';

/**
 * SpecialPredictions — "Posebne napovedi" (Football Predictor), premium slog.
 *
 * Dve stanji:
 *  • ODPRTO  — urejanje (+10 glavne, +3 zmagovalci skupin), en sticky gumb.
 *  • LOCKED  — vse onemogočeno (brez spustnih menijev), zaklenjen header + statistika,
 *              vsaka napoved ocenjena: pravilno / napačno (pokažemo pravega) / še poteka, + točke.
 *
 * Locked je dejansko upoštevan v telesu: `const disabled = p.locked ?? false;`
 * disablea vsa polja, set() zgodaj vrne, gumb zamenja zaklenjena vrstica, header pokaže status.
 *
 * Brez okrasnih emojijev (le zastave v opcijah).
 */

import { useMemo, useState } from 'react';

export type TeamOption = { code: string; name: string; flag?: string };

export type SpecialState = {
  champion?: string;        // team code
  topScorer?: string;       // ime
  bestPlayer?: string;      // ime
  groupWinners: Record<string, string>; // groupId -> team code/name
};

/** rezultat ocene posamezne napovedi (ključ: 'champion'|'topScorer'|'bestPlayer'|`group:<id>`) */
export type ItemResult = {
  status: 'correct' | 'wrong' | 'pending';
  actual?: string;          // pravi odgovor (pri 'wrong' ga pokažemo)
  points?: number;          // dejansko dodeljene točke (default: potencial pri correct)
};

export type SpecialPredictionsProps = {
  championOptions: TeamOption[];
  groups: { id: string; teams: TeamOption[] }[];   // 12 skupin
  value: SpecialState;
  savedCount: number;       // koliko oddanih
  totalCount: number;       // skupaj (npr. 15)
  lockLabel?: string;       // odprto: rok zaklepa, npr. "11. junija ob 20:00"
  lockedAtLabel?: string;   // locked: kdaj se je zaklenilo, npr. "12. junija ob 00:00"
  maxBonus?: number;        // npr. 66
  /** ko je true: vsa polja in gumb onemogočeni; prikaže se ocenjeno/zaklenjeno stanje */
  locked?: boolean;
  /** ocene posameznih napovedi (samo v locked stanju) */
  results?: Record<string, ItemResult>;
  onChange: (next: SpecialState) => void;
  onSave: () => void;
};

/* ── ikone ─────────────────────────────────────────────────── */
const Chevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9aa1ab]">
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const LockIcon = ({ s = 13 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
);
const CheckIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M5 12l5 5 9-10" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const XIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>;
const ClockIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;

const fieldCls = 'w-full rounded-xl border border-[#ebeeec] bg-[#fbfcfc] px-3.5 text-[14px] text-[#15201d] outline-none transition focus:border-[#0f766e] focus:shadow-[0_0_0_3px_rgba(15,118,110,0.10)] disabled:cursor-not-allowed disabled:opacity-60';

/* ── zaklenjeno polje (prikaz + ključavnica + ton ocene) ───── */
function LockedField({ flag, label, tone, h = 46 }: { flag?: string; label: string; tone: 'correct' | 'wrong' | 'neutral'; h?: number }) {
  const cls =
    tone === 'correct' ? 'border-[#bfe6cf] bg-[#f1faf4]' :
    tone === 'wrong' ? 'border-[#f0cfca] bg-[#fdf3f1]' :
    'border-[#ebeeec] bg-[#eef1f0]';
  const valCls = tone === 'correct' ? 'text-[#15803d]' : tone === 'wrong' ? 'text-[#15201d] line-through decoration-[#d99]' : 'text-[#15201d]';
  return (
    <div className={`flex items-center gap-2.5 rounded-xl border px-3.5 ${cls}`} style={{ height: h }} aria-disabled>
      {flag && <span className="text-[16px] leading-none">{flag}</span>}
      <span className={`min-w-0 flex-1 truncate text-[13.5px] font-semibold ${valCls}`}>{label}</span>
      <span className="flex-none text-[#9aa1ab]"><LockIcon /></span>
    </div>
  );
}

/* ── ocena → pill ──────────────────────────────────────────── */
function GradePill({ r, potential }: { r?: ItemResult; potential: number }) {
  if (!r || r.status === 'pending') {
    return <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#eef1f0] px-2.5 py-[5px] text-[11px] font-bold text-[#5b6470]"><ClockIcon /> še poteka · možnih +{potential}</span>;
  }
  if (r.status === 'correct') {
    return <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#eaf6f0] px-2.5 py-[5px] text-[11px] font-bold text-[#15803d]"><CheckIcon /> +{r.points ?? potential}</span>;
  }
  return <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#fdf1f0] px-2.5 py-[5px] text-[11px] font-bold text-[#c0392b]"><XIcon /> 0</span>;
}

const toneOf = (r?: ItemResult): 'correct' | 'wrong' | 'neutral' => r?.status === 'correct' ? 'correct' : r?.status === 'wrong' ? 'wrong' : 'neutral';

/* ── komponenta ────────────────────────────────────────────── */
export default function SpecialPredictions(p: SpecialPredictionsProps) {
  const [v, setV] = useState<SpecialState>(p.value);
  const disabled = p.locked ?? false;
  const results = p.results;
  const set = (patch: Partial<SpecialState>) => { if (disabled) return; const n = { ...v, ...patch }; setV(n); p.onChange(n); };
  const setGroup = (gid: string, team: string) => set({ groupWinners: { ...v.groupWinners, [gid]: team } });

  const champOpt = (code?: string) => p.championOptions.find((t) => t.code === code);
  const champLabel = (() => { const t = champOpt(v.champion); return t ? `${t.flag ? t.flag + ' ' : ''}${t.name}` : '—'; })();

  // statistika (locked): osvojeno / še v igri / možnih
  const stats = useMemo(() => {
    let won = 0, live = 0;
    const tally = (key: string, pot: number) => {
      const r = results?.[key];
      if (r?.status === 'correct') won += r.points ?? pot;
      else if (!r || r.status === 'pending') live += pot;
      // wrong → niti won niti live
    };
    if (disabled) {
      tally('champion', 10); tally('topScorer', 10); tally('bestPlayer', 10);
      p.groups.forEach((g) => tally(`group:${g.id}`, 3));
    }
    return { won, live, max: p.maxBonus ?? 66 };
  }, [results, disabled, p.groups, p.maxBonus]);

  const mainItems = [
    { key: 'champion', title: 'Zmagovalec prvenstva', q: 'Katera ekipa bo zmagala SP 2026?', flag: champOpt(v.champion)?.flag, label: champLabel },
    { key: 'topScorer', title: 'Najboljši strelec', q: 'Kdo bo dosegel največ zadetkov na SP?', flag: undefined as string | undefined, label: v.topScorer || '—' },
    { key: 'bestPlayer', title: 'Najboljši igralec — Zlata žoga', q: 'Kdo bo razglašen za najboljšega igralca?', flag: undefined as string | undefined, label: v.bestPlayer || '—' },
  ];

  return (
    <div className="mx-auto max-w-[600px] pb-[90px]">
      {/* ── summary ── */}
      {disabled ? (
        <div className="rounded-2xl border border-[#ebeeec] border-l-[3px] border-l-[#9aa1ab] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03),0_10px_26px_rgba(16,24,40,0.05)]">
          <div className="flex items-center gap-3">
            <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-[#eef1f0] text-[#5b6470]"><LockIcon s={17} /></span>
            <span className="text-[15.5px] font-bold">Posebne napovedi</span>
            <span className="ml-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#fdf1f0] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.04em] text-[#c0392b]"><LockIcon s={9} /> Zaklenjeno</span>
          </div>
          <p className="my-3 text-[12px] leading-snug text-[#6b7280]">Zaklenjeno {p.lockedAtLabel ?? '12. junija ob 00:00'} — sprememb ni več mogoče. Točke se dodelijo ob razpletu.</p>
          <div className="flex gap-2">
            {[
              { n: stats.won, k: 'osvojenih', c: 'text-[#15803d]' },
              { n: stats.live, k: 'še v igri', c: 'text-[#b45309]' },
              { n: stats.max, k: 'možnih', c: 'text-[#9aa1ab]' },
            ].map((s) => (
              <div key={s.k} className="flex-1 rounded-[11px] border border-[#ebeeec] bg-[#fafbfb] py-2.5 text-center">
                <div className={`text-[20px] font-extrabold leading-none tracking-[-0.02em] ${s.c}`}>{s.n}</div>
                <div className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.04em] text-[#9aa1ab]">{s.k}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#ebeeec] border-l-[3px] border-l-[#0f766e] bg-white px-[18px] py-4 shadow-[0_1px_2px_rgba(16,24,40,0.03),0_10px_26px_rgba(16,24,40,0.05)]">
          <div>
            <div className="text-[15px] font-bold tracking-tight">Posebne napovedi</div>
            <div className="mt-1 text-[12.5px] leading-snug text-[#6b7280]">Zaklep {p.lockLabel ?? '11. junija ob 20:00'} — do takrat lahko spreminjaš.</div>
          </div>
          <div className="flex-none text-right">
            <div className="text-[26px] font-extrabold leading-none tracking-[-0.03em] text-[#0f766e]">{p.maxBonus ?? 66}</div>
            <div className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#9aa1ab]">možnih bonus točk</div>
          </div>
        </div>
      )}

      {/* ── glavne napovedi ── */}
      <div className="mb-[11px] mt-[26px] px-0.5 text-[11px] font-bold uppercase tracking-[0.07em] text-[#9aa1ab]">Glavne napovedi · +10 točk vsaka</div>

      {mainItems.map((it) => {
        const r = results?.[it.key];
        return (
          <div key={it.key} className={`mb-[11px] rounded-2xl border p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)] ${disabled ? 'border-[#e3e8e6] bg-[#f5f7f7]' : 'border-[#ebeeec] bg-white'}`}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-[15px] font-bold tracking-tight">{it.title}</div>
                <div className="mt-[3px] text-[12.5px] leading-snug text-[#6b7280]">{it.q}</div>
              </div>
              <span className="flex-none whitespace-nowrap rounded-full bg-[#e9f7f5] px-[11px] py-[5px] text-[12px] font-bold text-[#0f766e]">+10</span>
            </div>

            {disabled ? (
              <>
                <LockedField flag={it.flag} label={it.label} tone={toneOf(r)} />
                <div className="mt-3 flex items-center justify-between gap-2.5 border-t border-dashed border-[#dde3e1] pt-3">
                  <span className="text-[12px] text-[#6b7280]">{r?.status === 'wrong' && r.actual ? <>Pravilno: <b className="font-bold text-[#15803d]">{r.actual}</b></> : 'Razplet ob koncu prvenstva'}</span>
                  <GradePill r={r} potential={10} />
                </div>
              </>
            ) : it.key === 'champion' ? (
              <div className="relative">
                <select value={v.champion ?? ''} onChange={(e) => set({ champion: e.target.value })} className={`${fieldCls} h-[46px] cursor-pointer appearance-none pr-10`}>
                  <option value="" disabled>Izberi ekipo…</option>
                  {p.championOptions.map((t) => <option key={t.code} value={t.code}>{t.flag ? `${t.flag} ${t.name}` : t.name}</option>)}
                </select>
                <Chevron />
              </div>
            ) : (
              <input
                value={(it.key === 'topScorer' ? v.topScorer : v.bestPlayer) ?? ''}
                onChange={(e) => set(it.key === 'topScorer' ? { topScorer: e.target.value } : { bestPlayer: e.target.value })}
                placeholder="Ime igralca…" className={`${fieldCls} h-[46px]`} />
            )}
          </div>
        );
      })}

      {/* ── zmagovalci skupin ── */}
      <div className="mb-[11px] mt-[26px] px-0.5 text-[11px] font-bold uppercase tracking-[0.07em] text-[#9aa1ab]">Zmagovalci skupin · +3 točke vsaka</div>
      <div className={`overflow-hidden rounded-2xl border shadow-[0_1px_2px_rgba(16,24,40,0.03)] ${disabled ? 'border-[#e3e8e6] bg-[#f5f7f7]' : 'border-[#ebeeec] bg-white'}`}>
        {p.groups.map((g) => {
          const r = results?.[`group:${g.id}`];
          const pick = v.groupWinners[g.id];
          const pickTeam = g.teams.find((t) => t.code === pick || t.name === pick);
          const pickLabel = pickTeam?.name ?? pick ?? '—';
          return disabled ? (
            <div key={g.id} className="border-t border-[#e3e8e6] px-4 py-[13px] first:border-t-0">
              <div className="mb-2.5 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 whitespace-nowrap text-[13.5px] font-bold">Skupina {g.id}<span className="rounded-full bg-[#e9f7f5] px-[7px] py-0.5 text-[10px] font-bold text-[#0f766e]">+3</span></div>
                <GradePill r={r} potential={3} />
              </div>
              <LockedField label={pickLabel} tone={toneOf(r)} h={40} />
              <div className="mt-2 truncate text-[10.5px] text-[#9aa1ab]">{g.teams.map((t) => t.name).join(' · ')}</div>
              {r?.status === 'wrong' && r.actual && <div className="mt-1.5 text-[11px] font-bold text-[#15803d]">Pravilno: {r.actual}</div>}
            </div>
          ) : (
            <div key={g.id} className="grid grid-cols-[1fr_168px] items-center gap-3.5 border-t border-[#ebeeec] px-4 py-[13px] first:border-t-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 text-[14px] font-bold">Skupina {g.id}<span className="rounded-full bg-[#e9f7f5] px-[7px] py-0.5 text-[10.5px] font-bold text-[#0f766e]">+3</span></div>
                <div className="mt-[3px] truncate text-[11px] text-[#9aa1ab]">{g.teams.map((t) => t.name).join(' · ')}</div>
              </div>
              <div className="relative">
                <select value={pick ?? ''} onChange={(e) => setGroup(g.id, e.target.value)} className={`${fieldCls} h-10 cursor-pointer appearance-none pr-9 text-[13px]`}>
                  <option value="" disabled>Izberi…</option>
                  {g.teams.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
                </select>
                <Chevron />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── footer ── */}
      {disabled ? (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-[13px] border border-[#e3e8e6] bg-[#eef1f0] py-3.5 text-[13px] font-semibold text-[#5b6470]">
          <LockIcon s={14} /> Napovedi zaklenjene · oddanih {p.savedCount} / {p.totalCount}
        </div>
      ) : (
        <div className="fixed inset-x-0 bottom-0 border-t border-[#ebeeec] bg-white/90 px-5 py-3.5 backdrop-blur-md">
          <div className="mx-auto flex max-w-[600px] items-center justify-between gap-3.5">
            <div className="text-[12.5px] text-[#6b7280]"><b className="font-bold text-[#0f766e]">{p.savedCount}</b> od {p.totalCount} napovedi oddanih</div>
            <button type="button" onClick={p.onSave} className="h-[46px] rounded-[13px] bg-[#0f766e] px-[26px] text-[14.5px] font-semibold text-white transition hover:bg-[#0c5f58] active:translate-y-px">
              Shrani posebne napovedi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
