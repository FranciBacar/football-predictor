import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const secret = process.env.CRON_SECRET
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://predictor.greatish.app'

  const res = await fetch(`${base}/api/cron/sync-fixtures`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: 'no-store',
  })
  const data = await res.json()
  return NextResponse.json(data)
}
