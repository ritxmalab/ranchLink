import { NextRequest, NextResponse } from 'next/server'
import { verifySuperadminAuth } from '@/lib/superadmin-auth'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { sendFulfillmentEmail } from '@/lib/ranch-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authError = verifySuperadminAuth(request)
  if (authError) return authError

  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('stripe_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const normalizedOrders = (data || []).map((row: any) => ({
      order_number: row.order_number || null,
      stripe_checkout_session_id: row.stripe_checkout_session_id,
      customer_email: row.customer_email ?? null,
      customer_name: row.customer_name ?? null,
      tier: row.tier ?? null,
      tag_count: row.tag_count ?? 0,
      amount_total: row.amount_total ?? null,
      currency: row.currency ?? null,
      payment_status: row.payment_status || 'unpaid',
      fulfillment_status: row.fulfillment_status || 'pending_payment',
      status: row.status || 'created',
      shipping_name: row.shipping_name ?? null,
      shipping_phone: row.shipping_phone ?? null,
      shipping_address_json: row.shipping_address_json ?? null,
      carrier: row.carrier ?? null,
      tracking_number: row.tracking_number ?? null,
      tracking_url: row.tracking_url ?? null,
      shipped_at: row.shipped_at ?? null,
      delivered_at: row.delivered_at ?? null,
      created_at: row.created_at,
    }))

    const paidOrders = normalizedOrders.filter(
      (row) => row.payment_status === 'paid' || row.payment_status === 'no_payment_required'
    )
    const totalRevenueCents = paidOrders.reduce((sum, row) => sum + (row.amount_total || 0), 0)
    const totalTagsScheduled = paidOrders.reduce((sum, row) => sum + (row.tag_count || 0), 0)
    const pendingFulfillment = paidOrders.filter(
      (row) => row.fulfillment_status === 'paid_unfulfilled'
    ).length

    return NextResponse.json({
      orders: normalizedOrders,
      metrics: {
        orders_total: normalizedOrders.length,
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

    if (error) {
      if (/column .* does not exist/i.test(error.message || '')) {
        return NextResponse.json(
          {
            error:
              'Fulfillment columns are not migrated yet. Run ADD_STRIPE_ORDER_FULFILLMENT_FIELDS.sql in Supabase first.',
          },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    // Send email notification to customer on status changes
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ranch-link.vercel.app'
    if (data) {
      const { data: order } = await supabase
        .from('stripe_orders')
        .select('customer_email, customer_name, order_number, tier, tag_count')
        .eq('order_number', orderNumber)
        .single()

      if (order?.customer_email) {
        const statusMessages: Record<string, { subject: string; body: string }> = {
          packed: {
            subject: `Your RanchLink order ${orderNumber} is packed`,
            body: `<h2>Your order is packed and ready to ship!</h2><p>Order: ${orderNumber}</p><p>We're preparing your ${order.tag_count || ''} tag(s) for shipment.</p>`,
          },
          shipped: {
            subject: `Your RanchLink order ${orderNumber} has shipped`,
            body: `<h2>Your order is on its way!</h2><p>Order: ${orderNumber}</p>${carrier ? `<p>Carrier: ${carrier}</p>` : ''}${trackingUrl ? `<p><a href="${trackingUrl}">Track your package</a></p>` : trackingNumber ? `<p>Tracking: ${trackingNumber}</p>` : ''}<p><a href="${appUrl}/order/${orderNumber}">View order status</a></p>`,
          },
          delivered: {
            subject: `Your RanchLink order ${orderNumber} has been delivered`,
            body: `<h2>Your tags have arrived!</h2><p>Order: ${orderNumber}</p><p>Ready to get started? Scan a QR tag to register your first animal.</p><p><a href="${appUrl}/start">Claim your tag</a> | <a href="${appUrl}/order/${orderNumber}">View order</a></p>`,
          },
        }
        const msg = statusMessages[fulfillmentStatus]
        if (msg) {
          const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0a0a0a;color:#fff;border-radius:12px"><div style="text-align:center;margin-bottom:16px"><h1 style="color:#22d3ee;font-size:20px">RanchLink</h1></div><div style="background:#1f2937;border-radius:8px;padding:20px;margin-bottom:16px">${msg.body}</div><p style="color:#374151;font-size:11px;text-align:center">RanchLink by Ritxma Integrations LLC</p></div>`
          sendFulfillmentEmail(order.customer_email, msg.subject, html).catch(() => {})
        }
      }
    }

    return NextResponse.json({ order: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Unable to update fulfillment', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
