'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface Animal {
  id: string
  public_id: string
  name: string
  species: string
  breed: string | null
  birth_year: number | null
  sex: string | null
  size: string | null
  status: string
  photo_url: string | null
  created_at: string
  dam_id: string | null
  sire_id: string | null
  birth_weight: number | null
  weaning_weight: number | null
  weaning_date: string | null
  yearling_weight: number | null
  yearling_date: string | null
  purchase_price: number | null
  purchase_date: string | null
  seller: string | null
  eid: string | null
  brand: string | null
  tags?: { tag_code: string; token_id: string | null; status: string; chain: string; contract_address: string | null }[] | null
}

interface AnimalEvent {
  id: string
  animal_id: string
  event_type: string
  title: string
  description: string | null
  event_date: string
  metadata: Record<string, any>
  evidence_urls: string[]
  created_at: string
}

interface RanchProfile {
  ranch: { id: string; name: string; contact_email: string; phone: string | null; wallet_address: string | null; created_at: string }
  user: { id: string; name: string | null; email: string; phone: string | null }
  stats: { animal_count: number; tag_count: number; on_chain_count: number }
}

const EVENT_TYPES = [
  { value: 'health_check', label: 'Health Check', icon: '🩺' },
  { value: 'vaccination', label: 'Vaccination', icon: '💉' },
  { value: 'treatment', label: 'Treatment', icon: '💊' },
  { value: 'weight', label: 'Weight Record', icon: '⚖️' },
  { value: 'movement', label: 'Movement', icon: '🚛' },
  { value: 'breeding', label: 'Breeding', icon: '🧬' },
  { value: 'calving', label: 'Calving', icon: '🐮' },
  { value: 'processing', label: 'Processing', icon: '🏭' },
  { value: 'cost', label: 'Cost/Expense', icon: '💰' },
  { value: 'note', label: 'Note', icon: '📝' },
]

const TABS = ['overview', 'herd', 'health', 'analytics', 'settings'] as const
type Tab = typeof TABS[number]

const ic = 'w-full px-4 py-3 bg-[var(--bg)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none text-[var(--c1)]'
const eventIcon = (t: string) => EVENT_TYPES.find(e => e.value === t)?.icon || '📋'

export default function RanchDashboard() {
  const [session, setSession] = useState<{ authenticated: boolean; user_id?: string; ranch_id?: string; email?: string; wallet_address?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  // Login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginCode, setLoginCode] = useState('')
  const [loginStep, setLoginStep] = useState<'email' | 'code'>('email')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // Dashboard
  const [tab, setTab] = useState<Tab>('overview')
  const [animals, setAnimals] = useState<Animal[]>([])
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null)
  const [events, setEvents] = useState<AnimalEvent[]>([])
  const [allEvents, setAllEvents] = useState<AnimalEvent[]>([])
  const [profile, setProfile] = useState<RanchProfile | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [speciesFilter, setSpeciesFilter] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  // Event form
  const [showEventForm, setShowEventForm] = useState(false)
  const [evtType, setEvtType] = useState('note')
  const [evtTitle, setEvtTitle] = useState('')
  const [evtDesc, setEvtDesc] = useState('')
  const [evtDate, setEvtDate] = useState(new Date().toISOString().split('T')[0])
  const [evtSaving, setEvtSaving] = useState(false)
  const [evtFile, setEvtFile] = useState<File | null>(null)

  // Settings
  const [editRanchName, setEditRanchName] = useState('')
  const [editUserName, setEditUserName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [copied, setCopied] = useState(false)

  const checkSession = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/session', { credentials: 'include' })
      setSession(await r.json())
    } catch { setSession({ authenticated: false }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { checkSession() }, [checkSession])

  const fetchAnimals = useCallback(async () => {
    if (!session?.authenticated) return
    try {
      const r = await fetch('/api/ranch/animals', { credentials: 'include' })
      const d = await r.json()
      if (d.animals) setAnimals(d.animals)
    } catch {}
  }, [session?.authenticated])

  const fetchProfile = useCallback(async () => {
    if (!session?.authenticated) return
    try {
      const r = await fetch('/api/ranch/profile', { credentials: 'include' })
      const d = await r.json()
      if (d.ranch) {
        setProfile(d)
        setEditRanchName(d.ranch.name || '')
        setEditUserName(d.user.name || '')
        setEditPhone(d.user.phone || '')
      }
    } catch {}
  }, [session?.authenticated])

  const fetchAllEvents = useCallback(async () => {
    if (!session?.authenticated) return
    try {
      const r = await fetch('/api/ranch/events', { credentials: 'include' })
      const d = await r.json()
      if (d.events) setAllEvents(d.events)
    } catch {}
  }, [session?.authenticated])

  useEffect(() => { fetchAnimals(); fetchProfile(); fetchAllEvents() }, [fetchAnimals, fetchProfile, fetchAllEvents])

  const fetchEvents = useCallback(async (aid: string) => {
    try {
      const r = await fetch(`/api/ranch/events?animal_id=${aid}`, { credentials: 'include' })
      const d = await r.json()
      if (d.events) setEvents(d.events)
    } catch {}
  }, [])

  useEffect(() => { if (selectedAnimal) fetchEvents(selectedAnimal.id) }, [selectedAnimal, fetchEvents])

  // Login handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoginLoading(true); setLoginError(null)
    try {
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: loginEmail }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setLoginStep('code')
    } catch (err: any) { setLoginError(err.message) }
    finally { setLoginLoading(false) }
  }

  const handleVerifyLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoginLoading(true); setLoginError(null)
    try {
      const r = await fetch('/api/auth/verify-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email: loginEmail, code: loginCode, purpose: 'login' }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      await checkSession()
    } catch (err: any) { setLoginError(err.message) }
    finally { setLoginLoading(false) }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' })
    setSession({ authenticated: false }); setAnimals([]); setSelectedAnimal(null)
  }

  // Event handler
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAnimal) return
    setEvtSaving(true)
    try {
      let evidenceUrls: string[] = []
      if (evtFile) {
        const fd = new FormData(); fd.append('file', evtFile)
        const ur = await fetch('/api/upload-photo', { method: 'POST', body: fd })
        const ud = await ur.json()
        if (ud.photo_url) evidenceUrls = [ud.photo_url]
      }
      const r = await fetch('/api/ranch/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ animal_id: selectedAnimal.id, event_type: evtType, title: evtTitle, description: evtDesc || undefined, event_date: new Date(evtDate).toISOString(), evidence_urls: evidenceUrls.length ? evidenceUrls : undefined }),
      })
      if (!r.ok) throw new Error('Failed to save')
      setShowEventForm(false); setEvtTitle(''); setEvtDesc(''); setEvtFile(null); setEvtType('note')
      fetchEvents(selectedAnimal.id); fetchAllEvents()
    } catch (err: any) { alert(err.message) }
    finally { setEvtSaving(false) }
  }

  // Profile save
  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      await fetch('/api/ranch/profile', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ ranch_name: editRanchName || undefined, user_name: editUserName || undefined, phone: editPhone || undefined }),
      })
      fetchProfile()
    } catch {}
    finally { setSavingProfile(false) }
  }

  const handleExport = async () => {
    const r = await fetch('/api/ranch/export', { credentials: 'include' })
    const blob = await r.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `ranchlink-export-${new Date().toISOString().split('T')[0]}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const copyWallet = () => {
    if (session?.wallet_address) {
      navigator.clipboard?.writeText(session.wallet_address).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => {})
    }
  }

  // Filters
  const filtered = animals.filter(a => {
    const q = searchQuery.toLowerCase()
    const matchQ = !q || a.name.toLowerCase().includes(q) || a.public_id.toLowerCase().includes(q) || (a.breed || '').toLowerCase().includes(q) || (a.tags?.[0]?.tag_code || '').toLowerCase().includes(q)
    const matchS = !speciesFilter || a.species === speciesFilter
    return matchQ && matchS
  })
  const species = [...new Set(animals.map(a => a.species))]
  const totalOnChain = animals.filter(a => a.tags?.some(t => t.token_id)).length
  const recentEvents = allEvents.slice(0, 8)

  // ── Loading ──
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--c2)]" /></div>

  // ── Login ──
  if (!session?.authenticated) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/"><span className="text-3xl font-bold gradient-text">🐄 RanchLink</span></Link>
          <h1 className="text-2xl font-bold mt-4 mb-2">Ranch Dashboard</h1>
          <p className="text-[var(--c4)]">Sign in to manage your livestock and assets</p>
        </div>
        <div className="bg-[var(--bg-card)] rounded-xl border border-[#1F2937] p-6">
          {loginStep === 'email' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div><label className="block text-sm font-medium text-[var(--c4)] mb-1">Email Address</label>
                <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="your@email.com" className={ic} required autoFocus /></div>
              {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
              <button type="submit" className="w-full py-3 rounded-lg bg-[var(--c2)] text-white font-semibold hover:opacity-90 disabled:opacity-50" disabled={loginLoading}>{loginLoading ? 'Sending...' : 'Send Login Code'}</button>
              <p className="text-xs text-center text-[var(--c4)]">Don&apos;t have an account? <Link href="/start" className="text-[var(--c2)] hover:underline">Claim a tag</Link> to get started.</p>
            </form>
          ) : (
            <form onSubmit={handleVerifyLogin} className="space-y-4">
              <p className="text-sm text-[var(--c4)]">Code sent to <span className="text-[var(--c2)]">{loginEmail}</span></p>
              <div><label className="block text-sm font-medium text-[var(--c4)] mb-1">Verification Code</label>
                <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className={`${ic} text-center text-2xl tracking-[0.5em] font-mono`} maxLength={6} required autoFocus /></div>
              {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
              <button type="submit" className="w-full py-3 rounded-lg bg-[var(--c2)] text-white font-semibold hover:opacity-90 disabled:opacity-50" disabled={loginLoading || loginCode.length !== 6}>{loginLoading ? 'Verifying...' : 'Sign In'}</button>
              <button type="button" onClick={() => { setLoginStep('email'); setLoginCode(''); setLoginError(null) }} className="w-full text-sm text-[var(--c4)] hover:text-[var(--c2)]">← Different email</button>
            </form>
          )}
        </div>
      </div>
    </div>
  )

  // ── Animal Detail ──
  if (selectedAnimal) {
    const tag = selectedAnimal.tags?.[0]
    const costEvents = events.filter(e => e.event_type === 'cost')
    const totalCosts = costEvents.reduce((s, e) => s + (e.metadata?.amount || 0), 0) + (selectedAnimal.purchase_price || 0)

    return (
      <div className="min-h-screen bg-[var(--bg)] pb-20">
        <div className="bg-[var(--bg-card)] border-b border-[#1F2937] sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
            <button onClick={() => { setSelectedAnimal(null); setEvents([]) }} className="text-[var(--c4)] hover:text-[var(--c2)] text-sm">← Back</button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{selectedAnimal.name}</h1>
              <p className="text-sm text-[var(--c4)]">{selectedAnimal.public_id} {tag && `· ${tag.tag_code}`}</p>
            </div>
            <Link href={`/a/${selectedAnimal.public_id}`} target="_blank" className="text-sm text-[var(--c2)] hover:underline shrink-0">Public Card →</Link>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          {selectedAnimal.photo_url && <div className="rounded-xl overflow-hidden border border-[#1F2937]"><img src={selectedAnimal.photo_url} alt={selectedAnimal.name} className="w-full h-48 object-cover" /></div>}

          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['Species', selectedAnimal.species], ['Breed', selectedAnimal.breed || '—'], ['Sex', selectedAnimal.sex || '—'], ['Birth Year', selectedAnimal.birth_year || '—'],
              ['Size', selectedAnimal.size || '—'], ['EID', selectedAnimal.eid || '—'], ['Brand', selectedAnimal.brand || '—'], ['On-Chain', tag?.token_id ? `#${tag.token_id}` : 'Pending'],
            ].map(([l, v]) => (
              <div key={l as string} className="bg-[var(--bg-card)] rounded-lg p-3 border border-[#1F2937]">
                <p className="text-xs text-[var(--c4)]">{l}</p><p className="font-semibold text-sm truncate">{v}</p>
              </div>
            ))}
          </div>

          {/* Genetics */}
          {(selectedAnimal.dam_id || selectedAnimal.sire_id || selectedAnimal.birth_weight) && (
            <div className="bg-[var(--bg-card)] rounded-xl border border-[#1F2937] p-5">
              <h3 className="font-bold mb-3">🧬 Genetics & Growth</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                {selectedAnimal.dam_id && <div><span className="text-[var(--c4)]">Dam:</span> {selectedAnimal.dam_id}</div>}
                {selectedAnimal.sire_id && <div><span className="text-[var(--c4)]">Sire:</span> {selectedAnimal.sire_id}</div>}
                {selectedAnimal.birth_weight && <div><span className="text-[var(--c4)]">Birth Weight:</span> {selectedAnimal.birth_weight} kg</div>}
                {selectedAnimal.weaning_weight && <div><span className="text-[var(--c4)]">Weaning:</span> {selectedAnimal.weaning_weight} kg {selectedAnimal.weaning_date && `(${new Date(selectedAnimal.weaning_date).toLocaleDateString()})`}</div>}
                {selectedAnimal.yearling_weight && <div><span className="text-[var(--c4)]">Yearling:</span> {selectedAnimal.yearling_weight} kg</div>}
              </div>
            </div>
          )}

          {/* Financial */}
          <div className="bg-[var(--bg-card)] rounded-xl border border-[#1F2937] p-5">
            <h3 className="font-bold mb-3">💰 Financial</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {selectedAnimal.purchase_price && <div><span className="text-[var(--c4)]">Purchase:</span> ${selectedAnimal.purchase_price.toLocaleString()}</div>}
              {selectedAnimal.purchase_date && <div><span className="text-[var(--c4)]">Date:</span> {new Date(selectedAnimal.purchase_date).toLocaleDateString()}</div>}
              {selectedAnimal.seller && <div><span className="text-[var(--c4)]">Seller:</span> {selectedAnimal.seller}</div>}
              <div><span className="text-[var(--c4)]">Total Costs:</span> <span className="text-[var(--c2)] font-semibold">${totalCosts.toLocaleString()}</span></div>
            </div>
          </div>

          {/* Events */}
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Events & Records</h3>
            <button onClick={() => setShowEventForm(true)} className="px-4 py-2 rounded-lg bg-[var(--c2)] text-white text-sm font-medium hover:opacity-90">+ Add Event</button>
          </div>

          {showEventForm && (
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--c2)]/50 p-5">
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-[var(--c4)] mb-1">Type</label>
                    <select value={evtType} onChange={e => setEvtType(e.target.value)} className={ic}>{EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-[var(--c4)] mb-1">Date</label>
                    <input type="date" value={evtDate} onChange={e => setEvtDate(e.target.value)} className={ic} /></div>
                </div>
                <div><label className="block text-sm font-medium text-[var(--c4)] mb-1">Title *</label>
                  <input type="text" value={evtTitle} onChange={e => setEvtTitle(e.target.value)} placeholder="e.g. Annual vaccination" className={ic} required /></div>
                <div><label className="block text-sm font-medium text-[var(--c4)] mb-1">Notes</label>
                  <textarea value={evtDesc} onChange={e => setEvtDesc(e.target.value)} placeholder="Details..." className={`${ic} h-20 resize-none`} /></div>
                <div><label className="block text-sm font-medium text-[var(--c4)] mb-1">Evidence (photo/scan)</label>
                  <input type="file" accept="image/*" onChange={e => setEvtFile(e.target.files?.[0] || null)} className="text-sm text-[var(--c4)]" /></div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowEventForm(false)} className="flex-1 py-2 rounded-lg border border-[#1F2937] text-[var(--c4)]">Cancel</button>
                  <button type="submit" className="flex-1 py-2 rounded-lg bg-[var(--c2)] text-white font-medium disabled:opacity-50" disabled={evtSaving || !evtTitle}>{evtSaving ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          )}

          {events.length > 0 ? (
            <div className="space-y-2">
              {events.map(ev => (
                <div key={ev.id} className="bg-[var(--bg-card)] rounded-lg border border-[#1F2937] p-4 flex gap-4">
                  <div className="text-2xl shrink-0">{eventIcon(ev.event_type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1"><h4 className="font-semibold truncate">{ev.title}</h4><span className="text-xs text-[var(--c4)] capitalize shrink-0">{ev.event_type.replace(/_/g, ' ')}</span></div>
                    {ev.description && <p className="text-sm text-[var(--c4)] mb-1">{ev.description}</p>}
                    {ev.evidence_urls?.length > 0 && <div className="flex gap-2 mt-2">{ev.evidence_urls.map((u, i) => <img key={i} src={u} alt="" className="w-16 h-16 rounded object-cover border border-[#1F2937]" />)}</div>}
                    <p className="text-xs text-[var(--c4)] mt-1">{new Date(ev.event_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-12 text-[var(--c4)]"><p className="text-4xl mb-3">📋</p><p>No events yet</p></div>}
        </div>
      </div>
    )
  }

  // ── Main Dashboard ──
  return (
    <div className="min-h-screen bg-[var(--bg)] pb-20">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border-b border-[#1F2937]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div><Link href="/"><span className="text-lg font-bold gradient-text">🐄 RanchLink</span></Link><p className="text-xs text-[var(--c4)]">{session.email}</p></div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-[var(--c4)] hover:text-[var(--c2)]">Home</Link>
            <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300">Sign Out</button>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${tab === t ? 'border-[var(--c2)] text-[var(--c2)]' : 'border-transparent text-[var(--c4)] hover:text-[var(--c1)]'}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[var(--bg-card)] rounded-lg p-4 border border-[#1F2937]"><p className="text-2xl font-bold text-[var(--c2)]">{animals.length}</p><p className="text-xs text-[var(--c4)]">Animals</p></div>
              <div className="bg-[var(--bg-card)] rounded-lg p-4 border border-[#1F2937]"><p className="text-2xl font-bold text-green-400">{totalOnChain}</p><p className="text-xs text-[var(--c4)]">On-Chain</p></div>
              <div className="bg-[var(--bg-card)] rounded-lg p-4 border border-[#1F2937]"><p className="text-2xl font-bold text-cyan-400">{species.length}</p><p className="text-xs text-[var(--c4)]">Species</p></div>
              <div className="bg-[var(--bg-card)] rounded-lg p-4 border border-[#1F2937]"><p className="text-2xl font-bold text-yellow-400">{allEvents.length}</p><p className="text-xs text-[var(--c4)]">Events</p></div>
            </div>

            {session.wallet_address && (
              <div className="bg-[var(--bg-card)] rounded-lg p-4 border border-[#1F2937] flex items-center gap-3">
                <span className="text-2xl">🔐</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--c4)]">Ranch Wallet (Base)</p>
                  <p className="text-sm font-mono truncate">{session.wallet_address}</p>
                </div>
                <button onClick={copyWallet} className="text-sm text-[var(--c2)] shrink-0">{copied ? '✓ Copied' : 'Copy'}</button>
              </div>
            )}

            <div>
              <h3 className="font-bold mb-3">Recent Activity</h3>
              {recentEvents.length > 0 ? (
                <div className="space-y-2">{recentEvents.map(ev => {
                  const animal = animals.find(a => a.id === ev.animal_id)
                  return (
                    <div key={ev.id} className="bg-[var(--bg-card)] rounded-lg border border-[#1F2937] p-3 flex items-center gap-3 text-sm">
                      <span className="text-lg">{eventIcon(ev.event_type)}</span>
                      <div className="flex-1 min-w-0"><span className="font-medium">{ev.title}</span>{animal && <span className="text-[var(--c4)]"> · {animal.name}</span>}</div>
                      <span className="text-xs text-[var(--c4)] shrink-0">{new Date(ev.event_date).toLocaleDateString()}</span>
                    </div>
                  )
                })}</div>
              ) : <p className="text-[var(--c4)] text-sm">No activity yet. Claim a tag to get started.</p>}
            </div>

            <div className="flex gap-3">
              <Link href="/start" className="flex-1 py-3 rounded-lg bg-[var(--c2)] text-white text-center font-semibold hover:opacity-90">Claim a Tag</Link>
              <Link href="/scan" className="flex-1 py-3 rounded-lg border border-[#1F2937] text-[var(--c4)] text-center hover:border-[var(--c2)]">Scan QR</Link>
            </div>
          </div>
        )}

        {/* ── HERD ── */}
        {tab === 'herd' && (
          <div className="space-y-4">
            <div className="flex gap-3 items-center flex-wrap">
              <div className="flex-1 min-w-[200px] relative">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search name, ID, breed, tag..." className={`${ic} pl-10`} />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c4)]">🔍</span>
              </div>
              {species.length > 1 && (
                <select value={speciesFilter} onChange={e => setSpeciesFilter(e.target.value)} className={`${ic} w-auto`}>
                  <option value="">All Species</option>
                  {species.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              <div className="flex rounded-lg overflow-hidden border border-[#1F2937]">
                <button onClick={() => setView('grid')} className={`px-3 py-2 text-sm ${view === 'grid' ? 'bg-[var(--c2)] text-white' : 'bg-[var(--bg-card)] text-[var(--c4)]'}`}>Grid</button>
                <button onClick={() => setView('list')} className={`px-3 py-2 text-sm ${view === 'list' ? 'bg-[var(--c2)] text-white' : 'bg-[var(--bg-card)] text-[var(--c4)]'}`}>List</button>
              </div>
            </div>

            {filtered.length > 0 ? (
              view === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map(a => (
                    <button key={a.id} onClick={() => setSelectedAnimal(a)} className="bg-[var(--bg-card)] rounded-xl border border-[#1F2937] overflow-hidden hover:border-[var(--c2)] transition-colors text-left">
                      {a.photo_url ? <img src={a.photo_url} alt={a.name} className="w-full h-36 object-cover" /> : <div className="w-full h-36 bg-[var(--bg-secondary)] flex items-center justify-center text-4xl">🐄</div>}
                      <div className="p-4">
                        <div className="flex items-baseline justify-between gap-2 mb-1"><h3 className="font-bold truncate">{a.name}</h3><span className="text-xs text-[var(--c4)] font-mono shrink-0">{a.public_id}</span></div>
                        <p className="text-sm text-[var(--c4)]">{a.species}{a.breed ? ` · ${a.breed}` : ''}{a.sex ? ` · ${a.sex}` : ''}</p>
                        {a.tags?.[0] && <div className="mt-2 flex items-center gap-2"><span className="text-xs font-mono text-[var(--c4)]">{a.tags[0].tag_code}</span>{a.tags[0].token_id && <span className="text-xs text-green-400">On-Chain</span>}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">{filtered.map(a => (
                  <button key={a.id} onClick={() => setSelectedAnimal(a)} className="w-full bg-[var(--bg-card)] rounded-lg border border-[#1F2937] p-4 flex items-center gap-4 hover:border-[var(--c2)] transition-colors text-left">
                    {a.photo_url ? <img src={a.photo_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" /> : <div className="w-12 h-12 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-xl shrink-0">🐄</div>}
                    <div className="flex-1 min-w-0"><h3 className="font-semibold truncate">{a.name}</h3><p className="text-sm text-[var(--c4)] truncate">{a.public_id} · {a.species}{a.breed ? ` · ${a.breed}` : ''}</p></div>
                    <div className="text-right shrink-0">{a.tags?.[0] && <p className="text-xs font-mono text-[var(--c4)]">{a.tags[0].tag_code}</p>}{a.tags?.[0]?.token_id && <p className="text-xs text-green-400">On-Chain</p>}</div>
                  </button>
                ))}</div>
              )
            ) : (
              <div className="text-center py-16"><p className="text-5xl mb-4">🐄</p><h3 className="text-xl font-bold mb-2">No Animals Yet</h3><p className="text-[var(--c4)] mb-6">Scan a RanchLink tag to register your first animal</p><Link href="/start" className="px-6 py-3 rounded-lg bg-[var(--c2)] text-white font-semibold hover:opacity-90">Claim a Tag</Link></div>
            )}
          </div>
        )}

        {/* ── HEALTH ── */}
        {tab === 'health' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Health & Treatments</h2>
            {(() => {
              const healthEvents = allEvents.filter(e => ['health_check', 'vaccination', 'treatment'].includes(e.event_type))
              return healthEvents.length > 0 ? (
                <div className="space-y-2">{healthEvents.map(ev => {
                  const animal = animals.find(a => a.id === ev.animal_id)
                  return (
                    <div key={ev.id} className="bg-[var(--bg-card)] rounded-lg border border-[#1F2937] p-4 flex gap-4">
                      <div className="text-2xl shrink-0">{eventIcon(ev.event_type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1"><h4 className="font-semibold truncate">{ev.title}</h4>{animal && <span className="text-xs text-[var(--c4)]">· {animal.name} ({animal.public_id})</span>}</div>
                        {ev.description && <p className="text-sm text-[var(--c4)]">{ev.description}</p>}
                        <p className="text-xs text-[var(--c4)] mt-1">{new Date(ev.event_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )
                })}</div>
              ) : <p className="text-[var(--c4)]">No health events recorded. Select an animal and add health checks, vaccinations, or treatments.</p>
            })()}
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {tab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Analytics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[var(--bg-card)] rounded-xl border border-[#1F2937] p-5">
                <h3 className="font-bold mb-3">Herd Composition</h3>
                {species.length > 0 ? species.map(s => {
                  const count = animals.filter(a => a.species === s).length
                  const pct = Math.round((count / animals.length) * 100)
                  return (
                    <div key={s} className="flex items-center gap-3 mb-2">
                      <span className="text-sm w-24 truncate">{s}</span>
                      <div className="flex-1 bg-[var(--bg)] rounded-full h-3 overflow-hidden"><div className="h-full bg-[var(--c2)] rounded-full" style={{ width: `${pct}%` }} /></div>
                      <span className="text-xs text-[var(--c4)] w-12 text-right">{count} ({pct}%)</span>
                    </div>
                  )
                }) : <p className="text-[var(--c4)] text-sm">No data</p>}
              </div>
              <div className="bg-[var(--bg-card)] rounded-xl border border-[#1F2937] p-5">
                <h3 className="font-bold mb-3">Costs Summary</h3>
                {(() => {
                  const totalPurchase = animals.reduce((s, a) => s + (a.purchase_price || 0), 0)
                  const totalExpenses = allEvents.filter(e => e.event_type === 'cost').reduce((s, e) => s + (e.metadata?.amount || 0), 0)
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm"><span className="text-[var(--c4)]">Purchase costs</span><span className="font-semibold">${totalPurchase.toLocaleString()}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-[var(--c4)]">Operating expenses</span><span className="font-semibold">${totalExpenses.toLocaleString()}</span></div>
                      <div className="border-t border-[#1F2937] pt-2 flex justify-between text-sm"><span className="text-[var(--c4)]">Total investment</span><span className="font-bold text-[var(--c2)]">${(totalPurchase + totalExpenses).toLocaleString()}</span></div>
                    </div>
                  )
                })()}
              </div>
              <div className="bg-[var(--bg-card)] rounded-xl border border-[#1F2937] p-5">
                <h3 className="font-bold mb-3">Events by Type</h3>
                {EVENT_TYPES.map(t => {
                  const count = allEvents.filter(e => e.event_type === t.value).length
                  if (!count) return null
                  return <div key={t.value} className="flex items-center gap-2 mb-1 text-sm"><span>{t.icon}</span><span className="flex-1">{t.label}</span><span className="text-[var(--c4)]">{count}</span></div>
                })}
              </div>
              <div className="bg-[var(--bg-card)] rounded-xl border border-[#1F2937] p-5">
                <h3 className="font-bold mb-3">On-Chain Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-[var(--c4)]">Tokenized (on-chain)</span><span className="text-green-400 font-semibold">{totalOnChain}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[var(--c4)]">Pending</span><span className="text-yellow-400 font-semibold">{animals.length - totalOnChain}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[var(--c4)]">Total RWAs</span><span className="font-bold">{animals.length}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && profile && (
          <div className="space-y-6 max-w-lg">
            <h2 className="text-xl font-bold">Settings</h2>
            <div className="bg-[var(--bg-card)] rounded-xl border border-[#1F2937] p-5 space-y-4">
              <div><label className="block text-sm font-medium text-[var(--c4)] mb-1">Ranch Name</label>
                <input type="text" value={editRanchName} onChange={e => setEditRanchName(e.target.value)} className={ic} /></div>
              <div><label className="block text-sm font-medium text-[var(--c4)] mb-1">Your Name</label>
                <input type="text" value={editUserName} onChange={e => setEditUserName(e.target.value)} className={ic} /></div>
              <div><label className="block text-sm font-medium text-[var(--c4)] mb-1">Phone</label>
                <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className={ic} /></div>
              <div><label className="block text-sm font-medium text-[var(--c4)] mb-1">Email</label>
                <input type="email" value={profile.user.email} readOnly className={`${ic} opacity-60 cursor-not-allowed`} /></div>
              <button onClick={handleSaveProfile} className="w-full py-3 rounded-lg bg-[var(--c2)] text-white font-semibold hover:opacity-90 disabled:opacity-50" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save Changes'}</button>
            </div>

            {session.wallet_address && (
              <div className="bg-[var(--bg-card)] rounded-xl border border-[#1F2937] p-5">
                <h3 className="font-bold mb-2">🔐 Custodial Wallet</h3>
                <p className="text-xs text-[var(--c4)] mb-2">Your ranch&apos;s blockchain wallet on Base. All your RWA tokens are held here.</p>
                <div className="flex items-center gap-2 bg-[var(--bg)] rounded-lg p-3">
                  <code className="text-sm font-mono truncate flex-1">{session.wallet_address}</code>
                  <button onClick={copyWallet} className="text-sm text-[var(--c2)] shrink-0">{copied ? '✓' : 'Copy'}</button>
                </div>
                <p className="text-xs text-[var(--c4)] mt-3">Want to transfer your assets to your own wallet or convert to non-custodial? <a href="mailto:solve@ritxma.com?subject=Wallet%20Transfer%20Request" className="text-[var(--c2)] hover:underline">Contact us</a> (small service fee applies).</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleExport} className="flex-1 py-3 rounded-lg border border-[#1F2937] text-[var(--c4)] hover:border-[var(--c2)] text-sm font-medium">📥 Export All Data</button>
              <button onClick={handleLogout} className="flex-1 py-3 rounded-lg border border-red-800 text-red-400 hover:bg-red-900/20 text-sm font-medium">Sign Out</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
