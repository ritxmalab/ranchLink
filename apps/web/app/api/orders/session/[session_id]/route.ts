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
      .select('*')
      .eq('stripe_checkout_session_id', session_id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({
      order: {
        order_number: data.order_number || null,
        stripe_checkout_session_id: data.stripe_checkout_session_id,
        payment_status: data.payment_status || 'unpaid',
        fulfillment_status: data.fulfillment_status || 'pending_payment',
        status: data.status || 'created',
        amount_total: data.amount_total ?? null,
        currency: data.currency ?? null,
        tag_count: data.tag_count ?? 0,
        customer_email: data.customer_email ?? null,
        created_at: data.created_at,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Unable to fetch order', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
