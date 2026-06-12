import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'

function getPoints(type: string): number {
  if (['tournament_winner', 'top_scorer', 'best_player'].includes(type)) return 10
  if (type.startsWith('group_winner_')) return 3
  return 0
}

export async function POST(req: NextRequest) {
  // Verify admin via session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { prediction_type, correct_values, canonical } = body as {
    prediction_type: string
    correct_values: string[]
    canonical: string
  }

  if (!prediction_type || !Array.isArray(correct_values) || !canonical?.trim()) {
    return NextResponse.json({ error: 'Manjkajo parametri' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const points = getPoints(prediction_type)
  const normalizedCorrect = correct_values.map(v => v.toLowerCase().trim())

  // 1. Reset all rows: earned_points = 0, correct_answer = canonical
  const { error: resetError } = await adminClient
    .from('special_predictions')
    .update({ earned_points: 0, correct_answer: canonical.trim() })
    .eq('prediction_type', prediction_type)

  if (resetError) {
    return NextResponse.json({ error: resetError.message }, { status: 500 })
  }

  // 2. Fetch all rows to find matching IDs (case+trim insensitive)
  const { data: allRows, error: fetchError } = await adminClient
    .from('special_predictions')
    .select('id, prediction_value')
    .eq('prediction_type', prediction_type)

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const correctIds = (allRows ?? [])
    .filter(r => normalizedCorrect.includes(r.prediction_value.toLowerCase().trim()))
    .map(r => r.id)

  // 3. Award points to matching rows
  if (correctIds.length > 0) {
    const { error: awardError } = await adminClient
      .from('special_predictions')
      .update({ earned_points: points })
      .in('id', correctIds)

    if (awardError) {
      return NextResponse.json({ error: awardError.message }, { status: 500 })
    }
  }

  return NextResponse.json({
    ok: true,
    awarded: correctIds.length,
    points,
    canonical: canonical.trim(),
    total: allRows?.length ?? 0,
  })
}
