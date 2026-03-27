'use client'

import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[var(--bg-secondary)] border-t border-[#1F2937] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-xl font-bold gradient-text">🐄 RanchLink</span>
            </Link>
            <p className="mt-3 text-sm text-[var(--c4)] max-w-xs">
              Tag. Scan. Done. Livestock management that adapts to your environment.
            </p>
          </div>

          {/* Store & product */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--c1)] uppercase tracking-wider mb-4">
              Store
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/#pricing" className="text-sm text-[var(--c4)] hover:text-[var(--c2)] transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/models" className="text-sm text-[var(--c4)] hover:text-[var(--c2)] transition-colors">
                  Models
                </Link>
              </li>
              <li>
                <Link href="/#how" className="text-sm text-[var(--c4)] hover:text-[var(--c2)] transition-colors">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--c1)] uppercase tracking-wider mb-4">
              Get started
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/start" className="text-sm text-[var(--c4)] hover:text-[var(--c2)] transition-colors">
                  Claim Tag
                </Link>
              </li>
              <li>
                <Link href="/ranch" className="text-sm text-[var(--c4)] hover:text-[var(--c2)] transition-colors">
                  My Ranch
                </Link>
              </li>
              <li>
                <Link href="/claim-kit" className="text-sm text-[var(--c4)] hover:text-[var(--c2)] transition-colors">
                  Claim Kit
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--c1)] uppercase tracking-wider mb-4">
              Contact
            </h4>
            <a href="mailto:solve@ritxma.com?subject=RanchLink" className="text-sm text-[var(--c4)] hover:text-[var(--c2)] transition-colors">
              solve@ritxma.com
            </a>
          </div>
        </div>

        {/* Bottom bar: compliance + legal */}
        <div className="mt-10 pt-8 border-t border-[#1F2937] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--c4)] text-center sm:text-left max-w-2xl">
            Management tag — not APHIS 840 official. Use with 840 RFID for interstate. All tags work forever with the software.
          </p>
          <p className="text-xs text-[var(--c4)] shrink-0">
            © {currentYear} RanchLink · Ritxma Integrations
          </p>
        </div>
      </div>
    </footer>
  )
}
