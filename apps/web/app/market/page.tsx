'use client'

import { useState } from 'react'

interface Product {
  sku: string
  title: string
  tier: string
  material: string
  color: string
  features: string[]
  priceUSD: number
  supply: number
  shipDays: number
}

export default function MarketplacePage() {
  const [products] = useState<Product[]>([
    {
      sku: 'RL-S-QR-01',
      title: 'RanchLink Single — PETG QR',
      tier: 'Common',
      material: 'PETG',
      color: 'Mesquite',
      features: ['QR', 'Overlay', 'IPFS'],
      priceUSD: 6.5,
      supply: 500,
      shipDays: 2,
    },
    {
      sku: 'RL-4-PACK',
      title: '4-Pack Bundle',
      tier: 'Common',
      material: 'PETG',
      color: 'Mesquite',
      features: ['QR', 'Overlay', 'IPFS', 'Bulk Discount'],
      priceUSD: 22,
      supply: 200,
      shipDays: 3,
    },
    {
      sku: 'RL-10-PACK',
      title: '10-Pack Bundle',
      tier: 'Common',
      material: 'PETG',
      color: 'Mesquite',
      features: ['QR', 'Overlay', 'IPFS', 'Best Value'],
      priceUSD: 49,
      supply: 100,
      shipDays: 5,
    },
  ])

  return (
    <div className="min-h-screen bg-[var(--bg)] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Marketplace</h1>
          <p className="text-xl text-[var(--c4)]">
            Browse and purchase RanchLink tags
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product.sku}
              className="card hover:shadow-2xl transition-all transform hover:-translate-y-2"
            >
              {/* Yu-Gi-Oh Style Card */}
              <div className="relative mb-4">
                <div className="aspect-[3/4] bg-gradient-to-br from-[var(--c2)] to-[var(--c3)] rounded-lg p-4 flex flex-col justify-between text-white">
                  <div>
                    <div className="text-xs opacity-75 mb-2">{product.tier}</div>
                    <h3 className="text-xl font-bold mb-2">{product.title}</h3>
                  </div>
                  <div className="text-center">
                    <div className="text-6xl mb-4">🏷️</div>
                    <div className="text-sm opacity-75">{product.material}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-2 py-1 bg-white/20 rounded text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Price</span>
                    <span className="text-2xl font-bold text-[var(--c2)]">
                      ${product.priceUSD}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-[var(--c4)]">
                    <span>Shipping:</span>
                    <span>{product.shipDays} days</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-[var(--c4)]">
                    <span>In Stock:</span>
                    <span>{product.supply} units</span>
                  </div>
                </div>

                <button className="btn-primary w-full">
                  Add to Cart
                </button>
                <button className="btn-secondary w-full">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 3D Preview Section */}
        <div className="mt-16 card">
          <h2 className="text-3xl font-bold mb-6 text-center">
            3D Tag Preview
          </h2>
          <div className="aspect-video bg-[var(--bg-card)] border border-[#1F2937] rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🏷️</div>
              <p className="text-[var(--c4)]">
                3D model viewer will appear here
              </p>
              <p className="text-sm text-[var(--c4)]/70 mt-2">
                (model-viewer component for GLB/GLTF files)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

