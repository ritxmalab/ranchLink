'use client'

const IMG_SRC = '/cattle-tag-rotating.png'

/**
 * Lightweight 3D-style floating cattle tag: single PNG + CSS animation.
 * Always animates (no JS), respects prefers-reduced-motion via CSS.
 */
export default function InteractiveCattleTag() {
  return (
    <div
      className="flex items-center justify-center w-full max-w-[120px] sm:max-w-[240px] md:max-w-[320px] lg:max-w-[380px] mx-auto md:mx-0 flex-shrink-0"
      style={{ perspective: '800px' }}
      role="img"
      aria-label="Blue cattle tag"
    >
      <div
        className="w-full aspect-[3/4] max-h-[160px] sm:max-h-[300px] md:max-h-[380px] lg:max-h-[440px] flex items-center justify-center overflow-hidden animate-float-3d"
        style={{ transformStyle: 'preserve-3d' }}
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
