# Vercel Build Configuration Analysis

**Date:** December 7, 2025  
**Purpose:** Verify how Vercel builds and deploys the RanchLink app

---

## 📋 MONOREPO STRUCTURE

```
ranchlink/
├── apps/
│   └── web/          ← Next.js app (App Router)
│       ├── app/
│       │   └── superadmin/
│       │       └── page.tsx  ← THE ONLY /superadmin route
│       ├── package.json
│       └── next.config.js
├── packages/
│   └── contracts/    ← Hardhat contracts
├── turbo.json        ← Turborepo config
└── package.json      ← Root package.json
```

---

## 🔧 BUILD CONFIGURATION

### Root `package.json`:
```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev"
  }
}
```

### `turbo.json`:
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"]
    }
  }
}
```

### `apps/web/package.json`:
```json
{
  "scripts": {
    "build": "next build",
    "dev": "next dev"
  }
}
```

---

## 🎯 VERCEL CONFIGURATION (Expected)

### Project Root:
- **Should be:** Root of monorepo (`/`)
- **OR:** `apps/web` if Vercel is configured for single app

### Build Command:
- **If root:** `npm run build` or `pnpm run build` (runs Turborepo)
- **If apps/web:** `npm run build` (runs Next.js directly)

### Output Directory:
- **Next.js default:** `.next` (handled automatically)
- **Turborepo:** Builds `apps/web` and outputs to `apps/web/.next`

### Framework Preset:
- **Should be:** Next.js
- **Version:** 13.5.6 (from package.json)

---

## ✅ VERIFICATION STEPS

### 1. Check Vercel Dashboard:
- Go to: https://vercel.com/dashboard
- Find project: `ranch-link` or `ranchlink`
- Check **Settings → General**:
  - **Root Directory:** Should be `/` or `apps/web`
  - **Build Command:** Should be `npm run build` or `pnpm run build`
  - **Output Directory:** Should be `.next` (or auto-detected)

### 2. Check Latest Deployment:
- Go to **Deployments** tab
- Check latest deployment:
  - **Commit:** Should match latest commit (`26474e9` or newer)
  - **Status:** Should be "Ready" (green)
  - **Build Logs:** Should show:
    ```
    > turbo run build
    > @ranchlink/web:build
    > next build
    ```

### 3. Check Build Logs:
- Open latest deployment
- Check **Build Logs**:
  - Should show: `Building apps/web`
  - Should show: `Compiling /superadmin`
  - Should NOT show errors about missing files

---

## 🐛 COMMON ISSUES

### Issue 1: Wrong Root Directory
**Symptom:** Vercel builds from wrong directory  
**Fix:** Set Root Directory to `/` (monorepo root) or `apps/web` (app root)

### Issue 2: Wrong Build Command
**Symptom:** Build fails or builds wrong app  
**Fix:** Use `npm run build` (Turborepo) or `cd apps/web && npm run build` (direct)

### Issue 3: Cached Build
**Symptom:** Old UI appears despite new commits  
**Fix:** 
- Clear Vercel build cache
- Force redeploy
- Check deployment commit hash matches latest

### Issue 4: Environment Variables Missing
**Symptom:** Build succeeds but app fails at runtime  
**Fix:** Verify all env vars from `turbo.json` are set in Vercel

---

## 📋 REQUIRED ENVIRONMENT VARIABLES

All variables listed in `turbo.json` → `tasks.build.env` must be set in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_ALCHEMY_BASE_RPC`
- `ALCHEMY_BASE_MAINNET_RPC`
- `NEXT_PUBLIC_CONTRACT_TAG`
- `SERVER_WALLET_ADDRESS`
- ... (see `turbo.json` for full list)

---

## ✅ EXPECTED BEHAVIOR

1. **Git Push:** Push to `main` branch
2. **Vercel Webhook:** Detects push
3. **Build Starts:** Runs `npm run build` (or configured command)
4. **Turborepo:** Builds `apps/web`
5. **Next.js:** Compiles app, creates `.next` directory
6. **Deploy:** Vercel deploys `.next` directory
7. **Production:** Serves from `apps/web/app/superadmin/page.tsx`

---

## 🔍 HOW TO VERIFY

1. **Check Vercel Dashboard:**
   - Latest deployment commit = `26474e9` or newer
   - Build status = "Ready" (green)
   - Build logs show successful compilation

2. **Check Production URL:**
   - Open `https://ranch-link.vercel.app/superadmin`
   - Verify build badge shows correct commit
   - Verify UI matches v1.0 spec

3. **Check Build Logs:**
   - Should show: `Compiling /superadmin ...`
   - Should NOT show errors

---

**CONCLUSION:** Vercel should build from monorepo root using Turborepo, which builds `apps/web` using Next.js. The `/superadmin` route comes from `apps/web/app/superadmin/page.tsx`.

