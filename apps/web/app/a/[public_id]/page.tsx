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
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Update form state
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [updateSubmitting, setUpdateSubmitting] = useState(false)
  const [updateMsg, setUpdateMsg] = useState<string | null>(null)
  const [updateEventType, setUpdateEventType] = useState('update')
  const [updateNotes, setUpdateNotes] = useState('')
  const [updateWeight, setUpdateWeight] = useState('')
  const [updatePhotoFile, setUpdatePhotoFile] = useState<File | null>(null)
  const [updatePhotoPreview, setUpdatePhotoPreview] = useState<string | null>(null)

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
      setEvents(data.events || [])
    } catch (err) {
      console.error('Error fetching animal:', err)
      setError('Failed to load animal')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUpdatePhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setUpdatePhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateSubmitting(true)
    setUpdateMsg(null)
    try {
      // Upload new photo if provided
      let photoUrl: string | undefined
      if (updatePhotoFile) {
        const photoForm = new FormData()
        photoForm.append('file', updatePhotoFile)
        photoForm.append('public_id', public_id)
        const photoRes = await fetch('/api/upload-photo', { method: 'POST', body: photoForm })
        const photoData = await photoRes.json()
        if (photoRes.ok && photoData.photo_url) photoUrl = photoData.photo_url
      }

      const payload: any = {
        public_id,
        event_type: updateEventType,
        event_notes: updateNotes || undefined,
        event_weight: updateWeight ? parseFloat(updateWeight) : undefined,
      }
      if (photoUrl) payload.photo_url = photoUrl
      if (updateWeight) payload.yearling_weight = parseFloat(updateWeight)

      const res = await fetch('/api/update-animal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        setUpdateMsg(data.metadata_updated
          ? '✅ Updated & synced to blockchain!'
          : '✅ Updated! (blockchain sync in progress)')
        setUpdateNotes('')
        setUpdateWeight('')
        setUpdatePhotoFile(null)
        setUpdatePhotoPreview(null)
        await fetchAnimal()
        setTimeout(() => setShowUpdateForm(false), 2000)
      } else {
        setUpdateMsg('❌ ' + (data.error || 'Update failed'))
      }
    } catch (err: any) {
      setUpdateMsg('❌ ' + err.message)
    } finally {
      setUpdateSubmitting(false)
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
          <div className="flex items-start justify-between mb-3 gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-1">{animal.name}</h1>
              <p className="text-[var(--c4)] text-sm">
                Animal ID: <span className="font-mono font-semibold text-white">{animal.public_id}</span>
              </p>
              {animal.ranches?.name && (
                <p className="text-[var(--c4)] text-sm mt-0.5">
                  Ranch: <span className="font-semibold text-white">{animal.ranches.name}</span>
                </p>
              )}
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                animal.status === 'active'
                  ? 'bg-green-900/20 text-green-400'
                  : 'bg-gray-900/20 text-gray-400'
              }`}>
                {animal.status}
              </span>
            </div>
            <div className="flex-shrink-0">
              {(animal as any).photo_url ? (
                <img
                  src={(animal as any).photo_url}
                  alt={animal.name}
                  className="w-24 h-24 rounded-xl object-cover border-2 border-[var(--c2)]/50 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-[var(--c2)] to-[var(--c3)] rounded-xl flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                  {(animal.name || 'A').charAt(0).toUpperCase()}
                </div>
              )}
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
        <div className="flex gap-3 mt-4 flex-wrap">
          <button
            onClick={() => setShowUpdateForm(!showUpdateForm)}
            className="btn-primary"
          >
            {showUpdateForm ? '✕ Cancel' : '📝 Update Animal'}
          </button>
          <button onClick={() => router.push('/dashboard')} className="btn-secondary">
            ← Dashboard
          </button>
        </div>

        {/* Ongoing Update Form */}
        {showUpdateForm && (
          <div className="mt-4 card border-2 border-[var(--c2)]/40 bg-gradient-to-br from-blue-900/10 to-purple-900/10">
            <h3 className="text-xl font-bold mb-4">📝 Log Update</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--c4)]">Event Type</label>
                <select
                  value={updateEventType}
                  onChange={e => setUpdateEventType(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none"
                >
                  <option value="weight_update">⚖️ Weight Update</option>
                  <option value="health_check">🏥 Health Check</option>
                  <option value="vet_visit">💉 Vet Visit</option>
                  <option value="update">📋 General Update</option>
                  <option value="note">📝 Note</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--c4)]">Weight (kg) — optional</label>
                <input
                  type="number"
                  step="0.1"
                  value={updateWeight}
                  onChange={e => setUpdateWeight(e.target.value)}
                  placeholder="e.g. 420.5"
                  className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--c4)]">Notes</label>
                <textarea
                  value={updateNotes}
                  onChange={e => setUpdateNotes(e.target.value)}
                  placeholder="Describe the update, health observations, etc."
                  rows={3}
                  className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--c4)]">New Photo — optional</label>
                {updatePhotoPreview && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden mb-2 border border-[var(--c2)]/30">
                    <img src={updatePhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setUpdatePhotoFile(null); setUpdatePhotoPreview(null) }}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-[var(--c2)]/40 rounded-lg cursor-pointer hover:border-[var(--c2)] transition-colors bg-[var(--bg-card)]">
                  <span className="text-xl">📷</span>
                  <span className="text-sm text-[var(--c4)]">{updatePhotoFile ? updatePhotoFile.name : 'Update photo'}</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleUpdatePhoto} className="hidden" />
                </label>
              </div>
              {updateMsg && (
                <div className={`p-3 rounded-lg text-sm ${updateMsg.startsWith('✅') ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                  {updateMsg}
                </div>
              )}
              <button type="submit" className="btn-primary w-full" disabled={updateSubmitting}>
                {updateSubmitting ? '⏳ Saving & syncing to blockchain...' : '✅ Save Update'}
              </button>
            </form>
          </div>
        )}

        {/* Event Log */}
        {events.length > 0 && (
          <div className="mt-4 card">
            <h3 className="text-lg font-bold mb-4 text-[var(--c2)]">📜 Update History</h3>
            <div className="space-y-3">
              {events.map((ev: any) => (
                <div key={ev.id} className="flex gap-3 p-3 bg-white/5 rounded-lg">
                  <div className="text-xl flex-shrink-0">
                    {ev.event_type === 'weight_update' ? '⚖️'
                      : ev.event_type === 'health_check' ? '🏥'
                      : ev.event_type === 'vet_visit' ? '💉'
                      : ev.event_type === 'note' ? '📝'
                      : '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold capitalize">{ev.event_type.replace(/_/g, ' ')}</span>
                      {ev.weight && (
                        <span className="px-2 py-0.5 bg-[var(--c2)]/20 text-[var(--c2)] rounded text-xs">
                          {ev.weight} kg
                        </span>
                      )}
                      {ev.ipfs_cid && (
                        <a href={`https://gateway.pinata.cloud/ipfs/${ev.ipfs_cid}`} target="_blank" rel="noopener noreferrer"
                          className="px-2 py-0.5 bg-purple-900/20 text-purple-400 rounded text-xs hover:underline">
                          IPFS ↗
                        </a>
                      )}
                    </div>
                    {ev.notes && <p className="text-sm text-[var(--c4)] mt-0.5">{ev.notes}</p>}
                    <p className="text-xs text-gray-500 mt-1">{new Date(ev.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
