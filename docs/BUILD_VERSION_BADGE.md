# Build Version Badge

**Purpose:** Make it impossible to confuse legacy builds with v1.0

---

## Implementation

**File:** `apps/web/lib/build-info.ts`

**Function:** `getBuildBadgeText()`

**Display Format:**
```
RanchLink v1.0.0 • Base Mainnet • 0xCE16...B6242 • build: 91f8056
```

---

## Where It Appears

### 1. Superadmin Page (`/superadmin`)
- Location: Top-right of header
- Style: Small, grey, monospace font
- Always visible

### 2. Dashboard Page (`/dashboard`)
- Location: Top-right of header
- Style: Small, grey, monospace font
- Always visible

---

## How to Verify You're on v1.0

**Check for:**
1. ✅ Build badge visible in header
2. ✅ Commit hash matches latest commit (check `git log`)
3. ✅ Contract address shows `0xCE16...B6242`
4. ✅ Version shows `v1.0.0`
5. ✅ Network shows `Base Mainnet`

**If badge is missing or shows old commit:**
- Production is running old build
- Clear cache and hard refresh
- Check Vercel deployment status

---

## Build-Time Variables

**Automatically set by:**
- Vercel: `VERCEL_GIT_COMMIT_SHA`
- Local: `GIT_COMMIT` (if set)
- Fallback: `'dev'`

**Build time:** Set at build time via `next.config.js`

---

## Example Badge

```
RanchLink v1.0.0 • Base Mainnet • 0xCE16...B6242 • build: 91f8056
```

This confirms:
- ✅ Version 1.0.0
- ✅ Base Mainnet network
- ✅ Correct contract address
- ✅ Build from commit 91f8056 (v1.0 FINAL)

---

**Status:** ✅ Implemented in `/superadmin` and `/dashboard`

