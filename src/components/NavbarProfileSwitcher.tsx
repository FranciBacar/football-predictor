'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import ProfileSwitcher from './ProfileSwitcher'
import { useProfile, type KidProfile } from '@/context/ProfileContext'

export default function NavbarProfileSwitcher() {
  const supabase = createClient()
  const { activeKidId, setActiveKid } = useProfile()
  const [parentName, setParentName] = useState('')
  const [parentAvatar, setParentAvatar] = useState<string | null>(null)
  const [kids, setKids] = useState<KidProfile[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('users')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single()

      if (profile) {
        setParentName(profile.name)
        setParentAvatar(profile.avatar_url)
      }

      const { data: kidRows } = await supabase
        .from('users')
        .select('id, name, avatar_emoji')
        .eq('parent_user_id', user.id)
        .eq('is_kid', true)

      const loadedKids = (kidRows ?? []) as KidProfile[]
      setKids(loadedKids)

      // Počisti zastareli localStorage: če shranjen otrok ne obstaja več, preklopimo nazaj
      if (activeKidId && !loadedKids.some(k => k.id === activeKidId)) {
        setActiveKid(null)
      }
    }
    load()
  }, [])

  if (!parentName) return null

  return (
    <ProfileSwitcher
      parentName={parentName}
      parentAvatar={parentAvatar}
      kids={kids}
    />
  )
}
