'use client';

/**
 * Profile — "Profil" (Football Predictor), premium slog.
 *
 * Profilna kartica · zasebnost (opt-in) · administracija · odjava · nevarno območje ·
 * otroški profili (dodaj / seznam / odstrani). Brez okrasnih emojijev.
 */

import { useState } from 'react';

export type Child = { id: string; name: string; initials: string; avatarUrl?: string | null };

export type ProfileProps = {
  name: string;
  email: string;
  initials: string;
  avatarUrl?: string | null;
  optIn: boolean;
  isAdmin?: boolean;
  children?: Child[];
  onToggleOptIn: (next: boolean) => void;
  onOpenAdmin?: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onAddChild?: () => void;
  onRemoveChild?: (id: string) => void;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-[9px] mt-5 px-1.5 text-[11px] font-bold uppercase tracking-[0.07em] text-[#9aa1ab]">{children}</div>;
}

export default function Profile(p: ProfileProps) {
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="mx-auto max-w-[420px]">
      <h1 className="m-0 mb-4 text-[26px] font-extrabold tracking-[-0.025em]">Profil</h1>

      {/* profilna kartica */}
      <div className="flex items-center gap-3.5 rounded-[18px] border border-[#ebeeec] bg-white px-4 py-[18px] shadow-[0_1px_2px_rgba(16,24,40,0.03),0_10px_26px_rgba(16,24,40,0.05)]">
        {p.avatarUrl
          ? <img src={p.avatarUrl} alt="" className="h-[58px] w-[58px] flex-none rounded-full object-cover" />
          : <div className="flex h-[58px] w-[58px] flex-none items-center justify-center rounded-full bg-[linear-gradient(140deg,#0f766e,#2dd4bf)] text-[22px] font-bold text-white">{p.initials}</div>}
        <div className="min-w-0">
          <div className="truncate text-[18px] font-bold tracking-tight">{p.name}</div>
          <div className="truncate text-[13px] text-[#6b7280]">{p.email}</div>
        </div>
      </div>

      {/* zasebnost */}
      <SectionLabel>Zasebnost</SectionLabel>
      <button type="button" onClick={() => p.onToggleOptIn(!p.optIn)}
        className={`flex w-full items-center gap-3.5 rounded-2xl border px-4 py-[15px] text-left transition ${p.optIn ? 'border-[#0f766e] bg-[#e9f7f5]' : 'border-[#ebeeec] bg-white'}`}>
        <div className="flex-1">
          <div className="text-[14px] font-semibold">Viden na globalni lestvici</div>
          <div className="mt-[3px] text-[12px] leading-snug text-[#6b7280]">Tvoje ime in točke so vidni vsem uporabnikom.</div>
        </div>
        <div className={`relative h-7 w-[46px] flex-none rounded-full transition ${p.optIn ? 'bg-[#0f766e]' : 'bg-[#d1d6d4]'}`}>
          <span className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-all ${p.optIn ? 'left-[21px]' : 'left-[3px]'}`} />
        </div>
      </button>

      {/* administracija */}
      {p.isAdmin && (
        <>
          <SectionLabel>Administracija</SectionLabel>
          <button type="button" onClick={p.onOpenAdmin}
            className="flex w-full items-center gap-3 rounded-2xl border border-[#ebeeec] bg-white px-4 py-[15px] text-left">
            <span className="flex-1 text-[14px] font-semibold">Admin panel</span>
            <svg width="8" height="14" viewBox="0 0 8 14" className="text-[#cfd5d3]"><path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </>
      )}

      {/* račun */}
      <SectionLabel>Račun</SectionLabel>
      <button type="button" onClick={p.onLogout}
        className="h-11 w-full rounded-[13px] border border-[#ebeeec] bg-white text-[13.5px] font-semibold text-[#15201d] transition hover:border-[#d8dddb]">
        Odjava
      </button>

      {/* nevarno območje */}
      <div className="mt-[18px] rounded-2xl border border-[#f3d3cf] bg-[#fdf1f0] p-4">
        <div className="text-[13.5px] font-bold text-[#c0392b]">Nevarno območje</div>
        <div className="mb-3 mt-1.5 text-[12px] leading-snug text-[#9a5a52]">Trajno izbriše tvoj račun in vse napovedi. Tega dejanja ni mogoče razveljaviti.</div>
        {!confirm ? (
          <button type="button" onClick={() => setConfirm(true)}
            className="h-[42px] w-full rounded-[11px] border border-[#e7b8b2] bg-white text-[13.5px] font-semibold text-[#c0392b] transition hover:bg-[#fdeceb]">
            Izbriši račun
          </button>
        ) : (
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setConfirm(false)} className="h-[42px] flex-1 rounded-[11px] border border-[#ebeeec] bg-white text-[13.5px] font-semibold">Prekliči</button>
            <button type="button" onClick={p.onDeleteAccount} className="h-[42px] flex-1 rounded-[11px] bg-[#c0392b] text-[13.5px] font-semibold text-white">Da, izbriši</button>
          </div>
        )}
      </div>

      {/* otroški profili */}
      <SectionLabel>Otroški profili</SectionLabel>
      <div className="mb-3 flex items-start justify-between gap-3.5">
        <div className="pt-0.5 text-[12px] leading-snug text-[#6b7280]">Otrok napoveduje prek tvojega računa — brez svojega emaila.</div>
        <button type="button" onClick={p.onAddChild}
          className="inline-flex h-[38px] flex-none items-center gap-1.5 rounded-[11px] bg-[#0f766e] px-[15px] text-[12.5px] font-semibold text-white transition hover:bg-[#0c5f58]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
          Dodaj otroka
        </button>
      </div>
      <div className="flex flex-col gap-2.5">
        {(p.children ?? []).map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-[14px] border border-[#ebeeec] bg-white px-3.5 py-[11px]">
            {c.avatarUrl
              ? <img src={c.avatarUrl} alt="" className="h-9 w-9 flex-none rounded-full object-cover" />
              : <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#eef1f0] text-[13px] font-bold text-[#5b6470]">{c.initials}</div>}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold">{c.name}</div>
              <div className="text-[11.5px] text-[#9aa1ab]">Otroški profil</div>
            </div>
            <button type="button" onClick={() => p.onRemoveChild?.(c.id)} aria-label="Odstrani"
              className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[9px] border border-[#f0dad6] bg-[#fdf4f3] text-[#c0392b] transition hover:bg-[#fbe8e6]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
