import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { verifySuperadminAuth } from '@/lib/superadmin-auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/superadmin/tag-photo
 * Upload assembly verification photo (physical tag + label) and attach to tag metadata.
 */
export async function POST(request: NextRequest) {
  const authError = verifySuperadminAuth(request)
  if (authError) return authError

  if (!rateLimit(request, 20, 60000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const tagCode = (formData.get('tag_code') as string | null)?.trim()
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d1bab796-07e5-40b1-a8e1-d8929352e341',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'da8bc1'},body:JSON.stringify({sessionId:'da8bc1',runId:'verification-pre',hypothesisId:'H2',location:'api/superadmin/tag-photo/route.ts:start',message:'Tag photo upload request received',data:{hasFile:Boolean(file),tagCode:tagCode||null,fileType:file?.type||null,fileSize:file?.size||null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!tagCode) return NextResponse.json({ error: 'tag_code is required' }, { status: 400 })

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPG, PNG, WEBP or GIF.' }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 })
    }

    const jwt = process.env.PINATA_JWT
    if (!jwt) return NextResponse.json({ error: 'PINATA_JWT not configured' }, { status: 500 })

    const pinataForm = new FormData()
    pinataForm.append('file', file, file.name || `${tagCode}.jpg`)
    pinataForm.append(
      'pinataMetadata',
      JSON.stringify({
        name: `ranchlink-assembly-${tagCode}-${Date.now()}`,
        keyvalues: { source: 'ranchlink', tag_code: tagCode, kind: 'assembly_photo' },
      })
    )

    const pinataRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}` },
      body: pinataForm,
    })

    if (!pinataRes.ok) {
      const err = await pinataRes.text()
      console.error('[TAG-PHOTO] Pinata error:', err)
      return NextResponse.json({ error: 'Failed to upload to IPFS', details: err }, { status: 500 })
    }

    const pinataData = await pinataRes.json()
    const cid = pinataData.IpfsHash
    const photoUrl = `https://gateway.pinata.cloud/ipfs/${cid}`

    const supabase = getSupabaseServerClient()
    const { data: existing } = await supabase
      .from('devices')
      .select('tag_id,metadata,status')
      .eq('tag_id', tagCode)
      .maybeSingle()

    const mergedMetadata = {
      ...(existing?.metadata || {}),
      assembly_photo_url: photoUrl,
      assembly_photo_cid: cid,
      assembly_photo_uploaded_at: new Date().toISOString(),
    }

    if (existing?.tag_id) {
      const { error } = await supabase
        .from('devices')
        .update({ metadata: mergedMetadata })
        .eq('tag_id', tagCode)
      if (error) {
        return NextResponse.json({ error: error.message || 'Failed to save photo metadata' }, { status: 500 })
      }
    } else {
      const { error } = await supabase
        .from('devices')
        .insert({
          tag_id: tagCode,
          status: 'assembled',
          metadata: mergedMetadata,
        })
      if (error) {
        return NextResponse.json({ error: error.message || 'Failed to create photo metadata row' }, { status: 500 })
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d1bab796-07e5-40b1-a8e1-d8929352e341',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'da8bc1'},body:JSON.stringify({sessionId:'da8bc1',runId:'verification-pre',hypothesisId:'H2',location:'api/superadmin/tag-photo/route.ts:success',message:'Tag photo metadata persisted',data:{tagCode,cid,hasExistingRow:Boolean(existing?.tag_id),photoUrlExists:Boolean(photoUrl)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    return NextResponse.json({ success: true, cid, tag_code: tagCode, photo_url: photoUrl })
  } catch (error: any) {
    console.error('[TAG-PHOTO] Error:', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}
