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
  assembly_photo_url?: string | null
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
    assembly_photo_url: device.assembly_photo_url ?? metadata.assembly_photo_url ?? null,
    code: device.code ?? device.serial ?? device.tag_code ?? metadata.code,
    metadata,
  }
}

// ── Composite token display code ─────────────────────────────────────────────
// Format: RL-008-39ECF320  (tag_code + first 8 hex chars of mint tx hash)
// This is the canonical identifier shown everywhere — never just a sequential number.
function formatTokenCode(tag: { tag_code?: string; token_id?: string | null; mint_tx_hash?: string | null }) {
  if (tag.mint_tx_hash) {
    const hex = tag.mint_tx_hash.replace('0x', '').substring(0, 8).toUpperCase()
    return `${tag.tag_code}-${hex}`
  }
  if (tag.token_id) return `${tag.tag_code}-T${tag.token_id}`
  return '—'
}

type StickerPreset = '30mm' | '50mm' | 'sxsw'

function getStickerLabel(preset: StickerPreset): string {
  if (preset === 'sxsw') return 'SXSW (45×45mm)'
  if (preset === '50mm') return '50×50mm'
  return '30×30mm'
}

function sxswColorsByTag(tag: any): { bg: string; fg: string } {
  const color = String(tag?.color || '').toLowerCase()
  // Red tags: blue + creamy yellow
  if (color.includes('red')) return { bg: '#3183fe', fg: '#fdfa00' }
  // Pink tags (and fallback): lime + purple
  return { bg: '#a4fe31', fg: '#a400fd' }
}

function hexToDashRgb(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r}-${g}-${b}`
}

// ── QR sticker HTML builder ────────────────────────────────────────────────────
// Bottom line = token code (manual claim fallback), black, bold.
function stickerHTML(tag: any, preset: StickerPreset): string {
  const url = tag.base_qr_url || `https://ranch-link.vercel.app/t/${tag.tag_code}`
  const batchLabel = tag.batch_name || ''
  const specLine = [tag.color, tag.material?.split(' ')[0]].filter(Boolean).join(' · ')
  // Token code = manual claim ID. Format: RL-029-A3F2B1C4 (from tx hash) or RL-029-T<tokenId>.
  // For pre_identity tags (not yet minted), just use the tag code — farmer types this to claim.
  const tokenCode = formatTokenCode(tag)
  const claimCode = tokenCode !== '—' ? tokenCode : tag.tag_code

  if (preset === 'sxsw') {
    const { bg, fg } = sxswColorsByTag(tag)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d1bab796-07e5-40b1-a8e1-d8929352e341',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'da8bc1'},body:JSON.stringify({sessionId:'da8bc1',runId:'sxsw-print-pre',hypothesisId:'H1',location:'superadmin/page.tsx:stickerHTML:sxsw',message:'SXSW sticker content generated',data:{tagCode:tag?.tag_code||null,batch:tag?.batch_name||null,claimCodeLength:String(claimCode||'').length,specLineLength:String(specLine||'').length,color:tag?.color||null,bg,fg},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&margin=0&data=${encodeURIComponent(url)}&bgcolor=${hexToDashRgb(bg)}&color=${hexToDashRgb(fg)}`
    return `
      <div class="sticker sxsw">
        <div class="sxsw-code">${tag.tag_code}</div>
        ${batchLabel ? `<div class="sxsw-batch">${batchLabel}</div>` : ''}
        ${specLine ? `<div class="sxsw-spec">${specLine}</div>` : ''}
        <img class="sxsw-qr" src="${qrSrc}" />
        <div class="sxsw-footer">
          <span class="sxsw-logo">SXSW</span>
          <span class="sxsw-year">26</span>
        </div>
      </div>`
  }

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=${encodeURIComponent(url)}`
  return `
    <div class="sticker">
      <div class="tag-code">${tag.tag_code}</div>
      ${batchLabel ? `<div class="batch-name">${batchLabel}</div>` : ''}
      ${specLine ? `<div class="spec-line">${specLine}</div>` : ''}
      <img src="${qrSrc}" />
      <div class="claim-code">${claimCode}</div>
    </div>`
}

// Shared CSS for sticker layout — works centered on any paper size
function getStickerCSS(preset: StickerPreset): string {
  const is50 = preset === '50mm'
  const isSXSW = preset === 'sxsw'
  const sticker = isSXSW ? '45mm' : is50 ? '50mm' : '30mm'
  const img = isSXSW ? '28mm' : is50 ? '37mm' : '22mm'
  const tagCodePt = isSXSW ? 8 : is50 ? 11 : 6.5
  const batchPt = isSXSW ? 5.5 : is50 ? 7.5 : 4.5
  const specPt = isSXSW ? 4.8 : is50 ? 6.5 : 4
  const claimPt = isSXSW ? 4.5 : is50 ? 6.5 : 4
  const claimMax = isSXSW ? '40mm' : is50 ? '46mm' : '28mm'
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d1bab796-07e5-40b1-a8e1-d8929352e341',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'da8bc1'},body:JSON.stringify({sessionId:'da8bc1',runId:'sxsw-print-pre',hypothesisId:'H2',location:'superadmin/page.tsx:getStickerCSS',message:'Computed print CSS dimensions',data:{preset,sticker,img,tagCodePt,batchPt,specPt,claimPt,claimMax,gap:isSXSW?'5mm':is50?'6mm':'4mm'},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return `
  @page { margin: 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: monospace; background: #fff; }
  .grid {
    display: flex; flex-wrap: wrap; gap: ${isSXSW ? '5mm' : is50 ? '6mm' : '4mm'};
    justify-content: flex-start; align-items: flex-start;
  }
  .sticker {
    width: ${sticker}; height: ${sticker};
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    border: 0.3mm dashed #ccc;
    overflow: hidden; page-break-inside: avoid;
  }
  .tag-code   { font-size: ${tagCodePt}pt; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 0.3mm; }
  .batch-name { font-size: ${batchPt}pt; color: #333; margin-bottom: 0.3mm; letter-spacing: 0.2px; }
  .spec-line  { font-size: ${specPt}pt; color: #888; margin-bottom: 0.5mm; }
  img { width: ${img}; height: ${img}; display: block; }
  .claim-code { font-size: ${claimPt}pt; color: #000; font-weight: bold; margin-top: 0.4mm;
                text-align: center; max-width: ${claimMax}; overflow: hidden;
                white-space: nowrap; text-overflow: ellipsis; letter-spacing: 0.3px; }
  .sxsw {
    border: 0.25mm solid #333;
    justify-content: flex-start;
    padding: 0.9mm 1mm 0.8mm;
    gap: 0.35mm;
  }
  .sxsw-code { font-size: ${tagCodePt}pt; font-weight: 800; letter-spacing: 0.2px; text-align: center; width: 100%; line-height: 1; }
  .sxsw-batch { font-size: ${batchPt}pt; text-align: center; width: 100%; line-height: 1; }
  .sxsw-spec { font-size: ${specPt}pt; text-align: center; width: 100%; line-height: 1; }
  .sxsw-qr { width: ${img}; height: ${img}; display: block; margin: 0 auto; }
  .sxsw-footer { width: 100%; display: flex; justify-content: space-between; align-items: baseline; margin-top: 0.2mm; }
  .sxsw-logo { font-size: 7.4pt; font-weight: 900; letter-spacing: 0.2px; }
  .sxsw-year { font-size: 8.8pt; font-weight: 900; }
`
}

// ── Individual QR print ────────────────────────────────────────────────────────
function printSingleQR(tag: any, preset: StickerPreset = '30mm') {
  const win = window.open('', '_blank', 'width=500,height=400')
  if (!win) { alert('Allow pop-ups to print QR labels.'); return }
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d1bab796-07e5-40b1-a8e1-d8929352e341',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'da8bc1'},body:JSON.stringify({sessionId:'da8bc1',runId:'sxsw-print-pre',hypothesisId:'H3',location:'superadmin/page.tsx:printSingleQR:start',message:'Print single started',data:{tagCode:tag?.tag_code||null,preset,windowOpened:Boolean(win)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>QR ${tag.tag_code}</title>
<style>${getStickerCSS(preset)}</style></head>
<body><div class="grid">${stickerHTML(tag, preset)}</div>
<script>
  var imgs = document.querySelectorAll('img'), loaded = 0;
  function tryPrint() { if (++loaded >= imgs.length) { window.print(); setTimeout(function(){ window.close(); }, 1000); } }
  imgs.forEach(function(img) { if (img.complete) tryPrint(); else { img.onload = tryPrint; img.onerror = tryPrint; } });
  if (!imgs.length) { window.print(); setTimeout(function(){ window.close(); }, 1000); }
<\/script></body></html>`)
  win.document.close()
}

// ── Batch QR print — all tags from the same batch in one print job ─────────────
function printBatchQR(tags: any[], preset: StickerPreset = '30mm') {
  if (!tags.length) return
  const batchName = tags[0].batch_name || 'Batch'
  const win = window.open('', '_blank', 'width=800,height=600')
  if (!win) { alert('Allow pop-ups to print QR labels.'); return }
  const stickers = tags.map((tag) => stickerHTML(tag, preset)).join('')
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d1bab796-07e5-40b1-a8e1-d8929352e341',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'da8bc1'},body:JSON.stringify({sessionId:'da8bc1',runId:'sxsw-print-pre',hypothesisId:'H4',location:'superadmin/page.tsx:printBatchQR:start',message:'Print batch started',data:{preset,batchName,count:tags.length,firstTag:tags?.[0]?.tag_code||null,windowOpened:Boolean(win)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Batch ${batchName} — ${tags.length} tags</title>
<style>${getStickerCSS(preset)}
  h1 { font-size: 9pt; color: #555; margin-bottom: 4mm; font-family: monospace; }
</style></head>
<body>
<h1>🐄 RanchLink · ${batchName} · ${tags.length} tags · ${getStickerLabel(preset)}</h1>
<div class="grid">${stickers}</div>
<script>
  var imgs = document.querySelectorAll('img'), loaded = 0, total = imgs.length;
  function tryPrint() { if (++loaded >= total) { window.print(); setTimeout(function(){ window.close(); }, 1200); } }
  imgs.forEach(function(img) { if (img.complete) tryPrint(); else { img.onload = tryPrint; img.onerror = tryPrint; } });
  if (!total) { window.print(); setTimeout(function(){ window.close(); }, 1000); }
<\/script></body></html>`)
  win.document.close()
}

// ── Shared status helpers — used by AssembleTab and InventoryTab ──────────────
function statusBadge(status: string): string {
  const map: Record<string, string> = {
    pre_identity:       'bg-cyan-900/20 text-cyan-400',
    on_chain_unclaimed: 'bg-blue-900/20 text-blue-400',
    assembled:          'bg-yellow-900/20 text-yellow-400',
    in_inventory:       'bg-green-900/20 text-green-400',
    demo:               'bg-orange-900/20 text-orange-400',
    for_sale:           'bg-pink-900/20 text-pink-400',
    sold:               'bg-rose-900/20 text-rose-400',
    shipped:            'bg-teal-900/20 text-teal-400',
    attached:           'bg-purple-900/20 text-purple-400',
  }
  return map[status] || 'bg-gray-900/20 text-gray-400'
}

const STATUS_LABELS: Record<string, string> = {
  pre_identity:       '⚓ Pre-Identity',
  on_chain_unclaimed: '🔵 On-Chain',
  assembled:          '📦 Assembled',
  in_inventory:       '🏬 In Inventory',
  demo:               '🎯 Demo',
  for_sale:           '🏷️ For Sale',
  sold:               '💰 Sold',
  shipped:            '🚚 Shipped',
  attached:           '🐄 Attached',
}

// ── Assemble Tab ──────────────────────────────────────────────────────────────
// Workflow: 🖨️ Print QR → 🔧 Assemble → 🖨️ Confirm Print → 📥 Push to Inventory
// Shipping is NOT part of this flow — it appears in Inventory after purchase/gift.
function AssembleTab({ stickerSizeMm }: { stickerSizeMm: StickerPreset }) {
  const [tags, setTags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [photoUploadingTagId, setPhotoUploadingTagId] = useState<string | null>(null)
  // Two-phase print tracking: 'pre' = printed before assembly, 'post' = printed after assembly
  const [printState, setPrintState] = useState<Record<string, 'pre' | 'post' | undefined>>({})

  const fetchAssembleTags = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/superadmin/assemble', { credentials: 'include' })
    const data = await res.json()
    setTags(data.tags || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAssembleTags() }, [fetchAssembleTags])

  const handleAction = async (tagId: string, action: 'assemble' | 'push_to_inventory') => {
    setActionLoading(tagId + action)
    const res = await fetch('/api/superadmin/assemble', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag_id: tagId, action, assembled_by: 'superadmin' }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      alert(`Action failed: ${err.error || err.message || 'Unknown error'}`)
    }
    await fetchAssembleTags()
    setActionLoading(null)
  }

  const handlePrint = (tagId: string, tag: any, phase: 'pre' | 'post') => {
    printSingleQR(tag, stickerSizeMm)
    // Only mark as printed after user confirms they actually sent the print job
    setTimeout(() => {
      const confirmed = window.confirm('Did the QR label print successfully?')
      if (confirmed) {
        setPrintState(prev => ({ ...prev, [tagId]: phase }))
      }
    }, 800)
  }

  const handlePhotoUpload = async (tag: any, file: File | null) => {
    if (!file) return
    setPhotoUploadingTagId(tag.id)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tag_code', tag.tag_code)
      const res = await fetch('/api/superadmin/tag-photo', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Photo upload failed')
      }
      setTags(prev => prev.map(t => t.id === tag.id ? { ...t, assembly_photo_url: data.photo_url } : t))
    } catch (error: any) {
      alert(`Photo upload failed: ${error.message || 'Unknown error'}`)
    } finally {
      setPhotoUploadingTagId(null)
    }
  }


  const workflowTags = tags.filter(t =>
    t.status === 'on_chain_unclaimed' || t.status === 'pre_identity' || t.status === 'assembled'
  )

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
      ) : workflowTags.length === 0 ? (
        <div className="text-center py-12 text-[var(--c4)]">
          <div className="text-5xl mb-4">📭</div>
          <p>No tags pending assembly. Generate a batch first.</p>
        </div>
      ) : (
        <>
          {/* Summary counters */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card text-center bg-blue-900/10 border border-blue-700/30">
              <div className="text-3xl font-bold text-blue-400">{workflowTags.filter(t => t.status === 'on_chain_unclaimed' || t.status === 'pre_identity').length}</div>
              <div className="text-xs text-[var(--c4)] mt-1">Ready to Assemble</div>
            </div>
            <div className="card text-center bg-yellow-900/10 border border-yellow-700/30">
              <div className="text-3xl font-bold text-yellow-400">{workflowTags.filter(t => t.status === 'assembled').length}</div>
              <div className="text-xs text-[var(--c4)] mt-1">Assembled</div>
            </div>
            <div className="card text-center bg-green-900/10 border border-green-700/30">
              <div className="text-3xl font-bold text-green-400">{workflowTags.filter(t => printState[t.id] === 'post').length}</div>
              <div className="text-xs text-[var(--c4)] mt-1">Labels Printed</div>
            </div>
          </div>

          {/* Print Whole Batch — grouped by batch_name */}
          {(() => {
            const batches: Record<string, typeof workflowTags> = {}
            workflowTags.forEach(t => {
              const key = t.batch_name || 'Legacy (no batch)'
              if (!batches[key]) batches[key] = []
              batches[key].push(t)
            })
            const batchEntries = Object.entries(batches)
            if (!batchEntries.length) return null
            return (
              <div className="mb-5 flex flex-wrap gap-2">
                {batchEntries.map(([name, bTags]) => (
                  <button
                    key={name}
                    onClick={() => printBatchQR(bTags, stickerSizeMm)}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--c2)] hover:opacity-80 text-white rounded-lg text-sm font-semibold shadow"
                  >
                    🖨️ Print Batch "{name}" ({bTags.length} tags)
                  </button>
                ))}
              </div>
            )
          })()}

          {/* Workflow steps legend */}
          <div className="mb-5 p-3 bg-[var(--bg-card)] border border-white/10 rounded-lg text-xs text-[var(--c4)]">
            <span className="font-semibold text-white">Steps:</span>
            {' '}
            <span className="text-blue-400">① Print QR</span>
            {' → '}
            <span className="text-yellow-400">② Assemble</span>
            {' → '}
            <span className="text-orange-400">③ Confirm Print</span>
            {' → '}
            <span className="text-teal-400">④ Upload Photo</span>
            {' → '}
            <span className="text-indigo-400">⑤ Push to Inventory</span>
          </div>

          <div className="space-y-4">
            {workflowTags.map(tag => {
              const tokenCode = formatTokenCode(tag)
              const tagPrintState = printState[tag.id]
              const hasPrintedPre = tagPrintState === 'pre' || tagPrintState === 'post'
              const hasPrintedPost = tagPrintState === 'post'
              const isAssembled = tag.status === 'assembled'
              const hasAssemblyPhoto = Boolean(tag.assembly_photo_url)
              const qrUrl = tag.base_qr_url || `https://ranch-link.vercel.app/t/${tag.tag_code}`

              return (
                <div key={tag.id} className="border border-white/10 rounded-xl p-4 bg-[var(--bg-card)]">
                  <div className="flex items-start gap-4">

                    {/* QR preview — sticker size matches print layout */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                      <div className="bg-white p-1.5 rounded border-2 border-[var(--c2)]">
                        <QRCodeDisplay url={qrUrl} size={72} />
                      </div>
                      <div className="text-[9px] text-[var(--c4)] font-mono text-center leading-tight max-w-[90px] break-all">
                        {getStickerLabel(stickerSizeMm)}
                      </div>
                    </div>

                    {/* Tag info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono font-bold text-base">{tag.tag_code}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusBadge(tag.status)}`}>
                          {STATUS_LABELS[tag.status] || tag.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {/* Batch name — e.g. TST_ATX_270226 */}
                      {tag.batch_name && (
                        <div className="font-mono text-xs text-[var(--c2)] mb-0.5">{tag.batch_name}</div>
                      )}
                      {/* Physical specs — color · material */}
                      {(tag.color || tag.material) && (
                        <div className="text-xs text-[var(--c4)] mb-1">
                          {[tag.color, tag.material].filter(Boolean).join(' · ')}
                        </div>
                      )}
                      {hasAssemblyPhoto && (
                        <div className="mt-2">
                          <a href={tag.assembly_photo_url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={tag.assembly_photo_url}
                              alt={`Assembly photo ${tag.tag_code}`}
                              className="w-16 h-16 object-cover rounded border border-green-600/60"
                            />
                          </a>
                        </div>
                      )}
                      {tag.assembled_at && (
                        <div className="text-xs text-[var(--c4)]">
                          Assembled: {new Date(tag.assembled_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* Sequential action buttons */}
                    <div className="flex flex-col gap-2 items-end flex-shrink-0 min-w-[130px]">

                      {/* Step 1: Print QR — always available, required before Assemble */}
                      {!isAssembled && (
                        <button
                          onClick={() => handlePrint(tag.id, tag, 'pre')}
                          className={`w-full px-3 py-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            hasPrintedPre
                              ? 'bg-green-900/30 border border-green-600 text-green-400'
                              : 'bg-[var(--c2)] hover:opacity-80 text-white shadow-md'
                          }`}
                        >
                          {hasPrintedPre ? '✅ Printed' : '🖨️ Print QR'}
                        </button>
                      )}

                      {/* Step 2: Assemble — unlocks after printing */}
                      {!isAssembled && (
                        <button
                          onClick={() => handleAction(tag.id, 'assemble')}
                          disabled={!hasPrintedPre || actionLoading === tag.id + 'assemble'}
                          title={!hasPrintedPre ? 'Print the QR label first' : 'Mark as physically assembled'}
                          className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          {actionLoading === tag.id + 'assemble' ? '⏳ ...' : '🔧 Assemble'}
                        </button>
                      )}

                      {/* Step 3: Confirm Print — required after assembly, before push */}
                      {isAssembled && (
                        <button
                          onClick={() => handlePrint(tag.id, tag, 'post')}
                          className={`w-full px-3 py-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            hasPrintedPost
                              ? 'bg-green-900/30 border border-green-600 text-green-400'
                              : 'bg-orange-600 hover:bg-orange-500 text-white shadow-md'
                          }`}
                        >
                          {hasPrintedPost ? '✅ Label Ready' : '🖨️ Print Label'}
                        </button>
                      )}

                      {/* Step 3.5: Upload assembled physical photo (required before inventory push) */}
                      {isAssembled && (
                        <label
                          className={`w-full px-3 py-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            hasAssemblyPhoto
                              ? 'bg-green-900/30 border border-green-600 text-green-400'
                              : 'bg-teal-700 hover:bg-teal-600 text-white shadow-md'
                          }`}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(tag, e.target.files?.[0] || null)}
                          />
                          {photoUploadingTagId === tag.id
                            ? '⏳ Uploading...'
                            : (hasAssemblyPhoto ? '✅ Photo Saved' : '📸 Upload Tag Photo')}
                        </label>
                      )}

                      {/* Step 4: Push to Inventory — only after assembled + printed */}
                      {isAssembled && (
                        <button
                          onClick={() => handleAction(tag.id, 'push_to_inventory')}
                          disabled={!hasPrintedPost || !hasAssemblyPhoto || actionLoading === tag.id + 'push_to_inventory'}
                          title={!hasPrintedPost ? 'Print the final label first' : (!hasAssemblyPhoto ? 'Upload assembled tag photo first' : 'Move to inventory')}
                          className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          {actionLoading === tag.id + 'push_to_inventory' ? '⏳ ...' : '📥 Push to Inventory'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
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
  const [material, setMaterial] = useState('PETG-HF')
  const [model, setModel] = useState('BASIC_QR')
  const [chain, setChain] = useState('BASE')
  const [color, setColor] = useState('Yellow')
  const [filamentBrand, setFilamentBrand] = useState('Bambu Lab')
  const [itwGrams, setItwGrams] = useState<number>(11) // Individual Tag Weight in grams
  const [itwInput, setItwInput] = useState<string>('11')
  const [batchName, setBatchName] = useState('')
  const [batchDate, setBatchDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [stickerSizeMm, setStickerSizeMm] = useState<StickerPreset>('30mm')

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
      const response = await fetch('/api/superadmin/devices', { credentials: 'include' })
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

  // Check cookie auth on mount — use exact key match (cookie is not httpOnly)
  useEffect(() => {
    const hasCookie = document.cookie
      .split(';')
      .some(c => c.trim().startsWith('rl_superadmin=') && c.trim().split('=')[1]?.trim().length > 0)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d1bab796-07e5-40b1-a8e1-d8929352e341',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'da8bc1'},body:JSON.stringify({sessionId:'da8bc1',runId:'auth-audit-pre',hypothesisId:'H4',location:'app/superadmin/page.tsx:authEffect',message:'Client superadmin cookie gate evaluated',data:{cookieStringLength:document.cookie.length,hasSuperadminCookie:hasCookie},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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
      const body: Record<string, unknown> = {
        batchName: batchName || `Batch ${new Date().toISOString().slice(0, 10)} | ${filamentBrand} ${color} ${material} | ITW:${itwGrams}g BW:${(itwGrams * batchSize).toFixed(1)}g`,
        batchSize,
        model,
        material,
        color,
        chain: 'BASE',
        targetRanchId: null,
        kitMode: false,
      }
      if (filamentBrand) body.filamentBrand = filamentBrand
      if (itwGrams != null) body.itwGrams = itwGrams
      if (batchSize > 0 && itwGrams != null) body.batchWeightGrams = parseFloat((itwGrams * batchSize).toFixed(1))
      // Omit kitSize — API schema expects number or undefined, not null; we're not in kit mode

      const response = await fetch('/api/factory/batches', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const detailsMsg = errorData.details?.length
          ? ` (${errorData.details.map((d: any) => d.path?.join('.') + ': ' + d.message).join('; ')})`
          : ''
        throw new Error((errorData.error || 'Failed to generate batch') + detailsMsg)
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
      
      // v2.0: Merkle anchoring — all tags are anchored in one tx
      const totalRequested = data.mint_summary?.total || batchSize
      const anchorTx = data.anchor?.tx_hash
      const basescanUrl = data.anchor?.basescan_url

      let message = data.message || `✅ ${totalRequested} tags anchored on Base Mainnet`
      if (anchorTx) {
        message += `\n\n⚓ Anchor tx: ${anchorTx}`
        if (basescanUrl) message += `\nBasescan: ${basescanUrl}`
      }
      if (data.anchor?.merkle_root) {
        message += `\n\nMerkle root: ${data.anchor.merkle_root}`
      }
      message += `\n\nTags will mint as ERC-1155 NFTs when farmers claim them (lazy mint).`
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

  const getOnChainStatus = (device: Device): 'on-chain' | 'anchored' | 'off-chain' | 'error' => {
    if (device.token_id && device.contract_address) {
      return 'on-chain'  // ERC-721 or lazy-minted ERC-1155
    } else if ((device as any).status === 'pre_identity' || ((device as any).metadata_cid || '').startsWith('MERKLE:')) {
      return 'anchored'  // Merkle-anchored, not yet lazy-minted
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
                Generate blockchain-linked tags. One transaction anchors the entire batch on Base Mainnet (ERC-1155). Tags mint as NFTs when farmers claim them.
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
                  {/* Bambu Lab filament swatches + custom entry */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      { name: 'Bambu Yellow', hex: '#F5C518' },
                      { name: 'Bambu Orange', hex: '#F47920' },
                      { name: 'Bambu Red', hex: '#D32F2F' },
                      { name: 'Bambu Green', hex: '#2E7D32' },
                      { name: 'Bambu Blue', hex: '#1565C0' },
                      { name: 'Bambu White', hex: '#F5F5F5' },
                      { name: 'Bambu Black', hex: '#212121' },
                      { name: 'Bambu Gray', hex: '#757575' },
                      { name: 'Mesquite', hex: '#8B6914' },
                      { name: 'Lime', hex: '#A3C639' },
                      { name: 'Pink', hex: '#E91E8C' },
                      { name: 'Purple', hex: '#7B1FA2' },
                    ].map(({ name, hex }) => (
                      <button
                        key={name}
                        type="button"
                        title={name}
                        onClick={() => setColor(name)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === name ? 'border-[var(--c2)] scale-110 ring-2 ring-[var(--c2)]/50' : 'border-white/30'}`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none bg-white text-gray-900 text-sm"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    placeholder="e.g. Bambu Yellow PETG"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Filament Brand</label>
                  <select
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none bg-white text-gray-900"
                    value={filamentBrand}
                    onChange={e => setFilamentBrand(e.target.value)}
                  >
                    <option>Bambu Lab</option>
                    <option>eSUN</option>
                    <option>Polymaker</option>
                    <option>Hatchbox</option>
                    <option>Prusament</option>
                    <option>Overture</option>
                    <option>Generic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    ITW — Individual Tag Weight (g)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none bg-white text-gray-900"
                    value={itwInput}
                    onChange={e => {
                      const raw = e.target.value
                      setItwInput(raw)
                      const normalized = raw.replace(',', '.').trim()
                      if (!normalized) return
                      const valid = /^(\d+(\.\d*)?|\.\d+)$/.test(normalized)
                      if (!valid) return
                      const parsed = Number(normalized)
                      if (Number.isFinite(parsed) && parsed > 0) {
                        setItwGrams(parsed)
                      }
                    }}
                    onBlur={() => {
                      const normalized = itwInput.replace(',', '.').trim()
                      const parsed = Number(normalized)
                      if (Number.isFinite(parsed) && parsed > 0) {
                        const rounded = Math.round(parsed * 100) / 100
                        setItwGrams(rounded)
                        setItwInput(String(rounded))
                      } else {
                        setItwInput(String(itwGrams))
                      }
                    }}
                    placeholder="11"
                  />
                  <p className="text-xs text-[var(--c4)] mt-1">
                    Batch weight: <strong>{(itwGrams * batchSize).toFixed(1)}g</strong> ({((itwGrams * batchSize) / 1000).toFixed(3)}kg)
                  </p>
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
                <div>
                  <label className="block text-sm font-medium mb-2">QR sticker size (print)</label>
                  <div className="flex gap-3 items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="stickerSize"
                        checked={stickerSizeMm === '30mm'}
                        onChange={() => setStickerSizeMm('30mm')}
                        className="text-[var(--c2)]"
                      />
                      <span>30×30 mm</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="stickerSize"
                        checked={stickerSizeMm === '50mm'}
                        onChange={() => setStickerSizeMm('50mm')}
                        className="text-[var(--c2)]"
                      />
                      <span>50×50 mm</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="stickerSize"
                        checked={stickerSizeMm === 'sxsw'}
                        onChange={() => setStickerSizeMm('sxsw')}
                        className="text-[var(--c2)]"
                      />
                      <span>SXSW (45×45 mm)</span>
                    </label>
                  </div>
                  <p className="text-xs text-[var(--c4)] mt-1">Used for all Print QR actions (Assemble & Inventory)</p>
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
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-[var(--c4)]">
                        <span>🎨 {color} · {material} · {filamentBrand}</span>
                        <span>⚖️ ITW: {itwGrams}g · Batch: {(itwGrams * batchSize).toFixed(1)}g ({((itwGrams * batchSize)/1000).toFixed(3)}kg)</span>
                        <span>🖨️ {model}</span>
                      </div>
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
                                {onChainStatus === 'anchored' && (
                                  <span className="px-2 py-1 bg-cyan-900/20 text-cyan-400 rounded text-xs font-semibold">
                                    ⚓ ANCHORED
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
                                    {device.token_id ? formatTokenCode(device) : '❌ NOT READY'}
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
                                    QR Code ({getStickerLabel(stickerSizeMm)})
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
                                  ) : onChainStatus === 'anchored' ? (
                                    <div className="text-center">
                                      <div className="inline-block bg-cyan-900/30 border-2 border-cyan-600 text-cyan-300 px-4 py-2 rounded-lg text-sm font-bold">
                                        ⚓ ANCHORED
                                      </div>
                                      <div className="text-[9px] text-gray-500 mt-1">Merkle proof on-chain · NFT mints at claim</div>
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
        {activeTab === 'assemble' && <AssembleTab stickerSizeMm={stickerSizeMm} />}

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
                      <th className="text-left py-2 px-3">Tag</th>
                      <th className="text-left py-2 px-3">Batch</th>
                      <th className="text-left py-2 px-3">Token Code</th>
                      <th className="text-left py-2 px-3">Status</th>
                      <th className="text-left py-2 px-3">On-Chain</th>
                      <th className="text-left py-2 px-3">Animal</th>
                      <th className="text-left py-2 px-3">Tag Photo</th>
                      <th className="text-left py-2 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((device) => {
                      const onChainStatus = getOnChainStatus(device)
                      const isInInventory = device.status === 'in_inventory'
                      return (
                        <tr key={device.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-2 px-3 font-mono font-semibold">{device.tag_code || device.tag_id}</td>
                          <td className="py-2 px-3">
                            {device.batch_name ? (
                              <span className="font-mono text-xs text-[var(--c2)]">{device.batch_name}</span>
                            ) : (
                              <span className="text-gray-500 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {device.token_id ? (
                              <span className="font-mono text-xs text-[var(--c2)]">{formatTokenCode(device)}</span>
                            ) : (
                              <span className="text-yellow-400 text-xs">Pending mint</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${statusBadge(device.status)}`}>
                              {STATUS_LABELS[device.status] || device.status?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {onChainStatus === 'on-chain' && (
                              <span className="px-2 py-1 bg-green-900/20 text-green-400 rounded text-xs font-semibold">
                                ✅ ON-CHAIN
                              </span>
                            )}
                            {onChainStatus === 'anchored' && (
                              <span className="px-2 py-1 bg-cyan-900/20 text-cyan-400 rounded text-xs font-semibold">
                                ⚓ ANCHORED
                              </span>
                            )}
                            {onChainStatus === 'off-chain' && (
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-yellow-900/20 text-yellow-400 rounded text-xs font-semibold">
                                  ⚪ OFF-CHAIN
                                </span>
                                <button
                                  onClick={async (e) => {
                                    const button = e.currentTarget
                                    const originalText = button.textContent
                                    button.disabled = true
                                    button.textContent = '🔄 Syncing...'
                                    try {
                                      const syncResponse = await fetch('/api/sync-tag', {
                                        method: 'POST',
                                        credentials: 'include',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ tagCode: device.tag_code }),
                                      })
                                      const syncData = await syncResponse.json()
                                      if (syncData.success && syncData.token_id) {
                                        alert(`✅ Tag synced!\n\nToken Code: ${formatTokenCode({ tag_code: device.tag_code, token_id: syncData.token_id, mint_tx_hash: syncData.mint_tx_hash })}\n\nView on Basescan: ${syncData.basescan_url}`)
                                        fetchDevices()
                                        return
                                      }
                                      if (!confirm(`Retry mint for ${device.tag_code}?\n\nThis will attempt to mint the NFT on Base Mainnet.`)) {
                                        button.disabled = false
                                        button.textContent = originalText
                                        return
                                      }
                                      button.textContent = '⏳ Minting...'
                                      const response = await fetch('/api/retry-mint', {
                                        method: 'POST',
                                        credentials: 'include',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ tagCode: device.tag_code }),
                                      })
                                      const data = await response.json()
                                      if (data.success) {
                                        alert(`✅ Mint Successful!\n\nToken Code: ${formatTokenCode({ tag_code: device.tag_code, token_id: data.token_id, mint_tx_hash: data.mint_tx_hash })}\n\nView on Basescan: ${data.basescan_url}`)
                                        fetchDevices()
                                      } else {
                                        let errorMsg = `❌ Mint Failed\n\nError: ${data.message || data.error}\n`
                                        if (data.error_code) errorMsg += `Code: ${data.error_code}\n\n`
                                        if (data.checks?.length) errorMsg += 'Checks:\n' + data.checks.join('\n') + '\n\n'
                                        if (data.errors?.length) errorMsg += 'Errors:\n' + data.errors.join('\n')
                                        alert(errorMsg)
                                      }
                                    } catch (err: any) {
                                      alert(`❌ Network Error: ${err.message}`)
                                    } finally {
                                      button.disabled = false
                                      if (button.textContent !== null) button.textContent = originalText
                                    }
                                  }}
                                  className="px-2 py-1 bg-[var(--c2)] text-white rounded text-xs hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
                              <a href={`/a/${device.public_id}`} className="text-[var(--c2)] hover:underline text-xs">
                                {device.public_id}
                              </a>
                            ) : (
                              <span className="text-gray-500 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {device.assembly_photo_url ? (
                              <a href={device.assembly_photo_url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={device.assembly_photo_url}
                                  alt={`Tag photo ${device.tag_code || device.tag_id}`}
                                  className="w-10 h-10 object-cover rounded border border-green-600/60"
                                />
                              </a>
                            ) : (
                              <span className="text-gray-500 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1 flex-wrap">
                              {/* Print QR — always available */}
                              <button
                                onClick={() => printSingleQR({ ...device, base_qr_url: device.base_qr_url || `https://ranch-link.vercel.app/t/${device.tag_code}` }, stickerSizeMm)}
                                className="px-2 py-1 bg-[var(--bg-secondary)] border border-white/20 text-[var(--c4)] hover:text-white rounded text-xs"
                                title={`Print ${getStickerLabel(stickerSizeMm)} QR sticker`}
                              >
                                🖨️
                              </button>

                              {/* Edit Animal — only for attached tags with a public_id */}
                              {device.public_id && (
                                <a
                                  href={`/a/${device.public_id}?superadmin=1`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 bg-[var(--bg-secondary)] border border-white/20 text-[var(--c4)] hover:text-white rounded text-xs"
                                  title={`Edit animal ${device.public_id}`}
                                >
                                  ✏️
                                </a>
                              )}

                              {/* Status transition dropdown — shown for in_inventory, demo, for_sale */}
                              {['in_inventory', 'demo', 'for_sale', 'assembled'].includes(device.status) && (
                                <select
                                  defaultValue=""
                                  className="text-xs bg-[var(--bg-secondary)] border border-white/20 text-[var(--c4)] rounded px-1 py-1 cursor-pointer hover:border-white/40"
                                  onChange={async (e) => {
                                    const action = e.target.value
                                    if (!action) return
                                    e.target.value = ''
                                    const labels: Record<string, string> = {
                                      mark_demo: 'Mark as Demo',
                                      mark_for_sale: 'List for Sale',
                                      mark_sold: 'Mark as Sold',
                                      ship: 'Mark as Shipped',
                                    }
                                    if (!confirm(`${labels[action] || action} for ${device.tag_code}?`)) return
                                    const r = await fetch('/api/superadmin/assemble', {
                                      method: 'POST',
                                      credentials: 'include',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ tag_id: device.id, action }),
                                    })
                                    if (!r.ok) {
                                      const err = await r.json().catch(() => ({ error: `HTTP ${r.status}` }))
                                      alert(`Action failed: ${err.error || 'Unknown error'}`)
                                    }
                                    await fetchDevices()
                                  }}
                                >
                                  <option value="">Actions ▾</option>
                                  {device.status !== 'demo' && <option value="mark_demo">🎯 Mark as Demo</option>}
                                  {device.status !== 'for_sale' && <option value="mark_for_sale">🏷️ List for Sale</option>}
                                  {device.status !== 'sold' && <option value="mark_sold">💰 Mark as Sold</option>}
                                  <option value="ship">🚚 Ship</option>
                                </select>
                              )}

                              {/* Shipped / Sold — show label only */}
                              {['shipped', 'sold'].includes(device.status) && (
                                <span className="text-xs text-gray-500 italic">
                                  {device.status === 'shipped' ? '🚚 Shipped' : '💰 Sold'}
                                </span>
                              )}
                            </div>
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
                    </div>
                    <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {printable.map((device) => (
                        <div key={device.id} className="border-2 border-white/20 rounded-lg p-3 bg-[var(--bg-card)]">
                          <div className="text-center mb-2">
                            <div className="font-mono font-bold text-sm border-b border-[var(--c2)] pb-1 mb-1">
                              {device.tag_code}
                            </div>
                            <div className="text-[var(--c2)] text-xs font-semibold font-mono break-all">{formatTokenCode(device)}</div>
                            {device.public_id && <div className="text-xs text-[var(--c4)] mt-0.5">{device.public_id}</div>}
                          </div>
                          <div className="bg-white p-2 rounded flex justify-center">
                            <QRCodeDisplay url={device.base_qr_url} size={110} />
                          </div>
                          <div className="text-[10px] text-[var(--c4)] mt-1 text-center break-all">{device.base_qr_url}</div>
                          <button
                            onClick={() => printSingleQR({ ...device, base_qr_url: device.base_qr_url || `https://ranch-link.vercel.app/t/${device.tag_code}` }, stickerSizeMm)}
                            className="mt-2 w-full px-2 py-1.5 bg-[var(--c2)] hover:opacity-80 text-white rounded text-xs font-semibold"
                          >
                            🖨️ Print this QR
                          </button>
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
