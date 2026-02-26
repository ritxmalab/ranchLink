'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getBasescanUrl } from '@/lib/blockchain/ranchLinkTag'

interface Animal {
  public_id: string
  name: string
  animal_name?: string
  species: string
  breed: string | null
  birth_year: number | null
  sex?: string | null
  status: string
  tags?: Array<{
    tag_code: string
    token_id: string | null
    mint_tx_hash: string | null
    chain: string
    contract_address: string | null
    status: string
    activation_state: string
  }>
  ranches?: {
    id: string
    name: string
    contact_email: string | null
  }
}

interface Event {
  id: string
  type: string
  payload_json: any
  created_at: string
}

function AnimalCardContent() {
  const searchParams = useSearchParams()
  const publicId = searchParams.get('id') || 'AUS0001'
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnimal()
  }, [publicId])

  const fetchAnimal = async () => {
    try {
      const response = await fetch(`/api/animals/${publicId}`)
      const data = await response.json()
      setAnimal(data.animal)
      setEvents(data.events || [])
    } catch (error) {
      console.error('Error fetching animal:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--c2)] mx-auto mb-4"></div>
          <p className="text-[var(--c4)]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!animal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Animal Not Found</h1>
          <p className="text-[var(--c4)] mb-8">This animal card doesn't exist yet.</p>
          <a href="/start" className="btn-primary">
            Claim Your Tag
          </a>
        </div>
      </div>
    )
  }

  const age = animal.birth_year
    ? new Date().getFullYear() - animal.birth_year
    : null

  return (
    <div className="min-h-screen bg-[var(--bg)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="card mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{animal.name || animal.animal_name}</h1>
                <span className="px-3 py-1 bg-[var(--c3)] text-[var(--c1)] rounded-full text-sm font-semibold">
                  {animal.status}
                </span>
              </div>
              <p className="text-xl text-[var(--c4)]">
                Public ID: <span className="font-mono font-semibold text-white">{animal.public_id}</span>
              </p>
              {animal.ranches?.name && (
                <p className="text-[var(--c4)] mt-1">
                  Ranch: <span className="font-semibold text-white">{animal.ranches.name}</span>
                </p>
              )}
              {animal.tags && animal.tags.length > 0 && animal.tags[0] && (
                <div className="mt-2 space-y-1">
                  <p className="text-[var(--c4)]">
                    Tag: <span className="font-mono font-semibold text-white">{animal.tags[0].tag_code}</span>
                  </p>
                  {animal.tags[0].token_id && (
                    <div className="flex items-center gap-2">
                      <p className="text-[var(--c4)]">
                        Token ID: <span className="font-mono font-semibold text-white">#{animal.tags[0].token_id}</span>
                      </p>
                      <a
                        href={getBasescanUrl(BigInt(animal.tags[0].token_id))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--c2)] hover:underline text-sm"
                      >
                        View on Basescan →
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--c4)]">On-chain Status:</span>
                    {animal.tags[0].token_id && animal.tags[0].contract_address ? (
                      <span className="px-2 py-1 bg-green-900/20 text-green-400 rounded text-xs font-semibold">
                        ✅ ON-CHAIN
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-900/20 text-yellow-400 rounded text-xs font-semibold">
                        ⚪ OFF-CHAIN
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="w-24 h-24 bg-gradient-to-br from-[var(--c2)] to-[var(--c3)] rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                {(animal.name || animal.animal_name || 'A').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="card text-center">
            <div className="text-3xl font-bold text-[var(--c2)] mb-1">
              {animal.species}
            </div>
            <div className="text-sm text-gray-600">Species</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-[var(--c2)] mb-1">
              {animal.breed || '—'}
            </div>
            <div className="text-sm text-gray-600">Breed</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-[var(--c2)] mb-1">
              {age ? `${age} yr${age !== 1 ? 's' : ''}` : '—'}
            </div>
            <div className="text-sm text-gray-600">Age</div>
          </div>
        </div>

        {/* Events Timeline */}
        <div className="card mb-6">
          <h2 className="text-2xl font-bold mb-4">Activity Timeline</h2>
          {events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-[var(--c2)] rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold capitalize">{event.type}</span>
                      <span className="text-sm text-[var(--c4)]">
                        {new Date(event.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {event.payload_json && (
                      <div className="text-sm text-[var(--c4)]">
                        {JSON.stringify(event.payload_json, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--c4)] text-center py-8">
              No events recorded yet
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button className="btn-secondary">
              📷 Add Photo
            </button>
            <button className="btn-secondary">
              💉 Record Vaccination
            </button>
            <button className="btn-secondary">
              📤 Transfer Ownership
            </button>
          </div>
        </div>

        {/* Share Card */}
        <div className="mt-6 card bg-gradient-to-r from-[var(--c2)] to-[var(--c3)] text-white">
          <h3 className="font-bold mb-2">Share This Animal Card</h3>
          <p className="text-sm mb-4 opacity-90">
            Share the public card URL with vets, buyers, or anyone who needs to
            verify this animal's information.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/a?id=${publicId}`}
              readOnly
                  className="flex-1 px-4 py-2 bg-[var(--bg-card)]/50 rounded-lg text-white placeholder-white/70 border border-white/20"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${typeof window !== 'undefined' ? window.location.origin : ''}/a?id=${publicId}`
                )
                alert('URL copied!')
              }}
              className="btn-secondary bg-white text-[var(--c2)] hover:bg-white/90"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AnimalCardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--c2)] mx-auto mb-4"></div>
          <p className="text-[var(--c4)]">Loading...</p>
        </div>
      </div>
    }>
      <AnimalCardContent />
    </Suspense>
  )
}

