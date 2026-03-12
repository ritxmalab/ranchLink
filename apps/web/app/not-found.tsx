export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-4">This page could not be found.</h2>
        <p className="text-[var(--c4)] mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/" className="btn-primary">
            Go Home
          </a>
          <a href="/superadmin" className="btn-secondary">
            Super Admin
          </a>
        </div>
      </div>
    </div>
  )
}
