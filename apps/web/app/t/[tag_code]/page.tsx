'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBasescanUrl } from '@/lib/blockchain/ranchLinkTag'

interface TagData {
  id: string
  tag_code: string
  token_id: string | null
  mint_tx_hash: string | null
  chain: string
  contract_address: string | null
  status: string
  activation_state: string
  animal_id: string | null
  ranch_id: string | null
  animals?: {
    public_id: string
    name: string
    species: string
    breed: string | null
  } | null
  ranches?: {
    id: string
    name: string
  } | null
}

interface PageProps {
  params: {
    tag_code: string
  }
}

const inputClass =
  'w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)]'
const labelClass = 'block text-sm font-medium mb-1 text-[var(--c4)]'

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="pt-6 pb-2 border-t border-white/10">
      <h3 className="text-lg font-bold text-[var(--c1)]">{title}</h3>
      {subtitle && <p className="text-xs text-[var(--c4)] mt-0.5">{subtitle}</p>}
    </div>
  )
}

export default function TagScanPage({ params }: PageProps) {
  const { tag_code } = params
  const router = useRouter()
  const [tag, setTag] = useState<TagData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attaching, setAttaching] = useState(false)
  const [attachSuccess, setAttachSuccess] = useState(false)

  // BASIC
  const [animalName, setAnimalName] = useState('')
  const [species, setSpecies] = useState('Cattle')
  const [breed, setBreed] = useState('')
  const [birthYear, setBirthYear] = useState(new Date().getFullYear() - 1)
  const [sex, setSex] = useState('')
  const [size, setSize] = useState('')

  // IDENTIFICATION
  const [eid, setEid] = useState('')
  const [secondaryId, setSecondaryId] = useState('')
  const [tattoo, setTattoo] = useState('')
  const [brand, setBrand] = useState('')

  // ADDITIONAL
  const [owner, setOwner] = useState('')
  const [headCount, setHeadCount] = useState('')
  const [labels, setLabels] = useState('')

  // CALLFHOOD
  const [damId, setDamId] = useState('')
  const [sireId, setSireId] = useState('')
  const [birthWeight, setBirthWeight] = useState('')
  const [weaningWeight, setWeaningWeight] = useState('')
  const [weaningDate, setWeaningDate] = useState('')
  const [yearlingWeight, setYearlingWeight] = useState('')
  const [yearlingDate, setYearlingDate] = useState('')

  // PURCHASE
  const [seller, setSeller] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')

  // PHOTO
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    fetchTag()
  }, [tag_code])

  const fetchTag = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tags/${tag_code}`)
      if (!response.ok) {
        setError(response.status === 404 ? 'Tag not found' : 'Failed to load tag')
        return
      }
      const data = await response.json()

      if (data.tag?.animal_id && data.tag?.animals?.public_id) {
        router.push(`/a/${data.tag.animals.public_id}`)
        return
      }

      setTag(data.tag)
    } catch (err) {
      console.error('Error fetching tag:', err)
      setError('Failed to load tag')
    } finally {
      setLoading(false)
    }
  }

  const handleAttach = async (e: React.FormEvent) => {
    e.preventDefault()
    setAttaching(true)
    setError(null)

    try {
      // Step 1: Upload photo to IPFS if provided (before attach so we have the URL)
      let photoUrl: string | undefined
      if (photoFile) {
        setPhotoUploading(true)
        const photoForm = new FormData()
        photoForm.append('file', photoFile)
        const photoRes = await fetch('/api/upload-photo', { method: 'POST', body: photoForm })
        const photoData = await photoRes.json()
        if (photoRes.ok && photoData.photo_url) {
          photoUrl = photoData.photo_url
        }
        setPhotoUploading(false)
      }

      const response = await fetch('/api/attach-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagCode: tag_code,
          animalData: {
            // BASIC
            name: animalName,
            species,
            breed: breed || undefined,
            birth_year: birthYear || undefined,
            sex: sex || undefined,
            size: size || undefined,
            // IDENTIFICATION
            eid: eid || undefined,
            secondary_id: secondaryId || undefined,
            tattoo: tattoo || undefined,
            brand: brand || undefined,
            // ADDITIONAL
            owner: owner || undefined,
            head_count: headCount ? parseInt(headCount) : undefined,
            labels: labels ? labels.split(',').map((l) => l.trim()).filter(Boolean) : undefined,
            // CALLFHOOD
            dam_id: damId || undefined,
            sire_id: sireId || undefined,
            birth_weight: birthWeight ? parseFloat(birthWeight) : undefined,
            weaning_weight: weaningWeight ? parseFloat(weaningWeight) : undefined,
            weaning_date: weaningDate || undefined,
            yearling_weight: yearlingWeight ? parseFloat(yearlingWeight) : undefined,
            yearling_date: yearlingDate || undefined,
            // PHOTO
            photo_url: photoUrl || undefined,
            // PURCHASE
            seller: seller || undefined,
            purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
            purchase_date: purchaseDate || undefined,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to attach tag')
      }

      setAttachSuccess(true)
      setTimeout(() => {
        router.push(`/a/${data.public_id}`)
      }, 1000)
    } catch (err: any) {
      console.error('Attach error:', err)
      setError(err.message || 'Failed to attach tag')
    } finally {
      setAttaching(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--c2)] mx-auto mb-4"></div>
          <p className="text-[var(--c4)]">Loading tag...</p>
        </div>
      </div>
    )
  }

  if (error && !tag) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tag Not Found</h1>
          <p className="text-[var(--c4)] mb-8">Tag code "{tag_code}" does not exist.</p>
          <a href="/" className="btn-primary">Go Home</a>
        </div>
      </div>
    )
  }

  if (!tag) return null

  const basescanUrl = tag.token_id ? getBasescanUrl(BigInt(tag.token_id)) : null
  const onChainStatus = tag.token_id && tag.contract_address ? 'on-chain' : 'off-chain'

  return (
    <div className="min-h-screen bg-[var(--bg)] py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Tag Info Card */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Tag: {tag_code}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              onChainStatus === 'on-chain'
                ? 'bg-green-900/20 text-green-400'
                : 'bg-yellow-900/20 text-yellow-400'
            }`}>
              {onChainStatus === 'on-chain' ? '✅ ON-CHAIN' : '⚪ OFF-CHAIN'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm text-[var(--c4)]">Status:</span>
              <div className="font-semibold capitalize">{tag.status?.replace(/_/g, ' ')}</div>
            </div>
            <div>
              <span className="text-sm text-[var(--c4)]">Chain:</span>
              <div className="font-semibold">{tag.chain}</div>
            </div>
            {tag.token_id && (
              <div>
                <span className="text-sm text-[var(--c4)]">Token ID:</span>
                <div className="font-mono">#{tag.token_id}</div>
              </div>
            )}
          </div>

          {tag.token_id && basescanUrl && (
            <a href={basescanUrl} target="_blank" rel="noopener noreferrer"
              className="text-[var(--c2)] hover:underline text-sm">
              🔗 View on Basescan →
            </a>
          )}
        </div>

        {/* Attach Form */}
        {!tag.animal_id && (
          <div className="card bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-2 border-blue-700/50">
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-1">Attach Tag to Animal</h2>
              <p className="text-sm text-[var(--c4)]">
                Fill in the basic info now — you can always add more details later.
              </p>
            </div>

            {onChainStatus === 'off-chain' && (
              <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <p className="text-yellow-400 font-semibold mb-1">⚠️ Tag Not On-Chain</p>
                <p className="text-yellow-300 text-sm">
                  {tag.status === 'mint_failed'
                    ? 'The mint failed. Please use the Retry Mint button in the Super Admin Inventory tab.'
                    : 'This tag has not been minted yet. Please wait or contact support.'}
                </p>
              </div>
            )}

            {attachSuccess && (
              <div className="mb-4 p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
                <p className="text-green-400 font-semibold">✅ Tag attached successfully! Redirecting...</p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            <form
              onSubmit={handleAttach}
              className="space-y-3"
              style={{ opacity: onChainStatus === 'off-chain' ? 0.5 : 1 }}
            >
              {/* ── PHOTO ── */}
              <SectionHeader title="Animal Photo" subtitle="Optional — shown on public card and NFT" />
              <div>
                <label className={labelClass}>Photo</label>
                <div className="space-y-3">
                  {photoPreview && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-[var(--c2)]/50">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold"
                      >✕</button>
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-[var(--c2)]/40 rounded-lg cursor-pointer hover:border-[var(--c2)] transition-colors bg-[var(--bg-card)]">
                    <span className="text-2xl">📷</span>
                    <span className="text-sm text-[var(--c4)]">{photoFile ? photoFile.name : 'Take photo or choose from library'}</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
                  </label>
                </div>
              </div>

              {/* ── BASIC ── */}
              <SectionHeader title="Basic Info" subtitle="Required" />

              <div>
                <label className={labelClass}>Animal Name *</label>
                <input type="text" value={animalName} onChange={(e) => setAnimalName(e.target.value)}
                  placeholder="e.g. Bessie, Charlie" className={inputClass} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Species *</label>
                  <select value={species} onChange={(e) => setSpecies(e.target.value)} className={inputClass} required>
                    <option value="Cattle">Cattle</option>
                    <option value="Sheep">Sheep</option>
                    <option value="Goat">Goat</option>
                    <option value="Pig">Pig</option>
                    <option value="Horse">Horse</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Sex</label>
                  <select value={sex} onChange={(e) => setSex(e.target.value)} className={inputClass}>
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Castrated">Castrated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Breed</label>
                  <input type="text" value={breed} onChange={(e) => setBreed(e.target.value)}
                    placeholder="e.g. Angus, Hereford" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Birth Year</label>
                  <input type="number" value={birthYear}
                    onChange={(e) => setBirthYear(parseInt(e.target.value) || new Date().getFullYear() - 1)}
                    min="1900" max={new Date().getFullYear()} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Size / Frame Score</label>
                <input type="text" value={size} onChange={(e) => setSize(e.target.value)}
                  placeholder="e.g. Large, Medium, Frame 5" className={inputClass} />
              </div>

              {/* ── IDENTIFICATION ── */}
              <SectionHeader title="Identification" subtitle="Optional — EID, tattoo, brand" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>EID (Electronic ID)</label>
                  <input type="text" value={eid} onChange={(e) => setEid(e.target.value)}
                    placeholder="e.g. 982 000123456789" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Secondary ID / Tag</label>
                  <input type="text" value={secondaryId} onChange={(e) => setSecondaryId(e.target.value)}
                    placeholder="e.g. visual tag #" className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Tattoo</label>
                  <input type="text" value={tattoo} onChange={(e) => setTattoo(e.target.value)}
                    placeholder="e.g. A123" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Brand</label>
                  <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Lazy S" className={inputClass} />
                </div>
              </div>

              {/* ── ADDITIONAL ── */}
              <SectionHeader title="Additional" subtitle="Optional — owner, head count, labels" />

              <div>
                <label className={labelClass}>Owner</label>
                <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)}
                  placeholder="Owner name or entity" className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Head Count</label>
                  <input type="number" value={headCount} onChange={(e) => setHeadCount(e.target.value)}
                    placeholder="1" min="1" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Labels (comma-separated)</label>
                  <input type="text" value={labels} onChange={(e) => setLabels(e.target.value)}
                    placeholder="e.g. show, organic" className={inputClass} />
                </div>
              </div>

              {/* ── CALLFHOOD ── */}
              <SectionHeader title="Callfhood / Genetics" subtitle="Optional — dam, sire, weights" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Dam ID (Mother)</label>
                  <input type="text" value={damId} onChange={(e) => setDamId(e.target.value)}
                    placeholder="Dam animal ID" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Sire ID (Father)</label>
                  <input type="text" value={sireId} onChange={(e) => setSireId(e.target.value)}
                    placeholder="Sire animal ID" className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Birth Weight (kg)</label>
                  <input type="number" step="0.1" value={birthWeight}
                    onChange={(e) => setBirthWeight(e.target.value)}
                    placeholder="e.g. 38.5" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Weaning Weight (kg)</label>
                  <input type="number" step="0.1" value={weaningWeight}
                    onChange={(e) => setWeaningWeight(e.target.value)}
                    placeholder="e.g. 220" className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Weaning Date</label>
                  <input type="date" value={weaningDate} onChange={(e) => setWeaningDate(e.target.value)}
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Yearling Weight (kg)</label>
                  <input type="number" step="0.1" value={yearlingWeight}
                    onChange={(e) => setYearlingWeight(e.target.value)}
                    placeholder="e.g. 380" className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Yearling Date</label>
                <input type="date" value={yearlingDate} onChange={(e) => setYearlingDate(e.target.value)}
                  className={inputClass} />
              </div>

              {/* ── PURCHASE ── */}
              <SectionHeader title="Purchase" subtitle="Optional — seller, price, date" />

              <div>
                <label className={labelClass}>Seller</label>
                <input type="text" value={seller} onChange={(e) => setSeller(e.target.value)}
                  placeholder="Seller name or ranch" className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Purchase Price (USD)</label>
                  <input type="number" step="0.01" value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="e.g. 1500.00" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Purchase Date</label>
                  <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)}
                    className={inputClass} />
                </div>
              </div>

              {/* ── SUBMIT ── */}
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => router.push('/')}
                  className="btn-secondary flex-1" disabled={attaching}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={attaching || !animalName || !species || onChainStatus === 'off-chain'}
                >
                  {photoUploading ? '📷 Uploading photo...' : attaching ? '⛓️ Saving & minting...' : '🐄 Attach Animal'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
