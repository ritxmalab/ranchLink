export default function Home() {
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
          <a href="/scan" className="btn-primary text-lg px-8 py-4">
            📷 Scan Tag
          </a>
          <a href="/start" className="btn-secondary">
            Get Started
          </a>
          <a href="/models" className="btn-secondary">
            View Models
          </a>
          <a href="/market" className="btn-secondary">
            Browse Tags
          </a>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-4">How It Works</h2>
        <p className="text-center text-[var(--c4)] mb-12 max-w-2xl mx-auto">
          <strong>All tags work forever with the software.</strong> Optional refill service available. Custom capabilities available as separate service.
        </p>
        <div className="grid md:grid-cols-4 gap-8">
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
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Peel</h3>
            <p className="text-gray-600">Peel overlay to reveal base QR</p>
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
        <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <div className="card text-center border border-[#1F2937] hover:border-[var(--c2)] transition-all">
            <h3 className="text-2xl font-bold mb-2">Single</h3>
            <p className="text-4xl font-bold text-[var(--c2)] mb-4">$8.99</p>
            <ul className="text-sm text-[var(--c4)] space-y-2">
              <li>✓ 1 QR tag</li>
              <li>✓ Public card</li>
              <li>✓ NFT ownership</li>
              <li>✓ Optional refill service</li>
            </ul>
          </div>
          <div className="card text-center border-2 border-[var(--c2)] shadow-2xl transform scale-105 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)]">
            <h3 className="text-2xl font-bold mb-2">4-Pack</h3>
            <p className="text-4xl font-bold gradient-text mb-4">$22</p>
            <ul className="text-sm text-[var(--c4)] space-y-2">
              <li>✓ 4 QR tags</li>
              <li>✓ Public cards</li>
              <li>✓ NFT ownership</li>
              <li>✓ Optional refill service</li>
            </ul>
          </div>
          <div className="card text-center border border-[#1F2937] hover:border-[var(--c2)] transition-all">
            <h3 className="text-2xl font-bold mb-2">10-Pack</h3>
            <p className="text-4xl font-bold text-[var(--c2)] mb-4">$49</p>
            <ul className="text-sm text-[var(--c4)] space-y-2">
              <li>✓ 10 QR tags</li>
              <li>✓ Public cards</li>
              <li>✓ NFT ownership</li>
              <li>✓ Optional refill service</li>
            </ul>
          </div>
          <div className="card text-center border border-[#1F2937] hover:border-[var(--c2)] transition-all">
            <h3 className="text-2xl font-bold mb-2">Custom</h3>
            <p className="text-lg font-semibold text-[var(--c2)] mb-4">Contact Us</p>
            <ul className="text-sm text-[var(--c4)] space-y-2">
              <li>✓ Bulk orders</li>
              <li>✓ Custom colors</li>
              <li>✓ Enterprise</li>
              <li>✓ Refill service available</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}

