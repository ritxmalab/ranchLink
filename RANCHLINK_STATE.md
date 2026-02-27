# RanchLink — Session State Log

This file is the human-readable project log. Updated at the end of every Agent session automatically.

---

## Session: 2026-02-27

### Deployment
- **Live URL:** https://ranch-link.vercel.app
- **Latest deploy:** `3nmNXnxcr` (Vercel)
- **Latest commit:** `86b5631` — `feat: photo upload, assemble tab, ongoing updates, superadmin auth`

### What was built this session
1. **Photo upload** — `/api/upload-photo` → Pinata Files API → stored as `photo_url` in `animals` table. Displayed on `/a/[public_id]` and embedded in NFT metadata.
2. **Superadmin password gate** — `/api/superadmin/login` sets cookie `rl_superadmin`. Password: `SUPERADMIN_PASSWORD` env var (default: `ranchlink2026`).
3. **Assemble tab** — New tab in `/superadmin`. Shows tags ready for physical assembly + shipment. `GET/POST /api/superadmin/assemble`. Tracks `assembled_at`, `shipped_at`, `assembled_by`.
4. **Ongoing Updates** — `/api/update-animal` lets farmers add weight, notes, vet visits after initial attach. Each update re-pins IPFS + calls `setCID()` on-chain. Full event log shown on animal card.
5. **Supabase migrations executed:**
   - `animals.photo_url` column added
   - `tags.assembled_at`, `tags.shipped_at`, `tags.assembled_by` columns added
   - `animal_events` table created with indexes
6. **Vercel env vars set:** `NEXT_PUBLIC_CHAIN_ID=8453`, `NEXT_PUBLIC_APP_URL=https://ranch-link.vercel.app`, `PINATA_JWT`, `SUPERADMIN_PASSWORD`, `RANCHLINKTAG_ADDRESS`, `SERVER_WALLET_PRIVATE_KEY`, `SUPABASE_SERVICE_KEY`

### What was NOT built (pending)
- User account creation at claim time (farmer identity)
- Custodial wallet per farmer
- NFT transfer from server wallet to farmer wallet
- Compliance section (delegate, sell cattle on-chain)

### Blockchain state
- **Chain:** Base Mainnet (8453)
- **Contract:** `0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242`
- **Server wallet:** `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83` (has MINTER_ROLE)

### Files changed this session
- `apps/web/app/api/upload-photo/route.ts` — NEW
- `apps/web/app/api/update-animal/route.ts` — NEW
- `apps/web/app/api/superadmin/assemble/route.ts` — NEW
- `apps/web/app/api/superadmin/login/route.ts` — NEW
- `apps/web/app/superadmin/auth.ts` — NEW
- `apps/web/app/superadmin/page.tsx` — MODIFIED (assemble tab, password gate)
- `apps/web/app/a/[public_id]/page.tsx` — wait, check the path
- `apps/web/app/t/[tag_code]/page.tsx` — MODIFIED (photo upload section)
- `apps/web/app/api/attach-tag/route.ts` — MODIFIED (photo_url)
- `apps/web/lib/ipfs/client.ts` — MODIFIED (photo_url in NFT metadata)
- `apps/web/lib/rate-limit.ts` — NEW
- `.cursor/rules/ranchlink-architecture.mdc` — REWRITTEN (full state)

---

## Session: 2026-02-25 (Previous)

### What was built
- Core pipeline from Factory → Assemble → QR Print → Scan → Attach
- `/api/factory/batches` — batch creation + immediate NFT mint per tag
- `/t/[tag_code]` — scan landing page with full 5-section attach form
- `/a/[public_id]` — public animal card
- `/api/attach-tag` — animal creation + IPFS pin + setCID on-chain
- `/api/retry-mint`, `/api/sync-tag`, `/api/verify-tx` — ops tooling
- Superadmin page with Factory + Inventory tabs
- Supabase schema with tags, animals, batches, ranches tables
- Base Mainnet contract deployed + MINTER_ROLE granted to server wallet

### Blockchain state
- First real NFTs minted on Base Mainnet
- Server wallet confirmed to have MINTER_ROLE

---

## How to resume any session

1. Agent auto-reads `.cursor/rules/ranchlink-architecture.mdc` (alwaysApply rule)
2. Say **"Resume RanchLink"** — agent will read this file and give full briefing
3. Or just start giving instructions — context is already loaded

---

## Next recommended steps (priority order)

1. **E2E test in production** — scan a real QR, fill the full form, verify animal card + NFT
2. **User accounts at claim time** — Supabase Auth or magic link so farmer has persistent identity
3. **Custodial wallet assignment** — create a Privy or similar wallet per farmer at first scan
4. **NFT transfer** — once farmer has wallet, transfer NFT from server wallet
5. **Compliance section** — delegate access to staff, sell cattle on-chain (ERC-721 transfer)
