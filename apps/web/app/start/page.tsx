'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StartPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    token: '',
    email: '',
    phone: '',
    basename: '',
    animalName: '',
    species: 'Cattle',
    breed: '',
    birthYear: new Date().getFullYear() - 1,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if token looks like a tag_code (RL-XXX format)
  const isTagCode = (token: string) => {
    return /^RL-\d+$/i.test(token.trim())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // If token looks like a tag_code, redirect to v1.0 flow
    if (isTagCode(formData.token)) {
      router.push(`/t/${formData.token.trim().toUpperCase()}`)
      return
    }

    // Otherwise, try legacy claim flow
    try {
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/a?id=${data.public_id}`)
      } else {
        setError(data.error || 'Failed to claim tag')
      }
    } catch (error) {
      setError('Error claiming tag. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      step >= s
                        ? 'bg-gradient-to-r from-[var(--c2)] to-[var(--c3)] text-white'
                        : 'bg-[var(--bg-card)] text-[var(--c4)] border border-white/20'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        step > s ? 'bg-[var(--c2)]' : 'bg-[var(--bg-card)]'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-[var(--c4)]">
            <span>Scan QR</span>
            <span>Animal Info</span>
            <span>Done!</span>
          </div>
        </div>

        <div className="card">
          <h1 className="text-3xl font-bold mb-2">Claim Your Tag</h1>
          <p className="text-gray-600 mb-8">
            Scan the overlay QR code on your tag to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Token */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Claim Token
            </label>
                  <input
                    type="text"
                    value={formData.token}
                    onChange={(e) =>
                      setFormData({ ...formData, token: e.target.value })
                    }
                    placeholder="Scan QR code or enter token"
                    className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)] placeholder:text-[var(--c4)]"
                    required
                  />
                  <p className="text-sm text-[var(--c4)] mt-2">
                    Scan the QR code on your tag, or enter the tag code (e.g., RL-001)
                  </p>
                  {error && (
                    <div className="mt-2 p-3 bg-red-900/20 border border-red-700/50 rounded text-red-400 text-sm">
                      {error}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-primary w-full"
                  disabled={!formData.token}
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Owner & Animal Info */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-white">Your Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)] placeholder:text-[var(--c4)]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)] placeholder:text-[var(--c4)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Ranch/Alias (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.basename}
                        onChange={(e) =>
                          setFormData({ ...formData, basename: e.target.value })
                        }
                        placeholder="e.g., OakHillRanch"
                        className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)] placeholder:text-[var(--c4)]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-white">Animal Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Animal Name *
                      </label>
                      <input
                        type="text"
                        value={formData.animalName}
                        onChange={(e) =>
                          setFormData({ ...formData, animalName: e.target.value })
                        }
                        placeholder="e.g., Bessie"
                        className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)] placeholder:text-[var(--c4)]"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Species
                        </label>
                        <select
                          value={formData.species}
                          onChange={(e) =>
                            setFormData({ ...formData, species: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)] placeholder:text-[var(--c4)]"
                        >
                          <option>Cattle</option>
                          <option>Sheep</option>
                          <option>Goat</option>
                          <option>Pig</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Birth Year
                        </label>
                        <input
                          type="number"
                          value={formData.birthYear}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              birthYear: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)] placeholder:text-[var(--c4)]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Breed
                      </label>
                      <input
                        type="text"
                        value={formData.breed}
                        onChange={(e) =>
                          setFormData({ ...formData, breed: e.target.value })
                        }
                        placeholder="e.g., Angus, Hereford"
                        className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)] placeholder:text-[var(--c4)]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary flex-1"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={loading || !formData.token}
                  >
                    {loading ? 'Processing...' : isTagCode(formData.token) ? 'Continue to Tag' : 'Claim Tag'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Instructions */}
        <div className="mt-8 card bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] border border-[var(--c2)]/20">
          <h3 className="font-semibold mb-2 text-white">📋 How to Claim</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-[var(--c4)]">
            <li>Scan the overlay QR code on your tag</li>
            <li>Fill in your contact information</li>
            <li>Enter your animal's details</li>
            <li>Peel the overlay to reveal the base QR code</li>
            <li>Share your public animal card!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

