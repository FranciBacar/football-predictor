'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Profile, { type Child } from '@/components/Profile'

type UserProfile = {
  id: string
  name: string
  email: string
  avatar_url: string | null
  is_global_opt_in: boolean
  is_admin?: boolean
}

type KidRow = {
  id: string
  name: string
}

function toInitials(name: string) {
  return name
    .split(' ')
    .map((p) => (p[0] ?? '').toUpperCase())
    .join('')
    .slice(0, 2) || '?'
}

function toChild(k: KidRow): Child {
  return { id: k.id, name: k.name, initials: toInitials(k.name), avatarUrl: null }
}

export default function ProfileClient({
  profile,
  initialKids,
}: {
  profile: UserProfile
  initialKids: KidRow[]
}) {
  const supabase = createClient()
  const router = useRouter()

  const [optIn, setOptIn] = useState(profile.is_global_opt_in)
  const [kids, setKids] = useState<Child[]>(initialKids.map(toChild))
  const [addingKid, setAddingKid] = useState(false)
  const [kidName, setKidName] = useState('')
  const [savingKid, setSavingKid] = useState(false)

  const initials = toInitials(profile.name)

  const handleToggleOptIn = async () => {
    const next = !optIn
    setOptIn(next)
    const { error } = await supabase
      .from('users')
      .update({ is_global_opt_in: next, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
    if (error) setOptIn(!next) // revert
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleDeleteAccount = async () => {
    await supabase.from('users').delete().eq('id', profile.id)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleAddChild = () => setAddingKid(true)

  const handleSaveKid = async () => {
    if (!kidName.trim()) return
    setSavingKid(true)
    const { data, error } = await supabase.rpc('create_kid_profile', {
      p_parent_id: profile.id,
      p_name: kidName.trim(),
      p_avatar_emoji: '',
    })
    if (!error && data) {
      setKids((prev) => [...prev, { id: data, name: kidName.trim(), initials: toInitials(kidName.trim()), avatarUrl: null }])
    }
    setKidName('')
    setAddingKid(false)
    setSavingKid(false)
  }

  const handleRemoveChild = async (kidId: string) => {
    if (!confirm('Izbriši otrokov profil? Vse napovedi bodo izgubljene.')) return
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', kidId)
      .eq('parent_user_id', profile.id)
    if (!error) setKids((prev) => prev.filter((k) => k.id !== kidId))
  }

  return (
    <div className="flex flex-col gap-3">
      <Profile
        name={profile.name}
        email={profile.email}
        initials={initials}
        avatarUrl={profile.avatar_url}
        optIn={optIn}
        isAdmin={profile.is_admin}
        children={kids}
        onToggleOptIn={handleToggleOptIn}
        onOpenAdmin={() => router.push('/admin')}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
        onAddChild={handleAddChild}
        onRemoveChild={handleRemoveChild}
      />

      {/* Add kid form */}
      {addingKid && (
        <div className="overflow-hidden rounded-[18px] border border-[#ebeeec] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.03),0_10px_26px_rgba(16,24,40,0.05)]">
          <div className="mb-3 text-[14px] font-bold text-[#15201d]">Nov otroški profil</div>
          <input
            type="text"
            placeholder="Ime otroka (npr. Matic)"
            value={kidName}
            onChange={(e) => setKidName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveKid()}
            className="mb-3 w-full rounded-[13px] border border-[#ebeeec] bg-[#f4f7f6] px-4 py-3 text-[14px] outline-none focus:border-[#0f766e]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setAddingKid(false); setKidName('') }}
              className="flex-1 rounded-[13px] border border-[#ebeeec] py-[11px] text-[14px] font-semibold text-[#6b7280] transition-colors hover:bg-[#fafbfb]"
            >
              Prekliči
            </button>
            <button
              type="button"
              onClick={handleSaveKid}
              disabled={savingKid || !kidName.trim()}
              className="flex-1 rounded-[13px] bg-[#0f766e] py-[11px] text-[14px] font-semibold text-white transition-colors hover:bg-[#0c5f58] disabled:opacity-50"
            >
              {savingKid ? 'Ustvarjam...' : 'Dodaj profil'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
