import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { verifySuperadminAuth } from '@/lib/superadmin-auth'
import { z } from 'zod'
import { keccak256, encodePacked } from 'viem'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // blockchain tx receipt can take 5-30s on Base

const batchSchema = z.object({
  batchName: z.string().min(1).max(200),
  batchSize: z.number().int().min(1).max(10000),
  model: z.string().min(1).max(50),
  material: z.string().min(1).max(50),
  color: z.string().min(1).max(50),
  filamentBrand: z.string().max(100).optional(),
  itwGrams: z.number().optional(),           // Individual Tag Weight (g)
  batchWeightGrams: z.number().optional(),   // ITW × batchSize
  chain: z.string().optional(),
  targetRanchId: z.string().uuid().optional().nullable(),
  kitMode: z.boolean().optional(),
  kitSize: z.number().int().optional(),
})

/**
 * POST /api/factory/batches
 *
 * v2.0 — Merkle Anchoring Architecture
 * ─────────────────────────────────────
 * Factory is now FREE per tag. One blockchain transaction anchors any batch size.
 *
 * Flow:
 *   1. Generate tag codes in Supabase (status: pre_identity)
 *   2. Build Merkle tree of all tag codes
 *   3. Pin batch manifest to IPFS
 *   4. Call anchorBatch() on ERC-1155 contract — ONE tx for entire batch
 *   5. Store Merkle proofs per tag in Supabase
 *
 * Tags become active RWAs when farmers claim them (lazy mint at attach time).
 * Cost: ~$0.05 flat per batch regardless of size.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.error('[FACTORY-v2] Starting Merkle batch creation...')

  const authError = verifySuperadminAuth(request)
  if (authError) return authError

  if (!rateLimit(request, 5, 60000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let validated: z.infer<typeof batchSchema>
  try {
    validated = batchSchema.parse(await request.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: e.errors }, { status: 400 })
    }
    throw e
  }

  const { batchName, batchSize, model, material, color, filamentBrand, itwGrams, batchWeightGrams, chain = 'BASE', targetRanchId } = validated

  // Pre-flight: only need private key and contract address
  const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY
  const contractAddress = process.env.RANCHLINKTAG_1155_ADDRESS || '0x559D8f4196578c2308e092225bdFbBc1AF88d0Fb'

  if (!privateKey) {
    return NextResponse.json({
      error: 'Missing SERVER_WALLET_PRIVATE_KEY',
      hint: 'Check Vercel environment variables',
    }, { status: 500 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY!
  const appUrl      = process.env.NEXT_PUBLIC_APP_URL || 'https://ranch-link.vercel.app'

  // ── 1. Get next tag number ──────────────────────────────────────────────────
  const existingRes = await fetch(
    `${supabaseUrl}/rest/v1/tags?select=tag_code&order=created_at.desc&limit=1`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Cache-Control': 'no-cache' }, cache: 'no-store' }
  )
  const existingTags = await existingRes.json()
  let startNumber = 1
  if (existingTags?.length > 0) {
    const match = existingTags[0].tag_code?.match(/RL-(\d+)/)
    if (match) startNumber = parseInt(match[1], 10) + 1
  }

  // ── 2. Generate tag codes ───────────────────────────────────────────────────
  const tagCodes: string[] = []
  for (let i = 0; i < batchSize; i++) {
    tagCodes.push(`RL-${String(startNumber + i).padStart(3, '0')}`)
  }

  // ── 3. Create batch record ──────────────────────────────────────────────────
  const batchInsertRes = await fetch(`${supabaseUrl}/rest/v1/batches`, {
    method: 'POST',
    headers: {
      apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json', Prefer: 'return=representation',
    },
    body: JSON.stringify({
      name: batchName, batch_name: batchName, model, material, color, chain,
      count: batchSize, target_ranch_id: targetRanchId || null, status: 'anchoring',
      // Physical specs — stored in batch manifest and IPFS
      ...(filamentBrand && { filament_brand: filamentBrand }),
      ...(itwGrams && { itw_grams: itwGrams }),
      ...(batchWeightGrams && { batch_weight_grams: batchWeightGrams }),
    }),
  })
  const [batch] = await batchInsertRes.json()
  if (!batch?.id) {
    return NextResponse.json({ error: 'Failed to create batch record' }, { status: 500 })
  }

  // ── 4. Build Merkle tree ────────────────────────────────────────────────────
  const { buildTagMerkleTree } = await import('@/lib/blockchain/merkle')
  const { root: merkleRoot, proofs } = buildTagMerkleTree(tagCodes)

  // ── 5. Derive batchId (deterministic — no timestamp, reproducible) ─────────
  const batchId = keccak256(encodePacked(['string'], [batch.id]))

  // ── 6. Pin batch manifest to IPFS ──────────────────────────────────────────
  const physicalSpecs = {
    ...(filamentBrand && { filamentBrand }),
    ...(itwGrams && { itwGrams }),
    ...(batchWeightGrams && { batchWeightGrams }),
  }

  let batchURI = `data:application/json,${encodeURIComponent(JSON.stringify({
    batchId, batchName, model, material, color, chain,
    tagCount: batchSize, tagCodes, merkleRoot, createdAt: new Date().toISOString(),
    ...physicalSpecs,
  }))}`

  try {
    const { pinBatchManifest } = await import('@/lib/ipfs/client')
    if (typeof pinBatchManifest === 'function') {
      const cid = await pinBatchManifest({ batchId, batchName, tagCodes, merkleRoot, model, material, color, ...physicalSpecs })
      batchURI = `ipfs://${cid}`
    }
  } catch (e) {
    console.warn('[FACTORY-v2] IPFS pin failed, using inline URI:', e)
  }

  // ── 7. Anchor batch on-chain (ONE transaction) ──────────────────────────────
  let anchorTxHash: string | null = null
  try {
    const { anchorBatch } = await import('@/lib/blockchain/ranchLinkTag1155')
    anchorTxHash = await anchorBatch(batchId, merkleRoot, batchURI)
    console.error(`[FACTORY-v2] ✅ Batch anchored: ${anchorTxHash}`)
  } catch (e: any) {
    console.error('[FACTORY-v2] ❌ Anchor failed:', e.message)
    // Mark batch as failed
    await fetch(`${supabaseUrl}/rest/v1/batches?id=eq.${batch.id}`, {
      method: 'PATCH',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'anchor_failed' }),
    })
    return NextResponse.json({
      error: 'Failed to anchor batch on-chain',
      details: e.message,
      hint: 'Check server wallet ETH balance',
    }, { status: 500 })
  }

  // ── 8. Insert all tags into Supabase ────────────────────────────────────────
  const tagRows = tagCodes.map((tagCode) => ({
    tag_code: tagCode,
    chain: chain || 'BASE',
    contract_address: contractAddress,
    token_id: null,           // Set at lazy mint (claim time)
    mint_tx_hash: null,       // Set at lazy mint (claim time)
    batch_id: batch.id,
    ranch_id: targetRanchId || null,
    status: 'pre_identity',   // Anchored on-chain, NFT mints at claim time
    activation_state: 'active',
    // Merkle proof stored in mint_tx_hash as JSON string (no metadata column needed)
    // Format: "PROOF:<batchIdHex>|<proof1>,<proof2>,..."
    // This is decoded at attach time to reconstruct the proof
    metadata_cid: `MERKLE:${batchId}|${(proofs[tagCode] || []).join(',')}`,
  }))

  // Insert in chunks of 100
  const CHUNK = 100
  const insertedTags: any[] = []
  for (let i = 0; i < tagRows.length; i += CHUNK) {
    const chunk = tagRows.slice(i, i + CHUNK)
    const res = await fetch(`${supabaseUrl}/rest/v1/tags`, {
      method: 'POST',
      headers: {
        apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json', Prefer: 'return=representation',
      },
      body: JSON.stringify(chunk),
    })
    if (!res.ok) {
      const errBody = await res.text()
      console.error(`[FACTORY-v2] Tag insert chunk ${i}–${i + CHUNK} failed:`, errBody)
      // Mark batch as failed and abort
      await fetch(`${supabaseUrl}/rest/v1/batches?id=eq.${batch.id}`, {
        method: 'PATCH',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'insert_failed' }),
      })
      return NextResponse.json({ error: 'Failed to insert tags into database', details: errBody }, { status: 500 })
    }
    const inserted = await res.json()
    if (Array.isArray(inserted)) insertedTags.push(...inserted)
  }

  // ── 9. Update batch status ──────────────────────────────────────────────────
  await fetch(`${supabaseUrl}/rest/v1/batches?id=eq.${batch.id}`, {
    method: 'PATCH',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'ready_for_assembly' }),
  })

  const duration = Date.now() - startTime
  console.error(`[FACTORY-v2] ✅ Done in ${duration}ms. ${batchSize} tags anchored with 1 tx.`)

  // ── 10. Build response ──────────────────────────────────────────────────────
  const responseTags = insertedTags.map((tag: any) => ({
    id: tag.id,
    tag_code: tag.tag_code,
    public_id: null,
    token_id: null,           // Assigned at claim time
    mint_tx_hash: null,
    anchor_tx_hash: anchorTxHash,
    base_qr_url: `${appUrl}/t/${tag.tag_code}`,
    chain: chain || 'BASE',
    contract_address: contractAddress,
    status: 'pre_identity',
    activation_state: 'active',
    batch_id: batch.id,
  }))

  return NextResponse.json({
    success: true,
    message: `✅ ${batchSize} tags anchored on Base Mainnet with 1 transaction. Tags activate as RWAs when farmers claim them.`,
    batch: { id: batch.id, name: batchName },
    tags: responseTags,
    anchor: {
      tx_hash: anchorTxHash,
      basescan_url: `https://basescan.org/tx/${anchorTxHash}`,
      merkle_root: merkleRoot,
      batch_id_hex: batchId,
      cost: 'single transaction (~$0.05)',
    },
    mint_summary: {
      total: batchSize,
      anchored: batchSize,
      successful: batchSize,
      failed: 0,
      note: 'ERC-1155 tokens minted lazily when farmers claim tags',
    },
    duration_ms: duration,
  })
}
