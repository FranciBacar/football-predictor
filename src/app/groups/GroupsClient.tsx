'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Users, Plus, KeyRound, Copy, Check } from 'lucide-react'

export default function GroupsClient({ userId, initialGroups }: { userId: string, initialGroups: any[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [groups, setGroups] = useState(initialGroups)

  const [isCreating, setIsCreating] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  const [isJoining, setIsJoining] = useState(false)
  const [inviteCode, setInviteCode] = useState('')

  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyInviteCode = async (code: string, groupId: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedId(groupId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    setIsCreating(true)

    // 1. Ustvari skupino v bazi
    const { data: newGroup, error: groupError } = await supabase
      .from('groups')
      .insert({ name: newGroupName.trim(), creator_user_id: userId })
      .select()
      .single()

    if (groupError) {
      alert('Napaka pri kreiranju skupine: ' + groupError.message)
      setIsCreating(false)
      return
    }

    // 2. Dodaj samega sebe v člane skupine
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: newGroup.id, user_id: userId })

    if (!memberError) {
      setGroups(prev => [...prev, newGroup])
      setNewGroupName('')
    }
    setIsCreating(false)
  }

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) return
    setIsJoining(true)

    // 1. Poišči skupino po kodi
    const { data: group, error: fetchError } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', inviteCode.trim())
      .single()

    if (fetchError || !group) {
      alert('Skupina s to kodo ne obstaja.')
      setIsJoining(false)
      return
    }

    // 2. Dodaj se kot člana
    const { error: joinError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: userId })

    if (joinError) {
      alert('V tej skupini si že član ali pa je prišlo do napake.')
    } else {
      setGroups(prev => [...prev, group])
      setInviteCode('')
      alert(`Uspešno si se pridružil skupini: ${group.name}`)
    }
    setIsJoining(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ustvari skupino */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <Plus size={20} className="text-blue-600" />
            Ustvari Skupino
          </h3>
          <input 
            type="text" 
            placeholder="Ime skupine (npr. Sodelavci)" 
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={handleCreateGroup}
            disabled={isCreating || !newGroupName.trim()}
            className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isCreating ? 'Ustvarjam...' : 'Ustvari'}
          </button>
        </div>

        {/* Pridruži se skupini */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <KeyRound size={20} className="text-green-600" />
            Pridruži se s Kodo
          </h3>
          <input 
            type="text" 
            placeholder="Vnesi kodo za povabilo" 
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button 
            onClick={handleJoinGroup}
            disabled={isJoining || !inviteCode.trim()}
            className="w-full bg-green-600 text-white font-medium py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isJoining ? 'Pridružujem...' : 'Pridruži se'}
          </button>
        </div>
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4 flex items-center gap-2">
        <Users size={24} className="text-gray-700" />
        Moje Skupine
      </h2>

      {groups.length === 0 ? (
        <div className="text-center bg-white border border-dashed border-gray-300 rounded-xl py-12 px-4 text-gray-500">
          Trenutno nisi član nobene skupine. Ustvari jo ali pa se pridruži obstoječi s kodo!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {groups.map(group => (
            <div key={group.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg mb-1">{group.name}</h3>
              <div className="text-sm text-gray-500 mb-4 bg-gray-50 px-3 py-2 rounded-md font-mono mt-2 flex justify-between items-center">
                <span>Koda: <strong className="text-gray-900">{group.invite_code}</strong></span>
                <button
                  onClick={() => copyInviteCode(group.invite_code, group.id)}
                  className="ml-2 p-1.5 rounded-md hover:bg-gray-200 transition-colors text-gray-500"
                  title="Kopiraj kodo"
                >
                  {copiedId === group.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                </button>
              </div>
              <button
                onClick={() => router.push(`/leaderboard?group=${group.id}`)}
                className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Poglej Lestvico
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}