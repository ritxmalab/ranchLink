import { NextRequest, NextResponse } from 'next/server'
import { verifySuperadminAuth } from '@/lib/superadmin-auth'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authError = verifySuperadminAuth(request)
  if (authError) return authError

  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('stripe_orders')
      .select(
        'order_number, stripe_checkout_session_id, customer_email, tier, tag_count, amount_total, currency, payment_status, fulfillment_status, status, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const paidOrders = (data || []).filter(
      (row) => row.payment_status === 'paid' || row.payment_status === 'no_payment_required'
    )
    const totalRevenueCents = paidOrders.reduce((sum, row) => sum + (row.amount_total || 0), 0)
    const totalTagsScheduled = paidOrders.reduce((sum, row) => sum + (row.tag_count || 0), 0)
    const pendingFulfillment = paidOrders.filter(
      (row) => row.fulfillment_status === 'paid_unfulfilled'
    ).length

    return NextResponse.json({
      orders: data || [],
      metrics: {
        orders_total: (data || []).length,
        orders_paid: paidOrders.length,
        revenue_total_cents: totalRevenueCents,
        pending_fulfillment: pendingFulfillment,
        tags_scheduled_to_build: totalTagsScheduled,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Unable to fetch order metrics', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authError = verifySuperadminAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const orderNumber = String(body?.order_number || '').trim()
    const fulfillmentStatus = String(body?.fulfillment_status || '').trim()
    const carrier = body?.carrier ? String(body.carrier).trim() : null
    const trackingNumber = body?.tracking_number ? String(body.tracking_number).trim() : null
    const trackingUrl = body?.tracking_url ? String(body.tracking_url).trim() : null

    if (!orderNumber || !fulfillmentStatus) {
      return NextResponse.json(
        { error: 'order_number and fulfillment_status are required' },
        { status: 400 }
      )
    }

    const allowedStatuses = new Set([
      'pending_payment',
      'paid_unfulfilled',
      'packed',
      'shipped',
      'delivered',
      'cancelled',
    ])
    if (!allowedStatuses.has(fulfillmentStatus)) {
      return NextResponse.json({ error: 'Invalid fulfillment_status' }, { status: 400 })
    }

    const updatePayload: Record<string, any> = {
      fulfillment_status: fulfillmentStatus,
      carrier,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
      updated_at: new Date().toISOString(),
    }
    if (fulfillmentStatus === 'shipped') updatePayload.shipped_at = new Date().toISOString()
    if (fulfillmentStatus === 'delivered') updatePayload.delivered_at = new Date().toISOString()

    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('stripe_orders')
      .update(updatePayload)
      .eq('order_number', orderNumber)
      .select('order_number, fulfillment_status, carrier, tracking_number, tracking_url')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ order: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Unable to update fulfillment', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
