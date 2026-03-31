import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function safeEqualSecret(provided: string | null, stored: string | null): boolean {
  if (!provided || !stored || provided.length !== stored.length) return false
  try {
    return timingSafeEqual(Buffer.from(provided, 'utf8'), Buffer.from(stored, 'utf8'))
  } catch {
    return false
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ order_number: string }> }
) {
  try {
    const { order_number } = await params
    if (!order_number) {
      return NextResponse.json({ error: 'Missing order number' }, { status: 400 })
    }

    const k = request.nextUrl.searchParams.get('k') || ''

    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('stripe_orders')
      .select('*')
      .eq('order_number', order_number)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const fullAccess =
      data.order_view_secret && k && safeEqualSecret(k, data.order_view_secret as string)

    const email = data.customer_email ?? null
    const maskedEmail = email
      ? email.replace(/^(.{2})(.*)(@.*)$/, (_: string, a: string, b: string, c: string) => a + b.replace(/./g, '*') + c)
      : null

    if (fullAccess) {
      return NextResponse.json({
        access: 'full' as const,
        order: {
          order_number: data.order_number || data.stripe_checkout_session_id,
          payment_status: data.payment_status || 'unpaid',
          fulfillment_status: data.fulfillment_status || 'pending_payment',
          status: data.status || 'created',
          amount_total: data.amount_total ?? null,
          currency: data.currency ?? null,
          tier: data.tier ?? null,
          tag_count: data.tag_count ?? 0,
          customer_email: email,
          shipping_name: data.shipping_name ?? null,
          shipping_phone: data.shipping_phone ?? null,
          shipping_address_json: data.shipping_address_json ?? null,
          carrier: data.carrier ?? null,
          tracking_number: data.tracking_number ?? null,
          tracking_url: data.tracking_url ?? null,
          created_at: data.created_at,
          shipped_at: data.shipped_at ?? null,
          delivered_at: data.delivered_at ?? null,
        },
      })
    }

    // Public-safe summary (no raw email, no ship-to PII)
    return NextResponse.json({
      access: 'summary' as const,
      order: {
        order_number: data.order_number || data.stripe_checkout_session_id,
        payment_status: data.payment_status || 'unpaid',
        fulfillment_status: data.fulfillment_status || 'pending_payment',
        status: data.status || 'created',
        amount_total: data.amount_total ?? null,
        currency: data.currency ?? null,
        tier: data.tier ?? null,
        tag_count: data.tag_count ?? 0,
        customer_email: maskedEmail,
        carrier: data.carrier ?? null,
        tracking_number: data.tracking_number ?? null,
        tracking_url: data.tracking_url ?? null,
        created_at: data.created_at,
        shipped_at: data.shipped_at ?? null,
        delivered_at: data.delivered_at ?? null,
      },
      hint:
        'Use the private link from your confirmation email (?k=…) to see full shipping details.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Unable to fetch order', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
