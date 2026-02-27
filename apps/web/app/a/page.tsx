'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function RedirectContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get('id')

  useEffect(() => {
    if (id) {
      router.replace(`/a/${id}`)
    } else {
      router.replace('/')
    }
  }, [id, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--c2)] mx-auto mb-4" />
        <p className="text-[var(--c4)]">Redirecting...</p>
      </div>
    </div>
  )
}

export default function AnimalCardRedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--c2)]" />
      </div>
    }>
      <RedirectContent />
    </Suspense>
  )
}
