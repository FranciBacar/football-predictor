import './globals.css'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import CookieBanner from '@/components/CookieBanner'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'Goodish Football Predictor ⚽',
  description: 'Napovej rezultate tekem SP 2026 — Goodish ekipa',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen flex flex-col`}
        style={{ background: 'var(--page)', color: 'var(--ink)', fontFamily: 'var(--font)' }}>
        <main className="flex-1 flex flex-col">
          {children}
        </main>

        <CookieBanner />

        <footer className="w-full border-t pb-20 md:pb-4" style={{ borderColor: 'var(--line)', background: 'white' }}>
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <span style={{ fontWeight: 700, fontSize: 18, color: '#1a1a1a', letterSpacing: '-0.045em' }}>
              goodish<span style={{ color: '#0f766e' }}>.</span>
            </span>
            <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right', lineHeight: 1.7 }}>
              SP 2026 Predictor<br />
              <a href="/pravila" style={{ color: 'var(--teal)', textDecoration: 'none', fontWeight: 600 }}>Pravila igre</a>
              {' · '}
              <a href="/zasebnost" style={{ color: 'var(--teal)', textDecoration: 'none', fontWeight: 600 }}>Zasebnost</a>
              {' · '}
              <a href="https://goodish.agency" target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--teal)', textDecoration: 'none', fontWeight: 600 }}>
                goodish.agency →
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
