'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

const IMG_SRC = '/cattle-tag-rotating.png'

export default function InteractiveCattleTag() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragRotation, setDragRotation] = useState(0)
  const [scrollRotation, setScrollRotation] = useState(0)
  const [clickSpin, setClickSpin] = useState(0)
  const dragStart = useRef<{ x: number; base: number } | null>(null)

  useEffect(() => {
    const section = containerRef.current?.closest('section')
    if (!section) return
    const onScroll = () => {
      const rect = section.getBoundingClientRect()
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800
      const center = rect.top + rect.height / 2
      if (center >= 0 && center <= vh) {
        const t = Math.max(0, Math.min(1, 1 - rect.top / vh))
        setScrollRotation(t * 180)
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragStart.current = { x: e.clientX, base: dragRotation }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }, [dragRotation])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragStart.current === null) return
    setDragRotation(dragStart.current.base + (e.clientX - dragStart.current.x))
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    dragStart.current = null
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
  }, [])

  const handleClick = useCallback(() => {
    setClickSpin((s) => s + 360)
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center w-full max-w-[280px] sm:max-w-[320px] mx-auto md:mx-0 md:flex-shrink-0 cursor-grab active:cursor-grabbing select-none touch-none animate-float"
      style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleClick}
      role="img"
      aria-label="Rotating cattle tag — drag, scroll, or click to spin"
    >
      <div
        className="w-full aspect-[3/4] max-h-[320px] flex items-center justify-center will-change-transform transition-transform duration-300"
        style={{
          transform: `rotateY(${dragRotation + scrollRotation + clickSpin}deg)`,
          transformStyle: 'preserve-3d',
          filter: 'drop-shadow(0 20px 25px rgba(0,0,0,0.15)) drop-shadow(0 8px 10px rgba(0,0,0,0.1))',
        }}
      >
        <div className="w-full h-full animate-cattle-tag-spin">
          <img
            src={IMG_SRC}
            alt=""
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        </div>
      </div>
    </div>
  )
}
