import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseServerClient } from '@/lib/supabase/server'

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

  try {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.from('stripe_orders').upsert(
      {
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId ?? null,
        customer_email: session.customer_details?.email ?? null,
        customer_name: session.customer_details?.name ?? null,
        tier: session.metadata?.tier ?? null,
        amount_total: session.amount_total ?? null,
        currency: session.currency ?? null,
        payment_status: session.payment_status ?? 'unpaid',
        status,
        metadata: session.metadata ?? {},
      },
      { onConflict: 'stripe_checkout_session_id' }
    )

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

  return NextResponse.json({ received: true })
}
