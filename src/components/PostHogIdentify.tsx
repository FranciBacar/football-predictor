'use client'

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

// Poveže PostHog anonimni ID z email-om prijavljenega uporabnika.
// Dodaj ta komponent enkrat v layout.tsx znotraj <ProfileProvider>.
export default function PostHogIdentify() {
  useEffect(() => {
    const supabase = createClient()

    const identify = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Preberi še display name iz users tabele
      const { data: profile } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', user.id)
        .single()

      if (typeof window !== 'undefined' && (window as any).posthog) {
        ;(window as any).posthog.identify(user.id, {
          email: user.email ?? profile?.email,
          name: profile?.name,
        })
      }
    }

    identify()

    // Ob spremembi seje (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        supabase.from('users').select('name, email').eq('id', session.user.id).single().then(({ data: profile }) => {
          if (typeof window !== 'undefined' && (window as any).posthog) {
            ;(window as any).posthog.identify(session.user.id, {
              email: session.user.email ?? profile?.email,
              name: profile?.name,
            })
          }
        })
      }
      if (event === 'SIGNED_OUT') {
        if (typeof window !== 'undefined' && (window as any).posthog) {
          ;(window as any).posthog.reset()
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return null
}
