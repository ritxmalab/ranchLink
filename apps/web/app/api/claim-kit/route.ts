import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const claimKitSchema = z.object({
  kitCode: z.string().min(1).max(64),
  ranch: z.object({
    name: z.string().min(1).max(200),
    contact_email: z.string().email().max(255),
    phone: z.string().max(30).optional(),
  }),
})

/**
 * POST /api/claim-kit
 * Claims a retail kit and assigns tags to a new ranch (v1.0)
 * 
 * Request body:
 * {
 *   kitCode: string,
 *   ranch: {
 *     name: string,
 *     contact_email: string,
 *     phone?: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  // Kit codes are bearer secrets — throttle guessing.
  if (!rateLimit(request, 5, 60000)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    let kitCode: string
    let ranch: { name: string; contact_email: string; phone?: string }
    try {
      ({ kitCode, ranch } = claimKitSchema.parse(await request.json()))
    } catch (e) {
      if (e instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid request body', details: e.errors }, { status: 400 })
      }
      throw e
    }

    const supabase = getSupabaseServerClient()

    // 1. Find kit by kit_code
    const { data: kit, error: kitError } = await supabase
      .from('kits')
      .select('id, status, claimed_ranch_id')
      .eq('kit_code', kitCode)
      .single()

    if (kitError || !kit) {
      return NextResponse.json(
        { error: 'Kit not found' },
        { status: 404 }
      )
    }

    // 2. Check if kit is already claimed
    if (kit.status === 'claimed' || kit.claimed_ranch_id) {
      return NextResponse.json(
        { error: 'Kit has already been claimed' },
        { status: 400 }
      )
    }

    // 3. Create ranch
    const { data: newRanch, error: ranchError } = await supabase
      .from('ranches')
      .insert({
        name: ranch.name,
        contact_email: ranch.contact_email,
        phone: ranch.phone || null,
      })
      .select('id')
      .single()

    if (ranchError || !newRanch) {
      return NextResponse.json(
        { error: 'Failed to create ranch' },
        { status: 500 }
      )
    }

    // 4. Get all tags in this kit
    const { data: kitTags, error: kitTagsError } = await supabase
      .from('kit_tags')
      .select('tag_id')
      .eq('kit_id', kit.id)

    if (kitTagsError) {
      console.error('Error fetching kit tags:', kitTagsError)
      // Continue anyway - kit will be marked as claimed
    }

    // 5. Update tags to assign them to the ranch
    if (kitTags && kitTags.length > 0) {
      const tagIds = kitTags.map(kt => kt.tag_id)
      
      const { error: updateTagsError } = await supabase
        .from('tags')
        .update({
          ranch_id: newRanch.id,
          status: 'assigned', // Tags are assigned but not yet attached to animals
        })
        .in('id', tagIds)

      if (updateTagsError) {
        console.error('Error updating tags:', updateTagsError)
        // Continue anyway - ranch is created and kit is marked as claimed
      }
    }

    // 6. Update kit status
    const { error: updateKitError } = await supabase
      .from('kits')
      .update({
        status: 'claimed',
        claimed_ranch_id: newRanch.id,
      })
      .eq('id', kit.id)

    if (updateKitError) {
      console.error('Error updating kit:', updateKitError)
      // Ranch is created, but kit status update failed
    }

    // TODO: Link user account to this ranch if authentication is implemented
    // const { data: { user } } = await supabase.auth.getUser()
    // if (user) {
    //   await supabase.auth.updateUser({
    //     data: { ranch_id: newRanch.id }
    //   })
    // }

    return NextResponse.json({
      success: true,
      ranch: {
        id: newRanch.id,
        name: ranch.name,
      },
      tagsCount: kitTags?.length || 0,
      message: 'Kit claimed successfully',
    })
  } catch (error: any) {
    console.error('Claim kit error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to claim kit',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

