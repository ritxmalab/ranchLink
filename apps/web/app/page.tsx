'use client'

import { useEffect, useRef, useState } from 'react'
import { loadStripe, type StripeEmbeddedCheckout } from '@stripe/stripe-js'
import InteractiveCattleTag from '@/components/InteractiveCattleTag'
import ProductCard from '@/components/ProductCard'

const PRODUCTS_BASE = '/products'
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

/** Main pricing (digital/service) + physical catalog. Each item has 2–3 images (A/B/C). */
const PRODUCT_CATALOG = [
  // —— Main pricing (Stripe) ——
  { id: '0', title: 'Single', nameCode: undefined, price: '$3.39', material: undefined, itemCount: undefined, features: ['1 QR tag', 'Public card', 'NFT ownership', 'Optional refill service'], images: ['/1.png', '/interaction/2.png'], imgBg: 'bg-[var(--c2)]/10', isContact: false, stripeTierKey: 'single' as const },
  { id: '1', title: '5-Pack', nameCode: undefined, price: '$14.99', material: undefined, itemCount: undefined, features: ['5 QR tags', 'Public cards', 'NFT ownership', 'Optional refill service'], images: ['/2.png', '/interaction/4.png'], imgBg: 'bg-[var(--c2)]/10', isContact: false, stripeTierKey: 'five_pack' as const },
  { id: '2', title: 'Stack', nameCode: undefined, price: '$27.49', material: undefined, itemCount: undefined, features: ['10 QR tags', 'Public cards', 'NFT ownership', 'Optional refill service'], images: ['/3.png', '/interaction/6.png'], imgBg: 'bg-[var(--c2)]/10', isContact: false, stripeTierKey: 'stack' as const },
  { id: '3', title: 'Custom', nameCode: undefined, price: 'Contact Us', material: undefined, itemCount: undefined, features: ['Bulk orders', 'Custom colors', 'Enterprise', 'Refill service available'], images: ['/4.png'], imgBg: 'bg-[var(--c3)]/10', isContact: true, stripeTierKey: null },
  // —— Physical / labels (from design ref + zip) ——
  { id: 'label-100', title: 'RanchLink Label', nameCode: 'RL-LABEL', price: '$9.99', material: undefined, itemCount: 100, features: ['Batch of 100', 'QR labels'], images: [`${PRODUCTS_BASE}/RL-LABEL.svg`], imgBg: 'bg-[var(--bg-secondary)]', isContact: false, stripeTierKey: null },
  { id: 'tpp-1', title: 'Translucid PETG', nameCode: 'RL-TPP', price: '$1.99', material: 'Translucid PETG', itemCount: 1, features: [], images: [`${PRODUCTS_BASE}/RL-TPP-A.png`, `${PRODUCTS_BASE}/RL-TPP-B.png`], imgBg: 'bg-[var(--c2)]/10', isContact: false, stripeTierKey: null },
  { id: 'tpp-5', title: 'Translucid PETG 5-Pack', nameCode: 'RL-TPP-5', price: '$6.99', material: 'Translucid PETG', itemCount: 5, features: [], images: [`${PRODUCTS_BASE}/RL-TPP-4A.png`, `${PRODUCTS_BASE}/RL-TPP-4B.png`], imgBg: 'bg-[var(--c2)]/10', isContact: false, stripeTierKey: null },
  { id: 'tpp-15', title: 'Translucid PETG 15-Pack', nameCode: 'RL-TPP-15', price: '$31.89', material: 'Translucid PETG', itemCount: 15, features: [], images: [`${PRODUCTS_BASE}/RL-TPP-15A.png`, `${PRODUCTS_BASE}/RL-TPP-15B.png`, `${PRODUCTS_BASE}/RL-TPP-15C.png`], imgBg: 'bg-[var(--c2)]/10', isContact: false, stripeTierKey: null },
  { id: 'o-3', title: 'Orange 3-Pack', nameCode: 'RL-O-3', price: '$3.33', material: 'PETG-HF', itemCount: 3, features: [], images: [`${PRODUCTS_BASE}/RL-O-3A.png`, `${PRODUCTS_BASE}/RL-O-3B.png`], imgBg: 'bg-[var(--c2)]/10', isContact: false, stripeTierKey: null },
  { id: 'ya-3', title: 'Yellow ABS 3-Pack', nameCode: 'RL-YA-3', price: '$3.99', material: 'ABS', itemCount: 3, features: [], images: [`${PRODUCTS_BASE}/RL-YA%2B-3A.png`, `${PRODUCTS_BASE}/RL-YA%2B-3B.png`], imgBg: 'bg-[var(--c3)]/10', isContact: false, stripeTierKey: null },
  { id: 'fb-3', title: 'Fluorescent PETG 3-Pack', nameCode: 'RL-FB', price: '$3.99', material: 'Fluorescent PETG', itemCount: 3, features: [], images: [`${PRODUCTS_BASE}/RL-FBA.png`, `${PRODUCTS_BASE}/RL-FBB.png`], imgBg: 'bg-[var(--c2)]/10', isContact: false, stripeTierKey: null },
]

export default function Home() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [buyingTierId, setBuyingTierId] = useState<string | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null)
  const checkoutContainerRef = useRef<HTMLDivElement | null>(null)
  const embeddedCheckoutRef = useRef<StripeEmbeddedCheckout | null>(null)

  const closeEmbeddedCheckout = () => {
    embeddedCheckoutRef.current?.destroy()
    embeddedCheckoutRef.current = null
    setIsCheckoutOpen(false)
    setCheckoutMessage(null)
  }

  useEffect(() => {
    return () => {
      embeddedCheckoutRef.current?.destroy()
      embeddedCheckoutRef.current = null
    }
  }, [])

  const startCheckout = async (productId: string) => {
    const tierKey = productId === '0' ? 'single' : productId === '1' ? 'five_pack' : productId === '2' ? 'stack' : null
    if (!tierKey) return

    try {
      setBuyingTierId(productId)
      setCheckoutMessage(null)
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierKey, mode: 'embedded' }),
      })

      if (!res.ok) {
        console.error('Checkout failed with status', res.status)
        alert('Could not start checkout. Please try again.')
        return
      }

      const data = (await res.json()) as { url?: string; clientSecret?: string }

      if (data.clientSecret && stripePromise) {
        const stripe = await stripePromise
        if (stripe) {
          embeddedCheckoutRef.current?.destroy()
          const embeddedCheckout = await stripe.initEmbeddedCheckout({
            clientSecret: data.clientSecret,
          })
          embeddedCheckoutRef.current = embeddedCheckout
          setIsCheckoutOpen(true)
          setCheckoutMessage('Complete your payment securely without leaving this page.')
          requestAnimationFrame(() => {
            if (!checkoutContainerRef.current) return
            embeddedCheckout.mount(checkoutContainerRef.current)
          })
          return
        }
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Could not start checkout. Please try again.')
      }
    } catch (error) {
      console.error('Error starting checkout', error)
      alert('Could not start checkout. Please try again.')
    } finally {
      setBuyingTierId(null)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] overflow-x-hidden">
      {/* Banner — top, basically full width */}
      <section className="w-full max-w-none px-2 sm:px-3 pt-4 sm:pt-6 pb-6 sm:pb-10">
        <div className="w-full border-2 border-[var(--c2)] rounded-2xl sm:rounded-3xl overflow-hidden bg-[var(--bg-card)] shadow-md">
          <div className="grid md:grid-cols-[2.2fr_1.8fr] gap-0">
            <div className="relative overflow-hidden">
              <img
                src="/banner-ranchlink.png"
                alt="Livestock with RanchLink tags"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
            <div className="flex flex-col justify-between p-5 sm:p-6 md:p-8 gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 text-[var(--c1)]">
                  We build livestock management that adapts to any given conditions of the environment.
                </h2>
                <p className="text-sm sm:text-base text-[var(--c4)] max-w-sm md:max-w-md lg:max-w-lg">
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

      {/* Tag scan / Hero section — below banner */}
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

      {/* How It Works — blue tag left (floating + rotating), steps right */}
      <section id="how" className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 max-w-full overflow-x-auto bg-[var(--bg-secondary)]/50 scroll-mt-20">
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
            <div className="flex items-start gap-2 sm:gap-4 text-left min-w-0">
              <div className="text-2xl sm:text-5xl flex-shrink-0">🛒</div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-xl font-semibold mb-0.5 sm:mb-1">Get tags</h3>
                <p className="text-[var(--c4)] text-xs sm:text-base">
                  <a href="/#pricing" className="text-[var(--c2)] hover:underline font-medium">Single, 5-Pack, Stack, or Custom</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / engagement line */}
      <section className="container mx-auto px-4 sm:px-6 py-6 max-w-full">
        <p className="text-center text-sm text-[var(--c4)]">
          One-time purchase. No subscription. Data anchored on Base · IPFS. Optional refill service when you need it.
        </p>
      </section>

      {/* Pricing — single grid, continuous scroll (no View more) */}
      <section id="pricing" className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 max-w-full scroll-mt-20">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-8 sm:mb-12">Pricing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {PRODUCT_CATALOG.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              title={product.title}
              nameCode={product.nameCode}
              price={product.price}
              material={product.material}
              itemCount={product.itemCount}
              features={product.features}
              images={product.images}
              imgBg={product.imgBg}
              isContact={product.isContact}
              stripeTierKey={product.stripeTierKey}
              selected={selectedCard === product.id}
              onSelect={() => setSelectedCard(selectedCard === product.id ? null : product.id)}
              buyingTierId={buyingTierId}
              onBuy={product.stripeTierKey ? startCheckout : undefined}
            />
          ))}
        </div>
      </section>

      {isCheckoutOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 p-3 sm:p-6 flex items-center justify-center"
          onClick={closeEmbeddedCheckout}
        >
          <div
            className="w-full max-w-4xl max-h-[95vh] overflow-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Secure Checkout</h3>
              <button
                type="button"
                onClick={closeEmbeddedCheckout}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
            {checkoutMessage && (
              <p className="px-4 pt-3 text-sm text-gray-600">{checkoutMessage}</p>
            )}
            <div ref={checkoutContainerRef} className="p-3 sm:p-4 min-h-[640px]" />
          </div>
        </div>
      )}
    </main>
  )
}

