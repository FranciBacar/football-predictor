import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/statistike'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Preveri ali je nov uporabnik (ni dokončal onboardinga)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        // Nov uporabnik (onboarding_completed = false) → pokaži pravila
        if (profile && !profile.onboarding_completed) {
          const encodedNext = encodeURIComponent(next)
          return NextResponse.redirect(`${origin}/pravila?onboarding=1&next=${encodedNext}`)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Ob napaki preusmeri nazaj na login
  return NextResponse.redirect(`${origin}/login?error=auth-failed`)
}