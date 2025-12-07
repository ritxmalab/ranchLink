# Deployment Source Verification

**Date:** December 7, 2025  
**Purpose:** Verify that production deployment matches the latest v1.0 code

---

## Local Repository State

**Current HEAD Commit:** `91f8056a80625117464f09a485ef3982660e8f38`

**Latest Commits:**
- `91f8056` - v1.0 FINAL: Remove all legacy overlay/claim_token references, ensure only base QR to /t/[tag_code]
- `5bb77a4` - Fix: Remove overlay QR completely, use only base QR pointing to /t/[tag_code] - v1.0 production ready
- `2ff8bcf` - Fix: Add webpack config to ignore optional ws dependencies

**Branch:** `main`

---

## Vercel Configuration

**Expected Configuration:**
- Repository: `ritxmalab/ranchLink`
- Branch: `main`
- Framework: Next.js
- Build Command: `npm run build` (via Turborepo)
- Output Directory: `.next` (default)

**To Verify Vercel Deployment:**
1. Check Vercel dashboard: https://vercel.com/dashboard
2. Look for latest production deployment
3. Verify commit hash matches `91f8056` or later
4. Check deployment logs for build success

---

## Build Version Badge

**Implementation:**
- File: `apps/web/lib/build-info.ts`
- Exposes: `getBuildBadgeText()` function
- Shows in UI: `/superadmin` and `/dashboard` pages
- Format: `RanchLink v1.0.0 • Base Mainnet • 0xCE16...B6242 • build: 91f8056`

**How to Verify:**
- Open `/superadmin` in production
- Look for build badge in header (top-right)
- Commit hash should match `91f8056` or latest commit

---

## Environment Variables Check

**Required for Production:**

### Blockchain:
- `RANCHLINKTAG_ADDRESS` = `0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242`
- `NEXT_PUBLIC_CONTRACT_TAG` = `0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242`
- `SERVER_WALLET_ADDRESS` = `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
- `SERVER_WALLET_PRIVATE_KEY` = (server-side only, not public)
- `PRIVATE_KEY` = (for Hardhat, server-side only)

### RPC:
- `NEXT_PUBLIC_ALCHEMY_BASE_RPC` = Base Mainnet RPC URL
- `ALCHEMY_BASE_RPC` = Base Mainnet RPC URL (server-side)
- `ALCHEMY_BASE_MAINNET_RPC` = Base Mainnet RPC URL (alternative name)

### Supabase:
- `NEXT_PUBLIC_SUPABASE_URL` = Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon key (public)
- `SUPABASE_SERVICE_KEY` = Supabase service key (server-side only)

### App:
- `NEXT_PUBLIC_APP_URL` = `https://ranch-link.vercel.app`

---

## Verification Steps

1. **Check Vercel Dashboard:**
   - Latest deployment commit hash
   - Build status (should be successful)
   - Environment variables (verify all required vars are set)

2. **Check Production URL:**
   - Open `https://ranch-link.vercel.app/superadmin`
   - Verify build badge shows correct commit
   - Verify UI matches v1.0 design (no overlay QR)

3. **Check Browser Cache:**
   - Use incognito/private window
   - Or clear cache and hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

---

## If Mismatch Found

If production commit doesn't match `91f8056`:

1. **Trigger Manual Deployment:**
   - Go to Vercel dashboard
   - Click "Redeploy" on latest deployment
   - Or push an empty commit: `git commit --allow-empty -m "Trigger redeploy" && git push`

2. **Verify Environment Variables:**
   - Check all required vars are set in Vercel
   - Verify values match local `.env.local`

3. **Check Build Logs:**
   - Review Vercel build logs for errors
   - Verify build completes successfully

---

**Status:** ✅ Local repo is at commit `91f8056`  
**Action Required:** Verify Vercel production deployment matches this commit

