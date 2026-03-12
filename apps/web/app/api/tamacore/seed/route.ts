import { NextResponse, NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { verifySuperadminAuth } from '@/lib/superadmin-auth'

const SEED: Array<{
  list_order: number
  legal_name: string
  contact: string
  location: string
  category: string
  herd_type: string
  estimated_herd: string
  status: string
}> = [
  { list_order: 1,  legal_name: 'Smith Genetics LLC',            contact: 'Timothy J. Smith',     location: 'Giddings TX',  category: 'Breeder', herd_type: 'Seedstock genetics',     estimated_herd: '100-250',  status: 'prototype_sent' },
  { list_order: 2,  legal_name: 'Braham Country Genetics LLC',     contact: 'Ranch Owner',          location: 'Llano TX',     category: 'Breeder', herd_type: 'Brahman genetics',      estimated_herd: '200-400',  status: 'target' },
  { list_order: 3,  legal_name: 'V8 Ranch Inc',                  contact: 'Ranch Management',     location: 'Wharton TX',   category: 'Breeder', herd_type: 'Brahman genetics',      estimated_herd: '500-1000', status: 'target' },
  { list_order: 4,  legal_name: 'BRC Ranch LLC',                 contact: 'Operations Manager',   location: 'Refugio TX',   category: 'Breeder', herd_type: 'Wagyu breeding',       estimated_herd: '200-400',  status: 'target' },
  { list_order: 5,  legal_name: 'McClaren Farms LLC',            contact: 'Ranch Owner',          location: 'Texas',        category: 'Breeder', herd_type: 'Angus seedstock',        estimated_herd: '150-300',  status: 'target' },
  { list_order: 6,  legal_name: 'Mill-King Market & Creamery LLC', contact: 'Dairy Manager',     location: 'McGregor TX',  category: 'Dairy',   herd_type: 'Grass-fed dairy',        estimated_herd: '200-400',  status: 'target' },
  { list_order: 7,  legal_name: "Volleman's Family Farm LLC",     contact: 'Ranch Owner',          location: 'Gustine TX',   category: 'Dairy',   herd_type: 'Commercial dairy',       estimated_herd: '300-600',  status: 'target' },
  { list_order: 8,  legal_name: 'Stryk Jersey Farm LLC',         contact: 'Ranch Owner',          location: 'Schulenburg TX', category: 'Dairy', herd_type: 'Jersey dairy',          estimated_herd: '200-350',  status: 'target' },
  { list_order: 9,  legal_name: 'Richardson Farms LLC',          contact: 'Ranch Manager',        location: 'Rockdale TX',  category: 'Beef',    herd_type: 'Cow-calf operation',     estimated_herd: '300-600',  status: 'target' },
  { list_order: 10, legal_name: 'Strait Ranch Company LLC',      contact: 'Ranch Management',     location: 'South TX',     category: 'Beef',    herd_type: 'Large cattle ranch',     estimated_herd: '1000+',    status: 'target' },
  { list_order: 11, legal_name: 'JB Ranch LLC',                  contact: 'Ranch Owner',          location: 'Buda TX',      category: 'Beef',    herd_type: 'Cow-calf herd',          estimated_herd: '100-200',  status: 'target' },
  { list_order: 12, legal_name: '4C Ranch LLC',                  contact: 'Ranch Owner',          location: 'Dripping Springs TX', category: 'Beef', herd_type: 'Cow-calf herd', estimated_herd: '150-250',  status: 'target' },
]

/**
 * POST /api/tamacore/seed — internal (superadmin only)
 */
export async function POST(request: NextRequest) {
  const authErr = verifySuperadminAuth(request)
  if (authErr) return authErr
  const supabase = getSupabaseServerClient()
  const { count } = await supabase.from('pipeline_contacts').select('id', { count: 'exact', head: true })
  if (count != null && count > 0) {
    return NextResponse.json({ message: 'Pipeline already has data, skipping seed.', count })
  }

  const { data, error } = await supabase.from('pipeline_contacts').insert(SEED).select('id, legal_name, status')

  if (error) {
    console.error('[TAMACORE] seed error:', error)
    return NextResponse.json({
      error: error.message,
      hint: 'Run ADD_TAMACORE_PIPELINE.sql and SEED_TAMACORE_PIPELINE.sql in Supabase SQL Editor if tables are missing.',
    }, { status: 500 })
  }
  return NextResponse.json({ message: 'Pipeline seeded.', inserted: data?.length ?? 0, contacts: data })
}
