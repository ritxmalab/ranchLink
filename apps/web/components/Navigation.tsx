'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/#pricing', label: 'Pricing' },
    { href: '/#how', label: 'How It Works' },
    { href: '/models', label: 'Models' },
    { href: '/start', label: 'Claim Tag' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/superadmin', label: 'Factory', admin: true },
  ]

  return (
    <nav className="bg-[var(--bg-secondary)] border-b border-[#1F2937] sticky top-0 z-50 backdrop-blur-lg bg-opacity-90 overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 gap-2 min-w-0">
          <Link href="/" className="flex items-center shrink-0">
            <span className="text-lg sm:text-2xl font-bold gradient-text truncate">
              🐄 RanchLink
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-hide py-2 -mx-2">
            {navItems
              .filter((item) => !item.admin)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
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

