'use client'

import { useState, useEffect, useCallback } from 'react'
import QRCodeDisplay from '@/components/QRCodeDisplay'
import { getBasescanUrl } from '@/lib/blockchain/ranchLinkTag'
import { getBuildBadgeText } from '@/lib/build-info'

// ── Password Gate ──────────────────────────────────────────────────────────────
function SuperadminLogin({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErr('')
    const res = await fetch('/api/superadmin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    if (res.ok) {
      onAuth()
    } else {
      setErr('Invalid password')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1 text-center">🔒 RanchLink Admin</h1>
        <p className="text-[var(--c4)] text-sm text-center mb-6">Enter your admin password to continue</p>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none"
            autoFocus
          />
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Authenticating...' : 'Enter Factory'}
          </button>
        </form>
      </div>
    </div>
  )
}

interface Batch {
  id: string
  name: string
  batch_name?: string
  count: number
  status: string
  created_at?: string
}

interface Device {
  id: string
  tag_id: string
  tag_code?: string
  claim_token: string
  public_id: string | null
  overlay_qr_url: string // DEPRECATED - v1.0 doesn't use overlay
  base_qr_url: string
  status: string
  token_id?: string | null
  mint_tx_hash?: string | null
  activation_state?: string
  chain?: string
  contract_address?: string | null
  type?: string | null
  model?: string
  color?: string
  batch_name?: string
  batch_date?: string
  code?: string
  material?: string
  metadata?: Record<string, any>
}

const mapDevice = (device: any): Device => {
  const metadata = device.metadata || {}
  const appUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.NEXT_PUBLIC_APP_URL || 'https://ranch-link.vercel.app')
  
  return {
    id: String(device.id ?? metadata.id ?? crypto.randomUUID()),
    tag_id: device.tag_id || device.tag_code,
    tag_code: device.tag_code || device.tag_id,
    claim_token: device.claim_token || '',
    public_id: device.public_id || null,
    token_id: device.token_id || null,
    mint_tx_hash: device.mint_tx_hash || null,
    overlay_qr_url: '', // v1.0: DEPRECATED - always empty, never displayed
    base_qr_url: device.base_qr_url || metadata.base_qr_url || (device.tag_code ? `${appUrl}/t/${device.tag_code}` : ''),
    status: device.status || 'in_inventory',
    activation_state: device.activation_state || 'active',
    chain: device.chain || metadata.chain || 'BASE',
    contract_address: device.contract_address || null,
    material: metadata.material ?? device.material,
    model: metadata.model ?? device.model,
    color: metadata.color ?? device.color,
    batch_name: metadata.batch_name ?? device.batch_name,
    batch_date: metadata.batch_date ?? device.batch_date,
    code: device.code ?? device.serial ?? device.tag_code ?? metadata.code,
    metadata,
  }
}

// ── Assemble Tab ──────────────────────────────────────────────────────────────
function AssembleTab() {
  const [tags, setTags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchAssembleTags = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/superadmin/assemble')
    const data = await res.json()
    setTags(data.tags || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAssembleTags() }, [fetchAssembleTags])

  const handleAction = async (tagId: string, action: 'assemble' | 'ship') => {
    setActionLoading(tagId + action)
    await fetch('/api/superadmin/assemble', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag_id: tagId, action, assembled_by: 'superadmin' }),
    })
    await fetchAssembleTags()
    setActionLoading(null)
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      on_chain_unclaimed: 'bg-blue-900/20 text-blue-400',
      assembled: 'bg-yellow-900/20 text-yellow-400',
      shipped: 'bg-green-900/20 text-green-400',
      attached: 'bg-purple-900/20 text-purple-400',
    }
    return map[status] || 'bg-gray-900/20 text-gray-400'
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">📦 Assemble</h2>
          <p className="text-[var(--c4)] text-sm mt-1">Match QR labels to 3D-printed tags and track shipments</p>
        </div>
        <button onClick={fetchAssembleTags} className="btn-secondary">🔄 Refresh</button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--c2)] mx-auto mb-3" />
          <p className="text-[var(--c4)]">Loading tags...</p>
        </div>
      ) : tags.length === 0 ? (
        <div className="text-center py-12 text-[var(--c4)]">
          <div className="text-5xl mb-4">📭</div>
          <p>No tags ready for assembly. Generate a batch first.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card text-center bg-blue-900/10 border border-blue-700/30">
              <div className="text-3xl font-bold text-blue-400">{tags.filter(t => t.status === 'on_chain_unclaimed').length}</div>
              <div className="text-xs text-[var(--c4)] mt-1">Ready to Assemble</div>
            </div>
            <div className="card text-center bg-yellow-900/10 border border-yellow-700/30">
              <div className="text-3xl font-bold text-yellow-400">{tags.filter(t => t.status === 'assembled').length}</div>
              <div className="text-xs text-[var(--c4)] mt-1">Assembled</div>
            </div>
            <div className="card text-center bg-green-900/10 border border-green-700/30">
              <div className="text-3xl font-bold text-green-400">{tags.filter(t => t.status === 'shipped').length}</div>
              <div className="text-xs text-[var(--c4)] mt-1">Shipped</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-3">Tag Code</th>
                  <th className="text-left py-2 px-3">Token ID</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Assembled</th>
                  <th className="text-left py-2 px-3">Shipped</th>
                  <th className="text-left py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags.map(tag => (
                  <tr key={tag.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2 px-3 font-mono font-bold">{tag.tag_code}</td>
                    <td className="py-2 px-3 font-mono">{tag.token_id ? `#${tag.token_id}` : '—'}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusBadge(tag.status)}`}>
                        {tag.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-xs text-[var(--c4)]">
                      {tag.assembled_at ? new Date(tag.assembled_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-2 px-3 text-xs text-[var(--c4)]">
                      {tag.shipped_at ? new Date(tag.shipped_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-2">
                        {tag.status === 'on_chain_unclaimed' && (
                          <button
                            onClick={() => handleAction(tag.id, 'assemble')}
                            disabled={actionLoading === tag.id + 'assemble'}
                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-xs font-semibold disabled:opacity-50"
                          >
                            {actionLoading === tag.id + 'assemble' ? '...' : '🔧 Assemble'}
                          </button>
                        )}
                        {tag.status === 'assembled' && (
                          <button
                            onClick={() => handleAction(tag.id, 'ship')}
                            disabled={actionLoading === tag.id + 'ship'}
                            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-semibold disabled:opacity-50"
                          >
                            {actionLoading === tag.id + 'ship' ? '...' : '🚚 Ship'}
                          </button>
                        )}
                        {tag.status === 'shipped' && (
                          <span className="text-green-400 text-xs">✅ Shipped</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default function SuperAdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<'factory' | 'assemble' | 'dashboard' | 'inventory'>('factory')

  const [devices, setDevices] = useState<Device[]>([])
  const [selectedBatch, setSelectedBatch] = useState<string>('')
  const [batches, setBatches] = useState<Batch[]>([])
  const [isLoadingDevices, setIsLoadingDevices] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Factory form state
  const [batchSize, setBatchSize] = useState(3)
  const [material, setMaterial] = useState('PETG')
  const [model, setModel] = useState('BASIC_QR')
  const [chain, setChain] = useState('BASE')
  const [color, setColor] = useState('Mesquite')
  const [batchName, setBatchName] = useState('')
  const [batchDate, setBatchDate] = useState<string>(new Date().toISOString().slice(0, 10))

  // Latest batch state
  const [latestBatch, setLatestBatch] = useState<{
    id: string
    name: string
    tags: Device[]
    created_at: string
  } | null>(null)

  const fetchDevices = useCallback(async () => {
    setIsLoadingDevices(true)
    setErrorMessage(null)
    try {
      const response = await fetch('/api/superadmin/devices')
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load devices')
      }
      setDevices(data.devices.map(mapDevice))
    } catch (error: any) {
      console.error(error)
      setErrorMessage(error.message)
    } finally {
      setIsLoadingDevices(false)
    }
  }, [])

  // Check cookie auth on mount
  useEffect(() => {
    const hasCookie = document.cookie.includes('rl_superadmin')
    setAuthed(hasCookie)
  }, [])

  // Fetch devices only after authenticated
  useEffect(() => {
    if (authed) fetchDevices()
  }, [authed, fetchDevices])

  if (authed === null) {
    return <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--c2)]" />
    </div>
  }

  if (!authed) {
    return <SuperadminLogin onAuth={() => setAuthed(true)} />
  }

  const handleGenerate = async () => {
    setIsSaving(true)
    setMessage(null)
    setErrorMessage(null)

    try {
      // Call v1.0 factory endpoint
      const response = await fetch('/api/factory/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchName: batchName || `Batch ${new Date().toISOString().slice(0, 10)}`,
          batchSize,
          model,
          material,
          color,
          chain: 'BASE',
          targetRanchId: null,
          kitMode: false,
          kitSize: null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate batch')
      }

      const data = await response.json()
      
      // v1.0: Only successfully minted tags are returned in data.tags
      // Failed tags are NOT included - they're in DB but marked as 'mint_failed'
      
      // Map response tags to Device format for UI compatibility
      const mappedDevices = data.tags.map((tag: any) => ({
        id: tag.id,
        tag_id: tag.tag_code,
        tag_code: tag.tag_code,
        public_id: tag.public_id || null,
        token_id: tag.token_id, // v1.0: This should ALWAYS exist if tag is in response
        mint_tx_hash: tag.mint_tx_hash,
        base_qr_url: tag.base_qr_url,
        overlay_qr_url: '', // v1.0: DEPRECATED - always empty
        claim_token: '', // v1.0: DEPRECATED - always empty
        status: tag.status || 'on_chain_unclaimed', // v1.0: Should be 'on_chain_unclaimed' for new tags
        activation_state: tag.activation_state || 'active',
        chain: tag.chain || 'BASE',
        contract_address: tag.contract_address, // v1.0: This should ALWAYS exist
        material,
        model,
        color,
        batch_name: batchName || data.batch.name,
        batch_date: batchDate,
        code: tag.tag_code,
      }))

      // Set latest batch
      setLatestBatch({
        id: data.batch.id,
        name: data.batch.name || batchName,
        tags: mappedDevices,
        created_at: new Date().toISOString(),
      })

      // Set devices immediately so QR codes show up right away
      setDevices(mappedDevices)
      
      // Refresh from server to get latest data (including any failed tags)
      await fetchDevices()
      
      // v1.0: Use mint_summary from API response
      const successfulMints = data.mint_summary?.successful || 0
      const failedMints = data.mint_summary?.failed || 0
      const totalRequested = data.mint_summary?.total || batchSize
      
      // Show message based on API response
      let message = data.message || ''
      
      // If API provided warnings, show them
      if (data.warnings && data.warnings.length > 0) {
        message += '\n\n' + data.warnings.join('\n')
      }
      
      // If pre-flight checks failed, show them
      if (data.preflight_checks) {
        message += '\n\nPre-flight checks:\n' + data.preflight_checks.join('\n')
      }
      
      // If there are errors, show them
      if (data.errors && data.errors.length > 0) {
        message += '\n\nErrors:\n' + data.errors.join('\n')
      }
      
      setMessage(message)
      
      // Show error if all mints failed
      if (failedMints === totalRequested && successfulMints === 0) {
        setErrorMessage(`All ${totalRequested} tags failed to mint. Check server wallet balance, RPC connection, and MINTER_ROLE. See logs in Vercel for details.`)
      }
      
      // Scroll to QR codes section after a brief delay
      setTimeout(() => {
        const qrSection = document.getElementById('qr-codes-section')
        if (qrSection) {
          qrSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 300)
    } catch (error: any) {
      console.error('Generate error:', error)
      let errorMsg = error.message || 'Failed to generate batch'
      
      // Detailed error handling for fetch failures
      if (error.message?.includes('fetch failed') || error.message?.includes('Network') || error.name === 'TypeError') {
        errorMsg = `Network error: Could not connect to server.\n\n` +
          `Possible causes:\n` +
          `1. API endpoint not deployed: /api/factory/batches\n` +
          `2. Missing environment variables in Vercel\n` +
          `3. Server timeout or crash\n\n` +
          `Check:\n` +
          `- Vercel deployment status\n` +
          `- Environment variables (SERVER_WALLET_PRIVATE_KEY, RANCHLINKTAG_ADDRESS, etc.)\n` +
          `- Vercel logs for errors\n\n` +
          `Try: https://ranch-link.vercel.app/api/health`
      }
      
      setErrorMessage(errorMsg)
    } finally {
      setIsSaving(false)
    }
  }

  const getOnChainStatus = (device: Device): 'on-chain' | 'off-chain' | 'error' => {
    if (device.token_id && device.contract_address) {
      return 'on-chain'
    } else if (!device.token_id) {
      return 'off-chain'
    } else {
      return 'error'
    }
  }

  const tabs = [
    { id: 'factory', label: '🏭 Factory' },
    { id: 'assemble', label: '📦 Assemble' },
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'inventory', label: '🗂️ Inventory' },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg)] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold mb-2">RanchLink Factory</h1>
              <p className="text-[var(--c4)]">Generate blockchain-linked tags for production</p>
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

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[var(--c2)] text-[var(--c2)]'
                  : 'border-transparent text-[var(--c4)] hover:text-[var(--c2)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Factory Tab - v1.0 */}
        {activeTab === 'factory' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">🏭 Factory - Generate & Mint Tags</h2>
              <p className="text-[var(--c4)] mb-6">
                Generate blockchain-linked tags for production. Tags are pre-minted on Base Mainnet and ready for printing.
              </p>

              {/* Batch Creation Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-6 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] border-2 border-[var(--c2)]/20 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">Batch Size</label>
                  <input
                    type="number"
                    value={batchSize === 0 ? '' : batchSize}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '') {
                        setBatchSize(0)
                        return
                      }
                      const parsed = parseInt(value, 10)
                      if (Number.isFinite(parsed) && parsed >= 0) {
                        setBatchSize(parsed)
                      }
                    }}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none bg-white text-gray-900"
                    min="1"
                    placeholder="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Material</label>
                  <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none bg-white text-gray-900" value={material} onChange={e=>setMaterial(e.target.value)}>
                    <option>PETG</option>
                    <option>PLA</option>
                    <option>ABS</option>
                    <option>TPU</option>
                    <option>CARBON_FIBER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Model</label>
                  <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none bg-white text-gray-900" value={model} onChange={e=>setModel(e.target.value)}>
                    <option value="BASIC_QR">BASIC_QR (Original)</option>
                    <option value="BOOTS_ON">BOOTS_ON (Medium)</option>
                    <option value="CYBER_COWBOY">CYBER_COWBOY (Medium+)</option>
                    <option value="SPACE_COWBOY">SPACE_COWBOY (Pro)</option>
                    <option value="BIG_WESTERN">BIG_WESTERN (R&D)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Blockchain</label>
                  <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none bg-white text-gray-900" value={chain} onChange={e=>setChain(e.target.value)} disabled>
                    <option>BASE</option>
                  </select>
                  <p className="text-xs text-[var(--c4)] mt-1">Base Mainnet (v1.0)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none bg-white text-gray-900"
                    value={color}
                    onChange={e=>setColor(e.target.value)}
                    placeholder="Mesquite"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Batch Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none bg-white text-gray-900"
                    value={batchName}
                    onChange={e=>setBatchName(e.target.value)}
                    placeholder="Austin Run 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Batch Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none bg-white text-gray-900"
                    value={batchDate}
                    onChange={e=>setBatchDate(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleGenerate}
                    className={`btn-primary w-full ${isSaving ? 'opacity-60' : ''}`}
                    disabled={isSaving || batchSize <= 0}
                  >
                    {isSaving ? '🔄 Generating & Minting...' : '🚀 Generate & Mint Tags'}
                  </button>
                </div>
              </div>

              {message && (
                <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-2 border-green-700/50 text-green-300 px-6 py-4 rounded-lg mb-6 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">✅</div>
                    <div className="flex-1">
                      <div className="font-semibold text-lg mb-1">Success!</div>
                      <div className="text-sm">{message}</div>
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="bg-gradient-to-r from-red-900/30 to-rose-900/30 border-2 border-red-700/50 text-red-300 px-6 py-4 rounded-lg mb-6 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">❌</div>
                    <div className="flex-1">
                      <div className="font-semibold text-lg mb-1">Error</div>
                      <div className="text-sm">{errorMessage}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Latest Batch Panel */}
              {latestBatch && (
                <div className="card mb-6 bg-gradient-to-br from-blue-900/10 to-purple-900/10 border-2 border-blue-700/30">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">Latest Batch: {latestBatch.name}</h3>
                      <p className="text-sm text-[var(--c4)]">
                        Created: {new Date(latestBatch.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[var(--c2)]">{latestBatch.tags.length}</div>
                      <div className="text-xs text-[var(--c4)]">tags</div>
                    </div>
                  </div>

                  {/* Tags Table */}
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-2 px-3">Tag Code</th>
                          <th className="text-left py-2 px-3">Token ID</th>
                          <th className="text-left py-2 px-3">Contract</th>
                          <th className="text-left py-2 px-3">Chain</th>
                          <th className="text-left py-2 px-3">Status</th>
                          <th className="text-left py-2 px-3">On-Chain</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestBatch.tags.map((tag) => {
                          const onChainStatus = getOnChainStatus(tag)
                          return (
                            <tr key={tag.id} className="border-b border-white/5 hover:bg-white/5">
                              <td className="py-2 px-3 font-mono font-semibold">{tag.tag_code}</td>
                              <td className="py-2 px-3">
                                {tag.token_id ? (
                                  <span className="font-mono">#{tag.token_id}</span>
                                ) : (
                                  <span className="text-yellow-400">Pending</span>
                                )}
                              </td>
                              <td className="py-2 px-3">
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
                              <td className="py-2 px-3">{tag.chain || 'BASE'}</td>
                              <td className="py-2 px-3">
                                <span className="capitalize">{tag.status?.replace(/_/g, ' ')}</span>
                              </td>
                              <td className="py-2 px-3">
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
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {devices.length > 0 && (() => {
                // CRITICAL: Only show tags that are ON-CHAIN (have token_id) for printing
                // Tags without token_id should NOT be printed - they're not functional
                const readyToPrint = devices.filter(d => d.token_id !== null && d.token_id !== undefined)
                const pendingMint = devices.filter(d => !d.token_id || d.token_id === null)
                
                return (
                  <div id="qr-codes-section" className="mb-6">
                    {/* Warning for tags that failed mint */}
                    {pendingMint.length > 0 && (
                      <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                        <p className="text-yellow-400 font-semibold mb-2">⚠️ {pendingMint.length} tag(s) not ready for printing</p>
                        <p className="text-yellow-300 text-sm mb-2">
                          These tags failed to mint and cannot be printed yet. They must be on-chain (have a Token ID) before printing.
                        </p>
                        <p className="text-yellow-300 text-sm">
                          Use the <strong>Retry Mint</strong> button in the Inventory tab to complete the mint, then return here to print.
                        </p>
                        <div className="mt-2 text-xs text-yellow-400 font-mono">
                          Tags: {pendingMint.map(d => d.tag_code).join(', ')}
                        </div>
                      </div>
                    )}

                    {/* Only show printing section if there are tags ready */}
                    {readyToPrint.length > 0 && (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-lg font-semibold">
                            {readyToPrint.length} tag(s) ready for printing
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => window.print()}
                              className="btn-secondary"
                            >
                              🖨️ Print All ({readyToPrint.length})
                            </button>
                          </div>
                        </div>

                        {/* QR Codes Grid - Production Sticker Layout */}
                        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-3">
                          {readyToPrint.map((device) => {
                            const onChainStatus = getOnChainStatus(device)
                            return (
                              <div
                                key={device.id}
                                className="border-2 border-white/20 rounded-lg p-4 bg-[var(--bg-card)] print:border-2 print:border-black print:bg-white"
                              >
                                {/* Sticker Header - Production Info */}
                                <div className="text-center mb-4 space-y-2 print:text-left">
                                  <div className="font-mono font-bold text-xl border-b-2 border-[var(--c2)] pb-2">
                                    Tag ID: {device.tag_code || device.tag_id}
                                  </div>
                                  <div className={`text-base font-bold ${device.token_id ? 'text-green-600' : 'text-yellow-600'}`}>
                                    Token ID: {device.token_id ? `#${device.token_id}` : '❌ NOT READY'}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Animal ID: {device.public_id || 'Not attached'}
                                  </div>
                                  {device.chain && (
                                    <div className="text-xs text-gray-500 font-semibold">
                                      {device.chain} Mainnet
                                    </div>
                                  )}
                                </div>

                                {/* QR Code - Points to /t/[tag_code] */}
                                <div className="mb-4">
                                  <div className="text-xs font-semibold mb-2 text-center bg-gradient-to-r from-[var(--c2)] to-[var(--c3)] text-white px-2 py-1 rounded">
                                    QR Code (30mm × 30mm)
                                  </div>
                                  <div className="bg-white p-2 rounded border-4 border-[var(--c2)] flex justify-center print:border-2 print:border-black">
                                    <QRCodeDisplay url={device.base_qr_url} size={150} />
                                  </div>
                                  <div className="text-xs text-[var(--c4)] mt-2 text-center break-all">
                                    {device.base_qr_url}
                                  </div>
                                </div>

                                {/* On-chain Status Indicator - Prominent */}
                                <div className="mt-3 mb-3">
                                  {onChainStatus === 'on-chain' ? (
                                    <div className="text-center">
                                      <div className="inline-block bg-green-900/30 border-2 border-green-600 text-green-300 px-4 py-2 rounded-lg text-sm font-bold">
                                        ✅ ON-CHAIN
                                      </div>
                                      {device.contract_address && (
                                        <div className="text-[9px] text-gray-500 mt-1 break-all">
                                          {device.contract_address.substring(0, 10)}...{device.contract_address.substring(device.contract_address.length - 8)}
                                        </div>
                                      )}
                                    </div>
                                  ) : onChainStatus === 'off-chain' ? (
                                    <div className="text-center">
                                      <div className="inline-block bg-yellow-900/30 border-2 border-yellow-600 text-yellow-300 px-4 py-2 rounded-lg text-sm font-bold">
                                        ⚪ OFF-CHAIN
                                      </div>
                                      <div className="text-[9px] text-gray-500 mt-1">
                                        Mint Pending
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center">
                                      <div className="inline-block bg-red-900/30 border-2 border-red-600 text-red-300 px-4 py-2 rounded-lg text-sm font-bold">
                                        🔴 ERROR
                                      </div>
                                      <div className="text-[9px] text-gray-500 mt-1">
                                        Mint Failed
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Metadata Footer */}
                                <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-600 mt-2 border-t pt-2">
                                  {device.material && <div><strong>Material:</strong> {device.material}</div>}
                                  {device.model && <div><strong>Model:</strong> {device.model}</div>}
                                  {device.chain && <div><strong>Chain:</strong> {device.chain}</div>}
                                  {device.color && <div><strong>Color:</strong> {device.color}</div>}
                                  {device.batch_name && (
                                    <div className="col-span-2"><strong>Batch:</strong> {device.batch_name}</div>
                                  )}
                                  {device.mint_tx_hash && (
                                    <div className="col-span-2 text-[9px] break-all">
                                      <strong>TX:</strong> {device.mint_tx_hash.substring(0, 20)}...
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}

                    {/* Message if no tags are ready */}
                    {readyToPrint.length === 0 && (
                      <div className="text-center py-8 p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                        <p className="text-red-400 font-semibold mb-2">❌ No tags ready for printing</p>
                        <p className="text-red-300 text-sm">
                          All {devices.length} tag(s) failed to mint. Complete the mint process first before printing.
                        </p>
                        <p className="text-red-300 text-sm mt-2">
                          Go to <strong>Inventory</strong> tab and use <strong>Retry Mint</strong> for each tag.
                        </p>
                      </div>
                    )}
                  </div>
                )
              })()}

              {devices.length === 0 && !isSaving && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏭</div>
                  <h3 className="text-xl font-bold mb-2">Factory - Ready to Generate Tags</h3>
                  <p className="text-[var(--c4)] mb-6">
                    Configure your batch settings above and click "Generate & Mint Tags" to create blockchain-linked tags on Base Mainnet.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assemble Tab */}
        {activeTab === 'assemble' && <AssembleTab />}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Factory Dashboard</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="card text-center">
                <div className="text-4xl font-bold text-[var(--c2)] mb-2">{devices.length}</div>
                <div className="text-sm text-gray-600">Total Tags</div>
              </div>
              <div className="card text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {devices.filter(d => d.token_id).length}
                </div>
                <div className="text-sm text-gray-600">On-Chain</div>
              </div>
              <div className="card text-center">
                <div className="text-4xl font-bold text-yellow-600 mb-2">
                  {devices.filter(d => !d.token_id).length}
                </div>
                <div className="text-sm text-gray-600">Pending Mint</div>
              </div>
              <div className="card text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {devices.filter(d => d.public_id).length}
                </div>
                <div className="text-sm text-gray-600">Attached</div>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Tag Inventory</h2>
              <button onClick={fetchDevices} className="btn-secondary">
                🔄 Refresh
              </button>
            </div>
            {isLoadingDevices ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--c2)] mx-auto mb-2"></div>
                <p className="text-[var(--c4)]">Loading...</p>
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-8 text-[var(--c4)]">
                No tags in inventory. Generate a batch to get started.
              </div>
            ) : (
              <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-3">Tag Code</th>
                      <th className="text-left py-2 px-3">Token ID</th>
                      <th className="text-left py-2 px-3">Status</th>
                      <th className="text-left py-2 px-3">On-Chain</th>
                      <th className="text-left py-2 px-3">Animal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((device) => {
                      const onChainStatus = getOnChainStatus(device)
                      return (
                        <tr key={device.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-2 px-3 font-mono font-semibold">{device.tag_code || device.tag_id}</td>
                          <td className="py-2 px-3">
                            {device.token_id ? (
                              <span className="font-mono">#{device.token_id}</span>
                            ) : (
                              <span className="text-yellow-400">Pending</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <span className="capitalize">{device.status?.replace(/_/g, ' ')}</span>
                          </td>
                          <td className="py-2 px-3">
                            {onChainStatus === 'on-chain' && (
                              <span className="px-2 py-1 bg-green-900/20 text-green-400 rounded text-xs font-semibold">
                                ✅ ON-CHAIN
                              </span>
                            )}
                            {onChainStatus === 'off-chain' && (
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-yellow-900/20 text-yellow-400 rounded text-xs font-semibold">
                                  ⚪ OFF-CHAIN
                                </span>
                                <button
                                  onClick={async (e) => {
                                    // First try to sync (check if transaction already completed)
                                    const button = e.currentTarget
                                    const originalText = button.textContent
                                    button.disabled = true
                                    button.textContent = '🔄 Syncing...'
                                    
                                    try {
                                      // Try sync first (in case transaction completed but DB wasn't updated)
                                      const syncResponse = await fetch('/api/sync-tag', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ tagCode: device.tag_code }),
                                      })
                                      const syncData = await syncResponse.json()
                                      
                                      if (syncData.success && syncData.token_id) {
                                        // Sync successful - transaction was already completed
                                        alert(`✅ Tag synced!\n\nToken ID: #${syncData.token_id}\nTransaction: ${syncData.mint_tx_hash}\n\nView on Basescan: ${syncData.basescan_url}`)
                                        fetchDevices()
                                        return
                                      }
                                      
                                      // Sync didn't work, try mint
                                      if (!confirm(`Retry mint for ${device.tag_code}?\n\nThis will attempt to mint the NFT on Base Mainnet.`)) {
                                        button.disabled = false
                                        button.textContent = originalText
                                        return
                                      }
                                      
                                      button.textContent = '⏳ Minting...'
                                      
                                      const response = await fetch('/api/retry-mint', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ tagCode: device.tag_code }),
                                      })
                                      const data = await response.json()
                                      
                                      if (data.success) {
                                        // Show success with details
                                        const message = `✅ Mint Successful!\n\nToken ID: #${data.token_id}\nTransaction: ${data.mint_tx_hash}\n\nView on Basescan: ${data.basescan_url}`
                                        alert(message)
                                        fetchDevices()
                                      } else {
                                        // Show detailed error
                                        let errorMsg = `❌ Mint Failed\n\nError: ${data.message || data.error}\n`
                                        if (data.error_code) {
                                          errorMsg += `Code: ${data.error_code}\n\n`
                                        }
                                        if (data.checks && Array.isArray(data.checks)) {
                                          errorMsg += 'Checks:\n' + data.checks.join('\n') + '\n\n'
                                        }
                                        if (data.errors && Array.isArray(data.errors)) {
                                          errorMsg += 'Errors:\n' + data.errors.join('\n')
                                        }
                                        alert(errorMsg)
                                      }
                                    } catch (err: any) {
                                      alert(`❌ Network Error: ${err.message}\n\nPlease check your connection and try again.`)
                                    } finally {
                                      button.disabled = false
                                      if (button.textContent !== null) {
                                        button.textContent = originalText
                                      }
                                    }
                                  }}
                                  className="px-2 py-1 bg-[var(--c2)] text-white rounded text-xs hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                  title="Retry mint for this tag"
                                >
                                  🔄 Retry Mint
                                </button>
                              </div>
                            )}
                            {onChainStatus === 'error' && (
                              <span className="px-2 py-1 bg-red-900/20 text-red-400 rounded text-xs font-semibold">
                                🔴 ERROR
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {device.public_id ? (
                              <a href={`/a/${device.public_id}`} className="text-[var(--c2)] hover:underline">
                                {device.public_id}
                              </a>
                            ) : (
                              <span className="text-gray-500">Not attached</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* QR Print Section — on-chain tags only */}
              {(() => {
                const printable = devices.filter(d => d.token_id)
                if (printable.length === 0) return null
                return (
                  <div className="mt-8 border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold">🖨️ QR Codes — Ready to Print ({printable.length})</h3>
                      <button onClick={() => window.print()} className="btn-secondary">
                        🖨️ Print All ({printable.length})
                      </button>
                    </div>
                    <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-3">
                      {printable.map((device) => (
                        <div key={device.id} className="border-2 border-white/20 rounded-lg p-3 bg-[var(--bg-card)] print:border-2 print:border-black print:bg-white">
                          <div className="text-center mb-2">
                            <div className="font-mono font-bold text-base border-b border-[var(--c2)] pb-1 mb-1">
                              {device.tag_code}
                            </div>
                            <div className="text-green-400 text-xs font-semibold">Token #{device.token_id}</div>
                            {device.public_id && <div className="text-xs text-[var(--c4)]">{device.public_id}</div>}
                          </div>
                          <div className="bg-white p-2 rounded flex justify-center">
                            <QRCodeDisplay url={device.base_qr_url} size={130} />
                          </div>
                          <div className="text-[10px] text-[var(--c4)] mt-1 text-center break-all">{device.base_qr_url}</div>
                          {device.batch_name && (
                            <div className="text-[10px] text-[var(--c4)] text-center mt-1">Batch: {device.batch_name}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
