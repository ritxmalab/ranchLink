'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function StartPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    token: '',
    email: '',
    phone: '',
    basename: '',
    animalName: '',
    species: 'Cattle',
    breed: '',
    birthYear: new Date().getFullYear() - 1,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Inline camera scanner state
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
    stopScanner()
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
        const code = (window as any).__jsQR_start?.(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
          || jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
        if (code?.data) {
          const tagCode = extractTagCode(code.data)
          if (tagCode) {
            stopScanner(); setScannerOpen(false)
            router.push('/t/' + tagCode); return
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

  useEffect(() => () => stopScanner(), [stopScanner])

  // Extract tag code from any input format:
  //   RL-029              → RL-029  (plain tag code, minimum 3 digits)
  //   RL-029-A3F2B1C4     → RL-029  (token code from sticker)
  //   RL-029-T12345       → RL-029  (token id format)
  //   https://.../t/RL-029 → RL-029 (full URL)
  const extractTagCode = (token: string): string | null => {
    const t = token.trim()
    // Full URL
    const urlMatch = t.match(/\/t\/(RL-\d{3,})/i)
    if (urlMatch) return urlMatch[1].toUpperCase()
    // Token code: RL-029-XXXXXXXX or RL-029-TXXXXX
    const tokenMatch = t.match(/^(RL-\d{3,})-/i)
    if (tokenMatch) return tokenMatch[1].toUpperCase()
    // Plain tag code — require at least 3 digits to avoid RL-0, RL-1, RL-00 etc.
    if (/^RL-\d{3,}$/i.test(t)) return t.toUpperCase()
    return null
  }

  // Auto-redirect only when a complete, unambiguous code is entered.
  // Requires 3+ digit tag number so RL-0 / RL-01 / RL-00 don't trigger early.
  useEffect(() => {
    const t = formData.token.trim()
    const isComplete = /^RL-\d{3,}$/i.test(t) || /^RL-\d{3,}-.{6,}/i.test(t) || /\/t\/RL-\d{3,}/i.test(t)
    if (!isComplete) return
    const code = extractTagCode(t)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/85a8db88-d50f-4beb-ac4a-a5101446f485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'start/page.tsx:auto-redirect',message:'auto-redirect check',data:{input:t,code,isComplete},hypothesisId:'H1',timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    if (code) router.push(`/t/${code}`)
  }, [formData.token, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const code = extractTagCode(formData.token)
    if (code) {
      router.push(`/t/${code}`)
      return
    }

    // LEGACY: Only for old claim_token format (deprecated)
    // v1.0 uses /t/[tag_code] flow instead
    try {
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/a?id=${data.public_id}`)
      } else {
        setError(data.error || 'Failed to claim tag')
      }
    } catch (error) {
      setError('Error claiming tag. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      step >= s
                        ? 'bg-gradient-to-r from-[var(--c2)] to-[var(--c3)] text-white'
                        : 'bg-[var(--bg-card)] text-[var(--c4)] border border-white/20'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        step > s ? 'bg-[var(--c2)]' : 'bg-[var(--bg-card)]'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-[var(--c4)]">
            <span>Scan QR</span>
            <span>Animal Info</span>
            <span>Done!</span>
          </div>
        </div>

        {/* Inline camera scanner overlay */}
        {scannerOpen && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 bg-black/80">
              <span className="text-white font-semibold">📷 Scan Your Tag QR</span>
              <button onClick={() => { stopScanner(); setScannerOpen(false) }} className="text-white text-2xl leading-none">✕</button>
            </div>
            <div className="flex-1 relative flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 border-4 border-[var(--c2)] rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
              </div>
            </div>
            <div className="px-4 py-4 bg-black/80 text-center">
              {scanStatus === 'requesting' && <p className="text-yellow-400 text-sm">Requesting camera…</p>}
              {scanStatus === 'scanning' && <p className="text-green-400 text-sm">Point at the QR code on your tag</p>}
              {scanStatus === 'error' && (
                <div>
                  <p className="text-red-400 text-sm mb-2">{scanError}</p>
                  <button onClick={openScanner} className="text-[var(--c2)] text-sm underline">Try Again</button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="card">
          <h1 className="text-3xl font-bold mb-2">Claim Your Tag</h1>
          <p className="text-gray-600 mb-8">
            Scan the overlay QR code on your tag to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Token */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Camera scan button — primary CTA */}
                <button
                  type="button"
                  onClick={openScanner}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--c2)] to-[var(--c3)] text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:opacity-90 transition-opacity"
                >
                  <span className="text-2xl">📷</span> Scan QR Code
                </button>
                <div className="flex items-center gap-3 text-[var(--c4)] text-sm">
                  <div className="flex-1 h-px bg-white/10" />
                  <span>or type manually</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Token Code
                  </label>
                  <input
                    type="text"
                    value={formData.token}
                    onChange={(e) =>
                      setFormData({ ...formData, token: e.target.value })
                    }
                    placeholder="e.g. RL-029 or RL-029-A3F2B1C4"
                    className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)] placeholder:text-[var(--c4)]"
                  />
                  <p className="text-sm text-[var(--c4)] mt-2">
                    Type the token code printed on the sticker (e.g. <span className="font-mono text-white">RL-029-A3F2B1C4</span>)
                  </p>
                  {error && (
                    <div className="mt-2 p-3 bg-red-900/20 border border-red-700/50 rounded text-red-400 text-sm">
                      {error}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const code = extractTagCode(formData.token)
                    if (code) { router.push(`/t/${code}`); return }
                    if (formData.token.trim()) setStep(2)
                  }}
                  className="btn-primary w-full"
                  disabled={!formData.token}
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Owner & Animal Info */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-white">Your Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)] placeholder:text-[var(--c4)]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)] placeholder:text-[var(--c4)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Ranch/Alias (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.basename}
                        onChange={(e) =>
                          setFormData({ ...formData, basename: e.target.value })
                        }
                        placeholder="e.g., OakHillRanch"
                        className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)] placeholder:text-[var(--c4)]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-white">Animal Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Animal Name *
                      </label>
                      <input
                        type="text"
                        value={formData.animalName}
                        onChange={(e) =>
                          setFormData({ ...formData, animalName: e.target.value })
                        }
                        placeholder="e.g., Bessie"
                        className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)] placeholder:text-[var(--c4)]"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Species
                        </label>
                        <select
                          value={formData.species}
                          onChange={(e) =>
                            setFormData({ ...formData, species: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)] placeholder:text-[var(--c4)]"
                        >
                          <option>Cattle</option>
                          <option>Sheep</option>
                          <option>Goat</option>
                          <option>Pig</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Birth Year
                        </label>
                        <input
                          type="number"
                          value={formData.birthYear}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              birthYear: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)] placeholder:text-[var(--c4)]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Breed
                      </label>
                      <input
                        type="text"
                        value={formData.breed}
                        onChange={(e) =>
                          setFormData({ ...formData, breed: e.target.value })
                        }
                        placeholder="e.g., Angus, Hereford"
                        className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)] placeholder:text-[var(--c4)]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary flex-1"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={loading || !formData.token}
                  >
                    {loading ? 'Processing...' : extractTagCode(formData.token) ? 'Continue to Tag' : 'Claim Tag'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Instructions */}
        <div className="mt-8 card bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] border border-[var(--c2)]/20">
          <h3 className="font-semibold mb-2 text-white">📋 How to Claim</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-[var(--c4)]">
            <li>Scan the overlay QR code on your tag</li>
            <li>Fill in your contact information</li>
            <li>Enter your animal's details</li>
            <li>Peel the overlay to reveal the base QR code</li>
            <li>Share your public animal card!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

