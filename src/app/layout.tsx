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
            <a href="https://goodish.agency" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', lineHeight: 0 }}>
              <img
                src="https://goodish.agency/wp-content/uploads/2023/06/goodish-logotype-full-color-rgb-1024x251.png"
                alt="Goodish"
                style={{ height: 22, objectFit: 'contain', filter: 'hue-rotate(0deg) saturate(1)' }}
              />
            </a>
            <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right', lineHeight: 1.7 }}>
              SP 2026 Predictor<br />
              <a href="/pravila" style={{ color: 'var(--teal)', textDecoration: 'none', fontWeight: 600 }}>Pravila igre</a>
              {' · '}
              <a href="/zasebnost" style={{ color: 'var(--teal)', textDecoration: 'none', fontWeight: 600 }}>Zasebnost</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
