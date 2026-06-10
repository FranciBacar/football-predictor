'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import ProfileSwitcher, { type Profile } from './ProfileSwitcher'
import { useProfile, type KidProfile } from '@/context/ProfileContext'

function toInitials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
}

const CHILD_ACCENTS = ['#e8722a', '#7c3aed', '#db2777', '#0284c7', '#16a34a']

export default function NavbarProfileSwitcher() {
  const supabase = createClient()
  const { activeKidId, setActiveKid } = useProfile()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [parentId, setParentId] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setParentId(user.id)

      const { data: parentData } = await supabase
        .from('users').select('name, avatar_url').eq('id', user.id).single()

      const { data: kidRows } = await supabase
        .from('users').select('id, name, avatar_emoji')
        .eq('parent_user_id', user.id).eq('is_kid', true)

      const kids = (kidRows ?? []) as KidProfile[]

      if (!parentData || kids.length === 0) return

      const owner: Profile = {
        id: user.id,
        name: parentData.name,
        firstName: parentData.name.split(' ')[0],
        initials: toInitials(parentData.name),
        avatarUrl: parentData.avatar_url,
        kind: 'owner',
      }

      const children: Profile[] = kids.map((k, i) => ({
        id: k.id,
        name: k.name,
        firstName: k.name.split(' ')[0],
        initials: toInitials(k.name),
        kind: 'child' as const,
        accent: CHILD_ACCENTS[i % CHILD_ACCENTS.length],
      }))

      setProfiles([owner, ...children])

      // Počisti zastareli localStorage
      if (activeKidId && !kids.some(k => k.id === activeKidId)) {
        setActiveKid(null)
      }
    }
    load()
  }, [])

  if (profiles.length === 0) return null

  const activeId = activeKidId ?? parentId

  const handleSwitch = (id: string) => {
    if (id === parentId) {
      setActiveKid(null)
    } else {
      const kid = profiles.find(p => p.id === id)
      if (kid) setActiveKid({ id: kid.id, name: kid.name, avatar_emoji: '' })
    }
  }

  return (
    <ProfileSwitcher
      profiles={profiles}
      activeId={activeId}
      onSwitch={handleSwitch}
      onAddChild={() => { window.location.href = '/profile#kids' }}
    />
  )
}
