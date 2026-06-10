'use client';

/**
 * ProfileSwitcher + ActiveProfileBar — preklop med profili (odrasli ↔ otroci).
 *
 * Reši trk v glavi (en sam avatar namesto pill+krogec) in nejasen preklop:
 *  • <ProfileSwitcher> — avatar gumb v glavi → spodnji list "Kdo napoveduje?"
 *    (vsi profili, aktivni odkljukan, + "Dodaj otroka").
 *  • <ActiveProfileBar> — kontekstna vrstica "Napoveduješ kot …" (prikaži ko je aktiven otrok).
 *
 * Barva profila je dosledna v glavi, listu in kontekstni vrstici — uporabnik vedno ve, kdo je aktiven.
 * Brez okrasnih emojijev. Solid teal za odrasli; otroci dobijo svoj accent.
 */

import { useEffect, useState } from 'react';

export type Profile = {
  id: string;
  name: string;          // polno ime (list)
  firstName?: string;    // za kontekstno vrstico ("Napoveduješ kot Fran")
  initials: string;
  avatarUrl?: string | null;
  kind: 'owner' | 'child';
  /** accent za otroke (npr. '#e8722a'); odrasli uporabi privzeti teal gradient */
  accent?: string;
};

/* ── helperji ─────────────────────────────────────────────── */

function tint(hex: string) {
  // svetlo ozadje iz accenta (za kontekstno vrstico) — preprosto mešanje z belo
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * 0.86);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

function Avatar({ p, size = 46, ring = true }: { p: Profile; size?: number; ring?: boolean }) {
  const style: React.CSSProperties = {
    width: size, height: size, fontSize: size * 0.4,
    ...(p.kind === 'child' && p.accent
      ? { background: `linear-gradient(140deg, ${p.accent}, ${p.accent})` }
      : { background: 'linear-gradient(140deg,#0f766e,#2dd4bf)' }),
    ...(ring ? { border: '2.5px solid #fff', boxShadow: '0 4px 12px rgba(16,24,40,0.18)' } : {}),
  };
  return (
    <div className="flex flex-none items-center justify-center rounded-full font-bold text-white" style={style}>
      {p.avatarUrl ? <img src={p.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" /> : p.initials}
    </div>
  );
}

/* ── kontekstna vrstica (aktiven otrok) ───────────────────── */

export function ActiveProfileBar({ active, owner, onSwitch }: { active: Profile; owner: Profile; onSwitch: (id: string) => void }) {
  if (active.kind !== 'child') return null;
  const accent = active.accent ?? '#e8722a';
  return (
    <div className="mx-4 mt-3.5 flex items-center gap-2.5 rounded-[13px] px-3.5 py-2.5" style={{ background: tint(accent) }}>
      <div className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full text-[13px] font-bold text-white" style={{ background: accent }}>
        {active.initials}
      </div>
      <div className="flex-1 text-[13px] font-semibold">Napoveduješ kot <b className="font-bold">{active.firstName ?? active.name}</b></div>
      <button type="button" onClick={() => onSwitch(owner.id)} className="rounded-[9px] bg-white px-3 py-[7px] text-[12.5px] font-bold" style={{ color: accent }}>
        Nazaj na {owner.firstName ?? owner.name}
      </button>
    </div>
  );
}

/* ── glava: avatar gumb + spodnji list ────────────────────── */

export default function ProfileSwitcher({ profiles, activeId, onSwitch, onAddChild }: {
  profiles: Profile[];          // [owner, ...children]
  activeId: string;
  onSwitch: (id: string) => void;
  onAddChild?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const active = profiles.find((p) => p.id === activeId) ?? profiles[0];

  // zakleni scroll telesa, ko je list odprt
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* avatar gumb (en sam element — brez ločenega pilla) */}
      <button type="button" onClick={() => setOpen(true)} aria-label="Preklopi profil" className="relative flex-none">
        <Avatar p={active} />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-[19px] w-[19px] items-center justify-center rounded-full border border-[#ebeeec] bg-white shadow-[0_2px_5px_rgba(16,24,40,0.16)]">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="#15201d" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      </button>

      {/* scrim + sheet */}
      <div onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-[rgba(15,23,42,0.4)] transition-opacity duration-300 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
      <div role="dialog" aria-modal="true"
        className={`fixed inset-x-0 bottom-0 z-50 rounded-t-[26px] bg-white px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-2.5 transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${open ? 'translate-y-0' : 'translate-y-[110%]'}`}>
        <div className="mx-auto mb-3.5 mt-1.5 h-[5px] w-[38px] rounded-full bg-[#e2e6e5]" />
        <h3 className="m-0 px-1 text-[17px] font-bold">Kdo napoveduje?</h3>
        <p className="mb-3.5 mt-0.5 px-1 text-[12.5px] text-[#6b7280]">Izberi profil — napovedi se shranijo zanj.</p>

        {profiles.map((p) => {
          const isActive = p.id === active.id;
          return (
            <button key={p.id} type="button" onClick={() => { onSwitch(p.id); setOpen(false); }}
              className={`flex w-full items-center gap-3.5 rounded-2xl p-3 text-left transition active:bg-[#f4f7f6] ${isActive ? 'bg-[#e9f7f5]' : ''}`}>
              <Avatar p={p} size={42} ring={false} />
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold">{p.name}</div>
                <div className="mt-px text-[12px] text-[#9aa1ab]">{p.kind === 'owner' ? 'Tvoj račun' : 'Otroški profil'}</div>
              </div>
              {isActive && (
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#0f766e]">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5 9-10" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              )}
            </button>
          );
        })}

        {onAddChild && (
          <button type="button" onClick={() => { setOpen(false); onAddChild(); }}
            className="mt-1.5 flex w-full items-center gap-3.5 border-t border-[#ebeeec] p-3 text-left">
            <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full bg-[#e9f7f5] text-[#0f766e]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
            </span>
            <span className="text-[14.5px] font-bold text-[#0f766e]">Dodaj otroka</span>
          </button>
        )}
      </div>
    </>
  );
}
