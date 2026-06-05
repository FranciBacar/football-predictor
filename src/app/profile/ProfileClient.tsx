'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { LogOut, Trash2, Globe, Lock } from 'lucide-react'

type UserProfile = {
  id: string
  name: string
  email: string
  avatar_url: string | null
  is_global_opt_in: boolean
}

export default function ProfileClient({ profile }: { profile: UserProfile }) {
  const supabase = createClient()
  const router = useRouter()

  const [isOptIn, setIsOptIn] = useState(profile.is_global_opt_in)
  const [savingOptIn, setSavingOptIn] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleOptInToggle = async () => {
    const newValue = !isOptIn
    setSavingOptIn(true)
    setIsOptIn(newValue)

    const { error } = await supabase
      .from('users')
      .update({ is_global_opt_in: newValue, updated_at: new Date().toISOString() })
      .eq('id', profile.id)

    if (error) {
      setIsOptIn(!newValue) // revert on error
      alert('Napaka pri shranjevanju: ' + error.message)
    }
    setSavingOptIn(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    // Delete all user data - RLS ON DELETE CASCADE handles predictions, group_members
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', profile.id)

    if (error) {
      alert('Napaka pri brisanju računa: ' + error.message)
      setDeleting(false)
      return
    }

    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="space-y-4 max-w-lg">

      {/* Profile card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.name}
              width={64}
              height={64}
              className="rounded-full border-2 border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>
      </div>

      {/* Privacy setting */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-1">Zasebnost</h3>
        <p className="text-sm text-gray-500 mb-4">
          Določi, ali si viden na globalni lestvici vseh igralcev.
        </p>
        <button
          onClick={handleOptInToggle}
          disabled={savingOptIn}
          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
            isOptIn
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            {isOptIn ? (
              <Globe size={20} className="text-blue-600" />
            ) : (
              <Lock size={20} className="text-gray-400" />
            )}
            <div className="text-left">
              <p className={`font-semibold text-sm ${isOptIn ? 'text-blue-700' : 'text-gray-700'}`}>
                {isOptIn ? 'Viden na globalni lestvici' : 'Skrit z globalne lestvice'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isOptIn
                  ? 'Tvoje ime in točke so vidni vsem.'
                  : 'Viden si samo znotraj svojih skupin.'}
              </p>
            </div>
          </div>
          {/* Toggle switch */}
          <div className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${isOptIn ? 'bg-blue-500' : 'bg-gray-300'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isOptIn ? 'translate-x-7' : 'translate-x-1'}`} />
          </div>
        </button>
      </div>

      {/* Sign out */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Račun</h3>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          <LogOut size={18} />
          Odjava
        </button>
      </div>

      {/* Delete account */}
      <div className="bg-white rounded-xl shadow-sm border border-red-100 p-5">
        <h3 className="font-semibold text-red-700 mb-1">Nevarno območje</h3>
        <p className="text-sm text-gray-500 mb-4">
          Trajno izbriše tvoj račun, vse napovedi in podatke. Te akcije ni mogoče razveljaviti.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors"
          >
            <Trash2 size={18} />
            Izbriši račun
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-red-700 bg-red-50 p-3 rounded-lg">
              Si prepričan? Vse napovedi in podatki bodo trajno izgubljeni.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
              >
                Prekliči
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Brišem...' : 'Da, izbriši'}
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
