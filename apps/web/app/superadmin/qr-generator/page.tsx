'use client'

import { useState } from 'react'
import QRCodeDisplay from '@/components/QRCodeDisplay'

export default function QRGeneratorPage() {
  const [batchSize, setBatchSize] = useState(57)
  const [devices, setDevices] = useState<any[]>([])
  const [selectedDevice, setSelectedDevice] = useState<any>(null)
  const [material, setMaterial] = useState('PETG')
  const [model, setModel] = useState('BASIC_QR')
  const [chain, setChain] = useState('BASE')
  const [color, setColor] = useState('Mesquite')
  const [batchName, setBatchName] = useState('Austin Run')
  const [batchDate, setBatchDate] = useState<string>(new Date().toISOString().slice(0,10))

  const generateCode = (index: number) => {
    const ymd = batchDate.replaceAll('-', '')
    const slug = (batchName || 'BATCH').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0,4)
    return `RL-${ymd}-${slug}-${String(index).padStart(4, '0')}`
  }

  const generateBatch = () => {
    const generated = []
    for (let i = 0; i < batchSize; i++) {
      const index = i + 1
      const tagId = `RL-${String(index).padStart(3, '0')}`
      const claimToken = crypto.randomUUID()
      const publicId = `AUS${String(index).padStart(4, '0')}`
      const baseUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.ranchlink.com'}/start?token=${claimToken}`
      const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.ranchlink.com'}/a?id=${publicId}`
      
      generated.push({
        tagId,
        claimToken,
        publicId,
        overlayQr: baseUrl, // Instructions/Claim setup
        baseQr: publicUrl,   // Claimable (30mm x 30mm)
        material,
        model,
        chain,
        color,
        batchName,
        batchDate,
        code: generateCode(index),
      })
    }
    setDevices(generated)
  }

  const downloadQR = async (url: string, filename: string) => {
    try {
      const QRCode = (await import('qrcode')).default
      const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `${filename}.png`
      link.click()
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download QR code')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🏭 QR Code Generator</h1>

        {/* Generator Controls */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-4">Generate Batch</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Batch Size</label>
              <input
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Material</label>
              <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg" value={material} onChange={e=>setMaterial(e.target.value)}>
                <option>PETG</option>
                <option>PLA</option>
                <option>ABS</option>
                <option>TPU</option>
                <option>CARBON_FIBER</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Model</label>
              <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg" value={model} onChange={e=>setModel(e.target.value)}>
                <option value="BASIC_QR">BASIC_QR (Original)</option>
                <option value="BOOTS_ON">BOOTS_ON (Medium)</option>
                <option value="CYBER_COWBOY">CYBER_COWBOY (Medium+)</option>
                <option value="SPACE_COWBOY">SPACE_COWBOY (Pro)</option>
                <option value="BIG_WESTERN">BIG_WESTERN (R&D)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Blockchain</label>
              <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg" value={chain} onChange={e=>setChain(e.target.value)}>
                <option>BASE</option>
                <option>OPTIMISM</option>
                <option>ETHEREUM</option>
                <option>BITCOIN</option>
                <option>SOLANA</option>
                <option>HEMI</option>
              </select>
              <p className="text-xs text-[var(--c4)] mt-1">Solana & Hemi are separate blockchains. Hemi provides Bitcoin access via Solana.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <input className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg" value={color} onChange={e=>setColor(e.target.value)} placeholder="Mesquite" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Batch Name</label>
              <input className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg" value={batchName} onChange={e=>setBatchName(e.target.value)} placeholder="Austin Run" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Batch Date</label>
              <input type="date" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg" value={batchDate} onChange={e=>setBatchDate(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <button onClick={generateBatch} className="btn-primary">Generate QR Codes</button>
          </div>
        </div>

        {/* QR Codes Display */}
        {devices.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{devices.length} Tags Generated</h2>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="btn-secondary">
                  🖨️ Print All
                </button>
                <button className="btn-secondary">📄 Export PDF</button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device, index) => (
                <div
                  key={index}
                  className="card border-2 border-gray-200 print:break-inside-avoid"
                >
                  <div className="text-center mb-4">
                    <div className="font-mono font-bold text-lg">{device.tagId}</div>
                    <div className="text-sm text-gray-500">{device.publicId}</div>
                    <div className="text-xs text-gray-600 mt-1">Code: {device.code}</div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-600 mt-2">
                      <div><strong>Material:</strong> {device.material}</div>
                      <div><strong>Model:</strong> {device.model}</div>
                      <div><strong>Chain:</strong> {device.chain}</div>
                      <div><strong>Color:</strong> {device.color}</div>
                      <div className="col-span-2"><strong>Batch:</strong> {device.batchName} — {device.batchDate}</div>
                    </div>
                  </div>

                  {/* Overlay QR (Instructions) */}
                  <div className="mb-6">
                    <div className="text-xs font-semibold mb-2 text-center bg-blue-100 px-2 py-1 rounded">
                      Overlay QR (Peelable Sticker) - Instructions
                    </div>
                    <div className="bg-white p-3 rounded border-2 border-blue-300 flex justify-center">
                      <QRCodeDisplay url={device.overlayQr} size={200} />
                    </div>
                    <div className="text-xs text-gray-500 mt-2 break-all text-center">
                      {device.overlayQr.substring(0, 50)}...
                    </div>
                    <button
                      onClick={() => downloadQR(device.overlayQr, `${device.tagId}-overlay`)}
                      className="mt-2 text-xs text-[var(--c2)] hover:underline w-full"
                    >
                      Download
                    </button>
                  </div>

                  {/* Base QR (30mm x 30mm - Claimable) */}
                  <div>
                    <div className="text-xs font-semibold mb-2 text-center bg-[var(--c2)] text-white px-2 py-1 rounded">
                      Base QR (30mm × 30mm) - Claimable NFT
                    </div>
                    <div className="bg-white p-3 rounded border-4 border-[var(--c2)] flex justify-center">
                      <QRCodeDisplay url={device.baseQr} size={200} />
                    </div>
                    <div className="text-xs text-gray-500 mt-2 break-all text-center">
                      {device.baseQr.substring(0, 50)}...
                    </div>
                    <button
                      onClick={() => downloadQR(device.baseQr, `${device.tagId}-base`)}
                      className="mt-2 text-xs text-[var(--c2)] hover:underline w-full"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {devices.length === 0 && (
          <div className="card bg-blue-50">
            <h3 className="font-bold mb-4">📋 Two QR System</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Overlay QR (Top Sticker)</h4>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Peelable sticker material</li>
                  <li>Contains claim token and instructions</li>
                  <li>User scans → Setup wizard → Ready to claim</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Base QR (30mm × 30mm)</h4>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Permanent on tag (30mm × 30mm)</li>
                  <li>Direct link to public animal card</li>
                  <li>After claim → Takes to NFT/Animal profile</li>
                  <li>Gateway to Coinbase ecosystem</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded border-2 border-[var(--c2)]">
                <p className="text-sm font-semibold mb-2">User Flow:</p>
                <p className="text-sm text-gray-700">
                  Scan Overlay → Setup → Peel → Scan Base → Claim NFT → Access Coinbase Ecosystem
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


