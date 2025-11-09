'use client'

import { ChangeEvent, useMemo, useState } from 'react'
import QRCodeDisplay from '@/components/QRCodeDisplay'

type Role = 'creator' | 'supplier' | 'inspector' | 'staff'

type AssetType =
  | 'object'
  | 'batch'
  | 'agreement'
  | 'livestock'
  | 'service'
  | 'other'

type BlockchainProfile =
  | 'polygon'
  | 'base'
  | 'solana'
  | 'ethereum'
  | 'hemi'
  | 'stacks'
  | 'bitcoin'

type LabelTemplate = 'dual' | 'single' | 'sheet'

interface CustomField {
  id: string
  key: string
  value: string
}

interface GeneratedAsset {
  uniqueId: string
  claimCode: string
  setupUrl: string
  publicUrl: string
  blockchainProfile: BlockchainProfile
  additionalAnchors: BlockchainProfile[]
  qrSizeMm: number
  qrSizePx: number
  labelTemplate: LabelTemplate
  index: number
}

const BASE_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.rwa.local'

const roleOptions: { label: string; value: Role }[] = [
  { label: 'Creator', value: 'creator' },
  { label: 'Supplier', value: 'supplier' },
  { label: 'Inspector', value: 'inspector' },
  { label: 'Staff', value: 'staff' },
]

const assetTypeOptions: { label: string; value: AssetType }[] = [
  { label: 'Object', value: 'object' },
  { label: 'Batch', value: 'batch' },
  { label: 'Agreement', value: 'agreement' },
  { label: 'Livestock / Biological Asset', value: 'livestock' },
  { label: 'Service / Exchange', value: 'service' },
  { label: 'Other', value: 'other' },
]

const blockchainProfiles: { label: string; value: BlockchainProfile; helper?: string }[] = [
  { label: 'Polygon Supernet + Ethereum Anchor (Default)', value: 'polygon', helper: 'Fast, low-cost, anchors daily on Ethereum for public proofs.' },
  { label: 'Base (Coinbase L2)', value: 'base', helper: 'Great for Coinbase integrations; additional gas costs apply.' },
  { label: 'Solana Program Anchor', value: 'solana', helper: 'High-throughput proof posting for supply chains and IoT.' },
  { label: 'Ethereum Mainnet', value: 'ethereum', helper: 'Highest security. Use for high-value provenance.' },
  { label: 'Hemi (Solana ↔ Bitcoin bridge)', value: 'hemi', helper: 'Dedicated anchoring into Bitcoin ecosystems via Solana.' },
  { label: 'Stacks', value: 'stacks', helper: 'Smart contract layer secured by Bitcoin.' },
  { label: 'Bitcoin (OpenTimestamps)', value: 'bitcoin', helper: 'Timestamp proofs directly on Bitcoin (batch anchoring).' },
]

const qrSizeOptions = [
  { label: '20 mm (small tags)', value: '20' },
  { label: '30 mm (standard)', value: '30' },
  { label: '40 mm (large signage)', value: '40' },
  { label: 'Custom (enter mm)', value: 'custom' },
]

const labelTemplates: { value: LabelTemplate; label: string; description: string }[] = [
  {
    value: 'dual',
    label: 'Dual QR (Overlay + Claimable)',
    description: 'Peelable setup instructions + permanent ownership QR. Ideal para onboarding.',
  },
  {
    value: 'single',
    label: 'Single QR (Public)',
    description: 'Un solo QR para etiquetado rápido, aún genera setup/claim interno.',
  },
  {
    value: 'sheet',
    label: 'PDF Sheet Layout',
    description: 'Auto-layout de múltiples QRs por hoja (A4/Letter).',
  },
]

const additionalAnchorOptions: { value: BlockchainProfile; label: string }[] = [
  { value: 'base', label: 'Base' },
  { value: 'solana', label: 'Solana' },
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'hemi', label: 'Hemi' },
  { value: 'stacks', label: 'Stacks' },
  { value: 'bitcoin', label: 'Bitcoin' },
]

const mmToPxAt300Dpi = (mm: number) => Math.round((mm / 25.4) * 300)

const slugify = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')

const getInitialClaimPreview = () => crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()

export default function QRGeneratorPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([])
  const [claimPreviewSeed] = useState(() => getInitialClaimPreview())
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [additionalAnchors, setAdditionalAnchors] = useState<BlockchainProfile[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    role: '' as Role | '',
    assetName: '',
    assetType: '' as AssetType | '',
    description: '',
    ownership: '',
    batchAssetId: '',
    creationTimestamp: new Date().toISOString().slice(0, 16),
    location: 'Austin, TX',
    blockchainProfile: 'polygon' as BlockchainProfile,
    quantity: 1,
    seriesPrefix: '',
    startingIndex: 1,
    qrSize: '30',
    qrSizeCustom: '',
    labelTemplate: 'dual' as LabelTemplate,
  })

  const previewUniqueId = useMemo(() => {
    const prefix =
      slugify(form.seriesPrefix || form.assetName || form.batchAssetId || 'RWA') || 'RWA'
    const serial = String(form.startingIndex).padStart(3, '0')
    return `${prefix}-${serial}`
  }, [form.seriesPrefix, form.assetName, form.batchAssetId, form.startingIndex])

  const previewClaimCode = useMemo(() => {
    return `${claimPreviewSeed.substring(0, 4)}${previewUniqueId.replace(/[^A-Z0-9]/g, '').slice(-4)}`
      .toUpperCase()
      .slice(0, 8)
  }, [claimPreviewSeed, previewUniqueId])

  const selectedQrSizeMm =
    form.qrSize === 'custom'
      ? Math.max(Number(form.qrSizeCustom) || 0, 5)
      : Number(form.qrSize)

  const selectedQrSizePx = mmToPxAt300Dpi(selectedQrSizeMm)

  const previewPublicUrl = `${BASE_APP_URL}/scan/${previewUniqueId}`
  const previewSetupUrl = `${BASE_APP_URL}/start?token=${previewClaimCode}`

  const resetAfterSuccess = () => {
    setForm((prev) => ({
      ...prev,
      assetName: '',
      assetType: '',
      description: '',
      ownership: '',
      batchAssetId: '',
      quantity: 1,
      seriesPrefix: '',
      startingIndex: 1,
    }))
    setCustomFields([])
    setEvidenceFiles([])
    setAdditionalAnchors([])
  }

  const handleAddCustomField = () => {
    setCustomFields((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        key: '',
        value: '',
      },
    ])
  }

  const handleCustomFieldChange = (id: string, field: 'key' | 'value', value: string) => {
    setCustomFields((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const handleRemoveCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((item) => item.id !== id))
  }

  const validateStepOne = () => {
    const nextErrors: Record<string, string> = {}
    if (!form.role) nextErrors.role = 'Selecciona el rol responsable'
    if (!form.assetName.trim()) nextErrors.assetName = 'Nombre requerido'
    if (!form.assetType) nextErrors.assetType = 'Selecciona un tipo de activo'
    if (!form.description.trim()) nextErrors.description = 'Incluye descripción'
    if (!form.batchAssetId.trim()) nextErrors.batchAssetId = 'Ingresa o escanea un ID'
    if (!form.creationTimestamp) nextErrors.creationTimestamp = 'Timestamp requerido'
    if (!form.location.trim()) nextErrors.location = 'Ubicación requerida'
    if (form.quantity < 1) nextErrors.quantity = 'Cantidad mínima: 1'
    if (form.qrSize === 'custom' && !Number(form.qrSizeCustom)) {
      nextErrors.qrSizeCustom = 'Especifica tamaño personalizado en mm'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleEvidenceUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return
    setEvidenceFiles(Array.from(event.target.files))
  }

  const toggleAdditionalAnchor = (value: BlockchainProfile) => {
    setAdditionalAnchors((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    )
  }

  const generateAssets = () => {
    const prefix =
      slugify(form.seriesPrefix || form.assetName || form.batchAssetId || 'RWA') || 'RWA'
    const quantity = Math.max(form.quantity, 1)
    const startIndex = form.startingIndex
    const next: GeneratedAsset[] = []
    for (let i = 0; i < quantity; i++) {
      const serial = String(startIndex + i).padStart(3, '0')
      const uniqueId = `${prefix}-${serial}`
      const claimCode = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
      const setupUrl = `${BASE_APP_URL}/start?token=${claimCode}`
      const publicUrl = `${BASE_APP_URL}/scan/${uniqueId}`
      next.push({
        uniqueId,
        claimCode,
        setupUrl,
        publicUrl,
        blockchainProfile: form.blockchainProfile,
        additionalAnchors,
        qrSizeMm: selectedQrSizeMm,
        qrSizePx: selectedQrSizePx,
        labelTemplate: form.labelTemplate,
        index: startIndex + i,
      })
    }
    setGeneratedAssets(next)
  }

  const handleDownloadPNG = async (url: string, filename: string, sizePx: number) => {
    try {
      const QRCode = (await import('qrcode')).default
      const dataUrl = await QRCode.toDataURL(url, { width: sizePx, margin: 2 })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `${filename}.png`
      link.click()
    } catch (error) {
      console.error('Download error', error)
      alert('Failed to download QR')
    }
  }

  const handleDownloadManifest = () => {
    const header = [
      'unique_id',
      'claim_code',
      'setup_url',
      'public_url',
      'primary_blockchain',
      'additional_blockchains',
      'qr_size_mm',
      'label_template',
    ]
    const rows = generatedAssets.map((asset) =>
      [
        asset.uniqueId,
        asset.claimCode,
        asset.setupUrl,
        asset.publicUrl,
        asset.blockchainProfile,
        asset.additionalAnchors.join('|'),
        asset.qrSizeMm.toString(),
        asset.labelTemplate,
      ].join(','),
    )
    const csv = [header.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rwa-manifest-${new Date().toISOString()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Trust Layer • RWA Label Forge</h1>
            <p className="text-sm text-[var(--c4)] mt-2">
              Captura eventos, acuña pruebas blockchain y genera etiquetas QR listas para producción.
            </p>
          </div>
          <div className="text-sm text-right text-[var(--c4)]">
            <div>
              Estado del dispositivo:{' '}
              <span className="text-green-600 font-semibold">Online</span>
            </div>
            <div>Paso {step} de 4</div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          {['Detalles', 'Evidencia', 'Revisión', 'Etiquetas'].map((label, index) => {
            const status = step === index + 1 ? 'current' : step > index + 1 ? 'done' : 'upcoming'
            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    status === 'current'
                      ? 'bg-[var(--c2)] text-white'
                      : status === 'done'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`text-sm font-medium ${
                    status === 'current'
                      ? 'text-[var(--c2)]'
                      : status === 'done'
                      ? 'text-gray-600'
                      : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
                {index < 3 && <div className="w-10 h-px bg-gray-300" />}
              </div>
            )
          })}
        </div>

        {step === 1 && (
          <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
            <div className="card space-y-6">
              <h2 className="text-2xl font-semibold">Paso 1: Detalles del Activo</h2>
              <p className="text-sm text-[var(--c4)]">
                Define tu activo o serie, selecciona el perfil blockchain y configura la etiqueta. Todo queda firmado y
                hasheado instantáneamente.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Rol</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as Role }))}
                    className={`form-input ${errors.role ? 'border-red-500' : ''}`}
                  >
                    <option value="">Selecciona rol...</option>
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.role && (
                    <p className="text-xs text-red-500 mt-1">{errors.role}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Nombre del activo</label>
                  <input
                    value={form.assetName}
                    onChange={(e) => setForm((prev) => ({ ...prev, assetName: e.target.value }))}
                    placeholder="p.ej. Organic Coffee Beans"
                    className={`form-input ${errors.assetName ? 'border-red-500' : ''}`}
                  />
                  {errors.assetName && (
                    <p className="text-xs text-red-500 mt-1">{errors.assetName}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Tipo de activo</label>
                  <select
                    value={form.assetType}
                    onChange={(e) => setForm((prev) => ({ ...prev, assetType: e.target.value as AssetType }))}
                    className={`form-input ${errors.assetType ? 'border-red-500' : ''}`}
                  >
                    <option value="">Selecciona tipo...</option>
                    {assetTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.assetType && (
                    <p className="text-xs text-red-500 mt-1">{errors.assetType}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Batch / Asset ID</label>
                  <input
                    value={form.batchAssetId}
                    onChange={(e) => setForm((prev) => ({ ...prev, batchAssetId: e.target.value }))}
                    placeholder="Escanea o ingresa ID"
                    className={`form-input ${errors.batchAssetId ? 'border-red-500' : ''}`}
                  />
                  {errors.batchAssetId && (
                    <p className="text-xs text-red-500 mt-1">{errors.batchAssetId}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Descripción</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Contexto del activo, acuerdos, condiciones, etc."
                    className={`form-textarea ${errors.description ? 'border-red-500' : ''}`}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500 mt-1">{errors.description}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Ownership (opcional)</label>
                  <input
                    value={form.ownership}
                    onChange={(e) => setForm((prev) => ({ ...prev, ownership: e.target.value }))}
                    placeholder="e.g. ACME Corp / did:example:123"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Timestamp de creación</label>
                  <input
                    type="datetime-local"
                    value={form.creationTimestamp}
                    onChange={(e) => setForm((prev) => ({ ...prev, creationTimestamp: e.target.value }))}
                    className={`form-input ${errors.creationTimestamp ? 'border-red-500' : ''}`}
                  />
                  {errors.creationTimestamp && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.creationTimestamp}
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label">Ubicación</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                    className={`form-input ${errors.location ? 'border-red-500' : ''}`}
                  />
                  {errors.location && (
                    <p className="text-xs text-red-500 mt-1">{errors.location}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Cantidad / Serie</label>
                  <input
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        quantity: Math.max(parseInt(e.target.value || '1', 10), 1),
                      }))
                    }
                    className={`form-input ${errors.quantity ? 'border-red-500' : ''}`}
                  />
                  {errors.quantity && (
                    <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Prefijo de serie</label>
                  <input
                    value={form.seriesPrefix}
                    onChange={(e) => setForm((prev) => ({ ...prev, seriesPrefix: e.target.value }))}
                    placeholder="Opcional"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Índice inicial</label>
                  <input
                    type="number"
                    min={1}
                    value={form.startingIndex}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        startingIndex: Math.max(parseInt(e.target.value || '1', 10), 1),
                      }))
                    }
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Perfil blockchain</label>
                  <select
                    value={form.blockchainProfile}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, blockchainProfile: e.target.value as BlockchainProfile }))
                    }
                    className="form-input"
                  >
                    {blockchainProfiles.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-[var(--c4)] mt-1">
                    {blockchainProfiles.find((option) => option.value === form.blockchainProfile)?.helper}
                  </p>
                </div>

                <div>
                  <label className="form-label">Tamaño del QR</label>
                  <select
                    value={form.qrSize}
                    onChange={(e) => setForm((prev) => ({ ...prev, qrSize: e.target.value }))}
                    className="form-input"
                  >
                    {qrSizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {form.qrSize === 'custom' && (
                  <div>
                    <label className="form-label">Tamaño personalizado (mm)</label>
                    <input
                      type="number"
                      min={5}
                      value={form.qrSizeCustom}
                      onChange={(e) => setForm((prev) => ({ ...prev, qrSizeCustom: e.target.value }))}
                      className={`form-input ${errors.qrSizeCustom ? 'border-red-500' : ''}`}
                    />
                    {errors.qrSizeCustom && (
                      <p className="text-xs text-red-500 mt-1">{errors.qrSizeCustom}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="form-label">Plantilla de etiqueta</label>
                  <select
                    value={form.labelTemplate}
                    onChange={(e) => setForm((prev) => ({ ...prev, labelTemplate: e.target.value as LabelTemplate }))}
                    className="form-input"
                  >
                    {labelTemplates.map((template) => (
                      <option key={template.value} value={template.value}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-[var(--c4)] mt-1">
                    {labelTemplates.find((template) => template.value === form.labelTemplate)?.description}
                  </p>
                </div>
              </div>

              <div>
                <label className="form-label">Campos personalizados</label>
                {customFields.length === 0 && (
                  <p className="text-xs text-[var(--c4)] mb-2">
                    Añade pares clave/valor (certificados, inspecciones, etc.).
                  </p>
                )}
                <div className="space-y-3">
                  {customFields.map((field) => (
                    <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-3">
                      <input
                        value={field.key}
                        onChange={(e) => handleCustomFieldChange(field.id, 'key', e.target.value)}
                        placeholder="Etiqueta"
                        className="form-input"
                      />
                      <input
                        value={field.value}
                        onChange={(e) => handleCustomFieldChange(field.id, 'value', e.target.value)}
                        placeholder="Valor"
                        className="form-input"
                      />
                      <button
                        onClick={() => handleRemoveCustomField(field.id)}
                        type="button"
                        className="text-sm text-red-500 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomField}
                  className="mt-3 text-sm text-[var(--c2)] hover:underline"
                >
                  + Agregar campo
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button type="button" className="btn-secondary" onClick={() => resetAfterSuccess()}>
                  Reiniciar formulario
                </button>
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary" onClick={() => setStep(4)}>
                    Ver último lote
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      if (validateStepOne()) {
                        setStep(2)
                      }
                    }}
                  >
                    Siguiente: Evidencia
                  </button>
                </div>
              </div>
            </div>

            <aside className="card bg-white border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Vista previa de la etiqueta</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 uppercase">Estado</span>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    Borrador
                  </span>
                </div>
                <div className="flex justify-center">
                  <QRCodeDisplay url={previewPublicUrl} size={Math.min(selectedQrSizePx, 280)} />
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-semibold">{form.assetName || 'Asset Name'}</p>
                    <p className="text-[var(--c4)] capitalize text-xs">
                      {form.assetType || 'Asset Type'} •{' '}
                      {form.role ? roleOptions.find((on) => on.value === form.role)?.label : 'Rol'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Unique Asset ID</span>
                    <span className="font-mono text-sm">{previewUniqueId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Claim Code</span>
                    <span className="font-mono text-sm">{previewClaimCode}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Blockchain</span>
                    <span className="text-xs font-semibold capitalize">{form.blockchainProfile}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Tamaño QR</span>
                    <span className="text-xs font-semibold">
                      {selectedQrSizeMm} mm ({selectedQrSizePx}px @300 dpi)
                    </span>
                  </div>
                </div>
                <div className="rounded-md border border-dashed border-gray-300 p-3 text-xs text-[var(--c4)]">
                  Vista previa. El QR final se bloqueará al mint y quedará anclado a ERC-3643 + ISO/TC 307.
                </div>
              </div>
            </aside>
          </div>
        )}

        {step === 2 && (
          <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
            <div className="card space-y-6">
              <h2 className="text-2xl font-semibold">Paso 2: Captura de Evidencia</h2>
              <p className="text-sm text-[var(--c4)]">
                Víncula pruebas visuales o documentales. Cada archivo se hashea y se agrega al Merkle log antes del mint.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-dashed border-gray-300 rounded-lg p-6 flex flex-col justify-center items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-3xl">
                    📷
                  </div>
                  <h3 className="font-semibold mb-2">Usar Arducam / Cámara</h3>
                  <p className="text-sm text-[var(--c4)]">
                    Captura condición, serie y cualquier evidencia física. Los archivos permanecen locales.
                  </p>
                  <button className="btn-secondary mt-4">Iniciar captura</button>
                </div>

                <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-3xl">
                    📁
                  </div>
                  <h3 className="font-semibold mb-2">Cargar archivos</h3>
                  <p className="text-sm text-[var(--c4)]">
                    Arrastra reportes, facturas, análisis o cualquier soporte.
                  </p>
                  <label className="btn-secondary inline-flex items-center justify-center mt-4 cursor-pointer">
                    <input type="file" multiple onChange={handleEvidenceUpload} className="hidden" />
                    Seleccionar archivos
                  </label>
                  {evidenceFiles.length > 0 && (
                    <div className="mt-4 text-left space-y-2 max-h-40 overflow-y-auto">
                      {evidenceFiles.map((file) => (
                        <div key={file.name} className="text-xs text-gray-600 flex items-center justify-between">
                          <span>{file.name}</span>
                          <span>{Math.round(file.size / 1024)} KB</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                <p className="font-semibold mb-1">¿Qué sucede?</p>
                <p>
                  Las capturas se hashean localmente, se agregan al Merkle log y se anclan cuando avances. Polygon es
                  principal; Chainlink programa anclajes extra (Base, Solana, Hemi, Stacks, Bitcoin).
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <button className="btn-secondary" onClick={() => setStep(1)}>
                  Volver
                </button>
                <button className="btn-primary" onClick={() => setStep(3)}>
                  Siguiente: Revisión
                </button>
              </div>
            </div>

            <aside className="card border border-gray-200 bg-white space-y-4">
              <h3 className="text-lg font-semibold">Checklist de Evidencia</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-500">✓</span>
                  <div>
                    <p className="font-medium">Metadata hasheada</p>
                    <p className="text-xs text-gray-500">Se creó automáticamente tras Paso 1.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500">{evidenceFiles.length > 0 ? '✓' : '•'}</span>
                  <div>
                    <p className="font-medium">Documentos adjuntos</p>
                    <p className="text-xs text-gray-500">
                      {evidenceFiles.length > 0 ? `${evidenceFiles.length} archivo(s)` : 'Opcional pero recomendado.'}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500">•</span>
                  <div>
                    <p className="font-medium">Revisión final</p>
                    <p className="text-xs text-gray-500">Confirma antes del mint para evitar reimpresiones.</p>
                  </div>
                </li>
              </ul>
            </aside>
          </div>
        )}

        {step === 3 && (
          <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
            <div className="card space-y-6">
              <h2 className="text-2xl font-semibold">Paso 3: Revisión &amp; Mint</h2>
              <p className="text-sm text-[var(--c4)]">
                Confirma la ruta blockchain y los anclajes adicionales antes de generar etiquetas. El mint dispara la
                emisión ERC-3643 y produce los QR.
              </p>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="border border-gray-200 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-sm uppercase text-gray-500">Esenciales</h3>
                  <div className="text-sm">
                    <p className="font-semibold">{form.assetName}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {form.assetType} • {roleOptions.find((item) => item.value === form.role)?.label}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600">{form.description}</p>
                  <div className="text-xs text-gray-500">
                    Batch ID: <span className="font-mono text-sm text-gray-700">{form.batchAssetId}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Ownership: {form.ownership || <span className="italic text-gray-400">No asignado</span>}
                  </div>
                  <div className="text-xs text-gray-500">
                    Timestamp: {new Date(form.creationTimestamp).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Ubicación: {form.location}</div>
                  {customFields.length > 0 && (
                    <div className="text-xs text-gray-500">
                      <p className="font-semibold text-gray-600 mt-2">Campos personalizados</p>
                      <ul className="mt-1 space-y-1">
                        {customFields.map((field) => (
                          <li key={field.id}>
                            <span className="font-medium">{field.key || '—'}:</span> {field.value || '—'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="border border-gray-200 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-sm uppercase text-gray-500">Resumen de serie</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                    <div>
                      <span className="font-semibold text-gray-700">Cantidad</span>
                      <div>{form.quantity} unidades</div>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Prefijo</span>
                      <div>{slugify(form.seriesPrefix || form.assetName || 'RWA')}</div>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Índice inicial</span>
                      <div>{form.startingIndex}</div>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Tamaño QR</span>
                      <div>{selectedQrSizeMm} mm ({selectedQrSizePx}px)</div>
                    </div>
                    <div className="col-span-2">
                      <span className="font-semibold text-gray-700">Plantilla</span>
                      <div>{labelTemplates.find((item) => item.value === form.labelTemplate)?.label}</div>
                    </div>
                  </div>
                  <div className="rounded bg-gray-50 border border-gray-200 p-3 text-xs text-gray-500">
                    Evidencias: {evidenceFiles.length} archivo(s)
                  </div>
                </div>

                <div className="md:col-span-2 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-sm uppercase text-gray-500 mb-3">
                    Anclajes adicionales
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Perfil primario:{' '}
                    <span className="font-semibold capitalize">{form.blockchainProfile}</span>. Añade anclajes para
                    requerimientos regulatorios o de partners.
                  </p>
                  <div className="grid md:grid-cols-3 gap-3">
                    {additionalAnchorOptions.map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm cursor-pointer transition ${
                          additionalAnchors.includes(option.value)
                            ? 'border-[var(--c2)] bg-[var(--c2)]/10 text-[var(--c2)]'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={additionalAnchors.includes(option.value)}
                          onChange={() => toggleAdditionalAnchor(option.value)}
                          className="form-checkbox"
                        />
                        <span className="capitalize">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                Minting generará {form.quantity} IDs únicos, códigos reclamables y QRs de {selectedQrSizeMm} mm. Hashes
                anclados en {form.blockchainProfile}
                {additionalAnchors.length > 0 && ` + ${additionalAnchors.join(', ')}`}.
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <button className="btn-secondary" onClick={() => setStep(2)}>
                  Volver
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    generateAssets()
                    setStep(4)
                  }}
                >
                  Generar QR &amp; Mint
                </button>
              </div>
            </div>

            <aside className="card border border-gray-200 bg-white space-y-4">
              <h3 className="text-lg font-semibold">Checklist final</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ Metadata firmada</li>
                <li>✓ Evidencias adjuntas ({evidenceFiles.length})</li>
                <li>✓ Anclajes configurados</li>
                <li>• Confirmar y mint</li>
              </ul>
            </aside>
          </div>
        )}

        {step === 4 && (
          <div className="card space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Paso 4: Etiquetas listas</h2>
                <p className="text-sm text-[var(--c4)]">
                  {generatedAssets.length > 0
                    ? `Se emitieron ${generatedAssets.length} activo(s). Descarga los QRs o imprime ahora mismo.`
                    : 'Revisa tu último lote o crea uno nuevo.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button className="btn-secondary" onClick={handleDownloadManifest} disabled={generatedAssets.length === 0}>
                  📄 Manifest CSV
                </button>
                <button className="btn-secondary" onClick={() => window.print()} disabled={generatedAssets.length === 0}>
                  🖨️ Layout impresión
                </button>
                <button className="btn-primary" onClick={() => setStep(1)}>
                  Crear nuevo
                </button>
              </div>
            </div>

            {generatedAssets.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white/60 p-8 text-center">
                <p className="text-sm text-gray-600">
                  No hay lote nuevo. Regresa a Paso 1 para definir un activo y generar etiquetas blockchain-ready.
                </p>
              </div>
            )}

            {generatedAssets.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedAssets.map((asset) => (
                  <div key={asset.uniqueId} className="card border-2 border-gray-200 print:break-inside-avoid">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>{new Date().toLocaleString()}</span>
                      <span className="capitalize">{asset.blockchainProfile}</span>
                    </div>
                    <h3 className="font-semibold text-lg">{asset.uniqueId}</h3>
                    <p className="text-xs text-gray-500 mb-4">
                      Claim: <span className="font-mono text-sm text-gray-700">{asset.claimCode}</span>
                    </p>

                    <div className="space-y-4">
                      {(asset.labelTemplate === 'dual' || asset.labelTemplate === 'single') && (
                        <div>
                          <div className="text-xs font-semibold mb-2 text-center bg-[var(--c2)] text-white px-2 py-1 rounded">
                            QR Primario ({asset.qrSizeMm} mm)
                          </div>
                          <div className="bg-white p-3 rounded border-4 border-[var(--c2)] flex justify-center">
                            <QRCodeDisplay url={asset.publicUrl} size={Math.min(asset.qrSizePx, 260)} />
                          </div>
                          <div className="text-xs text-gray-500 mt-2 break-all text-center">
                            {asset.publicUrl}
                          </div>
                          <button
                            onClick={() => handleDownloadPNG(asset.publicUrl, `${asset.uniqueId}-primary`, asset.qrSizePx)}
                            className="mt-2 text-xs text-[var(--c2)] hover:underline w-full"
                          >
                            Descargar PNG
                          </button>
                        </div>
                      )}

                      {asset.labelTemplate === 'dual' && (
                        <div>
                          <div className="text-xs font-semibold mb-2 text-center bg-blue-100 px-2 py-1 rounded">
                            QR Overlay – Setup &amp; Claim
                          </div>
                          <div className="bg-white p-3 rounded border-2 border-blue-300 flex justify-center">
                            <QRCodeDisplay url={asset.setupUrl} size={Math.min(asset.qrSizePx, 220)} />
                          </div>
                          <div className="text-xs text-gray-500 mt-2 break-all text-center">
                            {asset.setupUrl}
                          </div>
                          <button
                            onClick={() => handleDownloadPNG(asset.setupUrl, `${asset.uniqueId}-overlay`, Math.min(asset.qrSizePx, 220))}
                            className="mt-2 text-xs text-[var(--c2)] hover:underline w-full"
                          >
                            Descargar PNG
                          </button>
                        </div>
                      )}

                      {asset.labelTemplate === 'sheet' && (
                        <div className="rounded border border-dashed border-gray-300 p-3 text-xs text-gray-600">
                          Layout PDF listo. Usa “Layout impresión” para descargar todas las etiquetas en hoja.
                        </div>
                      )}
                    </div>

                    {asset.additionalAnchors.length > 0 && (
                      <div className="mt-4 text-[11px] text-gray-500">
                        Anclajes extra:{' '}
                        <span className="font-semibold">{asset.additionalAnchors.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {generatedAssets.length > 0 && (
              <div className="rounded border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600">
                Cada QR está vinculado criptográficamente a registros ERC-3643 con cumplimiento ISO/TC 307. Escanea para
                ver trazabilidad y pruebas.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


