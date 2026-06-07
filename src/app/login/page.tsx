'use client'

import { createClient } from '@/utils/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'

function LoginForm() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const inviteCode = searchParams.get('inviteCode')
  const next = inviteCode ? `/join?code=${inviteCode}` : '/dashboard'

  const [mode, setMode] = useState<'main' | 'email-login' | 'email-register' | 'check-email'>('main')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
  }

  const handleEmailLogin = async () => {
    if (!email || !password) return
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Napačen e-mail ali geslo.'); setLoading(false); return }
    router.push(next)
  }

  const handleEmailRegister = async () => {
    if (!email || !password || !name) return
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    if (error) { setError(error.message); setLoading(false); return }
    setMode('check-email')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--page)' }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">

        {/* Logo */}
        <a href="https://goodish.agency" target="_blank" rel="noopener noreferrer" className="inline-block mb-6">
          <img
            src="https://goodish.agency/wp-content/uploads/2023/06/goodish-logotype-full-color-rgb-1024x251.png"
            alt="Goodish" className="h-8 mx-auto object-contain"
          />
        </a>

        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl"
          style={{ background: '#e6faf8' }}>⚽</div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Football Predictor</h1>
        <p className="text-gray-500 text-sm mb-2">Svetovno Prvenstvo 2026</p>

        {inviteCode && (
          <div className="mb-4 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#e6faf8', color: '#0a5c55' }}>
            🎉 Prijaviš se in samodejno se pridružiš skupini!
          </div>
        )}

        {/* ── CHECK EMAIL state ── */}
        {mode === 'check-email' ? (
          <div className="mt-4">
            <div className="text-4xl mb-4">📬</div>
            <p className="font-semibold text-gray-800 mb-2">Preveri e-pošto</p>
            <p className="text-sm text-gray-500">
              Poslali smo ti potrditveni e-mail na <strong>{email}</strong>. Klikni na link za aktivacijo računa.
            </p>
          </div>
        ) : mode === 'main' ? (
          <>
            <p className="text-gray-400 text-sm mb-6">Prijavi se in začni z napovedmi</p>
            <div className="space-y-3">
              {/* Google */}
              <button onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Prijava z Googlom
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">ali</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Email/password */}
              <button onClick={() => setMode('email-login')}
                className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white font-medium py-3 px-4 rounded-xl hover:bg-gray-800 transition-colors">
                ✉️ Prijava z e-pošto
              </button>
              <button onClick={() => setMode('email-register')}
                className="w-full text-sm font-medium py-2 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Registracija z e-pošto
              </button>
            </div>
          </>
        ) : mode === 'email-login' ? (
          <>
            <p className="text-gray-500 text-sm mb-5">Prijava z e-pošto in geslom</p>
            <div className="space-y-3 text-left">
              <input type="email" placeholder="E-pošta" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{ borderColor: email ? '#0f766e' : undefined }}
              />
              <input type="password" placeholder="Geslo" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button onClick={handleEmailLogin} disabled={loading || !email || !password}
                className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50"
                style={{ background: 'linear-gradient(115deg,#0f766e 0%,#2dd4bf 100%)' }}>
                {loading ? 'Prijavljam...' : 'Prijava'}
              </button>
              <button onClick={() => { setMode('main'); setError('') }}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">
                ← Nazaj
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-5">Ustvari nov račun</p>
            <div className="space-y-3 text-left">
              <input type="text" placeholder="Ime in priimek" value={name} onChange={e => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
              />
              <input type="email" placeholder="E-pošta" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
              />
              <input type="password" placeholder="Geslo (min. 6 znakov)" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button onClick={handleEmailRegister} disabled={loading || !email || !password || !name}
                className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50"
                style={{ background: 'linear-gradient(115deg,#0f766e 0%,#2dd4bf 100%)' }}>
                {loading ? 'Registriram...' : 'Ustvari račun'}
              </button>
              <button onClick={() => { setMode('main'); setError('') }}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">
                ← Nazaj
              </button>
            </div>
          </>
        )}

        <p className="mt-6 text-xs text-gray-400">
          Z nadaljevanjem se strinjaš s{' '}
          <a href="/zasebnost" style={{ color: '#0f766e', textDecoration: 'none' }}>politiko zasebnosti</a>.
          Aplikacija je izključno zabavne narave.
        </p>
      </div>

      {/* Scoring rules */}
      <div className="w-full max-w-md mt-4 bg-white rounded-2xl shadow-sm p-6 text-left">
        <h2 className="text-base font-bold mb-3" style={{ color: '#1a1a1a' }}>🏆 Pravila igre</h2>
        <div className="space-y-2 mb-4">
          {[
            { e: '🎯', l: 'Točen rezultat (npr. 2:1 → 2:1)', p: '3 točke' },
            { e: '📐', l: 'Pravilen tip + zadetki ene ekipe (npr. 3:1 → 2:1)', p: '2 točki' },
            { e: '✅', l: 'Pravilen tip (zmagovalec ali remi)', p: '1 točka' },
            { e: '⚡', l: 'Od 1/8 finala naprej', p: '× 2 točke' },
          ].map(r => (
            <div key={r.l} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-600">{r.e} {r.l}</span>
              <span className="font-bold text-sm ml-4 shrink-0" style={{ color: '#0f766e' }}>{r.p}</span>
            </div>
          ))}
        </div>
        <h3 className="text-sm font-bold mb-2 mt-4" style={{ color: '#1a1a1a' }}>🔮 Posebne napovedi (bonus)</h3>
        <div className="space-y-1">
          <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
            <span className="text-sm text-gray-600">🏆 Zmagovalec SP, strelec, MVP</span>
            <span className="font-bold text-sm ml-4 shrink-0" style={{ color: '#0f766e' }}>10 točk vsak</span>
          </div>
          <div className="flex justify-between items-center py-1.5">
            <span className="text-sm text-gray-600">🥇 Zmagovalec vsake skupine (A–L)</span>
            <span className="font-bold text-sm ml-4 shrink-0" style={{ color: '#0f766e' }}>3 točke vsaka</span>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-400">Posebne napovedi se zaklenejo 11. junija ob 20:00.</p>
      </div>

      <p className="mt-4 mb-8 text-xs text-gray-400">
        Made with ❤️ by{' '}
        <a href="https://goodish.agency" target="_blank" rel="noopener noreferrer"
          className="font-medium hover:underline" style={{ color: '#0f766e' }}>
          Goodish
        </a>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
