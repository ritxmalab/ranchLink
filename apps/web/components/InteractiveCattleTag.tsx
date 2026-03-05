'use client'

const VIDEO_SRC = '/cattle-tag-blue.mp4'

/**
 * Looping blue cattle tag as a seamless floating object — no box, no shadow, no outlines.
 * Motion from video loop + subtle float only.
 */
export default function InteractiveCattleTag() {
  return (
    <div
      className="flex items-center justify-center w-full max-w-[280px] sm:max-w-[320px] mx-auto md:mx-0 md:flex-shrink-0 animate-float"
      role="img"
      aria-label="Blue cattle tag"
    >
      <div className="w-full aspect-[3/4] max-h-[320px] flex items-center justify-center overflow-hidden">
        <video
          src={VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-contain"
          aria-hidden
        />
      </div>
    </div>
  )
}
