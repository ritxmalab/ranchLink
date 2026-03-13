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
      .select(
        'order_number, payment_status, fulfillment_status, status, amount_total, currency, tier, tag_count, customer_email, shipping_name, shipping_phone, shipping_address_json, carrier, tracking_number, tracking_url, created_at, shipped_at, delivered_at'
      )
      .eq('order_number', order_number)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Unable to fetch order', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
