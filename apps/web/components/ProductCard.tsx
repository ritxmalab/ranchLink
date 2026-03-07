'use client'

import { useState, useCallback } from 'react'

export type ProductCardProps = {
  id: string
  title: string
  nameCode?: string
  price: string
  material?: string
  itemCount?: number
  features?: string[]
  /** 2–3 image paths (A, B, C variants); first is default */
  images: string[]
  imgBg?: string
  isContact?: boolean
  /** For Stripe checkout; null = use Contact or mailto Buy */
  stripeTierKey?: 'single' | 'five_pack' | 'stack' | null
  selected?: boolean
  onSelect?: () => void
  buyingTierId?: string | null
  onBuy?: (id: string) => void
}

export default function ProductCard({
  id,
  title,
  nameCode,
  price,
  material,
  itemCount,
  features = [],
  images,
  imgBg = 'bg-[var(--c2)]/10',
  isContact = false,
  stripeTierKey = null,
  selected = false,
  onSelect,
  buyingTierId,
  onBuy,
}: ProductCardProps) {
  const [hoverIndex, setHoverIndex] = useState(0)
  const hasMultiple = images.length > 1

  const cycleImage = useCallback(() => {
    if (!hasMultiple) return
    setHoverIndex((i) => (i + 1) % images.length)
  }, [hasMultiple, images.length])

  const handleMouseEnter = useCallback(() => {
    if (images.length >= 2) setHoverIndex(1)
  }, [images.length])

  const handleMouseLeave = useCallback(() => {
    setHoverIndex(0)
  }, [])

  const canCheckout = stripeTierKey && onBuy
  const isBuying = buyingTierId === id

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.()}
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        product-card text-left rounded-xl overflow-hidden transition-all duration-200 p-4 cursor-pointer min-w-0
        border-2
        hover:border-[var(--c2)] hover:shadow-xl hover:shadow-[var(--c2)]/20
        ${selected
          ? 'border-[var(--c2)] shadow-xl shadow-[var(--c2)]/25 bg-[var(--c2)]/20'
          : 'border-[#1F2937] bg-[var(--bg-card)]'
        }
      `}
    >
      <div
        className={`relative aspect-[4/3] overflow-hidden rounded-lg p-2 ${imgBg} flex items-center justify-center`}
        onClick={(e) => { e.stopPropagation(); cycleImage(); }}
        role="img"
        aria-label={images.length > 1 ? `${title} view ${hoverIndex + 1} of ${images.length}` : title}
      >
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full object-contain object-center transition-opacity duration-200"
            style={{ opacity: i === hoverIndex ? 1 : 0, zIndex: i === hoverIndex ? 1 : 0 }}
            loading="lazy"
          />
        ))}
      </div>

      <div className="pt-4">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h3 className="text-xl sm:text-2xl font-bold truncate">{title}</h3>
          {nameCode && (
            <span className="text-xs text-[var(--c4)] font-mono shrink-0">{nameCode}</span>
          )}
        </div>
        {(material != null || itemCount != null) && (
          <p className="text-xs text-[var(--c4)] mb-1">
            {itemCount != null && `${itemCount} tag${itemCount !== 1 ? 's' : ''}`}
            {itemCount != null && material != null && ' · '}
            {material}
          </p>
        )}
        <p className={`font-bold mb-3 ${isContact ? 'text-base sm:text-lg text-[var(--c2)]' : 'text-2xl sm:text-3xl text-[var(--c2)]'}`}>
          {price}
        </p>
        {features.length > 0 && (
          <ul className="text-sm text-[var(--c4)] space-y-1 mb-3">
            {features.map((f) => (
              <li key={f}>✓ {f}</li>
            ))}
          </ul>
        )}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {isContact ? (
            <a
              href="mailto:hello@ritxma.com?subject=RanchLink%20Custom%20Order"
              className="flex-1 py-2 px-3 text-sm font-medium rounded-lg bg-[var(--c2)] text-white hover:opacity-90 transition-opacity text-center"
            >
              Contact Us
            </a>
          ) : (
            <>
              <button
                type="button"
                disabled
                className="flex-1 py-2 px-3 text-sm font-medium rounded-lg bg-[var(--bg-secondary)] text-[var(--c4)] cursor-not-allowed"
              >
                Add to cart (soon)
              </button>
              {canCheckout ? (
                <button
                  type="button"
                  className="py-2 px-3 text-sm font-medium rounded-lg border border-[var(--c2)] text-[var(--c2)] hover:bg-[var(--c2)]/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isBuying}
                  onClick={() => onBuy?.(id)}
                >
                  {isBuying ? 'Redirecting…' : 'Buy'}
                </button>
              ) : (
                <a
                  href={`mailto:hello@ritxma.com?subject=RanchLink%20Order&body=Product:%20${encodeURIComponent(title + (nameCode ? ` (${nameCode})` : ''))}`}
                  className="py-2 px-3 text-sm font-medium rounded-lg border border-[var(--c2)] text-[var(--c2)] hover:bg-[var(--c2)]/10 transition-colors text-center"
                >
                  Buy
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
