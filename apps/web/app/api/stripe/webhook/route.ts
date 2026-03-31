import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getTierTagCount, makeOrderNumber } from '@/lib/orders'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ''
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null

function normalizeStatus(
  eventType: string,
  paymentStatus: string | null | undefined
): string {
  if (eventType === 'checkout.session.expired') return 'expired'
  if (eventType === 'checkout.session.async_payment_failed') return 'failed'
  if (paymentStatus === 'paid') return 'paid'
  if (paymentStatus === 'no_payment_required') return 'paid'
  return 'pending'
}

function normalizeFulfillmentStatus(paymentStatus: string | null | undefined): string {
  if (paymentStatus === 'paid' || paymentStatus === 'no_payment_required') {
    return 'paid_unfulfilled'
  }
  return 'pending_payment'
}

async function sendOrderEmail(params: {
  to: string
  orderNumber: string
  orderViewSecret: string
  amountTotal: number | null
  currency: string | null
  tagCount: number
  tier: string | null | undefined
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from =
    process.env.ORDER_EMAIL_FROM ||
    process.env.CLAIM_EMAIL_FROM ||
    'RanchLink <solve@ranchlink.com>'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ranch-link.vercel.app'
  if (!apiKey) {
    console.warn('[sendOrderEmail] RESEND_API_KEY missing')
    return false
  }

  const formattedAmount =
    params.amountTotal && params.currency
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: params.currency.toUpperCase(),
        }).format(params.amountTotal / 100)
      : 'N/A'

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: `RanchLink order confirmation ${params.orderNumber}`,
        html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
          <h2>Thanks for your RanchLink purchase</h2>
          <p>Your order is confirmed and now in the production queue.</p>
          <p><strong>Order:</strong> ${params.orderNumber}<br/>
          <strong>Tier:</strong> ${params.tier || 'N/A'}<br/>
          <strong>Tag quantity:</strong> ${params.tagCount}<br/>
          <strong>Total:</strong> ${formattedAmount}</p>
          <p>You can track your order status here (link includes your private access key — do not share):<br/>
          <a href="${appUrl}/order/${encodeURIComponent(params.orderNumber)}?k=${encodeURIComponent(params.orderViewSecret)}">${appUrl}/order/${params.orderNumber}?k=…</a></p>
          <p style="color:#555;font-size:13px">Support: <a href="mailto:solve@ranchlink.com">solve@ranchlink.com</a></p>
        </div>
      `,
      }),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.warn('[sendOrderEmail] Resend error', res.status, errText)
      return false
    }
    return true
  } catch (e) {
    console.warn('[sendOrderEmail] fetch failed', e)
    return false
  }
}

export async function POST(request: NextRequest) {
  if (!stripe || !stripeWebhookSecret) {
    return NextResponse.json(
      { error: 'Stripe webhook is not configured' },
      { status: 500 }
    )
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const payload = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Invalid webhook signature', details: error?.message || 'Unknown error' },
      { status: 400 }
    )
  }

  const supported = new Set([
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
    'checkout.session.expired',
  ])

  if (!supported.has(event.type)) {
    return NextResponse.json({ received: true, ignored: event.type })
  }

  const session = event.data.object as Stripe.Checkout.Session
  // Stripe types lag Checkout fields — shipping_details exists on completed sessions
  const sessionShip = session as Stripe.Checkout.Session & {
    shipping_details?: { name?: string | null; phone?: string | null; address?: Stripe.Address | null }
  }
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id

  const status = normalizeStatus(event.type, session.payment_status)
  const tier = session.metadata?.tier ?? null
  const tagCount =
    Number(session.metadata?.tag_count ?? 0) || getTierTagCount(tier)
  const orderNumber = makeOrderNumber({
    checkoutSessionId: session.id,
  })
  // Prefer Checkout shipping address (physical ship-to). Billing-only lives on customer_details.
  const ship = sessionShip.shipping_details
  const shippingAddress = ship?.address ?? session.customer_details?.address ?? null
  const shippingName = ship?.name ?? session.customer_details?.name ?? null
  const shippingPhone = ship?.phone ?? session.customer_details?.phone ?? null

  try {
    const supabase = getSupabaseServerClient()

    const { data: existingRow } = await supabase
      .from('stripe_orders')
      .select('order_view_secret')
      .eq('stripe_checkout_session_id', session.id)
      .maybeSingle()

    const orderViewSecret =
      (existingRow?.order_view_secret as string | undefined) || randomUUID()

    const enhancedPayload = {
      order_number: orderNumber,
      order_view_secret: orderViewSecret,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId ?? null,
      customer_email: session.customer_details?.email ?? null,
      customer_name: session.customer_details?.name ?? null,
      tier,
      tag_count: tagCount,
      amount_total: session.amount_total ?? null,
      currency: session.currency ?? null,
      payment_status: session.payment_status ?? 'unpaid',
      status,
      fulfillment_status: normalizeFulfillmentStatus(session.payment_status),
      shipping_name: shippingName,
      shipping_phone: shippingPhone,
      shipping_address_json: shippingAddress,
      metadata: session.metadata ?? {},
    }

    let { error } = await supabase.from('stripe_orders').upsert(
      enhancedPayload,
      { onConflict: 'stripe_checkout_session_id' }
    )

    if (error && /order_view_secret|column .* does not exist|schema cache/i.test(error.message || '')) {
      const { order_view_secret: _ignored, ...rest } = enhancedPayload
      ;({ error } = await supabase.from('stripe_orders').upsert(rest, {
        onConflict: 'stripe_checkout_session_id',
      }))
    }

    // Backward-compatible fallback if new fulfillment columns are not migrated yet.
    if (error && /column .* does not exist/i.test(error.message || '')) {
      const legacyPayload = {
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId ?? null,
        customer_email: session.customer_details?.email ?? null,
        customer_name: session.customer_details?.name ?? null,
        tier,
        amount_total: session.amount_total ?? null,
        currency: session.currency ?? null,
        payment_status: session.payment_status ?? 'unpaid',
        status,
        metadata: session.metadata ?? {},
      }
      ;({ error } = await supabase
        .from('stripe_orders')
        .upsert(legacyPayload, { onConflict: 'stripe_checkout_session_id' }))
    }

    if (error) {
      return NextResponse.json(
        { error: 'Failed to persist order', details: error.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Webhook persistence failed', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }

  if (status === 'paid') {
    const supabaseMail = getSupabaseServerClient()
    const { data: paidRow } = await supabaseMail
      .from('stripe_orders')
      .select('*')
      .eq('stripe_checkout_session_id', session.id)
      .maybeSingle()

    if (!paidRow) {
      console.warn('[webhook] paid session but no stripe_orders row — skip emails', session.id)
    } else {
    const row = paidRow as Record<string, unknown>
    let secretForEmail =
      (row.order_view_secret as string | undefined) || randomUUID()

    // Persist secret if row exists but secret missing (legacy rows)
    if (!row.order_view_secret) {
      await supabaseMail
        .from('stripe_orders')
        .update({ order_view_secret: secretForEmail })
        .eq('stripe_checkout_session_id', session.id)
    }

    const confirmationAlreadySent = Boolean(row.order_confirmation_sent_at)
    const opsAlreadyNotified = Boolean(row.internal_ops_notified_at)

    // Customer confirmation — only mark sent after Resend returns 2xx (webhook retries can resend otherwise)
    if (session.customer_details?.email && !confirmationAlreadySent) {
      const customerOk = await sendOrderEmail({
        to: session.customer_details.email,
        orderNumber,
        orderViewSecret: secretForEmail,
        amountTotal: session.amount_total ?? null,
        currency: session.currency ?? null,
        tagCount,
        tier,
      })
      if (customerOk) {
        const { error: confErr } = await supabaseMail
          .from('stripe_orders')
          .update({ order_confirmation_sent_at: new Date().toISOString() })
          .eq('stripe_checkout_session_id', session.id)
        if (confErr && !/order_confirmation_sent_at|does not exist|schema cache/i.test(confErr.message || '')) {
          console.warn('[webhook] order_confirmation_sent_at update', confErr.message)
        }
      }
    }

    // Internal ops — same: only stamp idempotency after successful send
    if (!opsAlreadyNotified) {
      const opsOk = await sendInternalOpsNotification({
        orderNumber,
        orderViewSecret: secretForEmail,
        tier,
        tagCount,
        amountTotal: session.amount_total ?? null,
        currency: session.currency ?? null,
        customerEmail: session.customer_details?.email ?? null,
        customerName: session.customer_details?.name ?? shippingName ?? null,
        shippingPhone,
        shippingAddress,
      })
      if (opsOk) {
        const { error: opsErr } = await supabaseMail
          .from('stripe_orders')
          .update({ internal_ops_notified_at: new Date().toISOString() })
          .eq('stripe_checkout_session_id', session.id)
        if (opsErr && !/internal_ops_notified_at|does not exist|schema cache/i.test(opsErr.message || '')) {
          console.warn('[webhook] internal_ops_notified_at update', opsErr.message)
        }
      }
    }
    }
  }

  return NextResponse.json({ received: true })
}

async function sendInternalOpsNotification(params: {
  orderNumber: string
  orderViewSecret: string
  tier: string | null
  tagCount: number
  amountTotal: number | null
  currency: string | null
  customerEmail: string | null
  customerName: string | null
  shippingPhone: string | null
  shippingAddress: any
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from =
    process.env.INTERNAL_OPS_EMAIL_FROM ||
    process.env.ORDER_EMAIL_FROM ||
    process.env.CLAIM_EMAIL_FROM ||
    'RanchLink <solve@ranchlink.com>'
  const rawTo = process.env.INTERNAL_OPS_EMAILS || 'solve@ranchlink.com,gonzalo@ritxma.com'
  const to = rawTo.split(',').map((e) => e.trim()).filter(Boolean)
  if (!apiKey) {
    console.warn('[sendInternalOpsNotification] RESEND_API_KEY missing')
    return false
  }
  if (!to.length) {
    console.warn('[sendInternalOpsNotification] INTERNAL_OPS_EMAILS empty')
    return false
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ranch-link.vercel.app'
  const customerPrivateUrl = `${appUrl}/order/${encodeURIComponent(params.orderNumber)}?k=${encodeURIComponent(params.orderViewSecret)}`
  const amount =
    params.amountTotal && params.currency
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: params.currency.toUpperCase(),
        }).format(params.amountTotal / 100)
      : 'N/A'

  const addr = params.shippingAddress
  const addrLines = addr
    ? [addr.line1, addr.line2, [addr.city, addr.state, addr.postal_code].filter(Boolean).join(' '), addr.country]
        .filter(Boolean)
        .join('<br/>')
    : 'Not provided yet'

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to,
        subject: `NEW PAID ORDER ${params.orderNumber} — ${params.tier || 'N/A'} (${params.tagCount} tags) — ${amount}`,
        html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:600px">
          <h2 style="color:#16a34a">New Paid Order — Action Required</h2>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:4px 8px;font-weight:bold">Order</td><td style="padding:4px 8px">${params.orderNumber}</td></tr>
            <tr><td style="padding:4px 8px;font-weight:bold">Tier</td><td style="padding:4px 8px">${params.tier || 'N/A'}</td></tr>
            <tr><td style="padding:4px 8px;font-weight:bold">Tags</td><td style="padding:4px 8px">${params.tagCount}</td></tr>
            <tr><td style="padding:4px 8px;font-weight:bold">Total</td><td style="padding:4px 8px">${amount}</td></tr>
            <tr><td style="padding:4px 8px;font-weight:bold">Customer</td><td style="padding:4px 8px">${params.customerEmail || '—'}</td></tr>
            <tr><td style="padding:4px 8px;font-weight:bold">Name</td><td style="padding:4px 8px">${params.customerName || '—'}</td></tr>
            <tr><td style="padding:4px 8px;font-weight:bold">Phone</td><td style="padding:4px 8px">${params.shippingPhone || '—'}</td></tr>
            <tr><td style="padding:4px 8px;font-weight:bold">Ship to</td><td style="padding:4px 8px">${addrLines}</td></tr>
          </table>
          <p style="margin-top:16px"><a href="${appUrl}/superadmin" style="color:#2563eb;font-weight:bold">Open Superadmin → Orders tab</a></p>
          <p style="margin-top:12px;font-size:13px;color:#444"><strong>Customer private tracking link</strong> (resend if they lost email):<br/>
          <a href="${customerPrivateUrl}" style="word-break:break-all;color:#2563eb">${customerPrivateUrl}</a></p>
        </div>
      `,
      }),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.warn('[sendInternalOpsNotification] Resend error', res.status, errText)
      return false
    }
    return true
  } catch (e) {
    console.warn('[sendInternalOpsNotification] fetch failed', e)
    return false
  }
}
