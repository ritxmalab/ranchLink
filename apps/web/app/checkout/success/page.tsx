'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type OrderLookup = {
  order_number: string | null
  payment_status: string
  fulfillment_status: string
  order_view_secret?: string | null
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [order, setOrder] = useState<OrderLookup | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!sessionId) {
        setError('Missing checkout session id')
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`/api/orders/session/${encodeURIComponent(sessionId)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Unable to load order')
        if (!cancelled) setOrder(data.order)
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Unable to load order')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  return (
    <main className="min-h-screen bg-[var(--bg)] py-10 px-4">
      <div className="max-w-2xl mx-auto card">
        <h1 className="text-3xl font-bold mb-2">Payment Received</h1>
        <p className="text-[var(--c4)] mb-6">
          Your RanchLink purchase is confirmed and now tracked in our fulfillment queue.
        </p>

        {loading && <p className="text-[var(--c4)]">Loading order details...</p>}

        {!loading && error && (
          <div className="rounded-lg border border-red-500/40 bg-red-900/20 p-4 text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && order && (
          <div className="space-y-3 rounded-lg border border-white/10 bg-[var(--bg-card)] p-4">
            <p>
              <span className="text-[var(--c4)]">Order number:</span>{' '}
              <span className="font-mono font-semibold">{order.order_number || 'Processing...'}</span>
            </p>
            <p>
              <span className="text-[var(--c4)]">Payment status:</span>{' '}
              <span className="font-semibold capitalize">{order.payment_status}</span>
            </p>
            <p>
              <span className="text-[var(--c4)]">Fulfillment status:</span>{' '}
              <span className="font-semibold capitalize">{order.fulfillment_status.replace(/_/g, ' ')}</span>
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {order?.order_number && (
            <a
              href={
                order.order_view_secret
                  ? `/order/${encodeURIComponent(order.order_number)}?k=${encodeURIComponent(order.order_view_secret)}`
                  : `/order/${encodeURIComponent(order.order_number)}`
              }
              className="btn-primary"
            >
              Track this order
            </a>
          )}
          <a href="/" className="btn-secondary">
            Back to store
          </a>
        </div>
      </div>
    </main>
  )
}
