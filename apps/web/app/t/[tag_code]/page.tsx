'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
  const [mintingStep, setMintingStep] = useState(0) // 0=idle, 1=saving, 2=ipfs, 3=blockchain, 4=done, -1=error
  const [mintingError, setMintingError] = useState<{ message: string; code: string; step: string } | null>(null)

  // ── Inline QR camera scanner ──────────────────────────────────────────────
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanStatus, setScanStatus] = useState<'requesting' | 'scanning' | 'error'>('requesting')
  const [scanError, setScanError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)

  const stopScanner = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const openScanner = useCallback(async () => {
    setScannerOpen(true)
    setScanStatus('requesting')
    setScanError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      await new Promise(r => setTimeout(r, 150))
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setScanStatus('scanning')
      const jsQR = (await import('jsqr')).default
      const scan = () => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
          rafRef.current = requestAnimationFrame(scan); return
        }
        canvas.width = video.videoWidth; canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
        if (code?.data) {
          const match = code.data.match(/\/t\/(RL-\d+)/i)
          if (match) {
            stopScanner(); setScannerOpen(false)
            router.push('/t/' + match[1].toUpperCase()); return
          }
        }
        rafRef.current = requestAnimationFrame(scan)
      }
      rafRef.current = requestAnimationFrame(scan)
    } catch (err: any) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied — allow camera access in your browser settings.'
        : err.name === 'NotFoundError' ? 'No camera found on this device.'
        : 'Camera error: ' + err.message
      setScanError(msg); setScanStatus('error')
    }
  }, [router, stopScanner])

  const closeScanner = useCallback(() => { stopScanner(); setScannerOpen(false) }, [stopScanner])

  useEffect(() => () => stopScanner(), [stopScanner])

  // BASIC
  const [animalName, setAnimalName] = useState('')
  const [species, setSpecies] = useState('Cattle')
  const [breed, setBreed] = useState('')
  const [birthYear, setBirthYear] = useState<number | ''>('')
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

  const fetchTag = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tags/${tag_code}`)
      if (!response.ok) {
        setError(response.status === 404 ? 'Tag not found' : 'Failed to load tag')
        return
      }
      const data = await response.json()

      // Redirect to animal card if already attached
      // Use tag.public_id first (most reliable), fall back to animals join
      const attachedPublicId = data.tag?.public_id || data.tag?.animals?.public_id
      if (data.tag?.animal_id && attachedPublicId) {
        router.push(`/a/${attachedPublicId}`)
        return
      }

      setTag(data.tag)
    } catch (err) {
      console.error('Error fetching tag:', err)
      setError('Failed to load tag')
    } finally {
      setLoading(false)
    }
  }, [tag_code, router])

  useEffect(() => {
    fetchTag()
  }, [fetchTag])

  const handleAttach = async (e: React.FormEvent) => {
    e.preventDefault()
    setAttaching(true)
    setMintingStep(1)
    setError(null)

    try {
      // Step 1: Upload photo if provided
      let photoUrl: string | undefined
      if (photoFile) {
        setPhotoUploading(true)
        setMintingStep(1)
        const photoForm = new FormData()
        photoForm.append('file', photoFile)
        const photoRes = await fetch('/api/upload-photo', { method: 'POST', body: photoForm })
        const photoData = await photoRes.json()
        if (photoRes.ok && photoData.photo_url) photoUrl = photoData.photo_url
        setPhotoUploading(false)
      }

      setMintingStep(2) // Pinning to IPFS

      const response = await fetch('/api/attach-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagCode: tag_code,
          animalData: {
            name: animalName, species,
            breed: breed || undefined, birth_year: birthYear || undefined,
            sex: sex || undefined, size: size || undefined,
            eid: eid || undefined, secondary_id: secondaryId || undefined,
            tattoo: tattoo || undefined, brand: brand || undefined,
            owner: owner || undefined,
            head_count: headCount ? parseInt(headCount) : undefined,
            labels: labels ? labels.split(',').map((l) => l.trim()).filter(Boolean) : undefined,
            dam_id: damId || undefined, sire_id: sireId || undefined,
            birth_weight: birthWeight ? parseFloat(birthWeight) : undefined,
            weaning_weight: weaningWeight ? parseFloat(weaningWeight) : undefined,
            weaning_date: weaningDate || undefined,
            yearling_weight: yearlingWeight ? parseFloat(yearlingWeight) : undefined,
            yearling_date: yearlingDate || undefined,
            photo_url: photoUrl || undefined,
            seller: seller || undefined,
            purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
            purchase_date: purchaseDate || undefined,
          },
        }),
      })

      setMintingStep(3) // Minting on blockchain

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to attach tag')

      setMintingStep(4) // Done
      setAttachSuccess(true)

      // Give the user 3 seconds to see the success screen before redirecting
      setTimeout(() => {
        router.push(`/a/${data.public_id}`)
      }, 3000)
    } catch (err: any) {
      console.error('Attach error:', err)
      const stepNames = ['', 'Saving data', 'Pinning to IPFS', 'Blockchain mint', 'Finalizing']
      const failedAt = mintingStep > 0 ? stepNames[mintingStep] || 'Processing' : 'Processing'
      const rawMsg: string = err.message || 'Unknown error'
      // Extract a short error code from the message for display
      const code = rawMsg.includes('MINTER') ? 'ERR_MINTER_ROLE'
        : rawMsg.includes('balance') || rawMsg.includes('funds') ? 'ERR_INSUFFICIENT_FUNDS'
        : rawMsg.includes('network') || rawMsg.includes('fetch') ? 'ERR_NETWORK'
        : rawMsg.includes('proof') || rawMsg.includes('Merkle') ? 'ERR_MERKLE_PROOF'
        : rawMsg.includes('IPFS') || rawMsg.includes('Pinata') ? 'ERR_IPFS_PIN'
        : rawMsg.includes('already') ? 'ERR_ALREADY_ATTACHED'
        : rawMsg.includes('not found') || rawMsg.includes('404') ? 'ERR_TAG_NOT_FOUND'
        : `ERR_${Date.now().toString(36).toUpperCase()}`
      setMintingError({ message: rawMsg, code, step: failedAt })
      setMintingStep(-1)
      setError(rawMsg)
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

  // ── Full-screen minting overlay ──────────────────────────────────────────
  if (mintingStep !== 0) {
    const steps = [
      { label: 'Saving animal data', icon: '💾' },
      { label: 'Pinning to IPFS', icon: '📌' },
      { label: 'Tokenizing on Base blockchain', icon: '⛓️' },
      { label: 'Your animal is on-chain!', icon: '🎉' },
    ]
    const isDone = mintingStep === 4
    const isError = mintingStep === -1

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sky-900 via-blue-950 to-[var(--bg)] overflow-hidden relative px-4">

        {/* Animated clouds */}
        <style>{`
          @keyframes cloud1 { 0%{transform:translateX(-120px)} 100%{transform:translateX(calc(100vw + 120px))} }
          @keyframes cloud2 { 0%{transform:translateX(-200px)} 100%{transform:translateX(calc(100vw + 200px))} }
          @keyframes cloud3 { 0%{transform:translateX(-160px)} 100%{transform:translateX(calc(100vw + 160px))} }
          @keyframes flyAcross { 0%{transform:translateX(-140px) translateY(0px) scaleX(1)} 40%{transform:translateX(35vw) translateY(-18px) scaleX(1)} 60%{transform:translateX(55vw) translateY(-8px) scaleX(1)} 100%{transform:translateX(calc(100vw + 140px)) translateY(0px) scaleX(1)} }
          @keyframes flyDone { 0%{transform:translateX(-140px) translateY(0px)} 100%{transform:translateX(calc(50vw - 60px)) translateY(-10px)} }
          @keyframes bobble { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-12px)} }
          @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          @keyframes progressFill { from{width:0%} to{width:var(--target-w)} }
          @keyframes sparkle { 0%,100%{opacity:0;transform:scale(0.5)} 50%{opacity:1;transform:scale(1.2)} }
          .cloud { position:absolute; border-radius:50px; background:rgba(255,255,255,0.18); }
          .cloud::before,.cloud::after { content:''; position:absolute; background:rgba(255,255,255,0.18); border-radius:50%; }
        `}</style>

        {/* Cloud layer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="cloud" style={{width:180,height:50,top:'18%',animation:'cloud1 8s linear infinite',animationDelay:'-2s'}}>
            <div style={{position:'absolute',width:80,height:80,background:'rgba(255,255,255,0.15)',borderRadius:'50%',top:-35,left:20}}/>
            <div style={{position:'absolute',width:60,height:60,background:'rgba(255,255,255,0.12)',borderRadius:'50%',top:-25,left:80}}/>
          </div>
          <div className="cloud" style={{width:140,height:40,top:'32%',animation:'cloud2 12s linear infinite',animationDelay:'-5s'}}>
            <div style={{position:'absolute',width:60,height:60,background:'rgba(255,255,255,0.13)',borderRadius:'50%',top:-28,left:15}}/>
            <div style={{position:'absolute',width:50,height:50,background:'rgba(255,255,255,0.1)',borderRadius:'50%',top:-20,left:65}}/>
          </div>
          <div className="cloud" style={{width:220,height:55,top:'55%',animation:'cloud3 10s linear infinite',animationDelay:'-1s'}}>
            <div style={{position:'absolute',width:90,height:90,background:'rgba(255,255,255,0.14)',borderRadius:'50%',top:-40,left:30}}/>
            <div style={{position:'absolute',width:70,height:70,background:'rgba(255,255,255,0.11)',borderRadius:'50%',top:-30,left:110}}/>
          </div>
        </div>

        {/* Flying cow */}
        <div
          className="absolute"
          style={{
            top: '30%',
            fontSize: 72,
            animation: isDone
              ? 'bobble 1.4s ease-in-out infinite'
              : 'flyAcross 3.6s cubic-bezier(0.4,0,0.6,1) infinite',
            zIndex: 10,
            filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))',
            ...(isDone ? { position: 'relative', top: 'auto' } : {}),
          }}
        >
          🐄
        </div>

        {/* Content card */}
        <div className="relative z-20 text-center max-w-sm w-full mt-32">

          {isError ? (
            <div style={{animation:'fadeIn 0.4s ease-out'}}>
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-white mb-1">Something went wrong</h2>
              <p className="text-red-300 text-sm mb-5">
                Failed during: <span className="font-semibold text-red-200">{mintingError?.step}</span>
              </p>

              {/* Error code badge */}
              <div className="inline-flex items-center gap-2 bg-red-950/60 border border-red-700/50 rounded-lg px-4 py-2 mb-4">
                <span className="text-red-400 text-xs font-mono tracking-wider">{mintingError?.code}</span>
              </div>

              {/* Error message */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left">
                <p className="text-gray-400 text-xs font-mono leading-relaxed break-words">
                  {mintingError?.message}
                </p>
              </div>

              <p className="text-sky-400 text-sm mb-6">
                Your animal data was <span className="text-green-400 font-semibold">saved</span> — only the blockchain step may need to be retried.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setMintingStep(0)
                    setMintingError(null)
                    setError(null)
                  }}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
                >
                  ↩ Try Again
                </button>
                <button
                  onClick={() => {
                    // Copy error code to clipboard
                    navigator.clipboard?.writeText(`${mintingError?.code}: ${mintingError?.message}`)
                      .then(() => alert('Error copied to clipboard'))
                      .catch(() => {})
                  }}
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-colors border border-white/10"
                >
                  📋 Copy error for support
                </button>
              </div>
            </div>
          ) : isDone ? (
            <div style={{animation:'fadeIn 0.5s ease-out'}}>
              <div className="text-6xl mb-4" style={{animation:'bobble 1.2s ease-in-out infinite'}}>🎉</div>
              <h2 className="text-3xl font-bold text-white mb-2">Animal Registered!</h2>
              <p className="text-sky-300 mb-6">Your livestock is now a verified on-chain asset on Base.</p>
              <div className="flex gap-2 justify-center mb-6">
                {['⚡','🔗','✅'].map((s,i) => (
                  <span key={i} style={{fontSize:24,animation:`sparkle 1s ease-in-out infinite`,animationDelay:`${i*0.3}s`}}>{s}</span>
                ))}
              </div>
              <p className="text-sky-400 text-sm">Taking you to your animal card...</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">Tokenizing RWA</h2>
              <p className="text-sky-300 text-sm mb-8">Registering your animal on the blockchain — hold on!</p>

              {/* Step list */}
              <div className="space-y-3 mb-8 text-left">
                {steps.map((step, idx) => {
                  const stepNum = idx + 1
                  const done = mintingStep > stepNum
                  const active = mintingStep === stepNum
                  return (
                    <div key={idx} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
                      done ? 'bg-green-900/40 border border-green-700/50'
                      : active ? 'bg-blue-900/50 border border-blue-500/60 shadow-lg shadow-blue-900/30'
                      : 'bg-white/5 border border-white/10 opacity-40'
                    }`}>
                      <span className="text-xl">
                        {done ? '✅' : active ? (
                          <span style={{display:'inline-block',animation:'bobble 0.8s ease-in-out infinite'}}>{step.icon}</span>
                        ) : step.icon}
                      </span>
                      <span className={`text-sm font-medium ${done ? 'text-green-300' : active ? 'text-white' : 'text-gray-500'}`}>
                        {step.label}
                      </span>
                      {active && (
                        <span className="ml-auto flex gap-1">
                          {[0,1,2].map(i => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400"
                              style={{animation:`sparkle 1s ease-in-out infinite`,animationDelay:`${i*0.2}s`}}/>
                          ))}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(((mintingStep - 1) / 3) * 100, 90)}%` }}
                />
              </div>
              <p className="text-sky-500 text-xs mt-2">{Math.round(Math.min(((mintingStep - 1) / 3) * 100, 90))}% complete</p>
            </>
          )}
        </div>
      </div>
    )
  }

  const basescanUrl = tag.token_id ? getBasescanUrl(BigInt(tag.token_id)) : null
  // pre_identity = Merkle-anchored ERC-1155 tag — valid for attachment (lazy mints at claim)
  const onChainStatus: 'on-chain' | 'anchored' | 'off-chain' =
    tag.token_id && tag.contract_address ? 'on-chain'
    : tag.status === 'pre_identity' ? 'anchored'
    : 'off-chain'

  return (
    <div className="min-h-screen bg-[var(--bg)] py-8 px-4">

      {/* ── Inline camera scanner overlay ── */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scan frame */}
          {scanStatus === 'scanning' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-64">
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-lg" />
                <style>{`@keyframes scanLine{0%{top:8px;opacity:1}50%{top:calc(100% - 8px);opacity:.6}100%{top:8px;opacity:1}}.scan-anim{animation:scanLine 2s ease-in-out infinite;position:absolute;}`}</style>
                <div className="scan-anim left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent" />
              </div>
            </div>
          )}

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
            <button onClick={closeScanner} className="text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
              ✕ Cancel
            </button>
            <span className="text-white font-semibold text-sm">Point at RanchLink QR</span>
            <div className="w-20" />
          </div>

          {/* Bottom status */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent z-10 text-center">
            {scanStatus === 'requesting' && (
              <div className="text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
                <p className="text-sm">Requesting camera...</p>
              </div>
            )}
            {scanStatus === 'scanning' && <p className="text-gray-300 text-sm">Point the camera at the QR code on the cattle tag</p>}
            {scanStatus === 'error' && (
              <div>
                <p className="text-red-400 text-sm mb-3">{scanError}</p>
                <button onClick={openScanner} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm mr-2">Try Again</button>
                <button onClick={closeScanner} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm">Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">

        {/* Tag Info Card */}
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-4 gap-3">
            <div>
              <h1 className="text-3xl font-bold">Tag: {tag_code}</h1>
              <button
                onClick={openScanner}
                className="mt-2 flex items-center gap-1.5 text-xs text-[var(--c2)] hover:underline"
              >
                📷 Scan a different tag
              </button>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold flex-shrink-0 ${
              onChainStatus === 'on-chain' ? 'bg-green-900/20 text-green-400'
              : onChainStatus === 'anchored' ? 'bg-cyan-900/20 text-cyan-400'
              : 'bg-yellow-900/20 text-yellow-400'
            }`}>
              {onChainStatus === 'on-chain' ? '✅ ON-CHAIN'
               : onChainStatus === 'anchored' ? '⚓ ANCHORED'
               : '⚪ OFF-CHAIN'}
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

            {onChainStatus === 'anchored' && (
              <div className="mb-4 p-4 bg-cyan-900/20 border border-cyan-700/50 rounded-lg">
                <p className="text-cyan-400 font-semibold mb-1">⚓ Tag Anchored On-Chain</p>
                <p className="text-cyan-300 text-sm">
                  This tag has a verified on-chain identity. Your NFT will be minted when you attach your animal.
                </p>
              </div>
            )}
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

            {/* Success state is handled by the full-screen minting overlay above */}

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
                    onChange={(e) => setBirthYear(e.target.value === '' ? '' : parseInt(e.target.value))}
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
                  // anchored and on-chain are both valid — only off-chain blocks submission
                >
                  {attaching ? '⛓️ Processing...' : '🐄 Attach Animal'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
