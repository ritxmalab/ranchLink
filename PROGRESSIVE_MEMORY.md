# RanchLink — Progressive Memory
**Last updated:** 2026-03-27 (session 7 — fulfillment pipeline polish, Stripe ship-to fix) | **Live:** https://ranch-link.vercel.app

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
| Ranch portal | https://ranch-link.vercel.app/ranch |
| Order tracking | https://ranch-link.vercel.app/order/[order_number]?k=[secret] |

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
- `apps/web/app/superadmin/page.tsx` — Factory/Assemble/Dashboard/Inventory/**Orders** tabs (internal fulfillment: ship-to, notes, assigned, Stripe link)

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

### Superadmin (factory ops)
- Cookie: `rl_superadmin=<value>` — set by `/api/superadmin/login`, `httpOnly: true`
- All superadmin API calls require `credentials: 'include'`
- Superadmin can edit any animal via `/a/[public_id]?superadmin=1`

### Tag Ownership (Farmer) — `rl_owner_*`
- Cookie: `rl_owner_<public_id>=<claim_token>` — set at attach time, **`httpOnly: true`** (session 6)
- `claim_token` stored in `tags.claim_token` (UUID)
- `/api/update-animal` reads the cookie server-side; no client JS access needed
- `/api/animals/[id]` returns `viewer: 'owner' | 'public' | 'superadmin'` and `can_edit` flag

### Claim PIN Gate (session 6)
- **Flow:** `/t/[tag_code]` → email+phone → 6-digit PIN to email (Resend) → verify → `rl_claim_gate` httpOnly cookie → `attach-tag` validates gate before allowing claim
- **APIs:** `/api/claim/request-pin`, `/api/claim/verify-pin`, `/api/claim/gate-status`
- **Lib:** `lib/claim-gate.ts` — HMAC-signed token with tag_code + email + phone + expiry
- **Bypass:** superadmin cookie OR `CLAIM_VERIFICATION_DISABLED=1` (non-production only)
- After attach: gate cookie cleared, `rl_rancher_portal` 90-day cookie set

### Rancher Portal (session 6)
- Cookie: `rl_rancher_portal=<signed-token>` — ranch_id + email, 90-day TTL, httpOnly
- **Page:** `/ranch` — herd overview, links to animal cards
- **APIs:** `/api/ranch/session`, `/api/ranch/animals`, `/api/ranch/logout`
- **Lib:** `lib/rancher-portal-auth.ts`
- This is **not** the Superadmin factory console; it is the farmer/rancher private dashboard

### Animal Privacy (session 6)
- **Public** viewers see: name, species, breed, photo, basic stats, chain/tag proof, ranch name only
- **Owner/Superadmin** see: full record including EID, tattoo, purchase, notes, ranch contact
- Event notes omitted on public view
- `lib/animal-privacy.ts` — `toPublicAnimalCard()`, `toPublicEvents()`

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
| — | api/stripe/webhook | Ship-to missing / wrong (only billing address saved) | Prefer `session.shipping_details` over `customer_details` for name/phone/address |
| — | superadmin/page.tsx | Ops had to click “Load order metrics”; easy to miss new sales | `useEffect` auto-`fetchOrders()` when Orders tab + authed |
| — | api/stripe/webhook | Customer confirmation skipped if `ORDER_EMAIL_FROM` unset | Fallback `from` same pattern as internal emails |
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
- `SUPERADMIN_SESSION_SECRET` — ≥32 char secret for signed session cookies
- `RANCHLINK_PORTAL_SECRET` — ≥16 char secret for claim gate + rancher portal cookies (falls back to SUPERADMIN_SESSION_SECRET)
- `NEXT_PUBLIC_APP_URL` — https://ranch-link.vercel.app
- `NEXT_PUBLIC_BASE_URL` — same as above (used by Stripe redirects)
- `STRIPE_SECRET_KEY` — Stripe secret API key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- `STRIPE_PRICE_SINGLE` / `STRIPE_PRICE_FIVE_PACK` / `STRIPE_PRICE_STACK` — Stripe price IDs
- `RESEND_API_KEY` — Resend email API key
- `ORDER_EMAIL_FROM` — e.g. `RanchLink <solve@ranchlink.com>`
- `CLAIM_EMAIL_FROM` — e.g. `RanchLink <solve@ranchlink.com>` (defaults to ORDER_EMAIL_FROM)
- `INTERNAL_OPS_EMAILS` — comma-separated, e.g. `solve@ranchlink.com,gonzalo@ritxma.com`
- `CLAIM_VERIFICATION_DISABLED` — set to `1` in dev to skip PIN (never in production)

---

## 12. Vercel Config Notes

- All serverless functions with blockchain calls: `export const maxDuration = 60`
- Cache headers: `Cache-Control: no-store, must-revalidate` on all routes (next.config.js)
- Build: TypeScript errors cause silent 404s on Vercel — always run `npx tsc --noEmit` before push

---

## 13. Session 6 — Commerce Pipeline, Claim PIN, Security (2026-03-25)

### Commerce / fulfillment
- **Superadmin orders API** returns **full** shipping, contact, tracking, `internal_notes`, `assigned_to` (migration `008_ORDER_INTERNAL_FIELDS.sql`)
- **Superadmin orders UI** — expandable `<details>` per order; **auto-loads** when the Orders tab opens (no manual “Load metrics”); **Stripe Dashboard** search link + session id; status dropdown includes **pending payment**; **Assigned** field; Save posts notes + assignment + fulfillment
- **Stripe webhook ship-to fix (2026-03-27):** persist **`session.shipping_details`** (name, phone, address) when present — **not** only `customer_details` (billing). Without this, physical ship-to was often wrong or empty.
- **Customer confirmation email:** `ORDER_EMAIL_FROM` may fall back to `CLAIM_EMAIL_FROM` or `RanchLink <solve@ranchlink.com>` if the primary var is unset (still requires `RESEND_API_KEY` + verified sender domain in Resend)
- **Internal ops email**: on paid checkout events, `sendInternalOpsNotification` → `INTERNAL_OPS_EMAILS` (default solve@ranchlink.com, gonzalo@ritxma.com) with order summary + ship-to
- **Customer shipped email**: Superadmin sets **Shipped** → prompts carrier/tracking → optional “Send email to customer?”
- **Order view secret**: `order_view_secret` on `stripe_orders` — `/order/[n]` summary vs full detail with `?k=`
- Contact: `solve@ranchlink.com` (no hello@ritxma)

### Claim flow (email PIN)
- Scan QR → `/t/[tag_code]` → email+phone prompt → PIN to email → verify → form unlocks → attach → blockchain mint → ranch portal session
- `claim_pin_challenges` table (migration 007)
- `rl_claim_gate` cookie (HMAC-signed, 30min TTL, httpOnly)
- `attach-tag` creates/updates `ranches` row with verified email+phone, sets `rl_rancher_portal` 90-day cookie

### Rancher portal (`/ranch`)
- Private dashboard for farmers (not Superadmin); shows herd linked to their ranch_id
- Session via `rl_rancher_portal` cookie (HMAC-signed, ranch_id + email)

### Security hardening
- `middleware.ts`: X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options
- `rl_owner_*` cookies now `httpOnly: true`
- `/api/animals/[id]` returns tiered data (public card vs full record)
- Removed all `127.0.0.1:7242` debug ingest calls
- Order API requires secret for PII fields

### DB migrations (session 6)
- `007_CLAIM_PIN_AND_ORDER_VIEW_SECRET.sql` — `claim_pin_challenges` table + `order_view_secret` on stripe_orders
- `008_ORDER_INTERNAL_FIELDS.sql` — `internal_notes` + `assigned_to` on stripe_orders

---

## 14. Open Issues (Not Yet Fixed)

### Issue A — Print state falsely set on OS dialog cancel ✅ FIXED (session 3)
- **Fix:** `handlePrint()` now opens the print window, waits 800ms, then shows "Did the QR label print successfully?" confirm dialog. Only marks printed if user confirms.

### Issue B — Security + Identity: claim flow (PARTIALLY DONE — Session 6)

#### What was implemented (session 6)
- **Email PIN verification** gate on `/t/[tag_code]` before animal form — email + phone required, 6-digit PIN sent to email
- `attach-tag` enforces `rl_claim_gate` cookie before allowing claim (superadmin bypass exists)
- Rancher portal (`/ranch`) created automatically on claim with verified email + phone
- `rl_owner_*` cookies made httpOnly

#### Still remaining (future)
- `claim_secret` per tag in QR URL (physical possession proof) — current tags don't encode it
- **SMS** for PIN (today email-only via Resend); phone is validated by matching but not separately verified
- Custodial wallet creation/linking on claim
- `claim_secret` column + generation in `factory/batches` + QR URL encoding
- These are important for **public tag distribution** security but not blocking for demo/controlled sales


---

## 15. Session 6 — Deployment Checklist

### Supabase migrations to run
1. `supabase/migrations/007_CLAIM_PIN_AND_ORDER_VIEW_SECRET.sql` — claim_pin_challenges table + order_view_secret
2. `supabase/migrations/008_ORDER_INTERNAL_FIELDS.sql` — internal_notes + assigned_to on stripe_orders

### Vercel env vars to set/verify
- `RESEND_API_KEY` — for order confirmation + PIN + shipped emails
- `ORDER_EMAIL_FROM` — e.g. `RanchLink <solve@ranchlink.com>`
- `CLAIM_EMAIL_FROM` — e.g. `RanchLink <solve@ranchlink.com>`
- `INTERNAL_OPS_EMAILS` — `solve@ranchlink.com,gonzalo@ritxma.com`
- `SUPERADMIN_SESSION_SECRET` — ≥32 chars (used for all signed cookies)
- `RANCHLINK_PORTAL_SECRET` — ≥16 chars (optional, defaults to session secret)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` — already configured
- `NEXT_PUBLIC_BASE_URL` — `https://ranch-link.vercel.app`

### Stripe webhook
- Verify endpoint URL: `https://ranch-link.vercel.app/api/stripe/webhook`
- Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`

### Do NOT touch
- `ranchLinkTag1155.ts` — blockchain layer is stable
- `lib/ipfs/client.ts` — IPFS pinning is stable
- `api/factory/batches/route.ts` Merkle tree logic
- Any already-attached animals (AUS0001–AUS0008+)

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
