'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Users, Plus, KeyRound, Copy, Check, BarChart2, ChevronDown, ChevronUp, Trash2, LogOut } from 'lucide-react'

type Member = { id: string; name: string; avatar_url: string | null }
type Group = { id: string; name: string; invite_code: string; creator_user_id: string; members?: Member[] }

export default function GroupsClient({ userId, initialGroups }: { userId: string; initialGroups: Group[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  const [isCreating, setIsCreating] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const getInviteUrl = (code: string) =>
    typeof window !== 'undefined'
      ? `${window.location.origin}/join?code=${code}`
      : `/join?code=${code}`

  const copyInviteLink = async (code: string, groupId: string) => {
    await navigator.clipboard.writeText(getInviteUrl(code))
    setCopiedId(groupId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    setIsCreating(true)
    const { data: newGroup, error } = await supabase
      .from('groups')
      .insert({ name: newGroupName.trim(), creator_user_id: userId })
      .select()
      .single()
    if (error) { alert('Napaka: ' + error.message); setIsCreating(false); return }
    await supabase.from('group_members').insert({ group_id: newGroup.id, user_id: userId })
    setGroups(prev => [...prev, { ...newGroup, members: [] }])
    setNewGroupName('')
    setIsCreating(false)
  }

  const handleDeleteGroup = async (groupId: string) => {
    setDeleting(groupId)
    const { error } = await supabase.from('groups').delete().eq('id', groupId)
    if (error) { alert('Napaka pri brisanju: ' + error.message); setDeleting(null); return }
    setGroups(prev => prev.filter(g => g.id !== groupId))
    setConfirmDelete(null)
    setDeleting(null)
  }

  const handleLeaveGroup = async (groupId: string) => {
    const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId)
    if (error) { alert('Napaka: ' + error.message); return }
    setGroups(prev => prev.filter(g => g.id !== groupId))
    setConfirmDelete(null)
  }

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) return
    setIsJoining(true)
    const { data: group, error } = await supabase
      .from('groups').select('*').eq('invite_code', inviteCode.trim()).single()
    if (error || !group) { alert('Skupina s to kodo ne obstaja.'); setIsJoining(false); return }
    const { error: joinError } = await supabase
      .from('group_members').insert({ group_id: group.id, user_id: userId })
    if (joinError) { alert('Si že član ali prišlo do napake.') }
    else { setGroups(prev => [...prev, { ...group, members: [] }]); setInviteCode('') }
    setIsJoining(false)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users size={20} style={{ color: 'var(--goodish-green)' }} />
          Moje Skupine
        </h2>
        <p className="text-sm text-gray-500 mt-1">Ustvari skupino, povabi prijatelje in tekmuj na skupinski lestvici.</p>
      </div>

      {/* Create + Join */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Plus size={18} style={{ color: 'var(--goodish-green)' }} />
            Ustvari skupino
          </h3>
          <input
            type="text"
            placeholder="Ime skupine (npr. Goodish ekipa)"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateGroup()}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 mb-3 focus:outline-none focus:ring-2 text-sm"
            style={{ '--tw-ring-color': 'var(--goodish-green)' } as any}
          />
          <button
            onClick={handleCreateGroup}
            disabled={isCreating || !newGroupName.trim()}
            className="w-full text-white font-medium py-2.5 rounded-lg disabled:opacity-50 transition-colors text-sm"
            style={{ background: isCreating || !newGroupName.trim() ? '#aaa' : 'var(--goodish-gradient)' }}
          >
            {isCreating ? 'Ustvarjam...' : 'Ustvari skupino'}
          </button>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <KeyRound size={18} className="text-gray-500" />
            Pridruži se s kodo
          </h3>
          <input
            type="text"
            placeholder="Vnesi povabilo kodo"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoinGroup()}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-mono"
          />
          <button
            onClick={handleJoinGroup}
            disabled={isJoining || !inviteCode.trim()}
            className="w-full bg-gray-900 text-white font-medium py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm"
          >
            {isJoining ? 'Pridružujem...' : 'Pridruži se'}
          </button>
        </div>
      </div>

      {/* Groups list */}
      {groups.length === 0 ? (
        <div className="text-center bg-white border border-dashed border-gray-300 rounded-xl py-16 px-4 text-gray-500">
          <Users size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Še nisi v nobeni skupini</p>
          <p className="text-sm mt-1">Ustvari skupino ali se pridruži s povabilno kodo.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(group => {
            const isExpanded = expandedGroup === group.id
            const members = group.members || []
            const isCreator = group.creator_user_id === userId

            return (
              <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Group header */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{group.name}</h3>
                      {isCreator && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--goodish-green-light)', color: 'var(--goodish-green-dark)' }}>
                          Admin
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">{members.length} član{members.length !== 1 ? (members.length >= 2 && members.length <= 4 ? 'i' : 'ov') : ''}</span>
                  </div>

                  {/* Members avatars */}
                  <div className="flex items-center gap-1 mb-4">
                    {members.slice(0, 8).map((m, i) => (
                      m.avatar_url ? (
                        <img
                          key={m.id}
                          src={m.avatar_url}
                          alt={m.name}
                          title={m.name}
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover"
                          style={{ zIndex: 10 - i, marginLeft: i > 0 ? '-8px' : '0' }}
                        />
                      ) : (
                        <div
                          key={m.id}
                          title={m.name}
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: 'var(--goodish-gradient)', zIndex: 10 - i, marginLeft: i > 0 ? '-8px' : '0' }}
                        >
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                      )
                    ))}
                    {members.length > 8 && (
                      <span className="ml-2 text-sm text-gray-500">+{members.length - 8} več</span>
                    )}
                  </div>

                  {/* Invite link */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">Povabilo link</p>
                      <p className="text-xs font-mono text-gray-600 truncate">/join?code={group.invite_code}</p>
                    </div>
                    <button
                      onClick={() => copyInviteLink(group.invite_code, group.id)}
                      className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
                      style={copiedId === group.id
                        ? { background: 'var(--goodish-green-light)', borderColor: 'var(--goodish-green)', color: 'var(--goodish-green-dark)' }
                        : { background: 'white', borderColor: '#e5e7eb', color: '#374151' }
                      }
                    >
                      {copiedId === group.id ? <Check size={13} /> : <Copy size={13} />}
                      {copiedId === group.id ? 'Kopirano!' : 'Kopiraj'}
                    </button>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/leaderboard?group=${group.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-white text-sm font-medium transition-colors"
                      style={{ background: 'linear-gradient(115deg,#0f766e 0%,#2dd4bf 100%)' }}
                    >
                      <BarChart2 size={15} />
                      Lestvica
                    </button>
                    <button
                      onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      <Users size={15} />
                      Člani
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(confirmDelete === group.id ? null : group.id)}
                      className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 hover:bg-red-50 transition-colors"
                      title={isCreator ? 'Izbriši skupino' : 'Zapusti skupino'}
                    >
                      {isCreator ? <Trash2 size={15} className="text-red-400" /> : <LogOut size={15} className="text-gray-400" />}
                    </button>
                  </div>

                  {/* Delete/Leave confirmation */}
                  {confirmDelete === group.id && (
                    <div className="mt-3 p-3 rounded-xl border border-red-100 bg-red-50">
                      <p className="text-sm font-semibold text-red-700 mb-2">
                        {isCreator
                          ? '⚠️ Izbriši skupino? Vsi člani bodo odstranjeni.'
                          : '⚠️ Zapusti skupino?'}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="flex-1 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium bg-white hover:bg-gray-50"
                        >
                          Prekliči
                        </button>
                        <button
                          onClick={() => isCreator ? handleDeleteGroup(group.id) : handleLeaveGroup(group.id)}
                          disabled={deleting === group.id}
                          className="flex-1 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                        >
                          {deleting === group.id ? 'Brišem...' : isCreator ? 'Da, izbriši' : 'Da, zapusti'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded members list */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4" style={{ background: 'var(--goodish-gray)' }}>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Člani ({members.length})</h4>
                    <div className="space-y-2">
                      {members.map(m => (
                        <div key={m.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 shadow-sm">
                          {m.avatar_url ? (
                            <img src={m.avatar_url} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'var(--goodish-gradient)' }}>
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-800 flex-1">{m.name}</span>
                          {m.id === userId && (
                            <span className="text-xs text-gray-400">(ti)</span>
                          )}
                          {m.id === group.creator_user_id && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--goodish-green-light)', color: 'var(--goodish-green-dark)' }}>Admin</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
