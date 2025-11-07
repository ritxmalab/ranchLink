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
    <html lang="en">
      <body className="font-sans">
        {/* Compliance Banner */}
        <div className="bg-gradient-to-r from-[var(--c2)] to-[var(--c3)] text-white text-center py-2 text-xs font-medium">
          Management tag — not APHIS 840 official. Use with 840 RFID for interstate.
        </div>
        <Navigation />
        {children}
      </body>
    </html>
  )
}

