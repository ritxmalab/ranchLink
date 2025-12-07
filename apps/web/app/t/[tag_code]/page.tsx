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

export default function TagScanPage({ params }: PageProps) {
  const { tag_code } = params
  const router = useRouter()
  const [tag, setTag] = useState<TagData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attaching, setAttaching] = useState(false)
  const [attachSuccess, setAttachSuccess] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    animalName: '',
    species: 'Cattle',
    breed: '',
    birthYear: new Date().getFullYear() - 1,
    sex: '',
  })

  useEffect(() => {
    fetchTag()
  }, [tag_code])

  const fetchTag = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tags/${tag_code}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Tag not found')
        } else {
          setError('Failed to load tag')
        }
        return
      }
      const data = await response.json()
      
      // If tag is attached, redirect to animal card
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
      const response = await fetch('/api/attach-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagCode: tag_code,
          animalData: {
            name: formData.animalName,
            species: formData.species,
            breed: formData.breed || null,
            birth_year: formData.birthYear || null,
            sex: formData.sex || null,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to attach tag')
      }

      setAttachSuccess(true)
      
      // Redirect to animal card after 1 second
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
          <a href="/" className="btn-primary">
            Go Home
          </a>
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
            {onChainStatus === 'on-chain' && (
              <span className="px-3 py-1 bg-green-900/20 text-green-400 rounded-full text-sm font-semibold">
                ✅ ON-CHAIN
              </span>
            )}
            {onChainStatus === 'off-chain' && (
              <span className="px-3 py-1 bg-yellow-900/20 text-yellow-400 rounded-full text-sm font-semibold">
                ⚪ OFF-CHAIN
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <span className="text-sm text-[var(--c4)]">Status:</span>
              <div className="font-semibold capitalize">{tag.status?.replace(/_/g, ' ')}</div>
            </div>
            <div>
              <span className="text-sm text-[var(--c4)]">Activation:</span>
              <div className="font-semibold capitalize">{tag.activation_state || 'active'}</div>
            </div>
            {tag.token_id && (
              <div>
                <span className="text-sm text-[var(--c4)]">Token ID:</span>
                <div className="font-mono">#{tag.token_id}</div>
              </div>
            )}
            {tag.chain && (
              <div>
                <span className="text-sm text-[var(--c4)]">Chain:</span>
                <div className="font-semibold">{tag.chain}</div>
              </div>
            )}
          </div>

          {tag.token_id && basescanUrl && (
            <div className="mb-4">
              <a
                href={basescanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--c2)] hover:underline text-sm"
              >
                🔗 View on Basescan →
              </a>
            </div>
          )}

          {tag.ranch_id && tag.ranches?.name && (
            <div className="text-sm text-[var(--c4)]">
              Ranch: <span className="font-semibold">{tag.ranches.name}</span>
            </div>
          )}
        </div>

        {/* Attach Form */}
        {!tag.animal_id && (
          <div className="card bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-2 border-blue-700/50">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Attach Tag to Animal</h2>
              
              {/* v1.0: Tag MUST be on-chain before attach */}
              {onChainStatus === 'off-chain' && (
                <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                  <p className="text-yellow-400 font-semibold mb-2">⚠️ Tag Not On-Chain</p>
                  <p className="text-yellow-300 text-sm mb-2">
                    This tag has not been minted on the blockchain yet. Tags must be minted before they can be attached to an animal.
                  </p>
                  {tag.status === 'mint_failed' && (
                    <p className="text-yellow-300 text-sm">
                      The mint failed during batch creation. Please use the <strong>Retry Mint</strong> button in the Super Admin Inventory tab to complete the mint.
                    </p>
                  )}
                  {tag.status !== 'mint_failed' && (
                    <p className="text-yellow-300 text-sm">
                      Please wait for the mint to complete, or contact support if this persists.
                    </p>
                  )}
                </div>
              )}
              
              {onChainStatus === 'on-chain' && (
                <p className="text-[var(--c4)]">
                  This tag is on-chain and ready to be linked to an animal. Fill out the information below to create the animal record.
                </p>
              )}
            </div>

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

            <form onSubmit={handleAttach} className="space-y-4" style={{ opacity: onChainStatus === 'off-chain' ? 0.5 : 1 }}>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Animal Name *
                </label>
                <input
                  type="text"
                  value={formData.animalName}
                  onChange={(e) => setFormData({ ...formData, animalName: e.target.value })}
                  placeholder="e.g., Bessie, Charlie"
                  className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Species *
                  </label>
                  <select
                    value={formData.species}
                    onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                    className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)]"
                    required
                  >
                    <option value="Cattle">Cattle</option>
                    <option value="Sheep">Sheep</option>
                    <option value="Goat">Goat</option>
                    <option value="Pig">Pig</option>
                    <option value="Horse">Horse</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Birth Year
                  </label>
                  <input
                    type="number"
                    value={formData.birthYear}
                    onChange={(e) => setFormData({ ...formData, birthYear: parseInt(e.target.value) || new Date().getFullYear() - 1 })}
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Breed (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    placeholder="e.g., Angus, Hereford"
                    className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Sex (optional)
                  </label>
                  <select
                    value={formData.sex}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                    className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)]"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Castrated">Castrated</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="btn-secondary flex-1"
                  disabled={attaching}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={attaching || !formData.animalName || !formData.species || onChainStatus === 'off-chain'}
                >
                  {attaching ? 'Attaching...' : 'Attach Animal'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
