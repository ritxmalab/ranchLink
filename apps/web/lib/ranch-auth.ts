import { getSupabaseServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const SESSION_COOKIE = 'rl_session'
const SESSION_TTL = 30 * 24 * 60 * 60 // 30 days

// ── OTP ─────────────────────────────────────────────────────────────────────

export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// ── Wallet encryption (AES-256-GCM) ─────────────────────────────────────────

function getEncryptionKey(): Buffer {
  const secret = process.env.WALLET_ENCRYPTION_KEY || process.env.SUPERADMIN_SESSION_SECRET || ''
  if (secret.length < 16) throw new Error('WALLET_ENCRYPTION_KEY must be at least 16 chars')
  return crypto.scryptSync(secret, 'ranchlink-wallet-salt', 32)
}

export function encryptPrivateKey(privateKey: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(privateKey, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decryptPrivateKey(encryptedData: string): string {
  const [ivHex, tagHex, dataHex] = encryptedData.split(':')
  const key = getEncryptionKey()
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  return decipher.update(dataHex, 'hex', 'utf8') + decipher.final('utf8')
}

// ── EOA Wallet generation (viem, NOT CDP smart wallets) ─────────────────────

export async function generateRanchWallet(ranchId: string): Promise<{ address: string }> {
  const { generatePrivateKey, privateKeyToAccount } = await import('viem/accounts')
  const supabase = getSupabaseServerClient()

  // Check if wallet already exists
  const { data: existing } = await supabase
    .from('ranch_wallets')
    .select('wallet_address')
    .eq('ranch_id', ranchId)
    .eq('chain', 'BASE')
    .single()

  if (existing?.wallet_address) {
    return { address: existing.wallet_address }
  }

  const privateKey = generatePrivateKey()
  const account = privateKeyToAccount(privateKey)
  const encrypted = encryptPrivateKey(privateKey)

  await supabase.from('ranch_wallets').insert({
    ranch_id: ranchId,
    wallet_address: account.address,
    encrypted_private_key: encrypted,
    chain: 'BASE',
    is_custodial: true,
  })

  // Also store address on ranch for quick access
  await supabase
    .from('ranches')
    .update({ wallet_address: account.address })
    .eq('id', ranchId)

  return { address: account.address }
}

// ── Email via Resend ────────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from =
    process.env.ORDER_EMAIL_FROM ||
    process.env.CLAIM_EMAIL_FROM ||
    'RanchLink <solve@ranchlink.com>'
  if (!apiKey) {
    console.error('[AUTH] RESEND_API_KEY not configured')
    return false
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `Your RanchLink verification code: ${code}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0a0a0a;color:#fff;border-radius:12px">
            <div style="text-align:center;margin-bottom:24px">
              <h1 style="font-size:24px;margin:0;color:#22d3ee">RanchLink</h1>
              <p style="color:#9ca3af;font-size:14px;margin:8px 0 0">Verification Code</p>
            </div>
            <div style="background:#1f2937;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px">
              <p style="color:#9ca3af;font-size:14px;margin:0 0 8px">Your code is:</p>
              <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#22d3ee;font-family:monospace">${code}</div>
            </div>
            <p style="color:#6b7280;font-size:12px;text-align:center">Expires in 10 minutes. Do not share.</p>
            <p style="color:#374151;font-size:11px;text-align:center;margin-top:24px">RanchLink by Ritxma Integrations LLC</p>
          </div>`,
      }),
    })
    return res.ok
  } catch (e) {
    console.error('[AUTH] Email send failed:', e)
    return false
  }
}

export async function sendFulfillmentEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from =
    process.env.ORDER_EMAIL_FROM ||
    process.env.CLAIM_EMAIL_FROM ||
    'RanchLink <solve@ranchlink.com>'
  if (!apiKey) return false

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html: htmlBody }),
    })
    return res.ok
  } catch { return false }
}

// ── Verification codes ──────────────────────────────────────────────────────

export async function createVerificationCode(email: string, phone: string | null, purpose: string = 'claim'): Promise<string | null> {
  const supabase = getSupabaseServerClient()
  const code = generateOTP()

  // Invalidate old codes for same email+purpose
  await supabase
    .from('verification_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('email', email.toLowerCase())
    .eq('purpose', purpose)
    .is('used_at', null)

  const { error } = await supabase.from('verification_codes').insert({
    email: email.toLowerCase(),
    phone: phone || null,
    code,
    purpose,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  })

  if (error) {
    console.error('[AUTH] Code creation failed:', error)
    return null
  }
  return code
}

export async function verifyCode(email: string, code: string, purpose: string = 'claim'): Promise<boolean> {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase
    .from('verification_codes')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('code', code)
    .eq('purpose', purpose)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return false
  if (data.attempts >= data.max_attempts) return false

  await supabase.from('verification_codes').update({ used_at: new Date().toISOString() }).eq('id', data.id)
  return true
}

export async function incrementAttempts(email: string, purpose: string = 'claim'): Promise<void> {
  const supabase = getSupabaseServerClient()
  const { data } = await supabase
    .from('verification_codes')
    .select('id, attempts')
    .eq('email', email.toLowerCase())
    .eq('purpose', purpose)
    .is('used_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (data) {
    await supabase.from('verification_codes').update({ attempts: data.attempts + 1 }).eq('id', data.id)
  }
}

// ── User + ranch management ─────────────────────────────────────────────────

export async function checkExistingUser(email: string, phone?: string): Promise<{ exists: boolean; userId?: string; ranchId?: string; ranchName?: string }> {
  const supabase = getSupabaseServerClient()
  const normalEmail = email.toLowerCase()

  // Check by email
  const { data: byEmail } = await supabase
    .from('ranch_users')
    .select('id, ranch_id, ranches(name)')
    .eq('email', normalEmail)
    .single()

  if (byEmail?.ranch_id) {
    return { exists: true, userId: byEmail.id, ranchId: byEmail.ranch_id, ranchName: (byEmail as any).ranches?.name }
  }

  // Check by phone if provided
  if (phone) {
    const { data: byPhone } = await supabase
      .from('ranch_users')
      .select('id, ranch_id, email, ranches(name)')
      .eq('phone', phone)
      .single()

    if (byPhone?.ranch_id) {
      return { exists: true, userId: byPhone.id, ranchId: byPhone.ranch_id, ranchName: (byPhone as any).ranches?.name }
    }
  }

  return { exists: false }
}

export async function findOrCreateRanchUser(
  email: string,
  phone: string | null,
  name: string | null
): Promise<{ userId: string; ranchId: string; walletAddress: string; isReturning: boolean }> {
  const supabase = getSupabaseServerClient()
  const normalEmail = email.toLowerCase()

  // Check if user already exists (by email or phone)
  const existing = await checkExistingUser(normalEmail, phone || undefined)

  if (existing.exists && existing.userId && existing.ranchId) {
    await supabase.from('ranch_users').update({
      last_login_at: new Date().toISOString(),
      email_verified: true,
      ...(phone && { phone }),
      ...(name && { name }),
    }).eq('id', existing.userId)

    const wallet = await generateRanchWallet(existing.ranchId)
    return { userId: existing.userId, ranchId: existing.ranchId, walletAddress: wallet.address, isReturning: true }
  }

  // New user — create ranch + user + wallet
  const ranchName = name ? `${name}'s Ranch` : `${normalEmail.split('@')[0]}'s Ranch`

  const { data: ranch } = await supabase
    .from('ranches')
    .insert({ name: ranchName, contact_email: normalEmail, phone: phone || null })
    .select('id')
    .single()

  if (!ranch) throw new Error('Failed to create ranch')

  const { data: user } = await supabase
    .from('ranch_users')
    .insert({ email: normalEmail, phone: phone || null, name, ranch_id: ranch.id, email_verified: true })
    .select('id')
    .single()

  if (!user) throw new Error('Failed to create user')

  const wallet = await generateRanchWallet(ranch.id)

  return { userId: user.id, ranchId: ranch.id, walletAddress: wallet.address, isReturning: false }
}

// ── Sessions ────────────────────────────────────────────────────────────────

export async function createSession(userId: string): Promise<string> {
  const supabase = getSupabaseServerClient()
  const token = generateSessionToken()
  await supabase.from('ranch_sessions').insert({
    user_id: userId,
    session_token: token,
    expires_at: new Date(Date.now() + SESSION_TTL * 1000).toISOString(),
  })
  return token
}

export async function validateSession(request: NextRequest): Promise<{
  userId: string; ranchId: string; email: string; walletAddress: string | null
} | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null

  const supabase = getSupabaseServerClient()
  const { data: session } = await supabase
    .from('ranch_sessions')
    .select('user_id, expires_at')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!session) return null

  const { data: user } = await supabase
    .from('ranch_users')
    .select('id, ranch_id, email')
    .eq('id', session.user_id)
    .single()

  if (!user || !user.ranch_id) return null

  const { data: ranch } = await supabase
    .from('ranches')
    .select('wallet_address')
    .eq('id', user.ranch_id)
    .single()

  return {
    userId: user.id,
    ranchId: user.ranch_id,
    email: user.email,
    walletAddress: ranch?.wallet_address || null,
  }
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL,
    secure: process.env.NODE_ENV === 'production',
  })
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0, secure: process.env.NODE_ENV === 'production' })
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE

// ── Finalize-claim token (for retroactive identity on existing tags) ────────

export function generateFinalizeToken(tagCode: string, publicId: string): string {
  const secret = process.env.SUPERADMIN_SESSION_SECRET || process.env.SUPERADMIN_PASSWORD || ''
  const payload = `${tagCode}:${publicId}:${Date.now()}`
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 16)
  return Buffer.from(`${payload}:${hmac}`).toString('base64url')
}

export function verifyFinalizeToken(token: string): { tagCode: string; publicId: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const parts = decoded.split(':')
    if (parts.length < 4) return null
    const [tagCode, publicId, ts, hmac] = parts
    const secret = process.env.SUPERADMIN_SESSION_SECRET || process.env.SUPERADMIN_PASSWORD || ''
    const expected = crypto.createHmac('sha256', secret).update(`${tagCode}:${publicId}:${ts}`).digest('hex').slice(0, 16)
    if (hmac !== expected) return null
    // Token valid for 30 days
    if (Date.now() - parseInt(ts) > 30 * 24 * 60 * 60 * 1000) return null
    return { tagCode, publicId }
  } catch { return null }
}
