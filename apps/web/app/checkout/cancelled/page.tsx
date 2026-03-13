export default function CheckoutCancelledPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] py-10 px-4">
      <div className="max-w-xl mx-auto card">
        <h1 className="text-3xl font-bold mb-2">Checkout Cancelled</h1>
        <p className="text-[var(--c4)] mb-6">
          No payment was captured. You can return to the store and complete your purchase any time.
        </p>
        <a href="/" className="btn-primary">
          Back to store
        </a>
      </div>
    </main>
  )
}
