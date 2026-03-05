'use client'

const VIDEO_SRC = '/cattle-tag-blue.mp4'

/**
 * Displays your actual blue cattle tag video, looped and with a subtle float.
 * No fake rotation — the video's motion is the only rotation.
 */
export default function InteractiveCattleTag() {
  return (
    <div
      className="flex items-center justify-center w-full max-w-[280px] sm:max-w-[320px] mx-auto md:mx-0 md:flex-shrink-0 animate-float"
      style={{
        filter: 'drop-shadow(0 20px 25px rgba(0,0,0,0.15)) drop-shadow(0 8px 10px rgba(0,0,0,0.1))',
      }}
      role="img"
      aria-label="Blue cattle tag"
    >
      <div className="w-full aspect-[3/4] max-h-[320px] flex items-center justify-center overflow-hidden rounded-lg">
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
