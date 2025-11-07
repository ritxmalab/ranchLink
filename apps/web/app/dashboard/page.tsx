'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Animal {
  public_id: string
  animal_name: string
  species: string
  breed: string | null
  status: string
  tag_id: string
  activated_at: string
}

export default function DashboardPage() {
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for preview - replace with actual API call
    setAnimals([
      {
        public_id: 'AUS0001',
        animal_name: 'Bessie',
        species: 'Cattle',
        breed: 'Angus',
        status: 'active',
        tag_id: 'RL-001',
        activated_at: new Date().toISOString(),
      },
      {
        public_id: 'AUS0002',
        animal_name: 'Charlie',
        species: 'Cattle',
        breed: 'Hereford',
        status: 'active',
        tag_id: 'RL-002',
        activated_at: new Date().toISOString(),
      },
    ])
    setLoading(false)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--bg)] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Ranch</h1>
          <p className="text-[var(--c4)]">Manage your animals and tags</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-[var(--c2)] mb-1">
              {animals.length}
            </div>
            <div className="text-sm text-[var(--c4)]">Total Animals</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {animals.filter((a) => a.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-[var(--c3)] mb-1">0</div>
            <div className="text-sm text-gray-600">Pending Transfers</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">0</div>
            <div className="text-sm text-gray-600">Events This Month</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Link href="/start" className="btn-primary text-center">
              ➕ Claim New Tag
            </Link>
            <button className="btn-secondary">📷 Add Photo</button>
            <button className="btn-secondary">💉 Record Event</button>
            <button className="btn-secondary">📊 View Reports</button>
          </div>
        </div>

        {/* Animals Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">My Animals</h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 border-2 border-gray-200 rounded-lg hover:border-[var(--c2)]">
                Filter
              </button>
              <button className="px-4 py-2 border-2 border-gray-200 rounded-lg hover:border-[var(--c2)]">
                Sort
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--c2)] mx-auto mb-4"></div>
              <p className="text-[var(--c4)]">Loading animals...</p>
            </div>
          ) : animals.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {animals.map((animal) => (
                <Link
                  key={animal.public_id}
                  href={`/a?id=${animal.public_id}`}
                  className="card hover:shadow-xl transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-1">
                        {animal.animal_name}
                      </h3>
                      <p className="text-sm text-gray-500 font-mono">
                        {animal.public_id}
                      </p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-[var(--c2)] to-[var(--c3)] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {animal.animal_name.charAt(0)}
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--c4)]">Species:</span>
                      <span className="font-semibold">{animal.species}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--c4)]">Breed:</span>
                      <span className="font-semibold">{animal.breed || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--c4)]">Status:</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          animal.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {animal.status}
                      </span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-[var(--c4)]">
                      <span>Tag: {animal.tag_id}</span>
                      <span>
                        {new Date(animal.activated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">🐄</div>
              <h3 className="text-xl font-bold mb-2">No Animals Yet</h3>
              <p className="text-[var(--c4)] mb-6">
                Claim your first tag to get started!
              </p>
              <Link href="/start" className="btn-primary inline-block">
                Claim Your First Tag
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

