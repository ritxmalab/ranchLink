# RanchLink — Progressive Memory
**Last updated:** 2026-02-28 | **Build:** fb5a35a | **Live:** https://ranch-link.vercel.app

---

## 1. Project Overview

RanchLink is a blockchain-linked cattle tag system. Physical 3D-printed tags (PETG-HF, 30×30mm QR stickers) are manufactured, assembled, and shipped to farmers. Each tag has:
- A **QR code** pointing to `ranch-link.vercel.app/t/[tag_code]` (e.g. `RL-029`)
- A **token code** printed on the sticker (e.g. `RL-029-A3F2B1C4`) — derived from the first 8 chars of the mint tx hash, used as manual claim fallback
- An **ERC-1155 NFT** on Base Mainnet via lazy minting (Merkle tree / `anchorBatch`)
- A **Supabase** backend (project: `utovzxpmfnzihurotqnv`)

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind · Supabase · Viem · Base Mainnet · Pinata IPFS · Vercel

---

## 2. Key URLs

| Page | URL |
|------|-----|
| Home | https://ranch-link.vercel.app |
| Claim Tag | https://ranch-link.vercel.app/start |
| QR Scanner | https://ranch-link.vercel.app/scan |
| Tag Claim Flow | https://ranch-link.vercel.app/t/[tag_code] |
| Animal Card | https://ranch-link.vercel.app/a/[public_id] |
| Dashboard | https://ranch-link.vercel.app/dashboard |
| Superadmin | https://ranch-link.vercel.app/superadmin |
| Marketplace | https://ranch-link.vercel.app/marketplace |

---

## 3. Architecture & Data Flow

### Tag Lifecycle
```
Factory (batch generation) 
  → anchorBatch on-chain (ERC-1155 Merkle root)  [status: pre_identity]
  → Assemble (print QR sticker + attach to 3D tag) [status: assembled]
  → Push to Inventory                              [status: in_inventory]
  → Demo / For Sale / Sold / Shipped               [status: demo/for_sale/sold/shipped]
  → Farmer claims via /t/[tag_code]                [status: attached]
  → Lazy mint (ERC-1155 token issued)              [status: attached, token_id set]
```

### Public IDs
- Tags: `RL-001` to `RL-029` (29 total as of 2026-02-28)
- Animals: `AUS0001` to `AUS0005` (5 attached animals)
- Token codes: `RL-XXX-[8 hex chars from mint_tx_hash]` or `RL-XXX-T[token_id]`

### Animals (as of 2026-02-28)
| public_id | name | tag | token_id | on-chain |
|-----------|------|-----|----------|----------|
| AUS0001 | Gonzo | RL-001 | — | OFF |
| AUS0002 | Gonzo | RL-003 | — | OFF |
| AUS0003 | Rocket | RL-004 | — | OFF |
| AUS0004 | Gonzo | RL-007 | #3 | ✅ ON |
| AUS0005 | Bañu | RL-002 | #5 | ✅ ON |

### Batches (as of 2026-02-28)
| name | tags | notes |
|------|------|-------|
| TST_ATX_270226 | RL-012 to RL-029 | Yellow PETG-HF, Bambu Lab, ITW:11g |
| Legacy (no batch) | RL-001 to RL-011 | Older tags, no batch_id |

---

## 4. Key Files

### Frontend Pages
- `apps/web/app/page.tsx` — Home with "📷 Scan Tag" CTA
- `apps/web/app/start/page.tsx` — Claim entry: inline camera scanner + manual token code input
- `apps/web/app/scan/page.tsx` — Dedicated full-screen QR scanner page
- `apps/web/app/t/[tag_code]/page.tsx` — Tag claim flow with inline scanner
- `apps/web/app/a/[public_id]/page.tsx` — Public animal card (owner-only updates)
- `apps/web/app/dashboard/page.tsx` — Ranch dashboard with animal cards + photos
- `apps/web/app/superadmin/page.tsx` — Factory/Assemble/Dashboard/Inventory tabs

### API Routes
- `apps/web/app/api/factory/batches/route.ts` — Generate batch (anchorBatch on-chain)
- `apps/web/app/api/attach-tag/route.ts` — Claim tag, create animal, lazy mint
- `apps/web/app/api/update-animal/route.ts` — Update animal data + IPFS/chain sync
- `apps/web/app/api/sync-tag/route.ts` — Sync token_id from chain to DB
- `apps/web/app/api/retry-mint/route.ts` — Retry failed mints (superadmin only)
- `apps/web/app/api/superadmin/assemble/route.ts` — Assembly pipeline actions
- `apps/web/app/api/superadmin/devices/route.ts` — Tag inventory (GET/POST)
- `apps/web/app/api/animals/[id]/route.ts` — Animal detail (GET)
- `apps/web/app/api/dashboard/animals/route.ts` — All animals for dashboard
- `apps/web/app/api/upload-photo/route.ts` — Photo upload to Pinata

### Blockchain
- `apps/web/lib/blockchain/ranchLinkTag.ts` — ERC-721 setCID (legacy)
- `apps/web/lib/blockchain/ranchLinkTag1155.ts` — ERC-1155 anchorBatch + setCID1155
- `apps/web/lib/blockchain/mintTag.ts` — Unified mint router
- `apps/web/lib/ipfs/client.ts` — Pinata IPFS pinning

### Config
- `apps/web/next.config.js` — Cache-Control: no-store headers on all routes
- `apps/web/lib/rate-limit.ts` — In-memory rate limiter

---

## 5. Authentication

### Superadmin
- Cookie: `rl_superadmin=<value>` — set by `/api/superadmin/login`, `httpOnly: false` (readable by JS)
- All superadmin API calls require `credentials: 'include'`
- Superadmin can edit any animal via `/a/[public_id]?superadmin=1`

### Tag Ownership (Farmer)
- Cookie: `rl_owner_<public_id>=<claim_token>` — set at attach time, `httpOnly: false`
- `claim_token` stored in `tags.claim_token` (UUID) — **PENDING MIGRATION** (see §8)
- Until migration runs, ownership check is permissive (allows updates when column is null)

---

## 6. Inventory States

```
pre_identity → assembled → in_inventory → demo / for_sale / sold / shipped
                                        ↑ (also: attached when farmer claims)
```

Status badges and labels defined at module level in `superadmin/page.tsx` (`statusBadge`, `STATUS_LABELS`).

---

## 7. QR Sticker Format (30×30mm)

```
[tag_code bold]          ← e.g. RL-029
[batch_name]             ← e.g. TST_ATX_270226
[color · material]       ← e.g. Yellow · PETG-HF
[QR code 22×22mm]
[claim_code bold black]  ← token code e.g. RL-029-A3F2B1C4, or tag_code if pre-identity
```

Print functions: `printSingleQR(tag)` and `printBatchQR(tags[])` in `superadmin/page.tsx`.

---

## 8. Pending Actions (Manual)

### CRITICAL — Run in Supabase SQL Editor:
```sql
-- https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv/sql/new
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS claim_token UUID;
NOTIFY pgrst, 'reload schema';
```
This enables the farmer ownership system. Without it, ownership checks are permissive.

---

## 9. Known Issues / Bugs Fixed (this session)

| # | File | Bug | Fix |
|---|------|-----|-----|
| H15 | scan/page.tsx | Scanner froze on non-RanchLink QR | Only stop loop when handleFound() returns true |
| H5 | t/[tag_code]/page.tsx | Photo upload failure silent | Show error, abort form |
| H23 | api/update-animal | photo_url stripped by Zod | Added to schema |
| H27 | api/retry-mint | No auth — wallet drain risk | Added superadmin cookie check |
| H1 | start/page.tsx | Auto-redirect on RL-0 | Require 3+ digit tag number |
| H8 | t/[tag_code]/page.tsx | Multiple camera streams on retry | stopScanner() before openScanner() |
| H29 | superadmin/page.tsx | Assemble errors silent | Alert on !res.ok |
| H31 | superadmin/page.tsx | Status refresh race | await fetchDevices() after POST |
| H13 | a/[public_id]/page.tsx | Event type not reset | Reset to 'update' on success |
| H14 | a/[public_id]/page.tsx | Clipboard unhandled rejection | execCommand fallback |
| — | api/animals/[id] | claim_token in select crashed query | Removed; fetch separately |
| — | start/page.tsx | No camera button visible | Added inline scanner as primary CTA |
| — | a/[public_id]/page.tsx | Superadmin couldn't edit animals | ?superadmin=1 + cookie check |
| — | dashboard/page.tsx | Photos not showing | photo_url in Animal interface + img tag |
| — | api/animals/[id] | AUS0005 "Animal Not Found" | Removed invalid claim_token from select |

---

## 10. Contracts

| Contract | Address | Network |
|----------|---------|---------|
| RanchLinkTag (ERC-721, legacy) | 0x2BAc88732c526d25698Bcd8940048Dac3d3e6C3B | Base Mainnet |
| RanchLinkTag1155 (ERC-1155) | $RANCHLINKTAG_1155_ADDRESS (env) | Base Mainnet |

---

## 11. Environment Variables (Vercel + .env.local)

Key vars (never commit values):
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_KEY` — Service role key (server-only)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon key
- `RANCHLINK_PRIVATE_KEY` — Server wallet private key (minting)
- `RANCHLINKTAG_1155_ADDRESS` — ERC-1155 contract address
- `PINATA_JWT` — Pinata IPFS JWT
- `SUPERADMIN_PASSWORD` — Superadmin login password
- `NEXT_PUBLIC_APP_URL` — https://ranch-link.vercel.app

---

## 12. Vercel Config Notes

- All serverless functions with blockchain calls: `export const maxDuration = 60`
- Cache headers: `Cache-Control: no-store, must-revalidate` on all routes (next.config.js)
- Build: TypeScript errors cause silent 404s on Vercel — always run `npx tsc --noEmit` before push
