'use client'

import { useState } from 'react'
import InteractiveCattleTag from '@/components/InteractiveCattleTag'

/* Single→1 orange, 5-Pack→5 orange, Stack→10 orange (ex-Custom), Custom: vacía */
const PRICING_TIERS = [
  { id: 0, title: 'Single', price: '$3.39', img: '/1.png', imgInteraction: '/interaction/2.png', alt: 'Single tag', features: ['1 QR tag', 'Public card', 'NFT ownership', 'Optional refill service'], imgBg: 'bg-[var(--c2)]/10', isContact: false, priceGradient: false },
  { id: 1, title: '5-Pack', price: '$14.99', img: '/2.png', imgInteraction: '/interaction/4.png', alt: '5-Pack', features: ['5 QR tags', 'Public cards', 'NFT ownership', 'Optional refill service'], imgBg: 'bg-[var(--c2)]/10', priceGradient: true, isContact: false },
  { id: 2, title: 'Stack', price: '$27.49', img: '/3.png', imgInteraction: '/interaction/6.png', alt: 'Stack', features: ['10 QR tags', 'Public cards', 'NFT ownership', 'Optional refill service'], imgBg: 'bg-[var(--c2)]/10', isContact: false, priceGradient: false },
  { id: 3, title: 'Custom', price: 'Contact Us', img: '/4.png', imgInteraction: null, alt: 'Custom', features: ['Bulk orders', 'Custom colors', 'Enterprise', 'Refill service available'], imgBg: 'bg-[var(--c3)]/10', isContact: true, priceGradient: false },
] as const

export default function Home() {
  const [selectedCard, setSelectedCard] = useState<number | null>(null)

  return (
    <main className="min-h-screen bg-[var(--bg)] overflow-x-hidden">
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center max-w-full">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 gradient-text break-words">
          Tag. <span className="text-[var(--c2)]">Scan.</span> Done.
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-[var(--c4)] mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
          2-minute setup. Public Animal Card. Owner-only edits. Vet photos & proofs in one place.
        </p>
        <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
          <a href="/start" className="btn-primary text-sm sm:text-base px-4 sm:px-6 py-3 sm:py-4">
            📷 Scan Tag
          </a>
          <a href="/start" className="btn-secondary text-sm sm:text-base px-4 sm:px-6 py-3">
            Get Started
          </a>
        </div>
      </section>

      {/* Banner card under hero */}
      <section className="container mx-auto px-4 sm:px-6 pb-10 max-w-full">
        <div className="max-w-5xl mx-auto border-2 border-[var(--c2)] rounded-3xl overflow-hidden bg-[var(--bg-card)] shadow-md">
          <div className="grid md:grid-cols-[1.6fr_2fr] gap-0">
            <div className="relative overflow-hidden">
              <img
                src="/banner-ranchlink.png"
                alt="Livestock with RanchLink tags"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex flex-col justify-between p-5 sm:p-6 md:p-8 gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 text-[var(--c1)]">
                  We build livestock management that adapts to any given conditions of the environment.
                </h2>
                <p className="text-sm sm:text-base text-[var(--c4)] max-w-md">
                  Affordable custom device to monitor, track and manage real world data into real world assets.
                </p>
              </div>
              <div className="flex justify-end">
                <a
                  href="/start"
                  className="inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[var(--c2)] text-white text-sm sm:text-base font-semibold shadow hover:bg-[#E55A2B] transition-colors"
                >
                  make it real
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — blue tag left (floating + rotating), steps right */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 max-w-full overflow-x-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">How It Works</h2>
        <p className="text-center text-sm sm:text-base text-[var(--c4)] mb-8 sm:mb-12 max-w-2xl mx-auto px-2">
          <strong>All tags work forever with the software.</strong> Optional refill service available. Custom capabilities available as separate service.
        </p>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center justify-items-start gap-3 sm:gap-8 md:gap-14 max-w-5xl mx-auto w-full">
          <InteractiveCattleTag />
          <div className="flex flex-col gap-2 sm:gap-6 md:gap-8 min-w-0 w-full">
            <div className="flex items-start gap-2 sm:gap-4 text-left min-w-0">
              <div className="text-2xl sm:text-5xl flex-shrink-0">📱</div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-xl font-semibold mb-0.5 sm:mb-1">Scan</h3>
                <p className="text-[var(--c4)] text-xs sm:text-base">Scan QR code on your tag</p>
              </div>
            </div>
            <div className="flex items-start gap-2 sm:gap-4 text-left min-w-0">
              <div className="text-2xl sm:text-5xl flex-shrink-0">✅</div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-xl font-semibold mb-0.5 sm:mb-1">Claim</h3>
                <p className="text-[var(--c4)] text-xs sm:text-base">Claim your tag in 2 minutes</p>
              </div>
            </div>
            <div className="flex items-start gap-2 sm:gap-4 text-left min-w-0">
              <div className="text-2xl sm:text-5xl flex-shrink-0">👁️</div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-xl font-semibold mb-0.5 sm:mb-1">View</h3>
                <p className="text-[var(--c4)] text-xs sm:text-base">Public card for your animal</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 max-w-full overflow-x-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-8 sm:mb-12">Pricing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {PRICING_TIERS.map((tier) => {
            const isSelected = selectedCard === tier.id
            const hasInteraction = tier.imgInteraction != null
            return (
              <div
                key={tier.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedCard(selectedCard === tier.id ? null : tier.id)}
                onClick={() => setSelectedCard(selectedCard === tier.id ? null : tier.id)}
                className={`
                  pricing-card group text-left rounded-xl overflow-hidden transition-all duration-200 p-4 sm:p-4 cursor-pointer min-w-0
                  border-2
                  hover:border-[var(--c2)] hover:shadow-xl hover:shadow-[var(--c2)]/20
                  ${isSelected
                    ? 'border-[var(--c2)] shadow-xl shadow-[var(--c2)]/25 bg-[var(--c2)]/20'
                    : 'border-[#1F2937] bg-[var(--bg-card)]'
                  }
                `}
              >
                <div className={`relative aspect-[4/3] overflow-hidden rounded-lg p-2 ${tier.imgBg} flex items-center justify-center`}>
                  <img
                    src={tier.img}
                    alt={tier.alt}
                    className={`pricing-img-default absolute inset-0 w-full h-full ${hasInteraction ? '' : ''}`}
                  />
                  {hasInteraction && (
                    <img
                      src={tier.imgInteraction!}
                      alt={`${tier.alt} (interacción)`}
                      className="pricing-img-interaction absolute inset-0 w-full h-full opacity-0"
                      fetchPriority="high"
                    />
                  )}
                </div>
                <div className="pt-4">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">{tier.title}</h3>
                  <p className={`font-bold mb-4 ${tier.isContact ? 'text-base sm:text-lg text-[var(--c2)]' : `text-3xl sm:text-4xl ${tier.priceGradient ? 'gradient-text' : 'text-[var(--c2)]'}`}`}>
                    {tier.price}
                  </p>
                  <ul className="text-sm text-[var(--c4)] space-y-2">
                    {tier.features.map((f) => (
                      <li key={f}>✓ {f}</li>
                    ))}
                  </ul>
                  <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="flex-1 py-2 px-3 text-sm font-medium rounded-lg bg-[var(--c2)] text-white hover:opacity-90 transition-opacity"
                    >
                      Add to cart
                    </button>
                    <button
                      type="button"
                      className="py-2 px-3 text-sm font-medium rounded-lg border border-[var(--c2)] text-[var(--c2)] hover:bg-[var(--c2)]/10 transition-colors"
                    >
                      Buy
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}

