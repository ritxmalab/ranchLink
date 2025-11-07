'use client'

import { useState, useEffect } from 'react'
import QRCodeDisplay from '@/components/QRCodeDisplay'

interface Batch {
  id: string
  name: string
  model: string
  color: string
  count: number
  status: string
}

interface Device {
  id: string
  tag_id: string
  claim_token: string
  public_id: string
  overlay_qr_url: string
  base_qr_url: string
  status: string
  type?: string | null
  material?: string
  model?: string
  chain?: string
  color?: string
  batch_name?: string
  batch_date?: string
  code?: string
  metadata?: Record<string, any>
}

const mapDevice = (device: any): Device => {
  const metadata = device.metadata || {}
  return {
    id: String(device.id ?? metadata.id ?? crypto.randomUUID()),
    tag_id: device.tag_id,
    claim_token: device.claim_token,
    public_id: device.public_id,
    overlay_qr_url: device.overlay_qr_url || metadata.overlay_qr_url || '',
    base_qr_url: device.base_qr_url || metadata.base_qr_url || '',
    status: device.status || 'printed',
    material: metadata.material ?? device.material,
    model: metadata.model ?? device.model,
    chain: metadata.chain ?? device.chain,
    color: metadata.color ?? device.color,
    batch_name: metadata.batch_name ?? device.batch_name,
    batch_date: metadata.batch_date ?? device.batch_date,
    code: device.code ?? device.serial ?? metadata.code,
    metadata,
  }
}

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'batches' | 'inventory' | 'qr-generator'>('dashboard')
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedBatch, setSelectedBatch] = useState<string>('')
  const [qrPreview, setQrPreview] = useState<{ overlay: string; base: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoadingDevices, setIsLoadingDevices] = useState(true)
  
  // Advanced QR Generator Fields
  const [batchSize, setBatchSize] = useState<number>(57)
  const [material, setMaterial] = useState('PETG')
  const [model, setModel] = useState('BASIC_QR')
  const [chain, setChain] = useState('BASE')
  const [color, setColor] = useState('Mesquite')
  const [batchName, setBatchName] = useState('Austin Run')
  const [batchDate, setBatchDate] = useState<string>(new Date().toISOString().slice(0,10))

  const appUrl = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  
  // Generate compliant code
  const generateCode = (index: number) => {
    const ymd = batchDate.replaceAll('-', '')
    const slug = (batchName || 'BATCH').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0,4)
    return `RL-${ymd}-${slug}-${String(index).padStart(4, '0')}`
  }

  const getMaxNumber = (accessor: (device: Device) => string | undefined) => {
    const numbers = devices
      .map(accessor)
      .filter((value): value is string => !!value)
      .map((value) => parseInt(value.replace(/[^0-9]/g, ''), 10))
      .filter((num) => Number.isFinite(num))
    return numbers.length ? Math.max(...numbers) : 0
  }

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

  // Generate QR codes for a batch with all advanced features
  const generateBatchQRCodes = (batchId: string, count: number) => {
    const generated: Device[] = []
    const currentTagMax = getMaxNumber((d) => d.tag_id)
    const currentPublicMax = getMaxNumber((d) => d.public_id)

    for (let i = 0; i < count; i++) {
      const tagNumber = currentTagMax + i + 1
      const publicNumber = currentPublicMax + i + 1
      const tagId = `RL-${String(tagNumber).padStart(3, '0')}`
      const claimToken = crypto.randomUUID()
      const publicId = `AUS${String(publicNumber).padStart(4, '0')}`
      
      // Overlay QR: Instructions/Claim Setup
      const overlayUrl = `${appUrl}/start?token=${claimToken}`
      // Base QR: Claimable (30mm x 30mm)
      const baseUrl = `${appUrl}/a?id=${publicId}`

      generated.push({
        id: crypto.randomUUID(),
        tag_id: tagId,
        claim_token: claimToken,
        public_id: publicId,
        overlay_qr_url: overlayUrl,
        base_qr_url: baseUrl,
        status: 'printed',
        type: model,
        material,
        model,
        chain,
        color,
        batch_name: batchName,
        batch_date: batchDate,
        code: generateCode(tagNumber),
      })
    }
    return generated
  }

  const handleGenerate = async () => {
    setIsSaving(true)
    setMessage(null)
    setErrorMessage(null)

    try {
      const generated = generateBatchQRCodes('batch-1', batchSize)
      setDevices(generated)

      const response = await fetch('/api/superadmin/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devices: generated }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save devices')
      }

      await fetchDevices()
      setMessage(`Saved ${generated.length} tags to Supabase`)
    } catch (error: any) {
      console.error(error)
      setErrorMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Preview QR codes
  const previewQR = async (device: Device) => {
    try {
      const QRCode = (await import('qrcode')).default
      const overlay = await QRCode.toDataURL(device.overlay_qr_url, { width: 200, margin: 2 })
      const base = await QRCode.toDataURL(device.base_qr_url, { width: 200, margin: 2 })
      setQrPreview({ overlay, base })
    } catch (error) {
      console.error('QR preview error:', error)
    }
  }

  // Export QR codes as PDF
  const exportQRPDF = async (devices: Device[]) => {
    // This would generate a PDF with all QR codes
    // For now, we'll download individual images
    alert('PDF export coming soon! For now, use the print function.')
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🏭 Super Admin Factory</h1>
          <p className="text-[var(--c4)]">Production, inventory, and QR code generation</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'batches', label: 'Batches' },
            { id: 'inventory', label: 'Inventory' },
            { id: 'qr-generator', label: 'QR Generator' },
          ].map((tab) => (
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

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="grid md:grid-cols-4 gap-6">
            <div className="card text-center">
              <div className="text-4xl font-bold text-[var(--c2)] mb-2">57</div>
              <div className="text-sm text-gray-600">Total Tags</div>
            </div>
            <div className="card text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Claimed</div>
            </div>
            <div className="card text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">57</div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
            <div className="card text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            {isLoadingDevices && (
              <div className="text-sm text-[var(--c4)] mt-4">Loading inventory…</div>
            )}
            {!isLoadingDevices && devices.length === 0 && (
              <div className="text-sm text-[var(--c4)] mt-4">No devices generated yet.</div>
            )}
          </div>
        )}

        {/* Batches Tab */}
        {activeTab === 'batches' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Create New Batch</h2>
              <form className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Batch Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Austin Run 2024"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Model</label>
                    <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none">
                      <option>PETG</option>
                      <option>GPS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Color</label>
                    <input
                      type="text"
                      placeholder="e.g., Mesquite"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Count</label>
                    <input
                      type="number"
                      placeholder="57"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('qr-generator')}
                  className="btn-primary"
                >
                  Go to QR Generator
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Inventory</h2>
              <div className="flex gap-2">
                <button className="btn-secondary">Export CSV</button>
                <button className="btn-secondary">Filter</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Tag ID</th>
                    <th className="text-left py-3 px-4">Public ID</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => (
                    <tr key={device.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-mono">{device.tag_id}</td>
                      <td className="py-3 px-4 font-mono">{device.public_id}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                          {device.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => previewQR(device)}
                          className="text-[var(--c2)] hover:underline text-sm"
                        >
                          Preview QR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* QR Generator Tab */}
        {activeTab === 'qr-generator' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">🏭 QR Code Generator - Real World Asset Machine</h2>
              <p className="text-[var(--c4)] mb-6">
                Generate compliant QR codes for blockchain-linked real-world assets. Configure material, model, blockchain, and batch details.
              </p>

              {/* Advanced Configuration Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border-2 border-[var(--c2)]/20">
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
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Material</label>
                  <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg" value={material} onChange={e=>setMaterial(e.target.value)}>
                    <option>PETG</option>
                    <option>PLA</option>
                    <option>ABS</option>
                    <option>TPU</option>
                    <option>CARBON_FIBER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Model</label>
                  <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg" value={model} onChange={e=>setModel(e.target.value)}>
                    <option value="BASIC_QR">BASIC_QR (Original)</option>
                    <option value="BOOTS_ON">BOOTS_ON (Medium)</option>
                    <option value="CYBER_COWBOY">CYBER_COWBOY (Medium+)</option>
                    <option value="SPACE_COWBOY">SPACE_COWBOY (Pro)</option>
                    <option value="BIG_WESTERN">BIG_WESTERN (R&D)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Blockchain</label>
                  <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg" value={chain} onChange={e=>setChain(e.target.value)}>
                    <option>BASE</option>
                    <option>OPTIMISM</option>
                    <option>ETHEREUM</option>
                    <option>BITCOIN</option>
                    <option>SOLANA</option>
                    <option>HEMI</option>
                  </select>
                  <p className="text-xs text-[var(--c4)] mt-1">Solana & Hemi are separate blockchains</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                    value={color}
                    onChange={e=>setColor(e.target.value)}
                    placeholder="Mesquite"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Batch Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                    value={batchName}
                    onChange={e=>setBatchName(e.target.value)}
                    placeholder="Austin Run"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Batch Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
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
                    {isSaving ? 'Generating…' : 'Generate & Save QR Codes'}
                  </button>
                </div>
              </div>

              {message && (
                <div className="bg-green-100 text-green-700 px-4 py-3 rounded mb-4 text-sm">
                  {message}
                </div>
              )}

              {errorMessage && (
                <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                  {errorMessage}
                </div>
              )}

              {devices.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold">
                      {devices.length} tags ready
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.print()}
                        className="btn-secondary"
                      >
                        🖨️ Print All
                      </button>
                      <button
                        onClick={() => exportQRPDF(devices)}
                        className="btn-secondary"
                      >
                        📄 Export PDF
                      </button>
                    </div>
                  </div>

                  {/* QR Codes Grid */}
                  <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {devices.map((device) => (
                      <div
                        key={device.id}
                        className="border-2 border-white/20 rounded-lg p-4 bg-[var(--bg-card)]"
                      >
                        <div className="text-center mb-4">
                          <div className="font-mono font-bold text-sm mb-2">
                            {device.tag_id}
                          </div>
                          <div className="text-xs text-gray-500 mb-1">
                            {device.public_id}
                          </div>
                          {device.code && (
                            <div className="text-xs font-semibold text-[var(--c2)] mb-2">
                              Code: {device.code}
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-600 mt-2">
                            {device.material && <div><strong>Material:</strong> {device.material}</div>}
                            {device.model && <div><strong>Model:</strong> {device.model}</div>}
                            {device.chain && <div><strong>Chain:</strong> {device.chain}</div>}
                            {device.color && <div><strong>Color:</strong> {device.color}</div>}
                            {device.batch_name && (
                              <div className="col-span-2"><strong>Batch:</strong> {device.batch_name} — {device.batch_date}</div>
                            )}
                          </div>
                        </div>

                        {/* Overlay QR (Instructions) */}
                        <div className="mb-4">
                          <div className="text-xs font-semibold mb-2 text-center bg-white/10 px-2 py-1 rounded border border-white/20">
                            Overlay QR (Instructions)
                          </div>
                          <div className="bg-white p-2 rounded border-2 border-white/30 flex justify-center">
                            <QRCodeDisplay url={device.overlay_qr_url} size={150} />
                          </div>
                          <div className="text-xs text-[var(--c4)] mt-2 text-center break-all">
                            {device.overlay_qr_url.substring(0, 40)}...
                          </div>
                        </div>

                        {/* Base QR (Claimable - 30mm) */}
                        <div>
                          <div className="text-xs font-semibold mb-2 text-center bg-gradient-to-r from-[var(--c2)] to-[var(--c3)] text-white px-2 py-1 rounded">
                            Base QR (30mm × 30mm) - Claimable
                          </div>
                          <div className="bg-white p-2 rounded border-4 border-[var(--c2)] flex justify-center">
                            <QRCodeDisplay url={device.base_qr_url} size={150} />
                          </div>
                          <div className="text-xs text-[var(--c4)] mt-2 text-center break-all">
                            {device.base_qr_url.substring(0, 40)}...
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {devices.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏭</div>
                  <h3 className="text-xl font-bold mb-2">Real World Asset QR Generator</h3>
                  <p className="text-[var(--c4)] mb-6">
                    Configure your batch settings above and click "Generate QR Codes" to create blockchain-linked tags
                  </p>
                  <div className="card bg-gradient-to-r from-[var(--c2)]/10 to-[var(--c3)]/10 border-2 border-[var(--c2)]/20 max-w-2xl mx-auto text-left">
                    <h4 className="font-bold mb-3">Features:</h4>
                    <ul className="space-y-2 text-sm text-[var(--c4)]">
                      <li>✓ Material selection (PETG, PLA, ABS, TPU, Carbon Fiber)</li>
                      <li>✓ Model selection (BASIC_QR, BOOTS_ON, CYBER_COWBOY, SPACE_COWBOY, BIG_WESTERN)</li>
                      <li>✓ Blockchain selection (Base, Optimism, Ethereum, Bitcoin, Solana, Hemi)</li>
                      <li>✓ Batch configuration (Name, Date, Color)</li>
                      <li>✓ Compliant code generation (RL-YYYYMMDD-BATC-0001)</li>
                      <li>✓ Two QR system (Overlay + Base)</li>
                      <li>✓ Real-world asset traceability on blockchain</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="card bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] border border-[var(--c2)]/20">
              <h3 className="font-bold mb-4 text-[var(--c1)]">📋 Real World Asset QR System</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-[var(--c1)]">1. Overlay QR (Peelable Sticker)</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-[var(--c4)]">
                    <li>Contains claim token and setup instructions</li>
                    <li>Print on peelable sticker material</li>
                    <li>User scans → Setup wizard → Ready to claim</li>
                    <li>Gateway to crypto world and Coinbase ecosystem</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-[var(--c1)]">2. Base QR (30mm × 30mm - Permanent)</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-[var(--c4)]">
                    <li>Direct link to public animal card</li>
                    <li>Print directly on tag (30mm × 30mm)</li>
                    <li>After claim → Takes to NFT/Animal profile</li>
                    <li>Blockchain-linked real-world asset</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-4 bg-[var(--c2)]/10 rounded-lg border border-[var(--c2)]/20">
                <p className="text-sm font-semibold mb-2 text-[var(--c1)]">User Flow:</p>
                <p className="text-sm text-[var(--c4)]">
                  Scan Overlay → Setup → Peel → Scan Base → Claim NFT → Access Coinbase Ecosystem → Real-World Asset on Blockchain
                </p>
              </div>
            </div>
          </div>
        )}

        {/* QR Preview Modal */}
        {qrPreview && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-[var(--bg-card)] border border-white/20 rounded-lg p-6 max-w-md">
              <h3 className="text-xl font-bold mb-4 text-white">QR Code Preview</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm font-semibold mb-2 text-white">Overlay QR</div>
                  <img src={qrPreview.overlay} alt="Overlay QR" className="w-full" />
                </div>
                <div>
                  <div className="text-sm font-semibold mb-2 text-white">Base QR</div>
                  <img src={qrPreview.base} alt="Base QR" className="w-full" />
                </div>
              </div>
              <button
                onClick={() => setQrPreview(null)}
                className="btn-secondary w-full"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

