'use client'

export default function ModelsPage() {
  const models = [
    {
      id: 'BASIC_QR',
      name: 'BASIC_QR',
      subtitle: 'Original Price',
      description: 'Code linked to real-world asset for traceability on the blockchain',
      tech: ['QR Code', 'Blockchain Link', 'Public Animal Card', 'NFT Ownership'],
      price: 8.99,
      refillService: 4.99,
      refillFeatures: ['Battery replacement', 'Chip replacement', 'Tag refill'],
    },
    {
      id: 'BOOTS_ON',
      name: 'BOOTS_ON',
      subtitle: 'Medium',
      description: 'QR + Blockchain + NFC/RFID or Apple Find My chip',
      tech: ['QR Code', 'NFC/RFID or Apple Find My', 'Blockchain Link', 'Public Animal Card', 'NFT Ownership'],
      price: 18.99,
      refillService: 9.99,
      refillFeatures: ['Battery replacement', 'Chip replacement', 'Tag refill'],
    },
    {
      id: 'CYBER_COWBOY',
      name: 'CYBER_COWBOY',
      subtitle: 'Medium+',
      description: 'Full QR + Blockchain + NFC/RFID + Apple Find My availability',
      tech: ['QR Code', 'NFC/RFID', 'Apple Find My', 'Blockchain Link', 'Public Animal Card', 'NFT Ownership'],
      price: 35.00,
      refillService: 14.99,
      refillFeatures: ['Battery replacement', 'Chip replacement', 'Tag refill', 'Priority support'],
    },
    {
      id: 'SPACE_COWBOY',
      name: 'SPACE_COWBOY',
      subtitle: 'Pro',
      description: 'QR + Blockchain + NFC + GPS/4G + Bluetooth or Find My + Solar Battery',
      tech: ['QR Code', 'NFC/RFID', 'GPS/4G Tracking', 'Bluetooth', 'Apple Find My', 'Solar Battery', 'Blockchain Link', 'Public Animal Card', 'NFT Ownership'],
      price: 59.00,
      refillService: 29.99,
      refillFeatures: ['GPS tracking service', 'Battery replacement', 'Chip replacement', 'Tag refill', 'Priority support'],
    },
    {
      id: 'BIG_WESTERN',
      name: 'BIG_WESTERN',
      subtitle: 'R&D',
      description: 'All features plus camera, satellite info recovery, and computer vision',
      tech: ['QR Code', 'NFC/RFID', 'GPS/4G', 'Satellite Recovery', 'Camera', 'Computer Vision', 'Solar Battery', 'Blockchain Link', 'Public Animal Card', 'NFT Ownership'],
      price: 300.00,
      refillService: 49.99,
      refillFeatures: ['Full service coverage', 'Camera replacement', 'Satellite service', 'Battery replacement', 'Chip replacement', 'Tag refill', 'Priority support', 'R&D updates'],
    },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg)] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 gradient-text">Tag Models & Tech Stacks</h1>
          <p className="text-xl text-[var(--c4)] max-w-3xl mx-auto">
            Choose the right tag for your needs. <strong>All tags work forever with the software.</strong> Optional refill service available for consumables. Custom capabilities available as a separate service.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {models.map((model) => (
            <div key={model.id} className="card border-2 hover:border-[var(--c2)] transition-all">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold">{model.name}</h3>
                  <span className="px-3 py-1 bg-[var(--c2)]/10 text-[var(--c2)] rounded-full text-sm font-semibold">
                    {model.subtitle}
                  </span>
                </div>
                <p className="text-[var(--c4)] text-sm mb-4">{model.description}</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2 text-sm">Tech Stack:</h4>
                <ul className="space-y-1">
                  {model.tech.map((tech, idx) => (
                    <li key={idx} className="text-sm text-[var(--c4)] flex items-center">
                      <span className="text-[var(--c2)] mr-2">✓</span>
                      {tech}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-sm text-[var(--c4)]">One-time Price:</span>
                  <span className="text-2xl font-bold text-[var(--c2)]">${model.price}</span>
                </div>
                <div className="text-xs text-[var(--c4)] bg-gray-50 p-2 rounded mb-2">
                  <strong>Optional Refill Service:</strong> ${model.refillService}/mo
                  <ul className="mt-1 space-y-0.5">
                    {model.refillFeatures.map((feature, idx) => (
                      <li key={idx}>• {feature}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-xs text-[var(--c4)] bg-orange-50 p-2 rounded border border-[var(--c2)]/20">
                  <strong>Custom Capabilities:</strong> Available as separate service. Contact us for pricing.
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card bg-gradient-to-r from-[var(--c2)]/10 to-[var(--c3)]/10 border-2 border-[var(--c2)]/20">
          <h2 className="text-2xl font-bold mb-4">📌 How It Works</h2>
          <p className="text-[var(--c4)] mb-4 font-semibold">
            All RanchLink tags work perfectly forever with the software. The tag itself and all core features are included with your one-time purchase.
          </p>
          
          <h3 className="text-xl font-bold mb-3 mt-6">Optional Refill Service:</h3>
          <p className="text-[var(--c4)] mb-3">
            For tags with consumables (batteries, chips, etc.), we offer an optional monthly refill service. We'll replace or refill consumables as needed, ensuring your tags stay operational.
          </p>
          <ul className="space-y-2 text-[var(--c4)] mb-6">
            <li className="flex items-start">
              <span className="text-[var(--c2)] mr-2 font-bold">•</span>
              <span>Battery replacement for GPS/solar-powered tags</span>
            </li>
            <li className="flex items-start">
              <span className="text-[var(--c2)] mr-2 font-bold">•</span>
              <span>Chip replacement for NFC/RFID tags</span>
            </li>
            <li className="flex items-start">
              <span className="text-[var(--c2)] mr-2 font-bold">•</span>
              <span>Tag refill for any consumable components</span>
            </li>
            <li className="flex items-start">
              <span className="text-[var(--c2)] mr-2 font-bold">•</span>
              <span>Priority support for refill service customers</span>
            </li>
          </ul>

          <h3 className="text-xl font-bold mb-3">Custom Capabilities Service:</h3>
          <p className="text-[var(--c4)] mb-3">
            Need advanced features, custom integrations, or tailored configurations? Our Custom Capabilities service provides:
          </p>
          <ul className="space-y-2 text-[var(--c4)]">
            <li className="flex items-start">
              <span className="text-[var(--c2)] mr-2 font-bold">•</span>
              <span>Custom integrations with your existing systems</span>
            </li>
            <li className="flex items-start">
              <span className="text-[var(--c2)] mr-2 font-bold">•</span>
              <span>Advanced data analytics and reporting</span>
            </li>
            <li className="flex items-start">
              <span className="text-[var(--c2)] mr-2 font-bold">•</span>
              <span>Tailored configurations for your specific needs</span>
            </li>
            <li className="flex items-start">
              <span className="text-[var(--c2)] mr-2 font-bold">•</span>
              <span>API access and custom development</span>
            </li>
          </ul>
          <p className="text-sm text-[var(--c4)] mt-4 italic">
            <strong>Contact us</strong> for Custom Capabilities pricing based on your specific requirements.
          </p>
        </div>
      </div>
    </div>
  )
}

