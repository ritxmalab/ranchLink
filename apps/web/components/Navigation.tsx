'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/models', label: 'Models' },
    { href: '/start', label: 'Claim Tag' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/market', label: 'Marketplace' },
    { href: '/superadmin', label: 'Factory', admin: true },
  ]

  return (
    <nav className="bg-[var(--bg-secondary)] border-b border-[#1F2937] sticky top-0 z-50 backdrop-blur-lg bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold gradient-text">
              🐄 RanchLink
            </span>
          </Link>
          <div className="flex items-center gap-6">
            {navItems
              .filter((item) => !item.admin) // Hide admin items in nav for now
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-gradient-to-r from-[var(--c2)] to-[var(--c3)] text-white'
                    : 'text-[var(--c4)] hover:text-[var(--c2)] hover:bg-[var(--bg-card)]'
                }`}
                >
                  {item.label}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

