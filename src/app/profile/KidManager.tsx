'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trash2, Plus } from 'lucide-react'

const EMOJIS = ['⚽', '🏆', '🦁', '🐯', '🦊', '🐼', '🚀', '⭐', '🦄', '🐲', '🎯', '🏅']

type Kid = {
  id: string
  name: string
  avatar_emoji: string
}

export default function KidManager({ parentId, initialKids }: { parentId: string; initialKids: Kid[] }) {
  const supabase = createClient()
  const [kids, setKids] = useState<Kid[]>(initialKids)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('⚽')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const addKid = async () => {
    if (!name.trim()) return
    setLoading(true)

    // Ustvari fake email za otroka
    const kidId = crypto.randomUUID()
    const fakeEmail = `kid_${kidId}@internal.fp2026`

    // Vstavi otroka direktno v users tabelo (brez auth — admin client ni na voljo client-side)
    // Uporabimo RPC funkcijo
    const { data, error } = await supabase.rpc('create_kid_profile', {
      p_parent_id: parentId,
      p_name: name.trim(),
      p_avatar_emoji: emoji,
    })

    if (error) {
      alert('Napaka: ' + error.message)
      setLoading(false)
      return
    }

    const newKid: Kid = { id: data, name: name.trim(), avatar_emoji: emoji }
    setKids(prev => [...prev, newKid])
    setName('')
    setEmoji('⚽')
    setAdding(false)
    setLoading(false)
  }

  const deleteKid = async (kidId: string) => {
    if (!confirm('Izbriši otrokov profil? Vse napovedi bodo izgubljene.')) return
    setDeleting(kidId)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', kidId)
      .eq('parent_user_id', parentId)
    if (!error) {
      setKids(prev => prev.filter(k => k.id !== kidId))
    }
    setDeleting(null)
  }

  return (
    <div id="kids" style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f0f0f0', marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>👦 Otroški profili</h2>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>
            Otrok napove tekme prek tvojega računa
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 999,
            background: 'linear-gradient(115deg, #0f766e 0%, #2dd4bf 100%)',
            color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Dodaj otroka
        </button>
      </div>

      {/* Dodaj otroka form */}
      {adding && (
        <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 14, border: '1px solid #f0f0f0' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 10px' }}>Nov otroški profil</p>

          {/* Emoji picker */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setEmoji(e)}
                style={{
                  fontSize: 22, width: 40, height: 40, borderRadius: 10, border: '2px solid',
                  borderColor: emoji === e ? '#0f766e' : '#e5e7eb',
                  background: emoji === e ? 'rgba(15,118,110,0.08)' : '#fff',
                  cursor: 'pointer',
                }}>
                {e}
              </button>
            ))}
          </div>

          <input
            type="text" placeholder="Ime otroka (npr. Matic)"
            value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addKid()}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10,
              border: '1px solid #e5e7eb', fontSize: 14, marginBottom: 10,
              boxSizing: 'border-box', outline: 'none',
            }}
          />

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setAdding(false); setName('') }}
              style={{ flex: 1, padding: '9px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, fontWeight: 600, color: '#6b7280', cursor: 'pointer' }}>
              Prekliči
            </button>
            <button onClick={addKid} disabled={loading || !name.trim()}
              style={{
                flex: 2, padding: '9px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700,
                color: '#fff', cursor: 'pointer', opacity: (loading || !name.trim()) ? 0.5 : 1,
                background: 'linear-gradient(115deg, #0f766e 0%, #2dd4bf 100%)',
              }}>
              {loading ? 'Ustvarjam...' : `Dodaj ${emoji} ${name || 'otroka'}`}
            </button>
          </div>
        </div>
      )}

      {/* Seznam otrok */}
      {kids.length === 0 && !adding ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontSize: 14 }}>
          Še nimaš dodanih otrok
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {kids.map(kid => (
            <div key={kid.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 12, background: '#f9fafb', border: '1px solid #f0f0f0',
            }}>
              <span style={{ fontSize: 28 }}>{kid.avatar_emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>{kid.name}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Otroški profil</div>
              </div>
              <button
                onClick={() => deleteKid(kid.id)}
                disabled={deleting === kid.id}
                title="Izbriši profil"
                style={{ padding: 8, borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer' }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
