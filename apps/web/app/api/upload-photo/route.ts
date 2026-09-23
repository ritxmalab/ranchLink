import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { isSuperadminAuthenticated } from '@/lib/superadmin-auth'
import { timingSafeEqualString, validateSession } from '@/lib/ranch-auth'

async function authorizePhotoLink(
  request: NextRequest,
  publicId: string,
  claimToken: string | null
): Promise<string | null> {
  const supabase = getSupabaseServerClient()

  const { data: animal } = await supabase
    .from('animals')
    .select('id, ranch_id, tags(id)')
    .eq('public_id', publicId)
    .single()

  if (!animal) return null

  let authorized = isSuperadminAuthenticated(request)

  if (!authorized) {
    const tag = Array.isArray((animal as any).tags) ? (animal as any).tags[0] : (animal as any).tags
    let tagClaimToken: string | null = null
    let tagOwnerUserId: string | null = null
    let tagRanchId: string | null = null

    if (tag?.id) {
      const { data: tagRow } = await supabase
        .from('tags')
        .select('claim_token, owner_user_id, ranch_id')
        .eq('id', tag.id)
        .single()
      tagClaimToken = (tagRow as any)?.claim_token ?? null
      tagOwnerUserId = (tagRow as any)?.owner_user_id ?? null
      tagRanchId = (tagRow as any)?.ranch_id ?? null
    }

    const session = await validateSession(request)
    const sessionOwns =
      !!session &&
      ((!!tagOwnerUserId && tagOwnerUserId === session.userId) ||
        (!!tagRanchId && tagRanchId === session.ranchId) ||
        (!!(animal as any).ranch_id && (animal as any).ranch_id === session.ranchId))

    authorized =
      sessionOwns ||
      (!!tagClaimToken && !!claimToken && timingSafeEqualString(claimToken, tagClaimToken))
  }

  if (!authorized) return null

  return (animal as any).id as string
}

/**
 * POST /api/upload-photo
 * Uploads a cow photo to Pinata IPFS, returns the gateway URL.
 * Optionally links to an animal record by public_id.
 */
export async function POST(request: NextRequest) {
  if (!rateLimit(request, 20, 60000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const publicId = formData.get('public_id') as string | null
    const claimToken = formData.get('claim_token') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPG, PNG, WEBP or GIF.' }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 })
    }

    // Authorize before pinning so an unauthorized caller cannot consume paid
    // Pinata storage. Uploads with no public_id happen during attach, before
    // the animal exists, and stay anonymous behind the rate limiter.
    let animalId: string | null = null
    if (publicId) {
      animalId = await authorizePhotoLink(request, publicId, claimToken)
      if (!animalId) {
        return NextResponse.json({ error: 'Not authorized to update this animal' }, { status: 403 })
      }
    }

    const jwt = process.env.PINATA_JWT
    if (!jwt) {
      return NextResponse.json({ error: 'PINATA_JWT not configured' }, { status: 500 })
    }

    // Upload to Pinata Files API
    const pinataForm = new FormData()
    pinataForm.append('file', file, file.name || 'photo.jpg')
    pinataForm.append('pinataMetadata', JSON.stringify({
      name: publicId ? `ranchlink-animal-${publicId}` : `ranchlink-photo-${Date.now()}`,
      keyvalues: { source: 'ranchlink', public_id: publicId || '' },
    }))

    const pinataRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}` },
      body: pinataForm,
    })

    if (!pinataRes.ok) {
      const err = await pinataRes.text()
      console.error('[UPLOAD-PHOTO] Pinata error:', err)
      return NextResponse.json({ error: 'Failed to upload to IPFS', details: err }, { status: 500 })
    }

    const pinataData = await pinataRes.json()
    const cid = pinataData.IpfsHash
    const photoUrl = `https://gateway.pinata.cloud/ipfs/${cid}`

    let linked = false
    if (animalId) {
      const { error: linkError } = await getSupabaseServerClient()
        .from('animals')
        .update({ photo_url: photoUrl })
        .eq('id', animalId)
      linked = !linkError
    }

    return NextResponse.json({ success: true, cid, photo_url: photoUrl, linked })
  } catch (error: any) {
    console.error('[UPLOAD-PHOTO] Error:', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}
