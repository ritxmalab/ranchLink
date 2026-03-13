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
  amountTotal: number | null
  currency: string | null
  tagCount: number
  tier: string | null | undefined
}) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.ORDER_EMAIL_FROM
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ranch-link.vercel.app'
  if (!apiKey || !from) return

  const formattedAmount =
    params.amountTotal && params.currency
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: params.currency.toUpperCase(),
        }).format(params.amountTotal / 100)
      : 'N/A'

  await fetch('https://api.resend.com/emails', {
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
          <p>You can track your order status here:<br/>
          <a href="${appUrl}/order/${params.orderNumber}">${appUrl}/order/${params.orderNumber}</a></p>
        </div>
      `,
    }),
  })
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
  const shippingAddress = session.customer_details?.address ?? null
  const shippingName = session.customer_details?.name ?? null
  const shippingPhone = session.customer_details?.phone ?? null

  try {
    const supabase = getSupabaseServerClient()
    const enhancedPayload = {
      order_number: orderNumber,
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

  if (status === 'paid' && session.customer_details?.email) {
    try {
      await sendOrderEmail({
        to: session.customer_details.email,
        orderNumber,
        amountTotal: session.amount_total ?? null,
        currency: session.currency ?? null,
        tagCount,
        tier,
      })
    } catch (emailError) {
      console.warn('Order email warning', emailError)
    }
  }

  return NextResponse.json({ received: true })
}
