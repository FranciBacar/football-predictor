import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { Resend } from 'resend'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // dry run — samo preštej prejemnike brez pošiljanja
  const dryRun = req.nextUrl.searchParams.get('dry') === '1'

  const resend = new Resend(process.env.RESEND_API_KEY!)
  const supabase = createAdminClient()
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, email')
    .not('email', 'is', null)
    .neq('email', '')

  if (error || !users) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  // Filtriraj samo odrasle (ne otroške profile — ti nimajo emaila)
  const recipients = users.filter(u => u.email && u.email.includes('@') && !u.email.includes('@internal.fp2026'))
  const userCount = recipients.length

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      recipients: userCount,
      emails: recipients.map(u => ({ name: u.name, email: u.email })),
    })
  }

  // Naloži HTML template
  const templatePath = path.join(process.cwd(), 'email-preview.html')
  const templateHtml = fs.readFileSync(templatePath, 'utf-8')

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const user of recipients) {
    const firstName = user.name?.split(' ')[0] ?? 'prijatelj'

    const html = templateHtml
      .replace(/\{\{ first_name \}\}/g, firstName)
      .replace(/\{\{ user_count \}\}/g, String(userCount))

    const { error: sendError } = await resend.emails.send({
      from: 'Franci Bačar <franci@greatish.app>',
      to: user.email,
      subject: '⚽ SP 2026 se začenja — dve novosti za tebe',
      html,
    })
    if (sendError) {
      failed++
      errors.push(`${user.email}: ${sendError.message}`)
    } else {
      sent++
    }

    // Kratka pavza med emaili da ne zadenemo rate limit
    await new Promise(r => setTimeout(r, 100))
  }

  return NextResponse.json({ sent, failed, errors })
}
