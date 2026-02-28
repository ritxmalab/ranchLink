'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function ScanPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)

  const [status, setStatus] = useState<'idle' | 'requesting' | 'scanning' | 'found' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [foundCode, setFoundCode] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [torchOn, setTorchOn] = useState(false)
  const [showManual, setShowManual] = useState(false)

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  const handleFound = useCallback((url: string) => {
    const match = url.match(/\/t\/(RL-\d+)/i)
    if (!match) return false
    const tagCode = match[1].toUpperCase()
    setFoundCode(tagCode)
    setStatus('found')
    stopCamera()
    setTimeout(() => router.push('/t/' + tagCode), 1200)
    return true
  }, [router, stopCamera])

  const startCamera = useCallback(async () => {
    setStatus('requesting')
    setErrorMsg('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStatus('scanning')
      const jsQR = (await import('jsqr')).default
      const scan = () => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
          rafRef.current = requestAnimationFrame(scan)
          return
        }
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
        if (code?.data) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/85a8db88-d50f-4beb-ac4a-a5101446f485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'scan/page.tsx:68',message:'QR detected - handleFound result',data:{raw:code.data,matched:handleFound(code.data)},hypothesisId:'H15',timestamp:Date.now()})}).catch(()=>{});
          // #endregion
          // Only stop looping if handleFound recognised the code (returns true).
          // Non-RanchLink QR codes return false — keep scanning.
          if (handleFound(code.data)) return
        }
        rafRef.current = requestAnimationFrame(scan)
      }
      rafRef.current = requestAnimationFrame(scan)
    } catch (err: any) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access and try again.'
        : err.name === 'NotFoundError'
        ? 'No camera found on this device.'
        : 'Camera error: ' + err.message
      setErrorMsg(msg)
      setStatus('error')
      setShowManual(true)
    }
  }, [handleFound])

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      await (track as any).applyConstraints({ advanced: [{ torch: !torchOn }] })
      setTorchOn(t => !t)
    } catch { /* torch not supported */ }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const code = manualCode.trim().toUpperCase()
    if (!code.match(/^RL-\d+$/)) { alert('Enter a valid tag code like RL-001'); return }
    router.push('/t/' + code)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        style={{ opacity: status === 'scanning' ? 1 : 0.3 }}
      />
      <canvas ref={canvasRef} className="hidden" />

      {status === 'scanning' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-64 h-64">
            <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-lg" />
            <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent scan-line" />
          </div>
        </div>
      )}

      <style>{`
        @keyframes scanLine {
          0% { top: 8px; opacity: 1; }
          50% { top: calc(100% - 8px); opacity: 0.6; }
          100% { top: 8px; opacity: 1; }
        }
        .scan-line { animation: scanLine 2s ease-in-out infinite; position: absolute; }
      `}</style>

      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent z-10">
        <button onClick={() => { stopCamera(); router.back() }} className="text-white text-sm bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg backdrop-blur-sm">
          ← Back
        </button>
        <span className="text-white font-semibold text-sm">Scan RanchLink Tag</span>
        <button
          onClick={toggleTorch}
          className={'text-sm px-3 py-2 rounded-lg backdrop-blur-sm ' + (torchOn ? 'bg-yellow-400/80 text-black' : 'bg-white/10 text-white hover:bg-white/20')}
        >
          {torchOn ? '🔦 On' : '🔦'}
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent z-10">
        {status === 'requesting' && (
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
            <p className="text-sm">Requesting camera access...</p>
          </div>
        )}
        {status === 'scanning' && (
          <div className="text-center text-white mb-4">
            <p className="text-sm text-gray-300">Point at the QR code on the cattle tag</p>
          </div>
        )}
        {status === 'found' && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-green-500/90 text-white px-6 py-3 rounded-2xl text-lg font-bold mb-2">
              ✅ Found: {foundCode}
            </div>
            <p className="text-gray-300 text-sm">Opening tag registration...</p>
          </div>
        )}
        {status === 'error' && (
          <div className="text-center mb-4">
            <p className="text-red-400 text-sm mb-3">{errorMsg}</p>
            <button onClick={startCamera} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm mr-2">
              Try Again
            </button>
          </div>
        )}
        <div className="mt-2">
          <button onClick={() => setShowManual(v => !v)} className="w-full text-center text-gray-400 text-xs hover:text-white transition-colors py-1">
            {showManual ? '▲ Hide' : '⌨️ Enter tag code manually'}
          </button>
          {showManual && (
            <form onSubmit={handleManualSubmit} className="flex gap-2 mt-2">
              <input
                type="text"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder="RL-001"
                className="flex-1 bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-white/50 uppercase"
                autoCapitalize="characters"
                autoCorrect="off"
              />
              <button type="submit" className="bg-white text-black font-semibold px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
                Go →
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
