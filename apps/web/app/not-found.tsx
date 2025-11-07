import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg)] to-[var(--bg-secondary)] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-[var(--c4)] mb-8">This page could not be found.</p>
        <div className="flex gap-4 justify-center">
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
          <Link href="/superadmin" className="btn-secondary">
            Super Admin
          </Link>
        </div>
      </div>
    </div>
  )
}

