'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function loginWithEmail(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) {
    return redirect('/login?message=Email je obvezen')
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: 'http://localhost:3000/auth/callback',
    },
  })

  if (error) {
    return redirect('/login?message=Prišlo je do napake pri pošiljanju povezave')
  }

  return redirect('/login?message=Preveri svoj e-poštni nabiralnik za povezavo')
}

export async function loginWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'http://localhost:3000/auth/callback',
    },
  })

  if (data.url) {
    return redirect(data.url)
  }

  return redirect('/login?message=Napaka pri povezovanju z Googlom')
}