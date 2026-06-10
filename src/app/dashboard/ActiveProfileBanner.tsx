'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ActiveProfileBar, type Profile } from '@/components/ProfileSwitcher'
import { useProfile } from '@/context/ProfileContext'

function toInitials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
}

const CHILD_ACCENTS = ['#e8722a', '#7c3aed', '#db2777', '#0284c7', '#16a34a']

export default function ActiveProfileBanner() {
  const { activeKidId, activeKidName, setActiveKid, isPlayingAsKid } = useProfile()
  const [ownerProfile, setOwnerProfile] = useState<Profile | null>(null)
  const [kidIndex, setKidIndex] = useState(0)

  useEffect(() => {
    if (!isPlayingAsKid) return
    const supabase = createClient()
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: parentData } = await supabase
        .from('users').select('name, avatar_url').eq('id', user.id).single()
      if (!parentData) return

      setOwnerProfile({
        id: user.id,
        name: parentData.name,
        firstName: parentData.name.split(' ')[0],
        initials: toInitials(parentData.name),
        avatarUrl: parentData.avatar_url,
        kind: 'owner',
      })

      // Ugotovi index otroka za accent barvo
      const { data: kidRows } = await supabase
        .from('users').select('id')
        .eq('parent_user_id', user.id).eq('is_kid', true)
      const idx = (kidRows ?? []).findIndex(k => k.id === activeKidId)
      setKidIndex(idx >= 0 ? idx : 0)
    }
    load()
  }, [isPlayingAsKid, activeKidId])

  if (!isPlayingAsKid || !activeKidId || !activeKidName || !ownerProfile) return null

  const activeProfile: Profile = {
    id: activeKidId,
    name: activeKidName,
    firstName: activeKidName.split(' ')[0],
    initials: toInitials(activeKidName),
    kind: 'child',
    accent: CHILD_ACCENTS[kidIndex % CHILD_ACCENTS.length],
  }

  return (
    <ActiveProfileBar
      active={activeProfile}
      owner={ownerProfile}
      onSwitch={() => setActiveKid(null)}
    />
  )
}
