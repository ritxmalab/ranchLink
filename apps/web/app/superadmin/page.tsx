'use client'

import { useState, useEffect } from 'react'
import QRCodeDisplay from '@/components/QRCodeDisplay'
import { getBasescanUrl } from '@/lib/blockchain/ranchLinkTag'

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
    overlay_qr_url: '', // v1.0 doesn't use overlay - always empty
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

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'batches' | 'inventory' | 'qr-generator'>('qr-generator')
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedBatch, setSelectedBatch] = useState<string>('')
  const [batches, setBatches] = useState<Batch[]>([])
  const [isLoadingDevices, setIsLoadingDevices] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // Removed qrPreview - v1.0 doesn't use overlay QR

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

  const fetchDevices = async () => {
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
  }

  useEffect(() => {
    fetchDevices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      
      // Map response tags to Device format for UI compatibility
      const mappedDevices = data.tags.map((tag: any) => ({
        id: tag.id,
        tag_id: tag.tag_code,
        tag_code: tag.tag_code,
        public_id: tag.public_id || null,
        token_id: tag.token_id,
        mint_tx_hash: tag.mint_tx_hash,
        base_qr_url: tag.base_qr_url,
        overlay_qr_url: '', // v1.0: NO OVERLAY - deprecated
        claim_token: '', // v1.0: NO CLAIM TOKEN - deprecated
        status: tag.status || 'in_inventory',
        activation_state: tag.activation_state || 'active',
        chain: tag.chain || 'BASE',
        contract_address: tag.contract_address,
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
      
      // Refresh from server to get latest data
      await fetchDevices()
      
      const tagsWithTokenId = data.tags.filter((t: any) => t.token_id).length
      const onChainCount = tagsWithTokenId
      const pendingCount = data.tags.length - tagsWithTokenId
      
      let message = ''
      if (tagsWithTokenId === data.tags.length) {
        message = `✅ Successfully generated ${data.tags.length} tags with NFTs minted on Base Mainnet. All tags are on-chain and ready to use.`
      } else if (tagsWithTokenId > 0) {
        message = `⚠️ Generated ${data.tags.length} tags. ${onChainCount} are on-chain (minted), ${pendingCount} are pending mint. Tags are saved in database and can be used immediately.`
      } else {
        message = `⚠️ Generated ${data.tags.length} tags. Minting is pending. Tags are saved in database and will be minted automatically.`
      }
      
      setMessage(message)
      
      // Scroll to QR codes section after a brief delay
      setTimeout(() => {
        const qrSection = document.getElementById('qr-codes-section')
        if (qrSection) {
          qrSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 300)
    } catch (error: any) {
      console.error('Generate error:', error)
      if (error.message?.includes('fetch failed') || error.message?.includes('Network')) {
        setErrorMessage('Network error: Could not connect to server. Check environment variables in Vercel.')
      } else {
        setErrorMessage(error.message || 'Failed to generate batch')
      }
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
    { id: 'qr-generator', label: '🏭 Factory' },
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'inventory', label: '📦 Inventory' },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg)] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">RanchLink Factory</h1>
          <p className="text-[var(--c4)]">Generate blockchain-linked tags for production</p>
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

        {/* QR Generator Tab */}
        {activeTab === 'qr-generator' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">🏭 QR Code Generator - Real World Asset Machine</h2>
              <p className="text-[var(--c4)] mb-6">
                Generate compliant QR codes for blockchain-linked real-world assets. Tags are pre-minted on Base Mainnet.
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

              {devices.length > 0 && (
                <div id="qr-codes-section" className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold">
                      {devices.length} tags ready for printing
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.print()}
                        className="btn-secondary"
                      >
                        🖨️ Print All
                      </button>
                    </div>
                  </div>

                  {/* QR Codes Grid - Production Sticker Layout */}
                  <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-3">
                    {devices.map((device) => {
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
                              Token ID: {device.token_id ? `#${device.token_id}` : 'Pending'}
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
                </div>
              )}

              {devices.length === 0 && !isSaving && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏭</div>
                  <h3 className="text-xl font-bold mb-2">Real World Asset QR Generator</h3>
                  <p className="text-[var(--c4)] mb-6">
                    Configure your batch settings above and click "Generate & Mint Tags" to create blockchain-linked tags
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

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
            )}
          </div>
        )}
      </div>
    </div>
  )
}
