# Environment Variables - Production Checklist

**Purpose:** Ensure all required environment variables are set in Vercel production

---

## Required Environment Variables

### 🔐 Server-Side Only (Never expose to client)

#### Blockchain Wallet:
- `PRIVATE_KEY` - Server wallet private key for Hardhat deployment
- `SERVER_WALLET_PRIVATE_KEY` - Server wallet private key for backend minting
- `SERVER_WALLET_ADDRESS` - Server wallet address (`0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`)

#### Supabase:
- `SUPABASE_SERVICE_KEY` - Supabase service role key (server-side only)

#### RPC (Server-side):
- `ALCHEMY_BASE_RPC` - Base Mainnet RPC URL (server-side)
- `ALCHEMY_BASE_MAINNET_RPC` - Base Mainnet RPC URL (alternative)

---

### 🌐 Public (Exposed to client via `NEXT_PUBLIC_*`)

#### Contract Addresses:
- `NEXT_PUBLIC_CONTRACT_TAG` - Contract address (`0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242`)
- `RANCHLINKTAG_ADDRESS` - Same as above (server-side, but also used in some client code)

#### Supabase (Public):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (safe to expose, protected by RLS)

#### RPC (Public):
- `NEXT_PUBLIC_ALCHEMY_BASE_RPC` - Base Mainnet RPC URL (for client-side reads)

#### App:
- `NEXT_PUBLIC_APP_URL` - Production URL (`https://ranch-link.vercel.app`)

---

## Build-Time Variables

These are automatically set by Vercel:

- `VERCEL_GIT_COMMIT_SHA` - Git commit hash (used for build badge)
- `VERCEL_ENV` - Environment (production, preview, development)

---

## Verification in Vercel

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Verify all variables above are set
3. Ensure they're set for **Production** environment
4. Check that values match local `.env.local` (except secrets)

---

## Critical Variables for v1.0

**Must be set correctly:**
- ✅ `NEXT_PUBLIC_CONTRACT_TAG` = `0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242`
- ✅ `SERVER_WALLET_ADDRESS` = `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
- ✅ `NEXT_PUBLIC_SUPABASE_URL` = (your Supabase URL)
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your Supabase anon key)
- ✅ `SUPABASE_SERVICE_KEY` = (your Supabase service key)
- ✅ `NEXT_PUBLIC_ALCHEMY_BASE_RPC` = (Base Mainnet RPC)

---

## If Variables Are Missing

1. **Add in Vercel Dashboard:**
   - Project Settings → Environment Variables
   - Add each variable
   - Set for "Production" environment
   - Redeploy after adding

2. **Verify After Deploy:**
   - Check `/api/health` endpoint
   - Should return status: "healthy" with env checks

---

**Status:** ⚠️ Verify in Vercel dashboard that all variables are set

