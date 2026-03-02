# RanchLink — Progressive Memory
**Last updated:** 2026-02-25 (session 3 — closed) | **Build:** 10057ad | **Live:** https://ranch-link.vercel.app

---

## 1. Project Overview

RanchLink is a blockchain-linked cattle tag system. Physical 3D-printed tags (PETG-HF, 30×30mm QR stickers) are manufactured, assembled, and shipped to farmers. Each tag has:
- A **QR code** pointing to `ranch-link.vercel.app/t/[tag_code]` (e.g. `RL-029`)
- A **token code** printed on the sticker (e.g. `RL-029-A3F2B1C4`) — derived from the first 8 chars of the mint tx hash, used as manual claim fallback. Pre-identity tags show just the tag code (e.g. `RL-029`) until claimed.
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

### Token Code Logic
- **Pre-identity tags** (not yet claimed): sticker shows just `RL-029` as claim code
- **After claim**: token code becomes `RL-029-A3F2B1C4` (8 hex chars from mint_tx_hash)
- This is correct/intentional — the token code upgrades at claim time, not at print time
- RL-008 is the only assembled tag with a real token code (was individually minted earlier)

### Public IDs
- Tags: `RL-001` to `RL-029` (29 total as of 2026-02-28)
- Animals: `AUS0001` to `AUS0005` (5 attached animals)
- Token codes: `RL-XXX-[8 hex chars from mint_tx_hash]` or `RL-XXX-T[token_id]`

### Animals (as of 2026-02-25)
| public_id | name | tag | token_id | on-chain |
|-----------|------|-----|----------|----------|
| AUS0001 | Gonzo | RL-001 | — | OFF |
| AUS0002 | Gonzo | RL-003 | — | OFF |
| AUS0003 | Rocket | RL-004 | — | OFF |
| AUS0004 | Gonzo | RL-007 | #3 | ✅ ON |
| AUS0005 | Bañu | RL-002 | #5 | ✅ ON |
| AUS0006 | Gonz | (no tag) | — | OFF |

### Batches (as of 2026-02-28)
| name | tags | notes |
|------|------|-------|
| TST_ATX_270226 | RL-012 to RL-029 | Yellow PETG-HF, Bambu Lab, ITW:11g — NOT YET PRINTED (print cancelled) |
| Legacy (no batch) | RL-001 to RL-011 | Older tags, no batch_id |

> **Important:** The batch print dialog was opened and cancelled — tags are NOT physically printed yet. The platform incorrectly marked RL-008 print state in memory (see §13 open issues).

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
- `apps/web/app/api/superadmin/migrate/route.ts` — DB migration status checker (returns SQL to run if columns missing)
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

### CRITICAL — Supabase SQL migration (DONE):
```sql
-- https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv/sql/new
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS claim_token UUID;
NOTIFY pgrst, 'reload schema';
```
This enables the farmer ownership system. Migration has been run; attach-tag now stores claim_token and farmer cookies persist as designed.

**Verify status:** POST to `https://ranch-link.vercel.app/api/superadmin/migrate` (with superadmin cookie) to check if migration has been applied.

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
| — | api/attach-tag | ERR_MM6VS10Z demo blocker | Fallback on PGRST204 (missing claim_token col) |
| — | superadmin/page.tsx | Print cancel falsely marks "printed" | Confirm dialog after print window opens |
| — | superadmin/page.tsx | Assemble counter showed 0 for pre_identity | Counter now includes pre_identity status |
| — | superadmin/page.tsx | Batch name TST_ATX_270226 not visible in Inventory | Added Batch column to inventory table |
| — | multiple files | localhost:7242 debug fetch calls in production | Removed from start, t/[tag_code], update-animal, superadmin |
| — | api/attach-tag | PGRST204 fallback used wrong error code | Fixed to check both 42703 and PGRST204 |

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

---

## 13. Open Issues (Not Yet Fixed)

### Issue A — Print state falsely set on OS dialog cancel ✅ FIXED (session 3)
- **Fix:** `handlePrint()` now opens the print window, waits 800ms, then shows "Did the QR label print successfully?" confirm dialog. Only marks printed if user confirms.

### Issue B — Security + Identity: full claim flow redesign (SESSION 4 SCOPE)

#### The problem
Tag codes are sequential (`RL-001`...`RL-029`) and the claim URL `/t/RL-029` is publicly accessible. Anyone who guesses a tag code can claim a tag without physical possession.

#### Original design intent (to be restored)
The QR sticker was always meant to encode a `claim_secret` — a random value generated at batch time that proves physical possession:
```
QR encodes:  https://ranch-link.vercel.app/t/RL-029?s=<claim_secret>
Sticker shows (visible text): RL-029-A3F2B1C4  ← human-readable fallback for /start
```
The `claim_secret` is random, stored in DB, never derivable from the tag code alone.
The token code (`RL-029-A3F2B1C4`) is the blockchain-derived human fallback — typed at `/start`.

#### Agreed architecture for Session 4
```
Batch creation
  → generate claim_secret (random UUID) per tag
  → store in tags.claim_secret (new column)
  → QR encodes: /t/RL-029?s=<claim_secret>
  → token code (RL-029-A3F2B1C4) printed visibly on sticker as manual fallback

Farmer scans QR → /t/RL-029?s=abc123
  → system validates ?s= matches tags.claim_secret in DB
  → if no match or missing → block with "Invalid tag" error
  → if valid → show phone number input
  → send SMS PIN (Twilio or similar)
  → farmer enters PIN → identity confirmed
  → proceed to animal form
  → animal attached, custodial wallet created/linked
  → farmer owns NFT, platform knows who holds which tag
```

#### What this does NOT change
- Blockchain layer (anchorBatch, lazyMint, Merkle proofs) — untouched
- Tag codes (RL-XXX) — still used as primary identifier
- Token codes — still derived from mint_tx_hash at claim time
- IPFS metadata — untouched

#### Implementation steps (Session 4)
1. Add `claim_secret` column to `tags` table (SQL migration)
2. Generate `claim_secret` per tag in `factory/batches/route.ts` at batch creation
3. Update QR URL generation to include `?s=<claim_secret>`
4. Validate `?s=` param in `/t/[tag_code]/page.tsx` and `/api/attach-tag`
5. Add phone number input + SMS PIN step before animal form
6. Link phone to farmer record + custodial wallet in DB
7. Update sticker print to show token code as visible fallback text

#### Status
Not yet implemented. Current batch (TST_ATX_270226, RL-012 to RL-029) does NOT have claim_secret. Safe for internal demo only — do not distribute publicly until implemented.


---

## 14. Session 4 — Kickoff Checklist

Before writing any code, confirm these in order:

### Pre-flight
- [x] Run Supabase SQL migration for `claim_token` (§8) — verify via `/api/superadmin/migrate`
- [ ] Confirm TST_ATX_270226 tags (RL-012 to RL-029) are physically printed and in hand
- [ ] Confirm Twilio (or SMS provider) account/credentials available for SMS PIN

### Build order (do not skip steps)
1. `tags.claim_secret` column migration
2. Batch generation encodes `claim_secret` into QR URL
3. `/t/[tag_code]` validates `?s=` before showing form
4. Phone + SMS PIN gate before animal form
5. Farmer/wallet record creation on PIN confirm
6. Update sticker print layout with token code as visible fallback

### Do NOT touch
- `ranchLinkTag1155.ts` — blockchain layer is stable
- `lib/ipfs/client.ts` — IPFS pinning is stable
- `api/factory/batches/route.ts` Merkle tree logic — only add claim_secret generation
- Any already-attached animals (AUS0001–AUS0006)
