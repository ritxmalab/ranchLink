import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/ranch-auth'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await validateSession(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseServerClient()

  const [animalsRes, eventsRes, tagsRes] = await Promise.all([
    supabase
      .from('animals')
      .select('*')
      .eq('ranch_id', session.ranchId)
      .order('created_at', { ascending: false }),
    supabase
      .from('animal_events')
      .select('*')
      .eq('ranch_id', session.ranchId)
      .order('event_date', { ascending: false }),
    supabase
      .from('tags')
      .select('*')
      .eq('ranch_id', session.ranchId)
      .order('created_at', { ascending: false }),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    ranch_id: session.ranchId,
    animals: animalsRes.data || [],
    events: eventsRes.data || [],
    tags: tagsRes.data || [],
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="ranchlink-export-${session.ranchId}.json"`,
    },
  })
}
