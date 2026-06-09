'use client';

/**
 * Profile — nastavitve profila (Football Predictor), premium slog.
 *
 * Presentational: vsi podatki & handleri prihajajo kot props.
 * Vsebuje: profilna kartica · zasebnost · (admin gumb) · otroci · odjava · izbriši.
 */

import { useState } from 'react';
import Image from 'next/image';

export type Child = {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string | null;
};

export type ProfileProps = {
  name: string;
  email: string;
  initials: string;
  avatarUrl?: string | null;
  optIn: boolean;
  isAdmin?: boolean;
  children?: Child[];
  onToggleOptIn: () => void;
  onOpenAdmin?: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onAddChild?: () => void;
  onRemoveChild?: (id: string) => void;
};

export default function Profile({
  name, email, initials, avatarUrl,
  optIn, isAdmin, children,
  onToggleOptIn, onOpenAdmin,
  onLogout, onDeleteAccount,
  onAddChild, onRemoveChild,
}: ProfileProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex flex-col gap-3">

      {/* ── Profilna kartica ───────────────────────────────── */}
      <div className="overflow-hidden rounded-[18px] border border-[#ebeeec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03),0_10px_26px_rgba(16,24,40,0.05)]">
        <div className="flex items-center gap-4 px-5 py-5">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={name} width={60} height={60}
              className="rounded-full border-2 border-[#ebeeec] shrink-0" />
          ) : (
            <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full text-[22px] font-extrabold text-white"
              style={{ background: 'linear-gradient(140deg,#0f766e,#2dd4bf)' }}>
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[17px] font-bold tracking-tight text-[#15201d]">{name}</div>
            <div className="mt-0.5 truncate text-[13px] text-[#6b7280]">{email}</div>
          </div>
        </div>
      </div>

      {/* ── Zasebnost ─────────────────────────────────────── */}
      <div className="overflow-hidden rounded-[18px] border border-[#ebeeec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03),0_10px_26px_rgba(16,24,40,0.05)]">
        <div className="border-b border-[#ebeeec] px-5 py-4">
          <div className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#9aa1ab]">Zasebnost</div>
        </div>
        <button type="button" onClick={onToggleOptIn}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[#fafbfb]">
          <div className="min-w-0">
            <div className={`text-[14px] font-semibold ${optIn ? 'text-[#0f766e]' : 'text-[#15201d]'}`}>
              {optIn ? 'Viden na globalni lestvici' : 'Skrit z globalne lestvice'}
            </div>
            <div className="mt-0.5 text-[12.5px] text-[#6b7280]">
              {optIn ? 'Tvoje ime in točke so vidni vsem.' : 'Viden si samo znotraj svojih skupin.'}
            </div>
          </div>
          {/* iOS toggle */}
          <div className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-200 ${optIn ? 'bg-[#0f766e]' : 'bg-[#d1d5db]'}`}>
            <div className={`absolute top-[3px] h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${optIn ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
          </div>
        </button>
      </div>

      {/* ── Otroški profili ────────────────────────────────── */}
      <div className="overflow-hidden rounded-[18px] border border-[#ebeeec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03),0_10px_26px_rgba(16,24,40,0.05)]">
        <div className="flex items-center justify-between border-b border-[#ebeeec] px-5 py-4">
          <div className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#9aa1ab]">Otroški profili</div>
          {onAddChild && (
            <button type="button" onClick={onAddChild}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0f766e] px-3 py-1.5 text-[12px] font-bold text-white hover:bg-[#0c5f58] transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              Dodaj
            </button>
          )}
        </div>

        {(!children || children.length === 0) ? (
          <div className="px-5 py-5 text-center text-[13px] text-[#9aa1ab]">
            Še nimaš dodanih otroških profilov.
          </div>
        ) : (
          <div className="divide-y divide-[#ebeeec]">
            {children.map(kid => (
              <div key={kid.id} className="flex items-center gap-3 px-5 py-3.5">
                {kid.avatarUrl ? (
                  <Image src={kid.avatarUrl} alt={kid.name} width={38} height={38}
                    className="rounded-full border border-[#ebeeec] shrink-0" />
                ) : (
                  <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white"
                    style={{ background: 'linear-gradient(140deg,#0f766e,#2dd4bf)' }}>
                    {kid.initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-[#15201d]">{kid.name}</div>
                  <div className="text-[12px] text-[#9aa1ab]">Otroški profil</div>
                </div>
                {onRemoveChild && (
                  <button type="button" onClick={() => onRemoveChild(kid.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fdf1f0] text-[#c0392b] transition-colors hover:bg-[#fce4e2]"
                    aria-label="Odstrani otroški profil">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Račun ─────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-[18px] border border-[#ebeeec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03),0_10px_26px_rgba(16,24,40,0.05)]">
        <div className="border-b border-[#ebeeec] px-5 py-4">
          <div className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#9aa1ab]">Račun</div>
        </div>
        <div className="flex flex-col gap-0 divide-y divide-[#ebeeec]">
          {isAdmin && onOpenAdmin && (
            <button type="button" onClick={onOpenAdmin}
              className="flex w-full items-center gap-3 px-5 py-4 text-left text-[14px] font-semibold text-[#0f766e] transition-colors hover:bg-[#fafbfb]">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Admin panel
            </button>
          )}
          <button type="button" onClick={onLogout}
            className="flex w-full items-center gap-3 px-5 py-4 text-left text-[14px] font-semibold text-[#15201d] transition-colors hover:bg-[#fafbfb]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Odjava
          </button>
        </div>
      </div>

      {/* ── Nevarno območje ─────────────────────────────── */}
      <div className="overflow-hidden rounded-[18px] border border-[#f5c6c2] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03),0_10px_26px_rgba(16,24,40,0.05)]">
        <div className="border-b border-[#f5c6c2] px-5 py-4">
          <div className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#c0392b]">Nevarno območje</div>
        </div>
        <div className="px-5 py-4">
          {!confirmDelete ? (
            <>
              <p className="mb-3 text-[13px] leading-[1.5] text-[#6b7280]">
                Trajno izbriše tvoj račun, vse napovedi in podatke. Te akcije ni mogoče razveljaviti.
              </p>
              <button type="button" onClick={() => setConfirmDelete(true)}
                className="flex w-full items-center justify-center gap-2 rounded-[13px] border border-[#f5c6c2] py-[13px] text-[14px] font-semibold text-[#c0392b] transition-colors hover:bg-[#fdf1f0]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Izbriši račun
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="rounded-[13px] bg-[#fdf1f0] px-4 py-3 text-[13px] font-semibold leading-[1.5] text-[#c0392b]">
                Si prepričan? Vse napovedi in podatki bodo trajno izgubljeni.
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-[13px] border border-[#ebeeec] py-[11px] text-[14px] font-semibold text-[#6b7280] transition-colors hover:bg-[#fafbfb]">
                  Prekliči
                </button>
                <button type="button" onClick={onDeleteAccount}
                  className="flex-1 rounded-[13px] bg-[#c0392b] py-[11px] text-[14px] font-semibold text-white transition-colors hover:bg-[#a93226]">
                  Da, izbriši
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
