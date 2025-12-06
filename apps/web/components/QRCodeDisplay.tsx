'use client'

import { useEffect, useState } from 'react'

interface QRCodeDisplayProps {
  url: string
  size?: number
  className?: string
}

export default function QRCodeDisplay({ url, size = 200, className = '' }: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Dynamically import QRCode only on client side
    import('qrcode').then((QRCode) => {
      QRCode.default
        .toDataURL(url, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
        .then((dataUrl) => {
          setQrDataUrl(dataUrl)
          setLoading(false)
        })
        .catch((error) => {
          console.error('QR generation error:', error)
          setLoading(false)
        })
    })
  }, [url, size])

  if (loading) {
    return (
      <div
        className={`bg-gray-100 animate-pulse rounded ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    )
  }

  if (!qrDataUrl) {
    return (
      <div
        className={`bg-red-100 rounded flex items-center justify-center text-red-600 text-xs ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        QR Error
      </div>
    )
  }

  return (
    <img
      src={qrDataUrl}
      alt="QR Code"
      className={className}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  )
}


