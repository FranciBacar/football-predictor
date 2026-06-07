import Link from 'next/link'

export default function ZasebnostPage() {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px 80px', fontFamily: 'var(--font)' }}>

      <Link href="/dashboard" style={{ color: '#0f766e', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
        ← Nazaj
      </Link>

      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '20px 0 4px', letterSpacing: '-0.03em' }}>
        Politika zasebnosti
      </h1>
      <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 32px' }}>
        Goodish Football Predictor — zadnja posodobitev: junij 2026
      </p>

      {[
        {
          title: '1. Upravljavec podatkov',
          body: 'Upravljavec osebnih podatkov je Goodish d.o.o., Slovenija (v nadaljevanju: "mi"). Aplikacija Football Predictor je interna zabavna aplikacija za napovedovanje rezultatov SP 2026.',
        },
        {
          title: '2. Kateri podatki se zbirajo',
          body: `Ob prijavi prek Googla, Facebooka ali GitHuba pridobimo:
• Ime in priimek
• E-poštni naslov
• URL profilne slike (avatar)

Te podatke shranjujemo v naši podatkovni bazi (Supabase, EU regija). Poleg tega beležimo tvoje napovedi rezultatov tekem.`,
        },
        {
          title: '3. Namen obdelave',
          body: `Podatki se uporabljajo izključno za:
• Identifikacijo uporabnika v aplikaciji
• Prikaz tvojega imena in avatarja na lestvici in v skupinah
• Izračun in prikaz točk

Podatkov ne prodajamo, ne delimo s tretjimi stranmi in ne uporabljamo za oglaševanje.`,
        },
        {
          title: '4. Piškotki',
          body: 'Aplikacija uporablja izključno funkcionalne piškotke za upravljanje prijave (Supabase Auth session). Ti piškotki so nujno potrebni za delovanje aplikacije. Ne uporabljamo oglaševalskih piškotkov niti sledilnih orodij.',
        },
        {
          title: '5. Hramba podatkov',
          body: 'Podatki se hranijo dokler imaš aktiven račun. Ko izbrišeš račun (Profil → Izbriši račun), se vsi tvoji podatki trajno izbrišejo iz naše baze — ime, e-mail, avatar, napovedi in točke.',
        },
        {
          title: '6. Tvoje pravice (GDPR)',
          body: `Imaš pravico do:
• Vpogleda v svoje podatke
• Popravka netočnih podatkov
• Izbrisa svojih podatkov (pravica do pozabe) — prek gumba "Izbriši račun" v Profilu
• Prenosa podatkov (kontaktiraj nas)
• Ugovora obdelavi

Za kakršnekoli zahteve glede zasebnosti nas kontaktiraj na: hello@goodish.agency`,
        },
        {
          title: '7. Varnost',
          body: 'Podatki so shranjeni pri ponudniku Supabase (infrastruktura AWS, EU regija). Dostop je zavarovan z Row Level Security (RLS) politikami — vsak uporabnik vidi samo svoje podatke.',
        },
        {
          title: '8. Kontakt',
          body: 'Za vprašanja glede zasebnosti: hello@goodish.agency\nGoodish d.o.o., Slovenija',
        },
      ].map(section => (
        <div key={section.title} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: '#1a1a1a' }}>
            {section.title}
          </h2>
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>
            {section.body}
          </p>
        </div>
      ))}

      <div style={{
        marginTop: 40, padding: '16px 20px', borderRadius: 14,
        background: '#f0fdf9', border: '1px solid #99e6dd',
      }}>
        <p style={{ margin: 0, fontSize: 13, color: '#0f766e', lineHeight: 1.6 }}>
          ✅ Aplikacija je izključno zabavne narave. Ne zbiramo finančnih podatkov, ne izvajamo profiliranja in ne delimo podatkov z oglaševalci.
        </p>
      </div>
    </div>
  )
}
