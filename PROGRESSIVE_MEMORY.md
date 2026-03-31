# RanchLink — Progressive Memory
**Last updated:** 2026-03-31 (session 10 — webhook idempotency only after Resend OK; Superadmin “Copy webhook URL”) | **Live:** https://ranch-link.vercel.app

---

## 1. Project Overview

RanchLink is a blockchain-linked cattle tag system. Physical 3D-printed tags (PETG-HF, 30×30mm QR stickers) are manufactured, assembled, and shipped to farmers. Each tag has:
- A **QR code** pointing to `ranch-link.vercel.app/t/[tag_code]` (e.g. `RL-029`)
- A **token code** printed on the sticker (e.g. `RL-029-A3F2B1C4`) — derived from the first 8 chars of the mint tx hash, used as manual claim fallback. Pre-identity tags show just the tag code (e.g. `RL-029`) until claimed.
- An **ERC-1155 NFT** on Base Mainnet via lazy minting (Merkle tree / `anchorBatch`)
- A **Supabase** backend (project: `utovzxpmfnzihurotqnv`)

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · Supabase · Viem · Base Mainnet · Pinata IPFS · Vercel

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
| Superadmin → Orders | Same URL, tab **💳 Orders** (internal CRM: ship-to, tracking, notes) |
| Ranch portal (farmer) | https://ranch-link.vercel.app/ranch |
| Order tracking (customer) | https://ranch-link.vercel.app/order/[order_number]?k=… |
| Checkout success | https://ranch-link.vercel.app/checkout/success |
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
- `apps/web/app/superadmin/page.tsx` — Factory / Assemble / Dashboard / Inventory / **Orders** (internal fulfillment CRM)

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
- Cookie: `rl_superadmin` — set by `/api/superadmin/login`, **httpOnly: true**, signed (`SUPERADMIN_SESSION_SECRET`)
- All superadmin API calls require `credentials: 'include'`
- Superadmin can edit any animal via `/a/[public_id]?superadmin=1`

### Tag Ownership (Farmer)
- Cookie: `rl_owner_<public_id>` — set at attach time; prefer **httpOnly** in current `attach-tag` (server reads cookie on `update-animal` / animal GET)
- `claim_token` stored in `tags.claim_token` (UUID); migration should be applied in prod

### Commerce (internal — no external CRM)
- **Stripe** Checkout → webhook `POST /api/stripe/webhook` updates `stripe_orders` (ship-to from `shipping_details`, billing fallback).
- **Paid:** customer confirmation email + **internal ops email** to `INTERNAL_OPS_EMAILS` (Resend). Idempotency timestamps are set **only after Resend returns 2xx** so failed sends retry on Stripe webhook redelivery (migrations 009 + 010).
- **Superadmin → Orders:** expandable rows — full address, Stripe session link, assignee, internal notes, status (packed/shipped/delivered); shipped/delivered emails to customer via `sendFulfillmentEmail`.
- **Health check:** `POST /api/superadmin/migrate` (authed) probes `tags.claim_token` + `stripe_orders` columns and prints which SQL files to run.
- **Env template:** `apps/web/.env.example` lists Stripe prices, `RESEND_API_KEY`, `ORDER_EMAIL_FROM`, `INTERNAL_OPS_EMAILS`, `STRIPE_WEBHOOK_SECRET`, etc.

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

Canonical list: **`apps/web/.env.example`**. Never commit real secrets.

**Core:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BASE_URL`, `PINATA_JWT`, server wallet + contract envs per architecture rule.

**Superadmin:** `SUPERADMIN_USERNAME`, `SUPERADMIN_PASSWORD`, `SUPERADMIN_SESSION_SECRET` (≥32 chars).

**Stripe store:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_SINGLE`, `STRIPE_PRICE_FIVE_PACK`, `STRIPE_PRICE_STACK`, plus any extra tier price IDs used on the storefront.

**Email (Resend):** `RESEND_API_KEY`, `ORDER_EMAIL_FROM`, optional `CLAIM_EMAIL_FROM`, **`INTERNAL_OPS_EMAILS`** (comma-separated, e.g. `solve@ranchlink.com,gonzalo@ritxma.com`), optional `INTERNAL_OPS_EMAIL_FROM`, optional `FULFILLMENT_EMAIL_ON_PACKED=1`.

**Claim / portal:** `RANCHLINK_PORTAL_SECRET` (or rely on `SUPERADMIN_SESSION_SECRET` for signed cookies).

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

### Files created/modified (FINAL — Session 7b, 2026-03-27)
| File | Action |
|------|--------|
| `apps/web/app/api/auth/check-existing/route.ts` | **NEW** — detect returning users by email/phone |
| `apps/web/app/api/auth/finalize-claim/route.ts` | **NEW** — retroactive identity for already-claimed tags |
| `apps/web/app/api/ranch/profile/route.ts` | **NEW** — GET/PATCH ranch + user profile + stats |
| `apps/web/app/api/ranch/export/route.ts` | **NEW** — export all ranch data as JSON |
| `apps/web/app/api/superadmin/finalize-links/route.ts` | **NEW** — generate finalize-claim URLs for unverified owners |
| `apps/web/app/a/[public_id]/page.tsx` | **MODIFIED** — update protection (login required), identity banner, finalize-claim URL support, login modal |
| `apps/web/app/api/superadmin/orders/route.ts` | **MODIFIED** — fulfillment email notifications (packed/shipped/delivered via Resend) |

### Session 7b — Additional changes (2026-03-27)
- **Wallet generation**: EOA wallets via viem (NOT CDP smart wallets — avoids the drain risk). AES-256-GCM encrypted private keys. One wallet per ranch, generated at identity verification. Stored in `ranch_wallets` table.
- **Returning user detection**: `POST /api/auth/check-existing` checks email + phone. Claim flow shows "Welcome back" modal when account already exists.
- **Animal card update protection**: Edit button on `/a/[public_id]` now requires login. Session-based auth matching ranch_id. SuperAdmin bypasses. Wrong ranch → error message.
- **Retroactive identity banner**: Tags without `owner_user_id` show a cyan banner prompting "Complete Your Ownership" → login modal.
- **Finalize-claim links**: SuperAdmin can generate signed URLs (`GET /api/superadmin/finalize-links`) for existing unverified owners. URLs valid 30 days.
- **Fulfillment notifications**: When SuperAdmin updates order status to packed/shipped/delivered, customer gets an email via Resend with tracking info.
- **Ranch dashboard expanded**: 5 tabs (Overview, Herd, Health, Analytics, Settings). Genetics/lineage, financial/cost tracking, event evidence uploads, wallet info, data export.
- **Transfer requests table**: `transfer_requests` in DB for future wallet conversion / RWA transfer fee tracking.
- **Species expanded**: Exotic/Safari added to claim form species dropdown.

---

## 17. Current Status (2026-03-27)

### Committed & Pushed
- **Branch**: `session7-full-platform` merged to `main`
- **Commit**: `4778c94` → pushed to `origin/main`
- **Vercel**: Auto-deploying from push (check Vercel dashboard for build status)

### BLOCKING — Must Complete Before Features Work

| # | Task | Who | Status |
|---|------|-----|--------|
| 1 | **Run SQL migration** `007_RANCH_USERS_AUTH_RLS.sql` in Supabase SQL Editor | Gonzalo | **NOT DONE** — all auth/wallet/events features blocked until this runs |
| 2 | **Set `WALLET_ENCRYPTION_KEY`** on Vercel env vars (32+ char random string) | Gonzalo | **NOT DONE** — wallet generation will fail without this |
| 3 | **Set `ORDER_EMAIL_FROM`** on Vercel: `RanchLink <solve@ritxma.com>` | Gonzalo | **NOT DONE** — verification + order emails need this |
| 4 | **Verify `RESEND_API_KEY`** is set on Vercel | Gonzalo | Check — email sending depends on this |
| 5 | **Check Vercel build** succeeded (no TS errors) | Gonzalo | Check Vercel dashboard |

### After Migration Runs — Test Flow
1. Go to `ranch-link.vercel.app/ranch` → enter `gonzalobame@gmail.com` → receive PIN → sign in → ranch + wallet auto-created
2. Scan any tag QR → must see identity verification before animal form
3. Try editing `/a/AUS0008` → should require login
4. As SuperAdmin: `GET /api/superadmin/finalize-links` → get URLs for 3 existing owners
5. Update an order status in SuperAdmin → customer should get email

### Stripe Products Not Yet Created
These products are wired in code but need Stripe Price IDs created in Stripe Dashboard and set on Vercel:
- `STRIPE_PRICE_LABEL_100` (RanchLink Label $9.99)
- `STRIPE_PRICE_TPP_1` (Translucid PETG $1.99)
- `STRIPE_PRICE_TPP_5` (Translucid PETG 5-Pack $6.99)
- `STRIPE_PRICE_TPP_15` (Translucid PETG 15-Pack $31.89)
- `STRIPE_PRICE_ORANGE_3` (Orange 3-Pack $3.33)
- `STRIPE_PRICE_YELLOW_ABS_3` (Yellow ABS 3-Pack $3.99)
- `STRIPE_PRICE_FLUORO_3` (Fluorescent PETG 3-Pack $3.99)

Until created, these products will fall through to `mailto:solve@ritxma.com` (graceful fallback).

### What's Built & Ready (once migration + env vars are set)
- [x] Identity-gated claim flow (email + phone + PIN)
- [x] Returning user detection ("Welcome back" / "Already have account?")
- [x] EOA custodial wallet per ranch (no CDP drain risk)
- [x] Ranch Admin Dashboard (/ranch) — 5 tabs, full management
- [x] Animal card update protection (login required)
- [x] Retroactive identity for existing owners (finalize-claim links)
- [x] All 10 products wired to Stripe
- [x] Fulfillment email notifications (packed/shipped/delivered)
- [x] RLS on all 11 Supabase tables
- [x] Security headers (XSS, clickjack, referrer, permissions)
- [x] PII redaction on public order API
- [x] claim_secret per tag in factory batches
- [x] Data export for interoperability
- [x] Email: solve@ritxma.com everywhere

### What Remains (future sessions)
- [ ] SMS verification (needs Twilio or alternative provider — email-only for now)
- [ ] Enforce `claim_secret` validation on `/t/[tag_code]` (currently backward-compatible — allows claims without `?s=`)
- [ ] NFT transfer to farmer's custodial wallet on claim
- [ ] Marketplace (buy/sell RWAs between ranchers)
- [ ] Non-custodial wallet conversion flow (with fee)
- [ ] RWA transfer to external wallets (with fee)
- [ ] Custom batch ordering from within Ranch Admin
- [ ] Import data from other platforms (CSV/API)
- [ ] CRM / marketing integrations
- [ ] Legal / compliance documentation
- [ ] Sentry error monitoring setup

### User Types (confirmed architecture)
| Role | Access | Login |
|------|--------|-------|
| **SuperAdmin** (Gonzalo + AI) | Factory, IT, orders, fulfillment, all tags, all animals, finalize-links, mini-rancher view | `/superadmin` with SUPERADMIN_PASSWORD |
| **Rancher (Admin)** | Their ranch only: animals, events, health, genetics, costs, analytics, wallet, export | `/ranch` with email + PIN (e.g. gonzalobame@gmail.com) |
| **Public** | View animal cards (`/a/[public_id]`), browse store, order tracking | No login needed |

---

## 18. Session 8 — Internal commerce & fulfillment (2026-03-31)

### Goal
Paid customers trigger **internal** attention (no external CRM): ops email + Superadmin **Orders** tab with full ship-to, notes, assignment, and safe customer tracking links.

### Supabase SQL (run in order if not already applied)
| Migration | Purpose |
|-----------|---------|
| `ADD_STRIPE_ORDER_FULFILLMENT_FIELDS.sql` | `order_number`, shipping, carrier, tracking, `shipped_at`, etc. |
| `008_STRIPE_ORDERS_INTERNAL_OPS.sql` | `internal_notes`, `assigned_to` |
| `009_STRIPE_WEBHOOK_EMAIL_IDEMPOTENCY.sql` | `order_confirmation_sent_at`, `internal_ops_notified_at` (no duplicate emails on Stripe retries) |
| `010_ORDER_VIEW_SECRET.sql` | `order_view_secret` UUID + backfill |

### Env (Vercel + `.env.local`)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — endpoint: `https://ranch-link.vercel.app/api/stripe/webhook`
- `RESEND_API_KEY`, `ORDER_EMAIL_FROM` (e.g. `RanchLink <solve@ranchlink.com>`)
- `INTERNAL_OPS_EMAILS` — comma-separated; each **new paid** order emails here with ship-to + **customer private link** (`/order/...?k=`)

### Code behavior (this session)
- **Checkout** persists `order_view_secret` (retries upsert without column if DB old).
- **Webhook** on paid: idempotent customer + internal ops emails; internal body includes copy-paste customer tracking URL; upsert retry omits `order_view_secret` if the column is missing.
- **GET `/api/orders/[order_number]`**: correct `?k=` → full ship-to + email; else summary + masked email.
- **Superadmin Orders**: copy customer link, confirmation/ops-sent badges, shipped save → confirm customer email (Cancel = skip email).
- **Fulfillment emails** to customer: order page links use `?k=` when stored.
- **Client pages** using `useSearchParams` (`/checkout/success`, `/order/[order_number]`) wrap content in `<Suspense>` so production `next build` succeeds.
- **PATCH `/api/ranch/profile`**: sequential `await` on Supabase update chains (correct Promise typing for `tsc`).

### Files touched
- `apps/web/app/api/checkout/route.ts`, `stripe/webhook/route.ts`, `orders/[order_number]/route.ts`, `orders/session/[session_id]/route.ts`, `superadmin/orders/route.ts`, `superadmin/page.tsx`, `checkout/success/page.tsx`, `order/[order_number]/page.tsx`, `ranch/profile/route.ts`, `supabase/migrations/008_STRIPE_ORDERS_INTERNAL_OPS.sql`, `009_STRIPE_WEBHOOK_EMAIL_IDEMPOTENCY.sql`, `010_ORDER_VIEW_SECRET.sql`

### Revenue Model (architecture supports)
- Tag sales on store → subscription gateway
- Label batch sales
- Custom batch purchases (future: from admin)
- RWA marketplace (future: sell animals)
- Non-custodial wallet conversion (future: fee-based)
- Asset transfer to external wallet (future: fee-based)

---

## 19. 2026-03-31 — Internal fulfillment & env knobs

- **Superadmin → Orders tab** is the internal fulfillment pipeline: expand a row for ship-to, carrier/tracking, status transitions (packed / shipped / delivered), and internal notes.
- **INTERNAL_OPS_EMAILS** drives Resend notifications on each new paid checkout (Stripe webhook); **migration 009** adds `order_confirmation_sent_at` and `internal_ops_notified_at` so webhook retries do not duplicate customer confirmation or ops emails.
- **Customer private tracking** uses `/order/{order_number}?k={order_view_secret}`; ops can copy that link from the expanded row (Ship to section) for resends.
- **Env:** `INTERNAL_OPS_EMAIL_FROM` (optional From for ops mail), `FULFILLMENT_EMAIL_ON_PACKED=1` (optional; packed-state customer email is off unless set), plus existing `RESEND_API_KEY`, `ORDER_EMAIL_FROM`, `CLAIM_EMAIL_FROM`, `INTERNAL_OPS_EMAILS`.
