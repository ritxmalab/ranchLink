'use client'

import { useState, useEffect, useCallback } from 'react'

type Contact = {
  id: string
  list_order: number
  legal_name: string
  contact: string | null
  location: string | null
  category: string | null
  herd_type: string | null
  estimated_herd: string | null
  status: string
  created_at: string
  updated_at: string
}

type Activity = {
  id: string
  pipeline_contact_id: string | null
  action_type: string
  step: string | null
  payload: Record<string, unknown> | null
  created_at: string
}

const POLL_MS = 4000
const CRED = { credentials: 'include' as RequestCredentials }

function TamacoreLogin({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErr('')
    const res = await fetch('/api/superadmin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    if (res.ok) onAuth()
    else setErr('Invalid password')
    setLoading(false)
  }
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1 text-center">TAMACORE (internal)</h1>
        <p className="text-[var(--c4)] text-sm text-center mb-6">Superadmin password required</p>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 bg-[var(--bg-card)] border-2 border-[#1F2937] rounded-lg focus:border-[var(--c2)] focus:outline-none"
            autoFocus
          />
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function TamacoreDashboard() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [seedLoading, setSeedLoading] = useState(false)
  const [seedMessage, setSeedMessage] = useState<string | null>(null)

  useEffect(() => {
    const hasCookie = document.cookie.split(';').some(c =>
      c.trim().startsWith('rl_superadmin=') && c.trim().split('=')[1]?.trim().length > 0
    )
    setAuthed(hasCookie)
  }, [])

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch('/api/tamacore/pipeline', CRED)
      const data = await res.json()
      if (res.status === 401) setAuthed(false)
      else if (data.contacts) setContacts(data.contacts)
    } catch (e) {
      console.error('Pipeline fetch error:', e)
    }
  }, [])

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch('/api/tamacore/activity?limit=30', CRED)
      const data = await res.json()
      if (res.status === 401) setAuthed(false)
      else if (data.activities) setActivities(data.activities)
    } catch (e) {
      console.error('Activity fetch error:', e)
    }
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([fetchPipeline(), fetchActivity()]).finally(() => setLoading(false))
  }, [fetchPipeline, fetchActivity])

  useEffect(() => {
    if (!authed) return
    load()
    const t = setInterval(load, POLL_MS)
    return () => clearInterval(t)
  }, [authed, load])

  const runSeed = async () => {
    setSeedLoading(true)
    setSeedMessage(null)
    try {
      const res = await fetch('/api/tamacore/seed', { method: 'POST', ...CRED })
      const data = await res.json()
      if (res.ok) {
        setSeedMessage(data.message || 'Seeded.')
        fetchPipeline()
      } else {
        setSeedMessage(data.error || data.hint || 'Seed failed')
      }
    } catch (e: unknown) {
      setSeedMessage(String(e))
    }
    setSeedLoading(false)
  }

  if (authed === null) return <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">Loading...</div>
  if (!authed) return <TamacoreLogin onAuth={() => setAuthed(true)} />

  const byCategory = contacts.reduce<Record<string, { total: number; contacted: number }>>((acc, c) => {
    const cat = c.category || 'Other'
    if (!acc[cat]) acc[cat] = { total: 0, contacted: 0 }
    acc[cat].total++
    if (['prototype_sent', 'demo_sent', 'contacted', 'converted'].includes(c.status)) acc[cat].contacted++
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] p-4 sm:p-6">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--c2)]">TAMACORE</h1>
        <p className="text-[var(--c4)] text-sm mt-1">Pipeline & agent activity — live</p>
      </header>

      {contacts.length === 0 && !loading && (
        <div className="card max-w-md mb-6">
          <p className="text-[var(--c4)] mb-3">Pipeline is empty. Run the migration then seed, or seed via API.</p>
          <button
            type="button"
            onClick={runSeed}
            disabled={seedLoading}
            className="px-4 py-2 rounded-lg bg-[var(--c2)] text-white font-medium disabled:opacity-60"
          >
            {seedLoading ? 'Seeding...' : 'Seed pipeline'}
          </button>
          {seedMessage && <p className="mt-2 text-sm text-[var(--c4)]">{seedMessage}</p>}
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3 text-[var(--c2)]">Outreach summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-[#1F2937] rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-[var(--bg-card)] text-left">
                <th className="p-3 border-b border-[#1F2937]">Segment</th>
                <th className="p-3 border-b border-[#1F2937]">Targets</th>
                <th className="p-3 border-b border-[#1F2937]">Contacted</th>
                <th className="p-3 border-b border-[#1F2937]">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byCategory).map(([segment, v]) => (
                <tr key={segment} className="border-b border-[#1F2937] last:border-0">
                  <td className="p-3">{segment}</td>
                  <td className="p-3">{v.total}</td>
                  <td className="p-3">{v.contacted}</td>
                  <td className="p-3">{v.total - v.contacted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3 text-[var(--c2)]">Pipeline contacts</h2>
        {loading && contacts.length === 0 ? (
          <p className="text-[var(--c4)]">Loading...</p>
        ) : (
          <div className="overflow-x-auto border border-[#1F2937] rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-card)] text-left">
                  <th className="p-2 sm:p-3 border-b border-[#1F2937]">#</th>
                  <th className="p-2 sm:p-3 border-b border-[#1F2937]">Legal name</th>
                  <th className="p-2 sm:p-3 border-b border-[#1F2937]">Contact</th>
                  <th className="p-2 sm:p-3 border-b border-[#1F2937]">Category</th>
                  <th className="p-2 sm:p-3 border-b border-[#1F2937]">Herd</th>
                  <th className="p-2 sm:p-3 border-b border-[#1F2937]">Status</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id} className="border-b border-[#1F2937] last:border-0 hover:bg-[var(--bg-card)]/50">
                    <td className="p-2 sm:p-3">{c.list_order}</td>
                    <td className="p-2 sm:p-3 font-medium">{c.legal_name}</td>
                    <td className="p-2 sm:p-3 text-[var(--c4)]">{c.contact ?? '—'}</td>
                    <td className="p-2 sm:p-3">{c.category ?? '—'}</td>
                    <td className="p-2 sm:p-3 text-[var(--c4)]">{c.estimated_herd ?? '—'}</td>
                    <td className="p-2 sm:p-3">
                      <span
                        className={
                          c.status === 'prototype_sent' || c.status === 'demo_sent' || c.status === 'converted'
                            ? 'text-green-400'
                            : c.status === 'target'
                              ? 'text-[var(--c2)]'
                              : 'text-[var(--c4)]'
                        }
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3 text-[var(--c2)]">Agent activity (live)</h2>
        <p className="text-xs text-[var(--c4)] mb-2">Refreshes every {POLL_MS / 1000}s</p>
        {activities.length === 0 && !loading ? (
          <p className="text-[var(--c4)]">No activity yet. Agent will log here as it runs.</p>
        ) : (
          <ul className="space-y-2 max-h-[400px] overflow-y-auto">
            {activities.map((a) => (
              <li
                key={a.id}
                className="p-3 rounded-lg bg-[var(--bg-card)] border border-[#1F2937] text-sm flex flex-wrap items-baseline gap-x-2 gap-y-1"
              >
                <span className="text-[var(--c4)] font-mono text-xs">
                  {new Date(a.created_at).toLocaleString()}
                </span>
                <span className="font-medium text-[var(--c2)]">{a.action_type}</span>
                {a.step && <span className="text-[var(--c4)]">{a.step}</span>}
                {a.pipeline_contact_id && (
                  <span className="text-xs text-[var(--c4)] truncate max-w-[120px]" title={a.pipeline_contact_id}>
                    {a.pipeline_contact_id.slice(0, 8)}…
                  </span>
                )}
                {a.payload && Object.keys(a.payload).length > 0 && (
                  <pre className="w-full mt-1 text-xs text-[var(--c4)] overflow-x-auto">
                    {JSON.stringify(a.payload)}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
