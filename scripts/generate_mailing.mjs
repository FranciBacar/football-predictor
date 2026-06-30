/**
 * generate_mailing.mjs — Posebne napovedi mailing via Resend
 *
 * Uporaba:
 *   node scripts/generate_mailing.mjs          → pošlje vsem
 *   node scripts/generate_mailing.mjs --dry    → samo pregled, brez pošiljanja
 *   node scripts/generate_mailing.mjs --test   → samo na franci@goodish.agency
 */

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dir, '..', '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()] })
)

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const resend = new Resend(env.RESEND_API_KEY)
const DRY  = process.argv.includes('--dry')
const TEST = process.argv.includes('--test')

// ── Grupiranje variant imen ────────────────────────────────────────
const GROUPS = {
  top_scorer: [
    { canonical: 'Harry Kane',    variants: ['harry kane', 'heri kejn', 'kane harry', 'heri can', 'h. kane', 'kane'] },
    { canonical: 'Kylian Mbappé', variants: ['kylian mbappé', 'kylian mbappe', 'mbappe', 'mbappé', 'mbappe kylian', 'kylian', 'mbappe kylian mbappé'] },
  ],
  best_player: [
    { canonical: 'Michael Olise', variants: ['michael olise', 'michel olise', 'olis', 'olise', 'm. olise'] },
    { canonical: 'Kylian Mbappé', variants: ['kylian mbappé', 'kylian mbappe', 'mbappe', 'mbappé', 'mbappe kylian', 'kylian'] },
  ],
}

const FLAGS = {
  'Brazilija': '🇧🇷', 'Brazil': '🇧🇷', 'Španija': '🇪🇸', 'Spain': '🇪🇸',
  'Francija': '🇫🇷', 'France': '🇫🇷', 'Argentina': '🇦🇷',
  'Anglija': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Nemčija': '🇩🇪', 'Germany': '🇩🇪',
  'Portugalska': '🇵🇹', 'Portugal': '🇵🇹', 'Nizozemska': '🇳🇱', 'Netherlands': '🇳🇱',
  'Belgija': '🇧🇪', 'Italija': '🇮🇹', 'Hrvaška': '🇭🇷', 'Urugvaj': '🇺🇾',
  'Kolumbija': '🇨🇴', 'Maroko': '🇲🇦', 'Mehika': '🇲🇽', 'ZDA': '🇺🇸',
  'Kanada': '🇨🇦', 'Japonska': '🇯🇵', 'Avstralija': '🇦🇺', 'Srbija': '🇷🇸',
  'Švica': '🇨🇭', 'Danska': '🇩🇰', 'Norveška': '🇳🇴', 'Senegal': '🇸🇳',
  'Nigerija': '🇳🇬', 'Ekvador': '🇪🇨', 'Peru': '🇵🇪', 'Čile': '🇨🇱',
  'Južna Koreja': '🇰🇷', 'Tunizija': '🇹🇳', 'Kamerun': '🇨🇲', 'Gana': '🇬🇭',
}

function normalize(name, groupsForType) {
  const lower = name.toLowerCase().trim()
  for (const g of (groupsForType ?? [])) {
    if (g.variants.includes(lower) || lower === g.canonical.toLowerCase()) return g.canonical
  }
  return name.trim()
}

function aggregate(rows, type) {
  const counts = {}
  for (const row of rows) {
    if (!row.prediction_value?.trim()) continue
    const key = normalize(row.prediction_value, GROUPS[type])
    counts[key] = (counts[key] ?? 0) + 1
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
}

// ── HTML generacija ────────────────────────────────────────────────
const MEDAL = ['🥇', '🥈', '🥉']
const BAR_COLORS = ['#0f766e', '#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1', '#e6faf8']

function renderRows(data, isCountry) {
  const maxCount = data[0]?.count ?? 1
  return data.map((d, i) => {
    const barW = Math.round((d.count / maxCount) * 100)
    const color = BAR_COLORS[Math.min(i, BAR_COLORS.length - 1)]
    const flag = isCountry ? (FLAGS[d.name] ?? '') : ''
    const rank = i < 3 ? MEDAL[i] : `<span style="font-size:13px;color:#9ca3af;">${i+1}.</span>`
    return `
      <tr>
        <td style="padding:9px 0;width:30px;text-align:center;vertical-align:middle;font-size:18px;">${rank}</td>
        <td style="padding:9px 8px 9px 4px;vertical-align:middle;">
          <div style="font-size:15px;font-weight:700;color:#1a1a1a;margin-bottom:5px;">${flag ? flag+' ' : ''}${d.name}</div>
          <div style="background:#f0faf8;border-radius:100px;height:8px;overflow:hidden;">
            <div style="background:${color};height:8px;border-radius:100px;width:${barW}%;"></div>
          </div>
        </td>
        <td style="padding:9px 0;vertical-align:middle;text-align:right;white-space:nowrap;">
          <span style="font-size:14px;font-weight:800;color:${i < 3 ? color : '#9ca3af'};">${d.pct}%</span>
          <span style="font-size:11px;color:#b0b8c1;margin-left:3px;">(${d.count}×)</span>
        </td>
      </tr>`
  }).join('')
}

function renderSection(icon, title, data, isCountry = false) {
  return `
  <tr><td style="padding-top:24px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <tr>
        <td style="background:linear-gradient(115deg,#0f766e 0%,#2dd4bf 100%);padding:14px 20px;">
          <span style="font-size:20px;">${icon}</span>
          <span style="font-size:16px;font-weight:800;color:#fff;margin-left:8px;vertical-align:middle;">${title}</span>
        </td>
      </tr>
      <tr><td style="padding:10px 20px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${renderRows(data, isCountry)}
        </table>
      </td></tr>
    </table>
  </td></tr>`
}

function buildHTML(winner, scorer, mvp, totalUsers, firstName) {
  const preheader = 'Kdo bo dvignil pokal, kdo bo MVP in kdo bo kraljeval med strelci? 37 napovedovalcev je oddalo svoje glasove za SP 2026. Poglejmo skupne favorite!'
  return `<!DOCTYPE html>
<html lang="sl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Glas ljudstva: To so naši favoriti za SP 2026!</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<!-- Preheader (skrit) -->
<span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</span>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6f5;padding:28px 12px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr><td>
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:linear-gradient(135deg,#064e3b 0%,#0f766e 55%,#2dd4bf 100%);border-radius:20px;overflow:hidden;">
      <tr>
        <td style="padding:36px 32px 30px;">
          <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;">predictor.greatish.app</div>
          <h1 style="margin:0 0 12px;font-size:26px;font-weight:900;color:#fff;line-height:1.2;letter-spacing:-0.02em;">
            Če bi naši napovedi<br>bili stavnica… 🎰
          </h1>
          <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85);line-height:1.6;">
            Pozdravljeni${firstName ? ', <strong>' + firstName + '</strong>' : ''}! Pred SP 2026 je ${totalUsers} napovedovalcev oddalo svoje tihe favorite. Poglejmo skupne glasove — favoriti za naslov, najboljšega strelca in MVP.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>

  ${renderSection('🏆', 'Zmagovalec turnirja', winner, true)}
  ${renderSection('⚽', 'Najboljši strelec', scorer, false)}
  ${renderSection('⭐', 'Najbolj vredni igralec (MVP)', mvp, false)}

  <!-- CTA -->
  <tr><td style="padding-top:24px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;">
      <tr>
        <td style="padding:22px 24px;text-align:center;">
          <p style="margin:0 0 14px;font-size:14px;color:#374151;line-height:1.6;">
            Se strinjaš z glasovi? Preveri lestvico in napovedi ostalih na
          </p>
          <a href="https://predictor.greatish.app"
            style="display:inline-block;background:linear-gradient(115deg,#0f766e,#2dd4bf);color:#fff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:100px;text-decoration:none;letter-spacing:0.01em;">
            Odpri lestvico →
          </a>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="padding:24px 0 8px;text-align:center;">
    <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">predictor.greatish.app · SP 2026</p>
    <p style="margin:0;font-size:11px;color:#d1d5db;">To sporočilo je samodejno generirano iz aplikacije za napovedi.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

// ── MAIN ──────────────────────────────────────────────────────────
async function main() {
  console.log(DRY ? '🔍 DRY RUN — samo pregled\n' : TEST ? '🧪 TEST — samo franci@goodish.agency\n' : '🚀 Pošiljam mailing vsem...\n')

  // 1. Fetch predictions
  const { data: preds, error: predErr } = await supabase
    .from('special_predictions')
    .select('prediction_type, prediction_value')
    .in('prediction_type', ['tournament_winner', 'top_scorer', 'best_player'])
    .neq('prediction_value', '')

  if (predErr) { console.error('❌ Predictions:', predErr.message); process.exit(1) }

  const byType = {}
  for (const r of preds ?? []) {
    if (!byType[r.prediction_type]) byType[r.prediction_type] = []
    byType[r.prediction_type].push(r)
  }

  const winner = aggregate(byType['tournament_winner'] ?? [], 'tournament_winner')
  const scorer = aggregate(byType['top_scorer'] ?? [], 'top_scorer')
  const mvp    = aggregate(byType['best_player'] ?? [], 'best_player')
  const totalUsers = Math.max(...['tournament_winner','top_scorer','best_player'].map(t => (byType[t]??[]).length))

  console.log('📊 Podatki:')
  console.log('  🏆 Zmagovalec:', winner.slice(0,3).map(d=>`${d.name} ${d.pct}%`).join(' | '))
  console.log('  ⚽ Strelec:   ', scorer.slice(0,3).map(d=>`${d.name} ${d.pct}%`).join(' | '))
  console.log('  ⭐ MVP:       ', mvp.slice(0,3).map(d=>`${d.name} ${d.pct}%`).join(' | '))

  // 2. Fetch recipients
  const { data: users, error: userErr } = await supabase
    .from('users')
    .select('id, name, email')
    .not('email', 'is', null)
    .neq('email', '')
  if (userErr) { console.error('❌ Users:', userErr.message); process.exit(1) }

  const allRecipients = (users ?? []).filter(u => u.email?.includes('@') && !u.email.includes('@internal.fp2026'))
  const recipients = TEST
    ? [allRecipients.find(u => u.email === 'franci@goodish.agency') ?? { name: 'Franci', email: 'franci@goodish.agency' }]
    : allRecipients
  console.log(`\n📬 Prejemniki: ${recipients.length}${TEST ? ' (test mode)' : ''}`)
  if (DRY) {
    recipients.forEach(u => console.log(`   ${u.name} <${u.email}>`))
    console.log('\n✅ Dry run zaključen. Poženi brez --dry za pošiljanje.')
    return
  }

  // 3. Send
  let sent = 0, failed = 0
  for (const user of recipients) {
    const firstName = user.name?.split(' ')[0] ?? ''
    const html = buildHTML(winner, scorer, mvp, totalUsers, firstName)

    const { error: sendErr } = await resend.emails.send({
      from: 'Franci Bačar <franci@greatish.app>',
      to: user.email,
      subject: '⚽ Glas ljudstva: To so naši favoriti za SP 2026!',
      html,
    })

    if (sendErr) {
      console.log(`  ❌ ${user.email}: ${sendErr.message}`)
      failed++
    } else {
      console.log(`  ✅ ${user.name} <${user.email}>`)
      sent++
    }
    await new Promise(r => setTimeout(r, 80))
  }

  console.log(`\n🎉 Poslano: ${sent} | Napake: ${failed}`)
}

main().catch(e => { console.error(e); process.exit(1) })
