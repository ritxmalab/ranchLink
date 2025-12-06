# 🚀 RanchLink v1.0 Implementation Plan

## Current State (v0.9) vs Target (v1.0)

### What Changes:
- ❌ Remove overlay/scratch codes per tag
- ✅ Single QR per tag: `/t/<tag_code>`
- ✅ Schema: `owners` → `ranches`, `devices` → `tags`
- ✅ Add `kits` system for retail distribution
- ✅ Single ERC-721 contract (RanchLinkTag)
- ✅ Base blockchain only
- ✅ Factory endpoint mints NFTs during batch creation

### What Stays:
- ✅ Existing UX/UI ("Tag. Scan. Done.")
- ✅ Home, Models, Claim Tag, Dashboard, Marketplace pages
- ✅ Visual design and branding

---

## Implementation Steps

### Phase 1: Fix Immediate Issues ✅
1. Verify Supabase env vars in Vercel
2. Fix "TypeError: fetch failed" error
3. Ensure API routes are working

### Phase 2: Database Schema Migration
1. Create v1.0 migration (ranches, tags, kits)
2. Keep old tables for backward compatibility initially
3. Add new tables alongside existing ones

### Phase 3: Blockchain Integration
1. Create RanchLinkTag wrapper (`/lib/blockchain/ranchLinkTag.ts`)
2. Implement `mintTag()` function
3. Test on Base Sepolia first

### Phase 4: Core API Routes
1. `POST /api/factory/batches` - Creates batch + mints NFTs
2. `GET /t/[tag_code]` - Tag scan route
3. `POST /api/claim-kit` - Kit claiming
4. Update `/a/[public_id]` - Show tokenId + Basescan links

### Phase 5: UI Updates
1. Update factory UI to use new endpoint
2. Update dashboard to read from new schema
3. Create `/claim-kit` page
4. Update tag scan flow

---

## Files to Create/Modify

### New Files:
- `infra/db/migrations/004_v1_schema.sql` - New schema
- `apps/web/lib/blockchain/ranchLinkTag.ts` - Contract wrapper
- `apps/web/app/api/factory/batches/route.ts` - Factory endpoint
- `apps/web/app/t/[tag_code]/page.tsx` - Tag scan route
- `apps/web/app/claim-kit/page.tsx` - Kit claiming page
- `apps/web/app/api/claim-kit/route.ts` - Kit claim API

### Modified Files:
- `apps/web/app/superadmin/page.tsx` - Use new factory endpoint
- `apps/web/app/a/[public_id]/page.tsx` - Show tokenId
- `apps/web/app/dashboard/page.tsx` - Read from new schema
- `apps/web/lib/supabase/client.ts` - Keep as-is (already correct)

---

## Environment Variables Needed

### Already Have:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_KEY`
- ✅ `NEXT_PUBLIC_ALCHEMY_BASE_RPC`
- ✅ `NEXT_PUBLIC_ALCHEMY_BASE_SEPOLIA_RPC`

### Need to Add:
- ⚠️ `RANCHLINKTAG_ADDRESS` - Contract address (after deployment)
- ⚠️ `SERVER_WALLET_PRIVATE_KEY` - For minting (keep secret!)
- ⚠️ `NEXT_PUBLIC_CHAIN_ID` - Set to 84532 (Sepolia) or 8453 (Mainnet)

---

## Next Actions

1. **Immediate**: Fix fetch error (verify env vars)
2. **Then**: Create v1.0 schema migration
3. **Then**: Create blockchain wrapper
4. **Then**: Implement factory endpoint
5. **Then**: Update UI flows

Let's start! 🚀

