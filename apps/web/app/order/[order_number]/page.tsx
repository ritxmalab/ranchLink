'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type Order = {
  order_number: string
  payment_status: string
  fulfillment_status: string
  status: string
  amount_total: number | null
  currency: string | null
  tier: string | null
  tag_count: number
  customer_email: string | null
  shipping_name: string | null
  shipping_phone: string | null
  shipping_address_json: Record<string, string> | null
  carrier: string | null
  tracking_number: string | null
  tracking_url: string | null
  created_at: string
  shipped_at: string | null
  delivered_at: string | null
}

function formatAmount(amountTotal: number | null, currency: string | null): string {
  if (!amountTotal || !currency) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountTotal / 100)
}

export default function OrderPage() {
  const params = useParams<{ order_number: string }>()
  const orderNumber = params?.order_number || ''
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!orderNumber) {
        setError('Missing order number')
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Order not found')
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
  }, [orderNumber])

  return (
    <main className="min-h-screen bg-[var(--bg)] py-10 px-4">
      <div className="max-w-3xl mx-auto card">
        <h1 className="text-3xl font-bold mb-2">Order Tracking</h1>
        <p className="text-[var(--c4)] mb-6">
          Order <span className="font-mono">{orderNumber}</span>
        </p>

        {loading && <p className="text-[var(--c4)]">Loading order...</p>}
        {!loading && error && (
          <div className="rounded-lg border border-red-500/40 bg-red-900/20 p-4 text-red-200">
            {error}
          </div>
        )}

        {!loading && order && (
          <div className="space-y-6">
            <section className="rounded-lg border border-white/10 bg-[var(--bg-card)] p-4">
              <h2 className="font-semibold mb-3">Purchase</h2>
              <p><span className="text-[var(--c4)]">Total:</span> {formatAmount(order.amount_total, order.currency)}</p>
              <p><span className="text-[var(--c4)]">Tier:</span> {order.tier || 'N/A'}</p>
              <p><span className="text-[var(--c4)]">Tag quantity:</span> {order.tag_count}</p>
              <p><span className="text-[var(--c4)]">Email:</span> {order.customer_email || 'N/A'}</p>
            </section>

            <section className="rounded-lg border border-white/10 bg-[var(--bg-card)] p-4">
              <h2 className="font-semibold mb-3">Traceability</h2>
              <p><span className="text-[var(--c4)]">Payment:</span> {order.payment_status}</p>
              <p><span className="text-[var(--c4)]">Fulfillment:</span> {order.fulfillment_status.replace(/_/g, ' ')}</p>
              <p><span className="text-[var(--c4)]">Created:</span> {new Date(order.created_at).toLocaleString()}</p>
              {order.shipped_at && <p><span className="text-[var(--c4)]">Shipped:</span> {new Date(order.shipped_at).toLocaleString()}</p>}
              {order.delivered_at && <p><span className="text-[var(--c4)]">Delivered:</span> {new Date(order.delivered_at).toLocaleString()}</p>}
            </section>

            <section className="rounded-lg border border-white/10 bg-[var(--bg-card)] p-4">
              <h2 className="font-semibold mb-3">Delivery</h2>
              <p><span className="text-[var(--c4)]">Recipient:</span> {order.shipping_name || 'Pending'}</p>
              <p><span className="text-[var(--c4)]">Phone:</span> {order.shipping_phone || 'Pending'}</p>
              <p><span className="text-[var(--c4)]">Address:</span> {order.shipping_address_json ? JSON.stringify(order.shipping_address_json) : 'Pending'}</p>
              <p><span className="text-[var(--c4)]">Carrier:</span> {order.carrier || 'Pending'}</p>
              <p><span className="text-[var(--c4)]">Tracking:</span> {order.tracking_number || 'Pending'}</p>
              {order.tracking_url && (
                <p>
                  <a href={order.tracking_url} target="_blank" rel="noreferrer" className="text-[var(--c2)] hover:underline">
                    Open tracking link
                  </a>
                </p>
              )}
            </section>
          </div>
        )}

        <div className="mt-6">
          <a href="/" className="btn-secondary">Back to store</a>
        </div>
      </div>
    </main>
  )
}
