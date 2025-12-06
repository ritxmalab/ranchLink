# 🚀 RanchLink v1.0 - Current Status & Next Steps

## ✅ What I Just Fixed

### **1. Critical Bug: Supabase Client Issue**
**Problem:** API routes were using `createServerClient()` from `client.ts` which requires anon key, but server routes only need service key.

**Fix:** Updated all API routes to use `getSupabaseServerClient()` from `server.ts`:
- ✅ `/api/superadmin/devices/route.ts`
- ✅ `/api/claim/route.ts`
- ✅ `/api/animals/[id]/route.ts`
- ✅ `/api/health/route.ts` (new diagnostic endpoint)

**This should fix the "TypeError: fetch failed" error!**

### **2. Created v1.0 Components**

**Database:**
- ✅ `infra/db/migrations/004_v1_schema.sql` - New v1.0 schema (ranches, tags, kits)
- ✅ Migration helpers to convert existing data
- ✅ Backward compatible (keeps old tables)

**Blockchain:**
- ✅ `apps/web/lib/blockchain/ranchLinkTag.ts` - Contract wrapper
  - `mintTag()` - Mint NFTs
  - `getOwner()` - Get token owner
  - `getTokenURI()` - Get IPFS URI
  - `getBasescanUrl()` - Generate Basescan links

**API Routes:**
- ✅ `POST /api/factory/batches` - Creates batch + mints NFTs
- ✅ `GET /t/[tag_code]` - Tag scan route
- ✅ `GET /api/health` - Diagnostic endpoint

---

## ⚠️ What Still Needs Work

### **1. Environment Variables in Vercel**

**Critical - Must Add:**
- `NEXT_PUBLIC_SUPABASE_URL` ✅ (you have this)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅ (you have this)
- `SUPABASE_SERVICE_KEY` ✅ (you have this)

**For Blockchain (After Contract Deployment):**
- `RANCHLINKTAG_ADDRESS` - Contract address (fill after deployment)
- `SERVER_WALLET_PRIVATE_KEY` - For minting (keep secret!)

**Action:** Add `SUPABASE_SERVICE_KEY` to Vercel if not already there, then redeploy.

### **2. Database Migration**

**Action Required:**
1. Go to Supabase SQL Editor
2. Run `infra/db/migrations/004_v1_schema.sql`
3. Run migration helpers:
   ```sql
   SELECT migrate_owners_to_ranches();
   SELECT migrate_devices_to_tags();
   ```

### **3. Contract Deployment**

**Action Required:**
1. Deploy `RanchLinkTag.sol` to Base Sepolia (testnet)
2. Get contract address
3. Add to Vercel as `RANCHLINKTAG_ADDRESS`
4. Grant MINTER_ROLE to your server wallet

**Deploy Command:**
```bash
cd packages/contracts
npm install
npx hardhat compile
PRIVATE_KEY=<your-server-wallet-private-key> \
ALCHEMY_BASE_SEPOLIA_RPC=<your-rpc-url> \
npx hardhat run scripts/deploy.ts --network baseSepolia
```

### **4. Blockchain Wrapper Fix**

**Issue:** `mintTag()` needs to properly extract `tokenId` from transaction events.

**Current:** Placeholder implementation
**Needed:** Parse `TagMinted` event from transaction receipt

**Action:** Update `ranchLinkTag.ts` to parse events correctly (or add a view function to contract).

### **5. Factory UI Update**

**Current:** UI generates QRs client-side only
**Needed:** Call `/api/factory/batches` endpoint

**Action:** Update `apps/web/app/superadmin/page.tsx` to:
- Call `POST /api/factory/batches` instead of client-side generation
- Display returned tags with real token IDs
- Show Basescan links

### **6. Remaining Routes**

- ✅ `/t/[tag_code]` - Created
- ⏳ `/a/[public_id]` - Needs update to show tokenId
- ⏳ `/claim-kit` - Needs creation
- ⏳ `/api/claim-kit` - Needs creation
- ⏳ `/dashboard` - Needs update for new schema

---

## 🧪 Testing Checklist

### **Immediate (Before v1.0):**
- [ ] Visit `/api/health` - Should show "healthy"
- [ ] Visit `/api/superadmin/devices` - Should return devices (or empty array)
- [ ] Try generating QR codes - Should work now (no fetch error)

### **After Migration:**
- [ ] Check `ranches` table exists
- [ ] Check `tags` table exists
- [ ] Check `kits` table exists
- [ ] Verify old data migrated correctly

### **After Contract Deployment:**
- [ ] Test `POST /api/factory/batches` with small batch (1-3 tags)
- [ ] Verify NFTs minted on Basescan
- [ ] Verify tags saved to database with token IDs
- [ ] Test `/t/RL-001` route

---

## 📋 Quick Start Guide

### **Step 1: Fix Immediate Issue**
1. Verify all Supabase env vars in Vercel
2. Redeploy
3. Test `/api/health` endpoint
4. Try QR generation - should work now!

### **Step 2: Run Database Migration**
1. Open Supabase SQL Editor
2. Copy/paste `004_v1_schema.sql`
3. Run it
4. Run migration helpers

### **Step 3: Deploy Contract**
1. Get server wallet private key
2. Deploy to Base Sepolia
3. Add contract address to Vercel
4. Test minting

### **Step 4: Update UI**
1. Update factory UI to use new endpoint
2. Update dashboard for new schema
3. Test end-to-end flow

---

## 🔍 Diagnostic Endpoint

I created `/api/health` to help diagnose issues:

**Visit:** `https://ranch-link.vercel.app/api/health`

**Returns:**
```json
{
  "status": "healthy" | "unhealthy",
  "checks": {
    "env": { "status": "ok", "message": "..." },
    "supabase": { "status": "ok", "message": "..." }
  }
}
```

Use this to verify everything is connected!

---

## 🎯 Priority Order

1. **NOW:** Fix fetch error (verify env vars + redeploy)
2. **THEN:** Run database migration
3. **THEN:** Deploy contract
4. **THEN:** Update UI to use new endpoints
5. **THEN:** Test full flow

---

## 📝 Files Created/Modified

### **New Files:**
- `infra/db/migrations/004_v1_schema.sql`
- `apps/web/lib/blockchain/ranchLinkTag.ts`
- `apps/web/app/api/factory/batches/route.ts`
- `apps/web/app/api/health/route.ts`
- `apps/web/app/t/[tag_code]/page.tsx`
- `V1_IMPLEMENTATION_PLAN.md`
- `V1_STATUS_AND_NEXT_STEPS.md` (this file)

### **Modified Files:**
- `apps/web/app/api/superadmin/devices/route.ts` - Fixed Supabase client
- `apps/web/app/api/claim/route.ts` - Fixed Supabase client
- `apps/web/app/api/animals/[id]/route.ts` - Fixed Supabase client

---

## 🚀 Next Actions

1. **Test the fix:** Visit `/api/health` and try QR generation
2. **If working:** Proceed with migration and contract deployment
3. **If still failing:** Check Vercel logs for specific error

The fetch error should be fixed now! Let me know what you see. 🎯

