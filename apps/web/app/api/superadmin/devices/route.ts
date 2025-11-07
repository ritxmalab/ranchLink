import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

// Helper to map metadata fields into flat structure
function mapDevice(record: any) {
  const metadata = record.metadata || {}
  return {
    id: record.id,
    tag_id: record.tag_id,
    claim_token: record.claim_token,
    public_id: record.public_id,
    overlay_qr_url: record.overlay_qr_url || metadata.overlay_qr_url || '',
    base_qr_url: record.base_qr_url || metadata.base_qr_url || '',
    status: record.status,
    code: record.serial || metadata.code,
    type: record.type,
    metadata,
  }
}

export async function GET(request: Request) {
  const supabase = createServerClient()
  const url = new URL(request.url)
  const limitParam = url.searchParams.get('limit')
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 200, 500) : 200

  const { data, error } = await supabase
    .from('devices')
    .select('id, tag_id, claim_token, public_id, overlay_qr_url, base_qr_url, status, serial, type, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ devices: (data || []).map(mapDevice) })
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    const devices = Array.isArray(body?.devices) ? body.devices : []

    if (devices.length === 0) {
      return NextResponse.json({ error: 'No devices provided' }, { status: 400 })
    }

    const payload = devices.map((device: any) => ({
      tag_id: device.tag_id,
      public_id: device.public_id,
      claim_token: device.claim_token,
      overlay_qr_url: device.overlay_qr_url,
      base_qr_url: device.base_qr_url,
      status: device.status || 'printed',
      type: device.model || device.type || null,
      serial: device.code || null,
      metadata: {
        material: device.material,
        model: device.model,
        chain: device.chain,
        color: device.color,
        batch_name: device.batch_name,
        batch_date: device.batch_date,
        code: device.code,
        overlay_qr_url: device.overlay_qr_url,
        base_qr_url: device.base_qr_url,
      },
    }))

    const { data, error } = await supabase
      .from('devices')
      .upsert(payload, { onConflict: 'tag_id' })
      .select('id, tag_id, claim_token, public_id, overlay_qr_url, base_qr_url, status, serial, type, metadata, created_at')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ devices: (data || []).map(mapDevice) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 })
  }
}
