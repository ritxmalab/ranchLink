# RanchLink — Progressive Memory
**Last updated:** 2026-03-24 (session 7 — full auth, ranch dashboard, purchase flow, security) | **Build:** TBD | **Live:** https://ranch-link.vercel.app

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
- Tags: `RL-001` through `RL-061+` (batch creation uses max tag_code for next number; no duplicates).
- Animals: `AUS0001` to `AUS0008`+ (one per claimed tag; dashboard shows all).
- Token codes: `RL-XXX-[8 hex chars from mint_tx_hash]` or `RL-XXX-T[token_id]`

### Animals (as of 2026-03-02)
| public_id | name | tag | on-chain |
|-----------|------|-----|----------|
| AUS0008 | SOY VACA | RL-017 | ✅ ON (ERC-1155 lazy-minted) |
| AUS0007 | Gonz | RL-028 | ✅ ON |
| AUS0006 | Gonz | (no tag) | — |
| AUS0005 | Bañu | RL-002 | ✅ ON |
| AUS0004 | Gonzo | RL-007 | ✅ ON |
| AUS0003 | Rocket | RL-004 | OFF |
| AUS0002 | Gonzo | RL-003 | OFF |
| AUS0001 | Gonzo | RL-001 | OFF |

**Dashboard count:** User expects **9 animals** on the public card dashboard. API currently returns 8; if a 9th (e.g. Thomas/Tomas from a Yellow-batch test claim) was claimed, it should appear after refetch or may need verification that the attach completed and animal row exists. All code is in place for full list (primary query + defensive merge by attached tags).

### Batches (as of 2026-03-02)
| name | tags | notes |
|------|------|-------|
| DEMOATXCFLIME-030226 | RL-042–RL-061 | Lime, 20 tags, PETG-HF, Bambu Lab, ITW 11g — production batch |
| DEMOATXCF-030226 | (user batch) | User-generated; agent did NOT create production batches |
| TST_ATX_270226 | RL-012–RL-029 | Yellow PETG-HF; 18 tags from this batch |
| Legacy | RL-001–RL-011 | Older tags |

**Tag numbering fix (2026-03-02):** Next tag number is derived from **max tag_code** (order by `tag_code.desc`), not `created_at`, so duplicate key errors no longer occur when batches are created out of order.

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

### Session 5 (2026-03-02) — Batch, dashboard, third-party claim
| — | superadmin/page.tsx + api/factory/batches | "Invalid request" on Generate & Mint (kitSize: null) | Omit kitSize when not kit mode; API schema kitSize optional+nullable |
| — | api/factory/batches/route.ts | Duplicate tag_code (e.g. RL-013) on new batch | Next number from max tag_code (order tag_code.desc), not created_at |
| — | api/debug/tag/[tag_code]/route.ts | Duplicate handler block caused build failure | Removed second copy of GET handler |
| — | api/dashboard/animals/route.ts | Debug instrumentation in production | Removed agent log region and ingest fetch |
| — | dashboard/page.tsx | Long token IDs wrapped on cards | Truncate + title tooltip (min-w-0, truncate, title=#token_id) |
| — | api/attach-tag/route.ts | Tag write-back failure silent | Return 500 with clear error if tag_id update fails |
| — | a/[public_id]/page.tsx | Token ID row wrapped on animal card | Custom div with min-w-0 truncate + title (no change to photo) |

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

---

## 15. Session 5 — Policy & Production Notes (2026-03-02)

### Batch creation
- **Do not create batches for the user.** The user runs their own production batches (e.g. 80 tags) with their own settings, colors, and numbers. The assistant should only fix bugs and verify flows, not run "Generate & Mint" with real batch sizes on their behalf.

### Third-party claim (SOY VACA)
- An entrepreneur (farmer) was given one of the 18 Yellow tags and claimed as **SOY VACA** (AUS0008, RL-017). Claim processed correctly: on-chain lazy mint, photo on IPFS, animal card public. All content is **Ritxma IP**. Farmers have **no superadmin access** — only owner cookie for editing their own animal; dashboard/marketplace/animal cards are intentionally public.

### Production batch size
- **80-tag batches** are supported: one Merkle anchor tx per batch, tag inserts in chunks of 100, `maxDuration = 60`. Tag numbering uses max `tag_code` so duplicate codes no longer occur.

### Dashboard animal count
- User expects **9 animals** on the public dashboard. If the API returns 8, the 9th may be Thomas/Tomas (test claim from Yellow batch) — confirm attach completed and animal has `tag_id` / is included in dashboard merge. Logic: primary query from `animals` plus animals linked from `tags` (status attached, animal_id not null); merged by id, sorted by `created_at` desc; refetch on window focus.

---

## 16. Session 7 — Full Auth, Ranch Dashboard, Purchase, Security (2026-03-24)

### What was built

#### A. Database Migration (`supabase/migrations/007_RANCH_USERS_AUTH_RLS.sql`)
- `claim_secret` UUID column on `tags` table — generated at batch creation, used in QR URL
- `ranch_users` table — rancher accounts (email, phone, ranch_id, verified flags)
- `verification_codes` table — OTP PINs with expiry, purpose, attempt limits
- `ranch_sessions` table — token-based auth sessions
- `animal_events` table — health checks, vaccinations, treatments, weights, movements, breeding, calving, notes
- **Comprehensive RLS**: all 11 tables enabled. Public-readable: animals, tags, ranches, batches, animal_events, kits, kit_tags. Locked down: stripe_orders, ranch_users, verification_codes, ranch_sessions

#### B. Customer Authentication System
- **`lib/ranch-auth.ts`** — OTP generation, Resend email sending, code verification, session management (cookie `rl_session`, 30-day TTL)
- **`/api/auth/send-code`** — sends 6-digit PIN to email
- **`/api/auth/verify-code`** — validates PIN, creates/finds ranch user + ranch, sets session cookie
- **`/api/auth/login`** — login flow for existing users
- **`/api/auth/session`** — GET checks session, DELETE logs out

#### C. Claiming Flow Update (`/t/[tag_code]/page.tsx`)
- 3-step flow: Identity → OTP → Animal Form
- Collects email (required), phone, name before allowing claim
- Session check on load — returning users skip to form
- `claim_secret` generated per tag in factory batch creation
- QR URLs now include `?s=<claim_secret>` for new batches
- Backward compatible: tags without claim_secret still claimable

#### D. Ranch Admin Dashboard (`/ranch/page.tsx`)
- Full customer admin panel (NOT superadmin)
- Login via email OTP
- Dashboard: animal count, on-chain stats, tagged stats, active stats
- Animal grid/list view with search by name, ID, breed, tag code
- Animal detail view with info cards, photo, event timeline
- Event management: add health checks, vaccinations, treatments, weight records, etc.
- Livestock management features reference: Boviq, Abrook, Stockbooks, Ranchr capabilities
- **APIs**: `/api/ranch/animals`, `/api/ranch/events`

#### E. Purchase Flow
- All 10 products now have Stripe `stripeTierKey` assignments
- Checkout API expanded: `STRIPE_PRICE_LABEL_100`, `STRIPE_PRICE_TPP_*`, `STRIPE_PRICE_ORANGE_3`, `STRIPE_PRICE_YELLOW_ABS_3`, `STRIPE_PRICE_FLUORO_3`
- `startCheckout` uses product's `stripeTierKey` directly (no hardcoded mapping)
- `orders.ts` expanded with tag counts for all tiers
- Email updated from `hello@ritxma.com` → `solve@ritxma.com` (Footer, ProductCard)
- Footer: "Dashboard" link changed to "My Ranch" → `/ranch`

#### F. Security Hardening
- **RLS on all tables** (see §A above)
- **Security headers** in `next.config.js`: X-Content-Type-Options, X-Frame-Options DENY, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- **Public animal cards** (`/a/*`) get SAMEORIGIN frame policy + brief caching for demo perf
- **Order lookup API** (`/api/orders/[order_number]`): PII redacted (email masked, phone/address removed from public response)
- **Health endpoint** (`/api/health`): public callers get minimal `healthy`/`unhealthy`; full diagnostics only for superadmin
- **Superadmin orders API**: expanded to return full pipeline data (shipping, tracking, carrier)

#### G. Factory — claim_secret
- `api/factory/batches/route.ts` now generates `claim_secret` UUID per tag
- Response includes `claim_url` with embedded secret for QR printing
- Existing tags without `claim_secret` remain claimable (backward compat)

### Files created/modified
| File | Action |
|------|--------|
| `supabase/migrations/007_RANCH_USERS_AUTH_RLS.sql` | **NEW** — full migration |
| `apps/web/lib/ranch-auth.ts` | **NEW** — auth library |
| `apps/web/app/api/auth/send-code/route.ts` | **NEW** — send OTP |
| `apps/web/app/api/auth/verify-code/route.ts` | **NEW** — verify OTP + create session |
| `apps/web/app/api/auth/login/route.ts` | **NEW** — login flow |
| `apps/web/app/api/auth/session/route.ts` | **NEW** — session check/logout |
| `apps/web/app/api/ranch/animals/route.ts` | **NEW** — ranch animals |
| `apps/web/app/api/ranch/events/route.ts` | **NEW** — animal events CRUD |
| `apps/web/app/ranch/page.tsx` | **NEW** — ranch admin dashboard |
| `apps/web/app/t/[tag_code]/page.tsx` | **MODIFIED** — identity verification gate |
| `apps/web/app/api/factory/batches/route.ts` | **MODIFIED** — claim_secret + claim_url |
| `apps/web/app/api/checkout/route.ts` | **MODIFIED** — expanded price map |
| `apps/web/app/api/orders/[order_number]/route.ts` | **MODIFIED** — PII redaction |
| `apps/web/app/api/health/route.ts` | **MODIFIED** — gated diagnostics |
| `apps/web/app/api/superadmin/orders/route.ts` | **MODIFIED** — full pipeline data |
| `apps/web/app/page.tsx` | **MODIFIED** — all products wired to Stripe |
| `apps/web/components/ProductCard.tsx` | **MODIFIED** — email + type fix |
| `apps/web/components/Footer.tsx` | **MODIFIED** — email + ranch link |
| `apps/web/next.config.js` | **MODIFIED** — security headers |
| `apps/web/lib/orders.ts` | **MODIFIED** — expanded tier counts |
| `apps/web/.env.local.example` | **MODIFIED** — new Stripe price env vars |

### Deploy checklist
1. **Run SQL migration** `007_RANCH_USERS_AUTH_RLS.sql` in Supabase SQL Editor
2. **Set env vars on Vercel**:
   - `ORDER_EMAIL_FROM=RanchLink <solve@ritxma.com>` (for Resend)
   - `RESEND_API_KEY=re_...` (must be configured for auth emails)
   - `STRIPE_PRICE_LABEL_100`, `STRIPE_PRICE_TPP_1`, etc. — create prices in Stripe Dashboard
3. **Push + deploy** to Vercel
4. **Test flows**: purchase → order email → order tracking → superadmin orders → fulfillment
5. **Test flows**: scan QR → identity → PIN → claim → ranch dashboard → events

### What remains (next session)
- Custodial wallet creation per ranch (CDP integration)
- SMS verification via Twilio (currently email-only)
- Claim_secret validation enforcement (currently claim works without `?s=` for backward compat)
- NFT transfer to farmer's custodial wallet
- CRM / marketing integrations
- Legal / compliance documentation
