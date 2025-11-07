import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { pinAnimalMetadata } from '@/lib/ipfs/client'
import { CONTRACTS, currentChain } from '@/lib/blockchain/config'
import { createWalletClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// POST /api/claim - Claim a tag with token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, email, phone, basename, animalName, species, breed, birthYear } = body

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Find device by claim token
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('*')
      .eq('claim_token', token)
      .eq('status', 'printed')
      .single()

    if (deviceError || !device) {
      return NextResponse.json({ error: 'Invalid or already claimed token' }, { status: 400 })
    }

    // Check if token expired
    if (device.claim_exp && new Date(device.claim_exp) < new Date()) {
      return NextResponse.json({ error: 'Claim token expired' }, { status: 400 })
    }

    // Create or get owner
    let ownerId
    if (basename) {
      const { data: existingOwner } = await supabase
        .from('owners')
        .select('id')
        .eq('basename', basename)
        .single()

      if (existingOwner) {
        ownerId = existingOwner.id
      } else {
        const { data: newOwner, error: ownerError } = await supabase
          .from('owners')
          .insert({ email, phone, basename })
          .select('id')
          .single()

        if (ownerError) {
          return NextResponse.json({ error: 'Failed to create owner' }, { status: 500 })
        }
        ownerId = newOwner.id
      }
    } else {
      const { data: newOwner, error: ownerError } = await supabase
        .from('owners')
        .insert({ email, phone })
        .select('id')
        .single()

      if (ownerError) {
        return NextResponse.json({ error: 'Failed to create owner' }, { status: 500 })
      }
      ownerId = newOwner.id
    }

    // Generate public ID if not assigned
    const publicId = device.public_id || `AUS${String(device.id).slice(0, 4).padStart(4, '0')}`

    // Create animal record
    const { data: animal, error: animalError } = await supabase
      .from('animals')
      .insert({
        public_id: publicId,
        tag_id: device.tag_id,
        owner_id: ownerId,
        species: species || 'Cattle',
        breed: breed || null,
        birth_year: birthYear || null,
        status: 'active',
      })
      .select('*')
      .single()

    if (animalError) {
      return NextResponse.json({ error: 'Failed to create animal' }, { status: 500 })
    }

    // Pin animal metadata to IPFS
    let cid: string | null = null
    try {
      cid = await pinAnimalMetadata({ ...animal, animal_name: animalName })
    } catch (error) {
      console.error('IPFS pin failed:', error)
      // Continue anyway - can retry later
    }

    // Update device status
    await supabase
      .from('devices')
      .update({
        status: 'claimed',
        owner_id: ownerId,
        public_id: publicId,
        activated_at: new Date().toISOString(),
      })
      .eq('id', device.id)

    // TODO: Mint NFT on-chain (async, don't block)
    // This would be done in a background job

    return NextResponse.json({
      success: true,
      public_id: publicId,
      animal,
      cid,
      message: 'Tag claimed successfully!',
    })
  } catch (error: any) {
    console.error('Claim error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

