'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBasescanUrl } from '@/lib/blockchain/ranchLinkTag'

interface Animal {
  id: string
  public_id: string
  name: string
  species: string
  breed: string | null
  sex: string | null
  birth_year: number | null
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

export default function AnimalPublicIdPage({ params }: { params: { public_id: string } }) {
  const { public_id } = params
  const router = useRouter()
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnimal()
  }, [public_id])

  const fetchAnimal = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/animals/${public_id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Animal not found')
        } else {
          setError('Failed to load animal')
        }
        return
      }
      
      const data = await response.json()
      setAnimal(data.animal)
    } catch (err) {
      console.error('Error fetching animal:', err)
      setError('Failed to load animal')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--c2)] mx-auto mb-4"></div>
          <p className="text-[var(--c4)]">Loading animal...</p>
        </div>
      </div>
    )
  }

  if (error || !animal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Animal Not Found</h1>
          <p className="text-[var(--c4)] mb-8">Animal with ID "{public_id}" does not exist.</p>
          <button onClick={() => router.push('/')} className="btn-primary">
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const age = animal.birth_year ? new Date().getFullYear() - animal.birth_year : null
  const tag = animal.tags && animal.tags.length > 0 ? animal.tags[0] : null
  const onChainStatus = tag?.token_id && tag?.contract_address ? 'on-chain' : 'off-chain'

  return (
    <div className="min-h-screen bg-[var(--bg)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{animal.name}</h1>
              <p className="text-[var(--c4)]">Animal ID: <span className="font-mono font-semibold">{animal.public_id}</span></p>
            </div>
            <div className="w-24 h-24 bg-gradient-to-br from-[var(--c2)] to-[var(--c3)] rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              {(animal.name || 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Animal Details */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Animal Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--c4)]">Species:</span>
                <span className="font-semibold">{animal.species}</span>
              </div>
              {animal.breed && (
                <div className="flex justify-between">
                  <span className="text-[var(--c4)]">Breed:</span>
                  <span className="font-semibold">{animal.breed}</span>
                </div>
              )}
              {animal.sex && (
                <div className="flex justify-between">
                  <span className="text-[var(--c4)]">Sex:</span>
                  <span className="font-semibold capitalize">{animal.sex}</span>
                </div>
              )}
              {age !== null && (
                <div className="flex justify-between">
                  <span className="text-[var(--c4)]">Age:</span>
                  <span className="font-semibold">{age} year{age !== 1 ? 's' : ''}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--c4)]">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  animal.status === 'active' 
                    ? 'bg-green-900/20 text-green-400' 
                    : 'bg-gray-900/20 text-gray-400'
                }`}>
                  {animal.status}
                </span>
              </div>
            </div>
          </div>

          {/* Blockchain & Tag Info */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Blockchain & Tag</h2>
            {tag ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[var(--c4)]">Tag Code:</span>
                  <span className="font-mono font-semibold">{tag.tag_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--c4)]">Tag Status:</span>
                  <span className="font-semibold capitalize">{tag.status.replace(/_/g, ' ')}</span>
                </div>
                {tag.token_id && (
                  <div className="flex justify-between">
                    <span className="text-[var(--c4)]">Token ID:</span>
                    <span className="font-mono font-semibold">#{tag.token_id}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[var(--c4)]">On-chain Status:</span>
                  {onChainStatus === 'on-chain' ? (
                    <span className="px-3 py-1 bg-green-900/20 text-green-400 rounded-full text-sm font-semibold">
                      ✅ ON-CHAIN
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-900/20 text-yellow-400 rounded-full text-sm font-semibold">
                      ⚪ OFF-CHAIN
                    </span>
                  )}
                </div>
                {tag.chain && (
                  <div className="flex justify-between">
                    <span className="text-[var(--c4)]">Chain:</span>
                    <span className="font-semibold">{tag.chain}</span>
                  </div>
                )}
                {tag.token_id && tag.contract_address && (
                  <div className="pt-3 border-t border-white/10">
                    <a
                      href={getBasescanUrl(BigInt(tag.token_id))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary w-full text-center"
                    >
                      🔗 View on Basescan
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[var(--c4)]">No tag attached to this animal.</p>
            )}
          </div>
        </div>

        {/* Ranch Info */}
        {animal.ranches && (
          <div className="card mb-6">
            <h2 className="text-2xl font-bold mb-4">Ranch Information</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--c4)]">Ranch Name:</span>
                <span className="font-semibold">{animal.ranches.name}</span>
              </div>
              {animal.ranches.contact_email && (
                <div className="flex justify-between">
                  <span className="text-[var(--c4)]">Contact:</span>
                  <span className="font-semibold">{animal.ranches.contact_email}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button onClick={() => router.push('/dashboard')} className="btn-secondary">
            ← Back to Dashboard
          </button>
          {tag && (
            <a
              href={`/t/${tag.tag_code}`}
              className="btn-primary"
            >
              View Tag Details
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
