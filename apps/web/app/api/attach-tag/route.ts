import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

/**
 * POST /api/attach-tag
 * Attaches a tag to an animal (v1.0)
 * 
 * Request body:
 * {
 *   tagCode: string,
 *   animalData: {
 *     name: string,
 *     species: string,
 *     breed?: string,
 *     birth_year?: number,
 *     sex?: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tagCode, animalData } = body

    if (!tagCode || !animalData || !animalData.name || !animalData.species) {
      return NextResponse.json(
        { error: 'Missing required fields: tagCode, animalData.name, animalData.species' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()

    // 1. Load tag from tags table
    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .select('id, tag_code, animal_id, ranch_id, status')
      .eq('tag_code', tagCode)
      .single()

    if (tagError || !tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    // 2. Verify authentication and ownership
    // TODO: Implement Supabase Auth check
    // For now, allow if tag.ranch_id is null or if user's ranch_id matches
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    // const userRanchId = user.user_metadata?.ranch_id
    // if (tag.ranch_id && tag.ranch_id !== userRanchId) {
    //   return NextResponse.json({ error: 'Not authorized to attach this tag' }, { status: 403 })
    // }

    // For v1.0, we'll allow attachment if tag.ranch_id is null or if explicitly allowed
    // In production, implement proper auth check above

    // 3. Create or update animal
    let animalId: string
    let publicId: string

    if (tag.animal_id) {
      // Update existing animal
      const { data: existingAnimal, error: animalError } = await supabase
        .from('animals')
        .update({
          name: animalData.name,
          species: animalData.species,
          breed: animalData.breed || null,
          birth_year: animalData.birth_year || null,
          sex: animalData.sex || null,
        })
        .eq('id', tag.animal_id)
        .select('public_id')
        .single()

      if (animalError || !existingAnimal) {
        return NextResponse.json(
          { error: 'Failed to update animal' },
          { status: 500 }
        )
      }

      animalId = tag.animal_id
      publicId = existingAnimal.public_id
    } else {
      // Create new animal
      // Generate public_id
      const { data: lastAnimal } = await supabase
        .from('animals')
        .select('public_id')
        .order('created_at', { ascending: false })
        .limit(1)

      let nextNumber = 1
      if (lastAnimal && lastAnimal.length > 0) {
        const match = lastAnimal[0].public_id?.match(/AUS(\d+)/)
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1
        }
      }

      publicId = `AUS${String(nextNumber).padStart(4, '0')}`

      // Determine ranch_id
      // TODO: Get from authenticated user's ranch_id
      // For now, use tag.ranch_id if exists, or null
      const ranchId = tag.ranch_id || null

      const { data: newAnimal, error: animalError } = await supabase
        .from('animals')
        .insert({
          public_id: publicId,
          name: animalData.name,
          species: animalData.species,
          breed: animalData.breed || null,
          birth_year: animalData.birth_year || null,
          sex: animalData.sex || null,
          ranch_id: ranchId,
          status: 'active',
        })
        .select('id, public_id')
        .single()

      if (animalError || !newAnimal) {
        return NextResponse.json(
          { error: 'Failed to create animal' },
          { status: 500 }
        )
      }

      animalId = newAnimal.id
      publicId = newAnimal.public_id
    }

    // 4. Update tag
    const { error: updateError } = await supabase
      .from('tags')
      .update({
        animal_id: animalId,
        ranch_id: tag.ranch_id || null, // Keep existing or set from animal
        status: 'attached',
      })
      .eq('id', tag.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update tag' },
        { status: 500 }
      )
    }

    // 5. Return success
    return NextResponse.json({
      success: true,
      public_id: publicId,
      tag_code: tagCode,
      message: 'Tag attached successfully',
    })
  } catch (error: any) {
    console.error('Attach tag error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to attach tag',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

