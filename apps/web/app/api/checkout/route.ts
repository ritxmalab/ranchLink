import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

// Initialise Stripe only when the secret key is configured
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null

const PRICE_MAP: Record<string, string | undefined> = {
  single: process.env.STRIPE_PRICE_SINGLE,
  five_pack: process.env.STRIPE_PRICE_FIVE_PACK,
  stack: process.env.STRIPE_PRICE_STACK,
}

type TierKey = keyof typeof PRICE_MAP

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

    if (!tier || !PRICE_MAP[tier]) {
      return NextResponse.json(
        { error: 'Invalid pricing tier.' },
        { status: 400 },
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ranch-link.vercel.app'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_MAP[tier]!,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/?checkout=success`,
      cancel_url: `${baseUrl}/?checkout=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error', error)
    return NextResponse.json(
      { error: 'Unable to start checkout.' },
      { status: 500 },
    )
  }
}
