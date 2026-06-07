import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Goodish Football Predictor ⚽',
  description: 'Napovej rezultate tekem SP 2026 — Goodish ekipa',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl">
      <body className="min-h-screen flex flex-col" style={{ background: 'var(--goodish-gray)', color: 'var(--foreground)' }}>
        <main className="flex-1 flex flex-col">
          {children}
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-gray-200 bg-white py-4 px-6 mt-auto pb-20 md:pb-4">
          <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <img
                src="https://goodish.agency/wp-content/uploads/2023/06/goodish-logotype-full-color-rgb-1024x251.png"
                alt="Goodish"
                className="h-5 object-contain"
              />
            </div>
            <div className="flex items-center gap-4">
              <span>⚽ SP 2026 Predictor</span>
              <a
                href="https://goodish.agency"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
                style={{ color: 'var(--goodish-green)' }}
              >
                goodish.agency →
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
