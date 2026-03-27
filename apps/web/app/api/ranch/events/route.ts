import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/ranch-auth'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const eventSchema = z.object({
  animal_id: z.string().uuid(),
  event_type: z.enum(['health_check', 'vaccination', 'treatment', 'weight', 'movement', 'breeding', 'calving', 'note']),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  event_date: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  evidence_urls: z.array(z.string().url()).max(10).optional(),
})

export async function GET(request: NextRequest) {
  const session = await validateSession(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const animalId = searchParams.get('animal_id')

  const supabase = getSupabaseServerClient()
  
  let query = supabase
    .from('animal_events')
    .select('*')
    .eq('ranch_id', session.ranchId)
    .order('event_date', { ascending: false })

  if (animalId) {
    query = query.eq('animal_id', animalId)
  }

  const { data, error } = await query.limit(200)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }

  return NextResponse.json({ events: data || [] })
}

export async function POST(request: NextRequest) {
  if (!rateLimit(request, 20, 60000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await validateSession(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validated = eventSchema.parse(body)

    const supabase = getSupabaseServerClient()

    const { data: animal } = await supabase
      .from('animals')
      .select('id, ranch_id')
      .eq('id', validated.animal_id)
      .single()

    if (!animal || animal.ranch_id !== session.ranchId) {
      return NextResponse.json({ error: 'Animal not found or not owned by your ranch' }, { status: 403 })
    }

    const { data: event, error } = await supabase
      .from('animal_events')
      .insert({
        animal_id: validated.animal_id,
        ranch_id: session.ranchId,
        event_type: validated.event_type,
        title: validated.title,
        description: validated.description || null,
        event_date: validated.event_date || new Date().toISOString(),
        metadata: validated.metadata || {},
        evidence_urls: validated.evidence_urls || [],
        created_by: session.userId,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    }

    return NextResponse.json({ event })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
