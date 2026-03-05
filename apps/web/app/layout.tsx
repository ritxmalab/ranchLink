import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import './globals.css'

export const metadata: Metadata = {
  title: 'RanchLink — Tag. Scan. Done.',
  description: '2-minute setup. Public Animal Card. Owner-only edits. Vet photos & proofs in one place.',
  keywords: ['livestock', 'cattle', 'ranch', 'animal tracking', 'blockchain', 'NFT'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <head>
        <link rel="preload" href="/interaction/2.png" as="image" />
        <link rel="preload" href="/interaction/4.png" as="image" />
        <link rel="preload" href="/interaction/6.png" as="image" />
      </head>
      <body className="font-sans overflow-x-hidden min-w-0">
        {/* Compliance Banner */}
        <div className="bg-gradient-to-r from-[var(--c2)] to-[var(--c3)] text-white text-center py-2 px-4 text-xs font-medium whitespace-normal overflow-hidden">
          Management tag — not APHIS 840 official. Use with 840 RFID for interstate.
        </div>
        <Navigation />
        {children}
      </body>
    </html>
  )
}

