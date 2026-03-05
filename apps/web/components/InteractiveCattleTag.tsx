'use client'

import { useEffect, useRef, useState } from 'react'

const IMG_SRC = '/cattle-tag-rotating.png'

/**
 * Lightweight 3D-style floating cattle tag: single PNG + CSS animation.
 * Pauses when off-screen, respects prefers-reduced-motion. No video, no shadows, no box.
 */
export default function InteractiveCattleTag() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(true)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.2, rootMargin: '40px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center w-full max-w-[120px] sm:max-w-[240px] md:max-w-[340px] lg:max-w-[400px] mx-auto md:mx-0 flex-shrink-0"
      style={{ perspective: '800px' }}
      role="img"
      aria-label="Blue cattle tag"
    >
      <div
        className="w-full aspect-[3/4] max-h-[160px] sm:max-h-[300px] md:max-h-[380px] lg:max-h-[440px] flex items-center justify-center overflow-hidden animate-float-3d"
        style={{
          transformStyle: 'preserve-3d',
          animationPlayState: isInView ? 'running' : 'paused',
        }}
      >
        <img
          src={IMG_SRC}
          alt=""
          className="w-full h-full object-contain"
          draggable={false}
          fetchPriority="high"
        />
      </div>
    </div>
  )
}
