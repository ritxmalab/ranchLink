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
  
  const { data: animals, error } = await supabase
    .from('animals')
    .select('*, tags!left(tag_code, token_id, status, mint_tx_hash, chain, contract_address)')
    .eq('ranch_id', session.ranchId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch animals' }, { status: 500 })
  }

  const { data: tagAnimals } = await supabase
    .from('tags')
    .select('animal_id, animals!inner(*, tags!left(tag_code, token_id, status, mint_tx_hash, chain, contract_address))')
    .eq('ranch_id', session.ranchId)
    .not('animal_id', 'is', null)

  const allAnimals = [...(animals || [])]
  const existingIds = new Set(allAnimals.map(a => a.id))
  
  if (tagAnimals) {
    for (const t of tagAnimals) {
      const animal = (t as any).animals
      if (animal && !existingIds.has(animal.id)) {
        allAnimals.push(animal)
        existingIds.add(animal.id)
      }
    }
  }

  return NextResponse.json({ animals: allAnimals, ranch_id: session.ranchId })
}
