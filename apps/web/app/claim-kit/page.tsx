'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ClaimKitPage() {
  const router = useRouter()
  const [kitCode, setKitCode] = useState('')
  const [ranchName, setRanchName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/claim-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kitCode,
          ranch: {
            name: ranchName,
            contact_email: contactEmail,
            phone: phone || null,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim kit')
      }

      setMessage(`Kit claimed successfully! You can now scan tags to attach them to animals.`)
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      console.error('Claim kit error:', error)
      setErrorMessage(error.message || 'Failed to claim kit')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h1 className="text-3xl font-bold mb-4">Claim Your Ranch Kit</h1>
          <p className="text-[var(--c4)] mb-8">
            Enter your kit code and ranch information to activate your tags.
          </p>

          {message && (
            <div className="bg-green-100 text-green-700 px-4 py-3 rounded mb-4">
              {message}
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Kit Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={kitCode}
                onChange={(e) => setKitCode(e.target.value.toUpperCase())}
                required
                placeholder="RLKIT-XXXXX"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none"
              />
              <p className="text-xs text-[var(--c4)] mt-1">
                Found on the box or insert included with your tags
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Ranch Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ranchName}
                onChange={(e) => setRanchName(e.target.value)}
                required
                placeholder="My Ranch"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Contact Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
                placeholder="ranch@example.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Phone (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[var(--c2)] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`btn-primary w-full ${isSubmitting ? 'opacity-60' : ''}`}
            >
              {isSubmitting ? 'Claiming...' : 'Claim Kit'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-blue-900/20 rounded-lg border border-blue-700/50">
            <h3 className="font-semibold mb-2">What happens next?</h3>
            <ul className="text-sm text-[var(--c4)] space-y-1 list-disc list-inside">
              <li>Your ranch will be created and linked to all tags in this kit</li>
              <li>You can now scan any tag QR code to attach it to an animal</li>
              <li>All tags will be visible in your dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

