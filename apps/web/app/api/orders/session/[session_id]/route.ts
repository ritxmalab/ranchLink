import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    const { session_id } = await params
    if (!session_id) {
      return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('stripe_orders')
      .select(
        'order_number, stripe_checkout_session_id, payment_status, fulfillment_status, status, amount_total, currency, tag_count, customer_email, created_at'
      )
      .eq('stripe_checkout_session_id', session_id)
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
