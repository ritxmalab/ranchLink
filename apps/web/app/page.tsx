'use client'

import { useState } from 'react'

export default function Home() {
  const [selectedCard, setSelectedCard] = useState<number | null>(null)

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-7xl font-bold mb-6 gradient-text">
          Tag. <span className="text-[var(--c2)]">Scan.</span> Done.
        </h1>
        <p className="text-xl text-[var(--c4)] mb-8 max-w-2xl mx-auto">
          2-minute setup. Public Animal Card. Owner-only edits. Vet photos & proofs in one place.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="/start" className="btn-primary text-lg px-8 py-4">
            📷 Scan Tag
          </a>
          <a href="/start" className="btn-secondary">
            Get Started
          </a>
          <a href="/models" className="btn-secondary">
            View Models
          </a>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-4">How It Works</h2>
        <p className="text-center text-[var(--c4)] mb-12 max-w-2xl mx-auto">
          <strong>All tags work forever with the software.</strong> Optional refill service available. Custom capabilities available as separate service.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-5xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">Scan</h3>
            <p className="text-[var(--c4)]">Scan QR code on your tag</p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-semibold mb-2">Claim</h3>
            <p className="text-gray-600">Claim your tag in 2 minutes</p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-4">👁️</div>
            <h3 className="text-xl font-semibold mb-2">View</h3>
            <p className="text-gray-600">Public card for your animal</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-5xl font-bold text-center mb-12">Pricing</h2>
        <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {[
            { id: 0, title: 'Single', price: '$3.39', img: '/1.png', alt: 'Single tag', features: ['1 QR tag', 'Public card', 'NFT ownership', 'Optional refill service'], imgBg: 'bg-[var(--c2)]/10' },
            { id: 1, title: '5-Pack', price: '$14.99', img: '/2.png', alt: '5-Pack', features: ['5 QR tags', 'Public cards', 'NFT ownership', 'Optional refill service'], imgBg: 'bg-[var(--c2)]/10', priceGradient: true },
            { id: 2, title: 'Stack', price: '$27.49', img: '/3.png', alt: 'Stack', features: ['10 QR tags', 'Public cards', 'NFT ownership', 'Optional refill service'], imgBg: 'bg-[var(--c2)]/10' },
            { id: 3, title: 'Custom', price: 'Contact Us', img: '/4.png', alt: 'Custom', features: ['Bulk orders', 'Custom colors', 'Enterprise', 'Refill service available'], imgBg: 'bg-[var(--c3)]/10', isContact: true },
          ].map((tier) => {
            const isSelected = selectedCard === tier.id
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setSelectedCard(selectedCard === tier.id ? null : tier.id)}
                className={`
                  text-left rounded-xl overflow-hidden transition-all duration-200 p-4
                  border-2
                  hover:border-[var(--c2)] hover:shadow-xl hover:shadow-[var(--c2)]/20
                  ${isSelected
                    ? 'border-[var(--c2)] shadow-xl shadow-[var(--c2)]/25 bg-[var(--c2)]/20'
                    : 'border-[#1F2937] bg-[var(--bg-card)]'
                  }
                `}
              >
                <div className={`relative aspect-[4/3] overflow-hidden rounded-lg p-2 ${tier.imgBg}`}>
                  <img
                    src={tier.img}
                    alt={tier.alt}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="pt-4">
                  <h3 className="text-2xl font-bold mb-2">{tier.title}</h3>
                  <p className={`font-bold mb-4 ${tier.isContact ? 'text-lg text-[var(--c2)]' : `text-4xl ${tier.priceGradient ? 'gradient-text' : 'text-[var(--c2)]'}`}`}>
                    {tier.price}
                  </p>
                  <ul className="text-sm text-[var(--c4)] space-y-2">
                    {tier.features.map((f) => (
                      <li key={f}>✓ {f}</li>
                    ))}
                  </ul>
                </div>
              </button>
            )
          })}
        </div>
      </section>
    </main>
  )
}

