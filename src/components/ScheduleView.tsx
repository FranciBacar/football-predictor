'use client';

/**
 * ScheduleView — "Po dnevih" pogled (kronološki razpored tekem).
 *
 * Reši problem: pri 12 skupinah + izločilnih bojih je lahko spregledana
 * tekma, ki je nisi nikoli odprl. Ta pogled prikaže VSE tekme po času, z dnevi,
 * napredkom in filtrom "Nenapovedane", ter dovoli napoved kar v vrstici.
 *
 * Vgradnja: kot način (mode) znotraj zavihka Napovedi — segmentni preklopnik
 * "Po skupinah / Po dnevih" (ne 5. tab, da spodnja navigacija ostane čista).
 *
 * Lasti draft-stanje napovedi; ob shranjevanju pokliče onSave(id, score).
 */

import { useMemo, useState, useEffect } from 'react';
import { ClosedRow, OpenRow, type Match, type Score } from './ScheduleRow';

const TZ = 'Europe/Ljubljana';
const dayKeyFmt = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: TZ });
const dowFmt = new Intl.DateTimeFormat('sl-SI', { weekday: 'long', timeZone: TZ });
const dateFmt = new Intl.DateTimeFormat('sl-SI', { day: 'numeric', month: 'short', timeZone: TZ });
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const word = (n: number) => (n === 1 ? 'tekma' : n === 2 ? 'tekmi' : n === 3 || n === 4 ? 'tekme' : 'tekem');

export type ScheduleViewProps = {
  matches: Match[];
  /** shranjene napovedi po match.id (vir resnice) */
  predictions: Record<string, Score>;
  /** klic ob shranjevanju ene napovedi */
  onSave: (matchId: string, score: Score) => void;
};

export default function ScheduleView({ matches, predictions, onSave }: ScheduleViewProps) {
  const [filter, setFilter] = useState<'all' | 'todo'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Score>>({});

  // Scroll na današnji dan ob prvem prikazu
  const todayKey = useMemo(() => dayKeyFmt.format(Date.now()), []);
  useEffect(() => {
    const el = document.getElementById(`day-${todayKey}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [todayKey]);

  const sorted = useMemo(() => [...matches].sort((a, b) => a.kickoffUtc - b.kickoffUtc), [matches]);

  const isPredicted = (m: Match) => !!predictions[m.id];
  const todo = sorted.filter((m) => m.status === 'open' && !isPredicted(m));
  const total = sorted.length;
  const done = sorted.filter(isPredicted).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const shown = filter === 'todo' ? todo : sorted;

  // group by local day
  const days = useMemo(() => {
    const out: { key: string; ts: number; items: Match[] }[] = [];
    const idx: Record<string, number> = {};
    for (const m of shown) {
      const k = dayKeyFmt.format(m.kickoffUtc);
      if (idx[k] === undefined) { idx[k] = out.length; out.push({ key: k, ts: m.kickoffUtc, items: [] }); }
      out[idx[k]].items.push(m);
    }
    return out;
  }, [shown]);

  const draftFor = (m: Match): Score => drafts[m.id] ?? predictions[m.id] ?? { home: 0, away: 0 };

  return (
    <div>
      {/* napredek */}
      <div className="px-4 pb-3">
        <div className="rounded-2xl border border-[#e6e9e8] bg-white p-[13px_15px] shadow-[0_4px_16px_rgba(16,24,40,0.04)]">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[14px] font-bold tracking-tight">Napovedal si <b className="text-[#0f766e]">{done}</b> / {total} tekem</span>
            <span className="text-[11.5px] font-medium text-[#6b7280]">{todo.length > 0 ? `še ${todo.length} odprtih` : 'vse oddane 🎉'}</span>
          </div>
          <div className="h-[7px] overflow-hidden rounded-full bg-[#eef2f1]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#0f766e] to-[#2dd4bf] transition-[width] duration-500" style={{ width: pct + '%' }} />
          </div>
        </div>
      </div>

      {/* filter */}
      <div className="flex gap-2 px-4 pb-1.5 pt-3">
        <button type="button" onClick={() => setFilter('all')}
          className={`inline-flex items-center gap-1.5 rounded-full border px-[14px] py-2 text-[12.5px] font-semibold transition ${filter === 'all' ? 'border-transparent bg-gradient-to-r from-[#0f766e] to-[#2dd4bf] text-white shadow-[0_4px_12px_rgba(15,118,110,0.26)]' : 'border-[#e6e9e8] bg-white text-[#374151]'}`}>
          Vse tekme
        </button>
        <button type="button" onClick={() => setFilter('todo')}
          className={`inline-flex items-center gap-1.5 rounded-full border px-[14px] py-2 text-[12.5px] font-semibold transition ${filter === 'todo' ? 'border-transparent bg-gradient-to-r from-[#0f766e] to-[#2dd4bf] text-white shadow-[0_4px_12px_rgba(15,118,110,0.26)]' : 'border-[#f3d8b0] bg-[#fffaf2] text-[#b45309]'}`}>
          ⚠️ Nenapovedane <span className="text-[11px] font-bold opacity-85">{todo.length}</span>
        </button>
      </div>

      {/* prazno stanje */}
      {shown.length === 0 && (
        <div className="mx-6 my-8 text-center text-[#6b7280]">
          <div className="mb-3 text-[40px]">🎉</div>
          <div className="text-[15px] font-bold text-[#1a1a1a]">Vse odprte tekme napovedane!</div>
          <div className="mt-1 text-[13px] leading-snug">Nič ti ne uide. Vrni se, ko se odprejo nove tekme.</div>
        </div>
      )}

      {/* dnevi */}
      {days.map((day) => {
        const dayTodo = day.items.filter((m) => m.status === 'open' && !isPredicted(m) && m.id !== openId).length;
        return (
          <section key={day.key} id={`day-${day.key}`} className="mb-1.5 scroll-mt-2">
            <header className="sticky top-0 z-[5] flex items-center justify-between gap-2.5 px-5 py-2.5 backdrop-blur-md" style={{ background: 'rgba(244,246,245,0.92)' }}>
              <div className="flex items-baseline gap-2">
                <span className="text-[13.5px] font-bold tracking-tight text-[#1a1a1a]">{cap(dowFmt.format(day.ts))}</span>
                <span className="text-[12px] font-medium text-[#6b7280]">{dateFmt.format(day.ts)}</span>
              </div>
              {dayTodo > 0
                ? <span className="whitespace-nowrap rounded-full bg-[#fdebd2] px-2.5 py-[3px] text-[10.5px] font-bold text-[#b45309]">{dayTodo} {word(dayTodo)} čaka</span>
                : <span className="whitespace-nowrap rounded-full bg-[#e7f6ed] px-2.5 py-[3px] text-[10.5px] font-bold text-[#15803d]">✓ urejeno</span>}
            </header>

            <div className="flex flex-col gap-2 px-4">
              {day.items.map((m) => (
                openId === m.id ? (
                  <OpenRow key={m.id} match={m}
                    draft={draftFor(m)} saved={predictions[m.id] ?? null}
                    onChange={(s) => setDrafts((d) => ({ ...d, [m.id]: s }))}
                    onSave={() => { onSave(m.id, draftFor(m)); setOpenId(null); }}
                    onCollapse={() => setOpenId(null)} />
                ) : (
                  <ClosedRow key={m.id} match={m} saved={predictions[m.id] ?? null}
                    onOpen={() => {
                      if (m.status !== 'open') return;
                      setDrafts((d) => ({ ...d, [m.id]: predictions[m.id] ?? { home: 0, away: 0 } }));
                      setOpenId(m.id);
                    }} />
                )
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
