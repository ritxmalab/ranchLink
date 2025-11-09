import './globals.css'

export const metadata = {
  title: 'RWA QR Label & Manager',
  description: 'Generate blockchain-ready QR labels and manage traceable inventory.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[var(--bg)] text-[var(--c1)] font-sans antialiased">
        {children}
      </body>
    </html>
  )
}


