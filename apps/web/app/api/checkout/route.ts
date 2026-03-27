import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getTierTagCount, makeOrderNumber } from '@/lib/orders'

export const dynamic = 'force-dynamic'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

// Initialise Stripe only when the secret key is configured
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null

const PRICE_MAP: Record<string, string | undefined> = {
  single: process.env.STRIPE_PRICE_SINGLE,
  five_pack: process.env.STRIPE_PRICE_FIVE_PACK,
  stack: process.env.STRIPE_PRICE_STACK,
  label_100: process.env.STRIPE_PRICE_LABEL_100,
  tpp_1: process.env.STRIPE_PRICE_TPP_1,
  tpp_5: process.env.STRIPE_PRICE_TPP_5,
  tpp_15: process.env.STRIPE_PRICE_TPP_15,
  orange_3: process.env.STRIPE_PRICE_ORANGE_3,
  yellow_abs_3: process.env.STRIPE_PRICE_YELLOW_ABS_3,
  fluoro_3: process.env.STRIPE_PRICE_FLUORO_3,
}

type TierKey = keyof typeof PRICE_MAP
type CheckoutMode = 'redirect' | 'embedded'

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      console.error('Stripe secret key is not configured')
      return NextResponse.json(
        { error: 'Payments are not configured yet. Please try again later.' },
        { status: 500 },
      )
    }

    const body = await request.json().catch(() => ({} as any))
    const tier = body?.tier as TierKey | undefined
    const checkoutMode =
      body?.mode === 'embedded' || body?.mode === 'redirect'
        ? (body.mode as CheckoutMode)
        : 'redirect'

    if (!tier || !PRICE_MAP[tier]) {
      return NextResponse.json(
        { error: 'Invalid pricing tier.' },
        { status: 400 },
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ranch-link.vercel.app'

    const session = await stripe.checkout.sessions.create(
      checkoutMode === 'embedded'
        ? {
            mode: 'payment',
            ui_mode: 'embedded',
            payment_method_types: ['card'],
            billing_address_collection: 'required',
            phone_number_collection: { enabled: true },
            shipping_address_collection: {
              allowed_countries: ['US', 'CA', 'MX'],
            },
            customer_email: typeof body?.email === 'string' ? body.email : undefined,
            line_items: [
              {
                price: PRICE_MAP[tier]!,
                quantity: 1,
              },
            ],
            metadata: {
              tier,
              tag_count: String(getTierTagCount(tier)),
            },
            return_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          }
        : {
            mode: 'payment',
            payment_method_types: ['card'],
            billing_address_collection: 'required',
            phone_number_collection: { enabled: true },
            shipping_address_collection: {
              allowed_countries: ['US', 'CA', 'MX'],
            },
            customer_email: typeof body?.email === 'string' ? body.email : undefined,
            line_items: [
              {
                price: PRICE_MAP[tier]!,
                quantity: 1,
              },
            ],
            metadata: {
              tier,
              tag_count: String(getTierTagCount(tier)),
            },
            success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/checkout/cancelled`,
          }
    )

    // Best-effort persistence of the created session. Webhook will finalize status.
    try {
      const supabase = getSupabaseServerClient()
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id
      const orderNumber = makeOrderNumber({
        checkoutSessionId: session.id,
      })
      const tagCount = getTierTagCount(tier)

      await supabase.from('stripe_orders').upsert(
        {
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
          status: 'created',
          fulfillment_status: 'pending_payment',
          metadata: session.metadata ?? {},
        },
        { onConflict: 'stripe_checkout_session_id' }
      )
    } catch (persistError) {
      console.warn('Stripe checkout session persistence warning', persistError)
    }

    return NextResponse.json({
      url: session.url,
      clientSecret: session.client_secret,
      mode: checkoutMode,
    })
  } catch (error: any) {
    console.error('Stripe checkout error', error)
    return NextResponse.json(
      { error: 'Unable to start checkout.' },
      { status: 500 },
    )
  }
}
