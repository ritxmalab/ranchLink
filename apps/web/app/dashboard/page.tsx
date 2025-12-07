'use client'

import { useEffect, useState } from 'react'
import { getBasescanUrl } from '@/lib/blockchain/ranchLinkTag'
import { getBuildBadgeText } from '@/lib/build-info'

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

interface Tag {
  tag_code: string
  token_id: string | null
  chain: string
  contract_address: string | null
  status: string
  activation_state: string
  animal_id: string | null
  animals?: {
    public_id: string
    name: string
  }
}

interface DashboardStats {
  totalAnimals: number
  activeAnimals: number
  inactiveAnimals: number
  totalTags: number
  tagsInInventory: number
  tagsAssigned: number
  tagsAttached: number
  tagsRetired: number
  tagsOnChain: number
  tagsOffChain: number
}

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<'animals' | 'inventory'>('animals')
  const [animals, setAnimals] = useState<Animal[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalAnimals: 0,
    activeAnimals: 0,
    inactiveAnimals: 0,
    totalTags: 0,
    tagsInInventory: 0,
    tagsAssigned: 0,
    tagsAttached: 0,
    tagsRetired: 0,
    tagsOnChain: 0,
    tagsOffChain: 0,
  })
  const [loading, setLoading] = useState(true)
  
  // Filters for inventory view
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activationFilter, setActivationFilter] = useState<string>('all')
  const [onChainFilter, setOnChainFilter] = useState<string>('all')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // TODO: Get current user's ranch_id from Supabase Auth
      // For now, we'll fetch all animals (will be filtered by ranch_id in production)
      // TODO: LastBurner / Non-custodial Support
      // - Dashboard should show on-chain owner (server wallet for custodial, Burner address for non-custodial)
      // - Liquidity flows (USDC, sales) can be displayed per owner address
      const animalsResponse = await fetch('/api/dashboard/animals')
      const tagsResponse = await fetch('/api/dashboard/tags')
      
      const animalsData = await animalsResponse.json()
      const tagsData = await tagsResponse.json()
      
      if (animalsData.animals) {
        setAnimals(animalsData.animals)
      }
      
      if (tagsData.tags) {
        setTags(tagsData.tags)
      }
      
      // Calculate stats
      const calculatedStats = calculateStats(animalsData.animals || [], tagsData.tags || [])
      setStats(calculatedStats)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (animalsList: Animal[], tagsList: Tag[]): DashboardStats => {
    const activeAnimals = animalsList.filter(a => a.status === 'active').length
    const inactiveAnimals = animalsList.filter(a => a.status !== 'active').length
    
    const tagsInInventory = tagsList.filter(t => t.status === 'in_inventory').length
    const tagsAssigned = tagsList.filter(t => t.status === 'assigned').length
    const tagsAttached = tagsList.filter(t => t.status === 'attached').length
    const tagsRetired = tagsList.filter(t => t.status === 'retired').length
    const tagsOnChain = tagsList.filter(t => t.token_id && t.contract_address).length
    const tagsOffChain = tagsList.filter(t => !t.token_id).length
    
    return {
      totalAnimals: animalsList.length,
      activeAnimals,
      inactiveAnimals,
      totalTags: tagsList.length,
      tagsInInventory,
      tagsAssigned,
      tagsAttached,
      tagsRetired,
      tagsOnChain,
      tagsOffChain,
    }
  }

  const getOnChainStatus = (tag: Tag | { token_id: string | null; contract_address: string | null }): 'on-chain' | 'off-chain' | 'error' => {
    if (tag.token_id && tag.contract_address) {
      return 'on-chain'
    } else if (!tag.token_id) {
      return 'off-chain'
    } else {
      return 'error'
    }
  }

  const filteredTags = tags.filter(tag => {
    if (statusFilter !== 'all' && tag.status !== statusFilter) return false
    if (activationFilter !== 'all' && tag.activation_state !== activationFilter) return false
    if (onChainFilter !== 'all') {
      const onChainStatus = getOnChainStatus(tag)
      if (onChainFilter === 'on-chain' && onChainStatus !== 'on-chain') return false
      if (onChainFilter === 'off-chain' && onChainStatus !== 'off-chain') return false
      if (onChainFilter === 'error' && onChainStatus !== 'error') return false
    }
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--c2)] mx-auto mb-4"></div>
          <p className="text-[var(--c4)]">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold mb-2">My Ranch Dashboard</h1>
              <p className="text-[var(--c4)]">Manage your animals, tags, and blockchain assets</p>
            </div>
            <div className="text-right">
              <div className="bg-[var(--bg-card)] border-2 border-[var(--c2)]/50 px-4 py-2 rounded-lg shadow-lg">
                <div className="text-sm font-bold text-[var(--c2)] font-mono">
                  {getBuildBadgeText()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* High-Level Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-[var(--c2)] mb-1">
              {stats.totalAnimals}
            </div>
            <div className="text-sm text-[var(--c4)]">Total Animals</div>
            {stats.inactiveAnimals > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {stats.activeAnimals} active, {stats.inactiveAnimals} inactive
              </div>
            )}
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {stats.activeAnimals}
            </div>
            <div className="text-sm text-[var(--c4)]">Active Animals</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {stats.totalTags}
            </div>
            <div className="text-sm text-[var(--c4)]">Total Tags</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-[var(--c3)] mb-1">
              {stats.tagsOnChain}
            </div>
            <div className="text-sm text-[var(--c4)]">On-Chain Tags</div>
            {stats.tagsOffChain > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {stats.tagsOffChain} pending
              </div>
            )}
          </div>
        </div>

        {/* Tags Status Breakdown */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="text-2xl font-bold text-gray-400 mb-1">
              {stats.tagsInInventory}
            </div>
            <div className="text-sm text-[var(--c4)]">In Inventory</div>
          </div>
          <div className="card">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {stats.tagsAssigned}
            </div>
            <div className="text-sm text-[var(--c4)]">Assigned</div>
          </div>
          <div className="card">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {stats.tagsAttached}
            </div>
            <div className="text-sm text-[var(--c4)]">Attached</div>
          </div>
          <div className="card">
            <div className="text-2xl font-bold text-gray-500 mb-1">
              {stats.tagsRetired}
            </div>
            <div className="text-sm text-[var(--c4)]">Retired</div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveView('animals')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeView === 'animals'
                ? 'border-[var(--c2)] text-[var(--c2)]'
                : 'border-transparent text-[var(--c4)] hover:text-[var(--c2)]'
            }`}
          >
            Animals View
          </button>
          <button
            onClick={() => setActiveView('inventory')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeView === 'inventory'
                ? 'border-[var(--c2)] text-[var(--c2)]'
                : 'border-transparent text-[var(--c4)] hover:text-[var(--c2)]'
            }`}
          >
            Tag Inventory
          </button>
        </div>

        {/* Animals View */}
        {activeView === 'animals' && (
          <div className="space-y-4">
            {animals.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-6xl mb-4">🐄</div>
                <h3 className="text-xl font-bold mb-2">No Animals Yet</h3>
                <p className="text-[var(--c4)] mb-6">
                  Scan a tag QR code to attach it to an animal and get started.
                </p>
                <a href="/superadmin" className="btn-primary">
                  Generate Tags
                </a>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {animals.map((animal) => {
                  const tag = animal.tags && animal.tags.length > 0 ? animal.tags[0] : null
                  const onChainStatus = tag ? getOnChainStatus(tag) : null
                  const age = animal.birth_year ? new Date().getFullYear() - animal.birth_year : null
                  
                  return (
                    <a
                      key={animal.id}
                      href={`/a/${animal.public_id}`}
                      className="card hover:border-[var(--c2)] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-1">{animal.name}</h3>
                          <p className="text-sm text-[var(--c4)] font-mono">{animal.public_id}</p>
                        </div>
                        <div className="w-16 h-16 bg-gradient-to-br from-[var(--c2)] to-[var(--c3)] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                          {(animal.name || 'A').charAt(0).toUpperCase()}
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--c4)]">Species:</span>
                          <span className="font-semibold">{animal.species}</span>
                        </div>
                        {animal.breed && (
                          <div className="flex justify-between text-sm">
                            <span className="text-[var(--c4)]">Breed:</span>
                            <span className="font-semibold">{animal.breed}</span>
                          </div>
                        )}
                        {animal.sex && (
                          <div className="flex justify-between text-sm">
                            <span className="text-[var(--c4)]">Sex:</span>
                            <span className="font-semibold capitalize">{animal.sex}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--c4)]">Status:</span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              animal.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {animal.status}
                          </span>
                        </div>
                      </div>
                      
                      {tag && (
                        <div className="pt-4 border-t border-gray-200 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--c4)]">Tag:</span>
                            <span className="font-mono font-semibold">{tag.tag_code}</span>
                          </div>
                          {tag.token_id && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[var(--c4)]">Token ID:</span>
                              <span className="font-mono">#{tag.token_id}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--c4)]">On-chain:</span>
                            {onChainStatus === 'on-chain' ? (
                              <span className="px-2 py-1 bg-green-900/20 text-green-400 rounded text-xs font-semibold">
                                ✅ ON-CHAIN
                              </span>
                            ) : onChainStatus === 'off-chain' ? (
                              <span className="px-2 py-1 bg-yellow-900/20 text-yellow-400 rounded text-xs font-semibold">
                                ⚪ OFF-CHAIN
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-900/20 text-red-400 rounded text-xs font-semibold">
                                🔴 ERROR
                              </span>
                            )}
                          </div>
                          {tag.token_id && tag.contract_address && (
                            <a
                              href={getBasescanUrl(BigInt(tag.token_id))}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[var(--c2)] hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View on Basescan →
                            </a>
                          )}
                        </div>
                      )}
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Inventory View */}
        {activeView === 'inventory' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="card">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none bg-white text-gray-900"
                  >
                    <option value="all">All Status</option>
                    <option value="in_inventory">In Inventory</option>
                    <option value="assigned">Assigned</option>
                    <option value="attached">Attached</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Activation</label>
                  <select
                    value={activationFilter}
                    onChange={(e) => setActivationFilter(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none bg-white text-gray-900"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">On-Chain Status</label>
                  <select
                    value={onChainFilter}
                    onChange={(e) => setOnChainFilter(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none bg-white text-gray-900"
                  >
                    <option value="all">All</option>
                    <option value="on-chain">On-Chain</option>
                    <option value="off-chain">Off-Chain</option>
                    <option value="error">Error</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tags Table */}
            {filteredTags.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-bold mb-2">No Tags Found</h3>
                <p className="text-[var(--c4)] mb-6">
                  {tags.length === 0 
                    ? 'No tags in inventory. Generate a batch to get started.'
                    : 'No tags match the current filters.'}
                </p>
                {tags.length === 0 && (
                  <a href="/superadmin" className="btn-primary">
                    Generate Tags
                  </a>
                )}
              </div>
            ) : (
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4">Tag Code</th>
                      <th className="text-left py-3 px-4">Token ID</th>
                      <th className="text-left py-3 px-4">Chain</th>
                      <th className="text-left py-3 px-4">Contract</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Activation</th>
                      <th className="text-left py-3 px-4">Attached Animal</th>
                      <th className="text-left py-3 px-4">On-Chain</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTags.map((tag) => {
                      const onChainStatus = getOnChainStatus(tag)
                      return (
                        <tr key={tag.tag_code} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-4 font-mono font-semibold">{tag.tag_code}</td>
                          <td className="py-3 px-4">
                            {tag.token_id ? (
                              <span className="font-mono">#{tag.token_id}</span>
                            ) : (
                              <span className="text-yellow-400">Pending</span>
                            )}
                          </td>
                          <td className="py-3 px-4">{tag.chain || 'BASE'}</td>
                          <td className="py-3 px-4">
                            {tag.contract_address ? (
                              <a
                                href={`https://basescan.org/address/${tag.contract_address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--c2)] hover:underline text-xs"
                              >
                                {tag.contract_address.substring(0, 6)}...{tag.contract_address.substring(tag.contract_address.length - 4)}
                              </a>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="capitalize">{tag.status?.replace(/_/g, ' ')}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="capitalize">{tag.activation_state || 'active'}</span>
                          </td>
                          <td className="py-3 px-4">
                            {tag.animals ? (
                              <a href={`/a/${tag.animals.public_id}`} className="text-[var(--c2)] hover:underline">
                                {tag.animals.name} ({tag.animals.public_id})
                              </a>
                            ) : (
                              <span className="text-gray-500">Not attached</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {onChainStatus === 'on-chain' && (
                              <span className="px-2 py-1 bg-green-900/20 text-green-400 rounded text-xs font-semibold">
                                ✅ ON-CHAIN
                              </span>
                            )}
                            {onChainStatus === 'off-chain' && (
                              <span className="px-2 py-1 bg-yellow-900/20 text-yellow-400 rounded text-xs font-semibold">
                                ⚪ OFF-CHAIN
                              </span>
                            )}
                            {onChainStatus === 'error' && (
                              <span className="px-2 py-1 bg-red-900/20 text-red-400 rounded text-xs font-semibold">
                                🔴 ERROR
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <a
                                href={`/t/${tag.tag_code}`}
                                className="text-[var(--c2)] hover:underline text-xs"
                              >
                                View
                              </a>
                              {tag.token_id && tag.contract_address && (
                                <a
                                  href={getBasescanUrl(BigInt(tag.token_id))}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[var(--c2)] hover:underline text-xs"
                                >
                                  Basescan
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
