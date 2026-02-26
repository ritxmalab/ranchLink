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
  size: string | null
  status: string
  // IDENTIFICATION
  eid: string | null
  secondary_id: string | null
  tattoo: string | null
  brand: string | null
  // ADDITIONAL
  owner: string | null
  head_count: number | null
  labels: string[] | null
  // CALLFHOOD
  dam_id: string | null
  sire_id: string | null
  birth_weight: number | null
  weaning_weight: number | null
  weaning_date: string | null
  yearling_weight: number | null
  yearling_date: string | null
  // PURCHASE
  seller: string | null
  purchase_price: number | null
  purchase_date: string | null
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

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="text-[var(--c4)] text-sm">{label}</span>
      <span className="font-semibold text-sm text-right max-w-[60%]">{String(value)}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card mb-4">
      <h2 className="text-lg font-bold mb-3 text-[var(--c2)]">{title}</h2>
      {children}
    </div>
  )
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
        setError(response.status === 404 ? 'Animal not found' : 'Failed to load animal')
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
          <button onClick={() => router.push('/')} className="btn-primary">Go Home</button>
        </div>
      </div>
    )
  }

  const age = animal.birth_year ? new Date().getFullYear() - animal.birth_year : null
  const tag = animal.tags && animal.tags.length > 0 ? animal.tags[0] : null
  const onChainStatus = tag?.token_id && tag?.contract_address ? 'on-chain' : 'off-chain'

  const hasIdentification = animal.eid || animal.secondary_id || animal.tattoo || animal.brand
  const hasCallfhood = animal.dam_id || animal.sire_id || animal.birth_weight || animal.weaning_weight || animal.yearling_weight
  const hasPurchase = animal.seller || animal.purchase_price || animal.purchase_date
  const hasAdditional = animal.owner || animal.head_count || (animal.labels && animal.labels.length > 0)

  return (
    <div className="min-h-screen bg-[var(--bg)] py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-4xl font-bold mb-1">{animal.name}</h1>
              <p className="text-[var(--c4)] text-sm">
                Animal ID: <span className="font-mono font-semibold text-white">{animal.public_id}</span>
              </p>
              {animal.ranches?.name && (
                <p className="text-[var(--c4)] text-sm mt-0.5">
                  Ranch: <span className="font-semibold text-white">{animal.ranches.name}</span>
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="w-20 h-20 bg-gradient-to-br from-[var(--c2)] to-[var(--c3)] rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {(animal.name || 'A').charAt(0).toUpperCase()}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                animal.status === 'active'
                  ? 'bg-green-900/20 text-green-400'
                  : 'bg-gray-900/20 text-gray-400'
              }`}>
                {animal.status}
              </span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center p-3 bg-white/5 rounded-lg">
              <div className="text-xl font-bold text-[var(--c2)]">{animal.species}</div>
              <div className="text-xs text-[var(--c4)]">Species</div>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-lg">
              <div className="text-xl font-bold text-[var(--c2)]">{animal.breed || '—'}</div>
              <div className="text-xs text-[var(--c4)]">Breed</div>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-lg">
              <div className="text-xl font-bold text-[var(--c2)]">
                {age !== null ? `${age}yr` : '—'}
              </div>
              <div className="text-xs text-[var(--c4)]">Age</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">

          {/* Basic Info */}
          <Section title="Basic Info">
            <InfoRow label="Sex" value={animal.sex} />
            <InfoRow label="Birth Year" value={animal.birth_year} />
            <InfoRow label="Age" value={age !== null ? `${age} year${age !== 1 ? 's' : ''}` : null} />
            <InfoRow label="Size / Frame" value={animal.size} />
          </Section>

          {/* Blockchain & Tag */}
          <Section title="Blockchain & Tag">
            {tag ? (
              <>
                <InfoRow label="Tag Code" value={tag.tag_code} />
                <InfoRow label="Tag Status" value={tag.status.replace(/_/g, ' ')} />
                <InfoRow label="Token ID" value={tag.token_id ? `#${tag.token_id}` : null} />
                <InfoRow label="Chain" value={tag.chain} />
                <div className="flex justify-between py-1.5">
                  <span className="text-[var(--c4)] text-sm">On-chain</span>
                  {onChainStatus === 'on-chain' ? (
                    <span className="px-2 py-0.5 bg-green-900/20 text-green-400 rounded text-xs font-semibold">✅ ON-CHAIN</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-yellow-900/20 text-yellow-400 rounded text-xs font-semibold">⚪ OFF-CHAIN</span>
                  )}
                </div>
                {tag.token_id && tag.contract_address && (
                  <div className="pt-3">
                    <a href={getBasescanUrl(BigInt(tag.token_id))} target="_blank" rel="noopener noreferrer"
                      className="btn-secondary w-full text-center text-sm">
                      🔗 View on Basescan
                    </a>
                  </div>
                )}
              </>
            ) : (
              <p className="text-[var(--c4)] text-sm">No tag attached.</p>
            )}
          </Section>

          {/* Identification */}
          {hasIdentification && (
            <Section title="Identification">
              <InfoRow label="EID" value={animal.eid} />
              <InfoRow label="Secondary ID" value={animal.secondary_id} />
              <InfoRow label="Tattoo" value={animal.tattoo} />
              <InfoRow label="Brand" value={animal.brand} />
            </Section>
          )}

          {/* Additional */}
          {hasAdditional && (
            <Section title="Additional">
              <InfoRow label="Owner" value={animal.owner} />
              <InfoRow label="Head Count" value={animal.head_count} />
              {animal.labels && animal.labels.length > 0 && (
                <div className="py-1.5">
                  <span className="text-[var(--c4)] text-sm">Labels</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {animal.labels.map((l) => (
                      <span key={l} className="px-2 py-0.5 bg-[var(--c2)]/20 text-[var(--c2)] rounded text-xs">{l}</span>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* Callfhood / Genetics */}
          {hasCallfhood && (
            <Section title="Callfhood / Genetics">
              <InfoRow label="Dam ID (Mother)" value={animal.dam_id} />
              <InfoRow label="Sire ID (Father)" value={animal.sire_id} />
              <InfoRow label="Birth Weight" value={animal.birth_weight ? `${animal.birth_weight} kg` : null} />
              <InfoRow label="Weaning Weight" value={animal.weaning_weight ? `${animal.weaning_weight} kg` : null} />
              <InfoRow label="Weaning Date" value={animal.weaning_date} />
              <InfoRow label="Yearling Weight" value={animal.yearling_weight ? `${animal.yearling_weight} kg` : null} />
              <InfoRow label="Yearling Date" value={animal.yearling_date} />
            </Section>
          )}

          {/* Purchase */}
          {hasPurchase && (
            <Section title="Purchase">
              <InfoRow label="Seller" value={animal.seller} />
              <InfoRow label="Purchase Price" value={animal.purchase_price ? `$${animal.purchase_price.toLocaleString()}` : null} />
              <InfoRow label="Purchase Date" value={animal.purchase_date} />
            </Section>
          )}

          {/* Ranch */}
          {animal.ranches && (
            <Section title="Ranch">
              <InfoRow label="Ranch Name" value={animal.ranches.name} />
              <InfoRow label="Contact" value={animal.ranches.contact_email} />
            </Section>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-4">
          <button onClick={() => router.push('/dashboard')} className="btn-secondary">
            ← Dashboard
          </button>
          {tag && (
            <a href={`/t/${tag.tag_code}`} className="btn-primary">
              View Tag Details
            </a>
          )}
        </div>

        {/* Share */}
        <div className="mt-4 card bg-gradient-to-r from-[var(--c2)] to-[var(--c3)] text-white">
          <h3 className="font-bold mb-1">Share This Animal Card</h3>
          <p className="text-sm mb-3 opacity-90">Share with vets, buyers, or anyone who needs to verify this animal.</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/a/${public_id}`}
              readOnly
              className="flex-1 px-3 py-2 bg-black/20 rounded-lg text-white text-sm border border-white/20"
            />
            <button
              onClick={() => navigator.clipboard.writeText(
                `${typeof window !== 'undefined' ? window.location.origin : ''}/a/${public_id}`
              )}
              className="btn-secondary bg-white text-[var(--c2)] hover:bg-white/90 text-sm px-4"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
