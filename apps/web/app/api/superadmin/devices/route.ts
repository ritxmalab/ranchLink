import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

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
  try {
    // Check environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ 
        error: 'Missing NEXT_PUBLIC_SUPABASE_URL environment variable' 
      }, { status: 500 })
    }
    if (!process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ 
        error: 'Missing SUPABASE_SERVICE_KEY environment variable' 
      }, { status: 500 })
    }

    const supabase = getSupabaseServerClient()
    const url = new URL(request.url)
    const limitParam = url.searchParams.get('limit')
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 200, 500) : 200

    // Query tags table (v1.0 canonical source)
    // Map to Device format for UI compatibility
    let query = supabase
      .from('tags')
      .select(`
        id,
        tag_code,
        token_id,
        mint_tx_hash,
        chain,
        contract_address,
        status,
        activation_state,
        animal_id,
        batch_id,
        ranches(id, name),
        animals(public_id)
      `)
      .limit(limit)
    
    const { data: tagsData, error } = await query.order('created_at', { ascending: false })
    
    // Get batch info for tags that have batch_id
    const batchIds = [...new Set((tagsData || []).map((t: any) => t.batch_id).filter(Boolean))]
    let batchesMap: Record<string, any> = {}
    
    if (batchIds.length > 0) {
      const { data: batches } = await supabase
        .from('batches')
        .select('id, name, model, material, color, created_at')
        .in('id', batchIds)
      
      if (batches) {
        batchesMap = batches.reduce((acc: any, batch: any) => {
          acc[batch.id] = batch
          return acc
        }, {})
      }
    }
    
    // Map tags to Device format for backward compatibility
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ranch-link.vercel.app'
    const data = (tagsData || []).map((tag: any) => {
      const batch = tag.batch_id ? batchesMap[tag.batch_id] : null
      return {
        id: tag.id,
        tag_id: tag.tag_code,
        tag_code: tag.tag_code,
        public_id: tag.animals?.public_id || null,
        token_id: tag.token_id,
        mint_tx_hash: tag.mint_tx_hash,
        chain: tag.chain || 'BASE',
        contract_address: tag.contract_address,
        status: tag.status || 'in_inventory',
        activation_state: tag.activation_state || 'active',
        // Generate base_qr_url from tag_code (v1.0: ONLY base QR, NO overlay)
        base_qr_url: tag.tag_code ? `${appUrl}/t/${tag.tag_code}` : '',
        overlay_qr_url: '', // v1.0: DEPRECATED - always empty, never used
        claim_token: '', // v1.0: DEPRECATED - always empty, never used
        serial: tag.tag_code,
        type: null,
        material: batch?.material || null,
        model: batch?.model || null,
        color: batch?.color || null,
        batch_name: batch?.name || null,
        batch_date: batch?.created_at ? new Date(batch.created_at).toISOString().slice(0, 10) : null,
        metadata: {
          material: batch?.material || null,
          model: batch?.model || null,
          chain: tag.chain || 'BASE',
          color: batch?.color || null,
          batch_name: batch?.name || null,
          batch_date: batch?.created_at ? new Date(batch.created_at).toISOString().slice(0, 10) : null,
          code: tag.tag_code,
        },
      }
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ devices: data || [] })
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message || 'Failed to fetch devices',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Check environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ 
        error: 'Missing NEXT_PUBLIC_SUPABASE_URL environment variable' 
      }, { status: 500 })
    }
    if (!process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ 
        error: 'Missing SUPABASE_SERVICE_KEY environment variable' 
      }, { status: 500 })
    }

    const supabase = getSupabaseServerClient()
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
      .select('id, tag_id, claim_token, public_id, overlay_qr_url, base_qr_url, status, serial, type, metadata')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ devices: (data || []).map(mapDevice) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 })
  }
}
