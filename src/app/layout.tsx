import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Football Predictor',
  description: 'Napovej rezultate tekem',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sl">
      <body className="bg-background text-foreground">
        <main className="min-h-screen flex flex-col items-center">
          {children}
        </main>
      </body>
    </html>
  )
}