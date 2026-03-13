import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ order_number: string }> }
) {
  try {
    const { order_number } = await params
    if (!order_number) {
      return NextResponse.json({ error: 'Missing order number' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('stripe_orders')
      .select('*')
      .eq('order_number', order_number)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({
      order: {
        order_number: data.order_number || data.stripe_checkout_session_id,
        payment_status: data.payment_status || 'unpaid',
        fulfillment_status: data.fulfillment_status || 'pending_payment',
        status: data.status || 'created',
        amount_total: data.amount_total ?? null,
        currency: data.currency ?? null,
        tier: data.tier ?? null,
        tag_count: data.tag_count ?? 0,
        customer_email: data.customer_email ?? null,
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
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Unable to fetch order', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
