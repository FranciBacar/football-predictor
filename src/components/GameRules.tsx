'use client';

/**
 * GameRules — "Pravila igre" (Football Predictor).
 *
 * Čista, uredniška postavitev: točke so poudarek (velike teal številke),
 * brez okrasnih emojijev, tanke ločnice namesto ugnezdenih kartic.
 *
 * Uporaba:
 *  • Vstopna stran (javno) — <GameRules onStart={…} />
 *  • V aplikaciji (zavihek/podstran) — <GameRules onStart={() => router.push('/napovedi')} />
 *
 * Kompaktni povzetek za nogo lestvice: <ScoringSummary />
 */

import type { ReactNode } from 'react';

/* ── osnovni gradniki ──────────────────────────────────────── */

function Section({ title, lead, children }: { title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <section className="border-b border-[#e9ecea] px-[30px] py-[26px] last:border-b-0">
      <h2 className="m-0 text-[13px] font-bold uppercase tracking-[0.04em] text-[#15201d]">{title}</h2>
      {lead && <p className="m-0 mt-1 mb-[18px] max-w-[48ch] text-[13.5px] leading-[1.55] text-[#6b7280] [&_b]:font-semibold [&_b]:text-[#15201d]">{lead}</p>}
      {children}
    </section>
  );
}

/** vrstica s točkami (value-trailing, velika teal številka) */
function ScoreRow({ title, example, value, unit, zero }: { title: string; example?: string; value: string; unit: string; zero?: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-[18px] border-t border-[#e9ecea] py-[15px] first:border-t-0 first:pt-0.5">
      <div>
        <div className="text-[15.5px] font-semibold tracking-tight">{title}</div>
        {example && <div className="mt-[3px] text-[12.5px] leading-[1.45] text-[#9aa1ab]">{example}</div>}
      </div>
      <div className="flex min-w-[54px] flex-col items-end leading-none">
        <span className={`text-[30px] font-extrabold tabular-nums tracking-[-0.03em] ${zero ? 'text-[#c2c7cd]' : 'text-[#0f766e]'}`}>{value}</span>
        <span className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#9aa1ab]">{unit}</span>
      </div>
    </div>
  );
}

/* ── celotna stran ─────────────────────────────────────────── */

export default function GameRules({ onStart }: { onStart?: () => void }) {
  return (
    <div className="mx-auto max-w-[640px]">
      <div className="overflow-hidden rounded-[20px] border border-[#e9ecea] bg-white">
        {/* hero */}
        <div className="border-b border-[#e9ecea] px-[30px] pb-[26px] pt-8">
          <p className="m-0 mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0f766e]">Goodish Football Predictor</p>
          <h1 className="m-0 text-[38px] font-extrabold leading-none tracking-[-0.03em]">Pravila igre</h1>
          <p className="m-0 mt-2.5 text-[14.5px] text-[#6b7280]">Svetovno prvenstvo 2026</p>
        </div>

        {/* Točkovanje tekem */}
        <Section title="Točkovanje tekem" lead={<>Napoveduješ rezultate po <b>90 minutah</b> — brez podaljškov in enajstmetrovk.</>}>
          <div className="flex flex-col">
            <ScoreRow title="Točen rezultat" example="Napoveš 2 : 1 in tekma se konča 2 : 1." value="3" unit="točke" />
            <ScoreRow title="Pravilna razlika ali zadetki ene ekipe" example="Napoveš 3 : 1, konča se 2 : 1 — zmagovalec in en rezultat se ujemata." value="2" unit="točki" />
            <ScoreRow title="Pravilen izid" example="Pravilno napoveš zmagovalca ali remi, a brez ujemanja zadetkov." value="1" unit="točka" />
            <ScoreRow title="Napačen izid" example="Napoveš zmago domačih, a izgubijo ali je remi." value="0" unit="točk" zero />
          </div>
          <div className="mt-[18px] grid grid-cols-[1fr_auto] items-center gap-4 rounded-[14px] bg-[#e6faf8] px-[17px] py-[15px]">
            <div>
              <div className="text-[14px] font-bold text-[#0f766e]">Izločilni del šteje dvojno</div>
              <div className="mt-[3px] text-[12.5px] leading-[1.45] text-[#3c7a72]">Od osmine finala naprej so vse napovedi vredne dvojno — 6, 4 ali 2 točke.</div>
            </div>
            <div className="whitespace-nowrap text-[24px] font-extrabold tracking-[-0.02em] text-[#0f766e]">× 2</div>
          </div>
        </Section>

        {/* Izločilni boji — remi */}
        <Section title="Izločilni boji — remi">
          <p className="m-0 text-[14.5px] leading-[1.6]">Ko v izločilni tekmi napoveš remi, te vprašamo, <b className="font-bold">kdo napreduje</b>. Pravilen napredovalec ti prinese <span className="font-bold text-[#0f766e]">+2 bonus točki</span>.</p>
        </Section>

        {/* Posebne napovedi */}
        <Section title="Posebne napovedi" lead={<>Pred začetkom prvenstva napoveš velike zmagovalce. Zaklenejo se <b>11. junija ob 20:00</b>.</>}>
          <div className="flex flex-col">
            <ScoreRow title="Zmagovalec prvenstva" value="+10" unit="točk" />
            <ScoreRow title="Najboljši strelec" value="+10" unit="točk" />
            <ScoreRow title="Najboljši igralec — Zlati čevelj" value="+10" unit="točk" />
            <ScoreRow title="Zmagovalec vsake skupine" example="12 skupin (A–L), po 3 točke za vsako." value="+3" unit="vsaka" />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3.5 rounded-[14px] border border-dashed border-[#cdd4d2] bg-[#fafbfb] px-[17px] py-3.5">
            <div className="text-[13px] text-[#6b7280]">Skupaj možnih bonus točk &nbsp;·&nbsp; <b className="font-bold text-[#15201d]">10 + 10 + 10 + (12 × 3)</b></div>
            <div className="whitespace-nowrap text-[22px] font-extrabold tracking-[-0.02em] text-[#0f766e]">66</div>
          </div>
        </Section>

        {/* Zaklepanje */}
        <Section title="Zaklepanje napovedi">
          <div className="flex flex-col">
            <div className="grid grid-cols-[1fr_auto] items-baseline gap-4 border-t border-[#e9ecea] py-[13px] first:border-t-0 first:pt-0.5">
              <div className="text-[14px] font-semibold">Napovedi tekem</div>
              <div className="text-right text-[13px] text-[#6b7280]"><b className="font-bold text-[#15201d]">15 min</b> pred tekmo</div>
            </div>
            <div className="grid grid-cols-[1fr_auto] items-baseline gap-4 border-t border-[#e9ecea] py-[13px]">
              <div className="text-[14px] font-semibold">Posebne napovedi</div>
              <div className="text-right text-[13px] text-[#6b7280]"><b className="font-bold text-[#15201d]">11. junija, 20:00</b></div>
            </div>
          </div>
        </Section>

        {/* Izenačenje */}
        <Section title="Izenačeno število točk">
          <p className="m-0 text-[14.5px] leading-[1.6]">Pri enakem seštevku odloča <b className="font-bold">število točnih rezultatov</b> (zadetkov za 3 točke). Kdor jih ima več, je višje na lestvici.</p>
        </Section>

        {/* Algoritem */}
        <Section title="Algoritemski namig" lead="Pri vsaki odprti tekmi vidiš analitični namig — ne da misli namesto tebe, ampak kot dodatna informacija pred odločitvijo.">
          <div className="border-t border-[#e9ecea] py-[13px] first:border-t-0">
            <div className="text-[14.5px] font-bold"><span className="mr-2 inline-block h-2 w-2 rounded-[2px] bg-[#0f766e] align-middle" />Stavnice</div>
            <div className="mt-[3px] text-[13px] leading-[1.55] text-[#6b7280]">Verjetnosti, izračunane iz pravih stavniških kvot. Odražajo, kaj pričakuje trg.</div>
          </div>
          <div className="border-t border-[#e9ecea] py-[13px]">
            <div className="text-[14.5px] font-bold"><span className="mr-2 inline-block h-2 w-2 rounded-[2px] bg-[#f97316] align-middle" />Model</div>
            <div className="mt-[3px] text-[13px] leading-[1.55] text-[#6b7280]">Naš matematični algoritem (Poisson + ELO moč ekip) oceni verjetnosti iz zgodovinskih podatkov.</div>
          </div>
          <p className="m-0 mt-4 text-[13.5px] leading-[1.55] text-[#6b7280]">Prikazani konsenz je povprečje obeh virov. Samo za zabavo — prihodnosti seveda ne poznamo.</p>
        </Section>

        {/* CTA */}
        {onStart && (
          <div className="px-[30px] pb-[30px] pt-[26px]">
            <button type="button" onClick={onStart}
              className="inline-flex items-center gap-2.5 rounded-[13px] bg-[#0f766e] px-[22px] py-3.5 text-[14.5px] font-semibold text-white transition hover:bg-[#0c5f58]">
              Na napovedi
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── kompaktni povzetek (noga lestvice / mobile) ───────────── */

export function ScoringSummary() {
  const rows: [string, string, boolean?][] = [
    ['Točen rezultat', '3'],
    ['Pravilna razlika', '2'],
    ['Pravilen izid', '1'],
    ['Napačen izid', '0', true],
  ];
  return (
    <div className="rounded-[18px] border border-[#e9ecea] bg-white p-[18px] pb-4">
      <h3 className="m-0 mb-3 text-[12px] font-bold uppercase tracking-[0.05em] text-[#15201d]">Točkovanje</h3>
      {rows.map(([label, val, zero]) => (
        <div key={label} className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-[#e9ecea] py-[11px] first:border-t-0">
          <div className="text-[14px] font-semibold">{label}</div>
          <div className={`text-[19px] font-extrabold tabular-nums tracking-[-0.02em] ${zero ? 'text-[#c2c7cd]' : 'text-[#0f766e]'}`}>{val}</div>
        </div>
      ))}
      <div className="mt-3 border-t border-[#e9ecea] pt-3 text-[12px] leading-[1.55] text-[#6b7280]">
        Izločilni del šteje <span className="inline-block whitespace-nowrap rounded-full bg-[#e6faf8] px-2 py-0.5 text-[11px] font-bold text-[#0f766e]">× 2</span>
        <span className="mt-2.5 block">Pri izenačenju odloča <b className="font-semibold text-[#15201d]">več točnih rezultatov</b>. Posebne napovedi (zmagovalec, strelec, MVP) prinesejo dodatne točke.</span>
      </div>
    </div>
  );
}
