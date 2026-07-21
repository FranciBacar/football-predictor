import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { Resend } from 'resend'

const MEDAL = ['🥇', '🥈', '🥉']

function initials(name: string) {
  return name.split(' ').map(p => p[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
}

const PODIUM_COLORS = [
  { bg: 'linear-gradient(140deg,#f3d989,#d8b24a)', text: '#7a5a12' },
  { bg: 'linear-gradient(140deg,#eef1f4,#bdc4cd)', text: '#5a626c' },
  { bg: 'linear-gradient(140deg,#ecca9f,#c08a55)', text: '#6e4824' },
]

type TopPlayer = { rank: number; name: string; total_points: number; exact_predictions: number; avatar_url: string | null }

function buildHTML(top3: TopPlayer[], firstName: string, totalUsers: number) {
  const preheader = `SP 2026 je končan. Hvala za igranje — poglejte končno lestvico in statistike!`

  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean)

  const podiumCells = podiumOrder.map((p) => {
    const ri = p.rank - 1
    const c = PODIUM_COLORS[ri]
    const isFirst = p.rank === 1
    const height = isFirst ? 80 : ri === 1 ? 56 : 40
    const sz = isFirst ? 60 : 48

    const avatarHTML = p.avatar_url
      ? `<img src="${p.avatar_url}" width="${sz}" height="${sz}" alt="" style="border-radius:50%;object-fit:cover;display:block;">`
      : `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:#e6faf8;font-size:${Math.round(sz * 0.3)}px;font-weight:700;color:#0f766e;text-align:center;line-height:${sz}px;">${initials(p.name)}</div>`

    return `
      <td width="33%" style="vertical-align:bottom;text-align:center;padding:0 4px;">
        <div style="margin-bottom:6px;">
          <div style="width:24px;height:24px;border-radius:50%;background:${c.bg};color:${c.text};font-size:12px;font-weight:800;line-height:24px;text-align:center;margin:0 auto 6px;">${p.rank}</div>
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td>${avatarHTML}</td></tr></table>
          <div style="font-size:${isFirst ? 14 : 12}px;font-weight:700;color:#15201d;margin-top:6px;">${p.name.split(' ')[0]}</div>
          <div style="font-size:${isFirst ? 20 : 16}px;font-weight:800;color:${isFirst ? '#0f766e' : '#15201d'};line-height:1.1;">${p.total_points}</div>
          <div style="font-size:10px;color:#b0b8c1;">točk</div>
        </div>
        <div style="height:${height}px;background:${isFirst ? 'linear-gradient(180deg,#e9f7f5,#d0f0ea)' : 'linear-gradient(180deg,#f4f7f6,#ebeeec)'};border-radius:8px 8px 0 0;border:1px solid #ebeeec;border-bottom:none;"></div>
      </td>`
  }).join('<td width="4"></td>')

  const statItems = [
    ['⚽', 'Skupinski mojster', 'kdo je bil najboljši v skupinskem delu'],
    ['🏆', 'Izločilni specialist', 'kdo je blestel v izločilnih bojih'],
    ['✓',  'Zanesljivec', 'kdo je imel največ pravilnih napovedi'],
    ['🎯', 'Točen rezultat', 'kdo je napovedal največ točnih izidov'],
    ['🔮', 'Posebne napovedi', 'kdo je vedel kdo bo zmagovalec in MVP'],
    ['😬', 'Najtežja tekma', 'tekma ki jo je največ igralcev napovedalo narobe'],
  ]

  return `<!DOCTYPE html>
<html lang="sl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>SP 2026 je končan — hvala za igranje!</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</span>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6f5;padding:28px 12px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr><td>
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:linear-gradient(135deg,#064e3b 0%,#0f766e 55%,#2dd4bf 100%);border-radius:20px;overflow:hidden;">
      <tr><td style="padding:36px 32px 32px;">
        <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;">predictor.greatish.app</div>
        <h1 style="margin:0 0 14px;font-size:26px;font-weight:900;color:#fff;line-height:1.2;letter-spacing:-0.02em;">
          SP 2026 je končan. 🏆<br>Hvala za igranje!
        </h1>
        <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.88);line-height:1.65;">
          ${firstName ? `Pozdravljeni, <strong>${firstName}</strong>! ` : 'Pozdravljeni! '}Turnir je za nami in z njim tudi naše napovedi. Hvala vsem za igranje.
        </p>
      </td></tr>
    </table>
  </td></tr>

  <!-- ZMAGOVALCI -->
  <tr><td style="padding-top:20px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
      <tr>
        <td style="background:linear-gradient(115deg,#0f766e 0%,#2dd4bf 100%);padding:14px 20px;">
          <span style="font-size:20px;">🏅</span>
          <span style="font-size:16px;font-weight:800;color:#fff;margin-left:8px;vertical-align:middle;">Končna lestvica — top 3</span>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 16px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>${podiumCells}</tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px 0;text-align:center;">
          ${top3.map((p, i) => `<div style="display:inline-block;background:#f8faf9;border-radius:8px;padding:6px 12px;margin:3px;font-size:13px;">${MEDAL[i]} <strong>${p.name}</strong> — ${p.total_points} točk</div>`).join('')}
        </td>
      </tr>
      ${top3.length >= 2 && top3[0].total_points === top3[1].total_points ? `
      <tr>
        <td style="padding:12px 20px 20px;">
          <div style="background:#f0fdf9;border-left:3px solid #2dd4bf;border-radius:0 8px 8px 0;padding:12px 14px;font-size:13px;color:#374151;line-height:1.6;">
            🤝 <strong>${top3[0].name}</strong> in <strong>${top3[1].name}</strong> sta končala z enakim številom točk (${top3[0].total_points}). Zmagala je ${top3[0].name.split(' ')[0]}, ker je napovedala <strong>${top3[0].exact_predictions} točnih izidov</strong> — ${top3[1].name.split(' ')[0]} jih je imel/a <strong>${top3[1].exact_predictions}</strong>.
          </div>
        </td>
      </tr>` : `<tr><td style="padding-bottom:20px;"></td></tr>`}
    </table>
  </td></tr>

  <!-- STATISTIKE -->
  <tr><td style="padding-top:16px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;">
      <tr>
        <td style="background:linear-gradient(115deg,#0f766e 0%,#2dd4bf 100%);padding:14px 20px;">
          <span style="font-size:20px;">📊</span>
          <span style="font-size:16px;font-weight:800;color:#fff;margin-left:8px;vertical-align:middle;">Več zanimivosti vas čaka</span>
        </td>
      </tr>
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 14px;font-size:14px;color:#374151;line-height:1.65;">Na <a href="https://predictor.greatish.app/statistike" style="color:#0f766e;font-weight:700;text-decoration:none;">strani statistik</a> najdete še:</p>
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
          ${statItems.map(([icon, title, desc]) => `
          <tr>
            <td style="padding:6px 0;vertical-align:top;width:28px;font-size:16px;">${icon}</td>
            <td style="padding:6px 0;vertical-align:top;">
              <span style="font-size:14px;font-weight:700;color:#15201d;">${title}</span>
              <span style="font-size:13px;color:#6b7280;"> — ${desc}</span>
            </td>
          </tr>`).join('')}
        </table>
      </td></tr>
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding-top:16px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;">
      <tr><td style="padding:24px;text-align:center;">
        <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#15201d;">Hvala vsem za igranje! ⚽</p>
        <p style="margin:0 0 18px;font-size:14px;color:#6b7280;line-height:1.6;">Upamo, da ste uživali. Se vidimo na naslednjem turnirju!</p>
        <a href="https://predictor.greatish.app/statistike"
          style="display:inline-block;background:linear-gradient(115deg,#0f766e,#2dd4bf);color:#fff;font-size:14px;font-weight:700;padding:13px 32px;border-radius:100px;text-decoration:none;letter-spacing:0.01em;">
          Oglej si statistike →
        </a>
      </td></tr>
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

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = req.nextUrl.searchParams.get('dry') === '1'
  // preview=1 vrne HTML prvega prejemnika za ogled v brskalniku
  const preview = req.nextUrl.searchParams.get('preview') === '1'

  const supabase = createAdminClient()

  // Top 3 lestvica
  const { data: leaderboard, error: lErr } = await supabase.rpc('get_global_leaderboard')
  if (lErr) return NextResponse.json({ error: lErr.message }, { status: 500 })

  const { data: allUsers, error: uErr } = await supabase
    .from('users')
    .select('id, name, email, avatar_url')
    .not('email', 'is', null)
    .neq('email', '')
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 })

  const userMap = Object.fromEntries((allUsers ?? []).map(u => [u.id, u]))
  const top3: TopPlayer[] = (leaderboard ?? [])
    .sort((a: any, b: any) => b.total_points - a.total_points || b.exact_predictions - a.exact_predictions)
    .slice(0, 3)
    .map((e: any, i: number) => ({
      rank: i + 1,
      name: e.name,
      total_points: e.total_points,
      exact_predictions: e.exact_predictions,
      avatar_url: userMap[e.user_id]?.avatar_url ?? null,
    }))

  const recipients = (allUsers ?? []).filter(u =>
    u.email?.includes('@') && !u.email.includes('@internal.fp2026')
  )
  const totalUsers = recipients.length

  // Preview mode — vrni HTML za ogled
  if (preview) {
    const html = buildHTML(top3, 'Franci', totalUsers)
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      top3: top3.map(p => `${p.rank}. ${p.name} — ${p.total_points} točk`),
      recipients: totalUsers,
      emails: recipients.map(u => ({ name: u.name, email: u.email })),
    })
  }

  const resend = new Resend(process.env.RESEND_API_KEY!)
  let sent = 0, failed = 0
  const errors: string[] = []

  for (const user of recipients) {
    const firstName = user.name?.split(' ')[0] ?? ''
    const html = buildHTML(top3, firstName, totalUsers)

    const { error: sendErr } = await resend.emails.send({
      from: 'Franci Bačar <franci@greatish.app>',
      to: user.email,
      subject: '🏆 SP 2026 je končan — hvala za igranje!',
      html,
    })

    if (sendErr) { failed++; errors.push(`${user.email}: ${sendErr.message}`) }
    else sent++

    await new Promise(r => setTimeout(r, 100))
  }

  return NextResponse.json({ sent, failed, errors })
}
