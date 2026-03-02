# Deploy & Batch Readiness

**Last validated:** Build and batch API request validation completed in-repo.

## What was fixed and validated

1. **Batch generation "Invalid request"**
   - **Cause:** Frontend sent `kitSize: null`; API schema allowed only number or omit.
   - **Fix:** API now accepts `kitSize` as optional and nullable. Frontend omits `kitSize` when not in kit mode and shows API validation details on error.
   - **Validated:** `POST /api/factory/batches` with payload including `kitSize: null` returns **401 Unauthorized** (validation passes, auth required), not 400.

2. **Build**
   - Duplicate block in `app/api/debug/tag/[tag_code]/route.ts` removed. `npm run build` completes successfully.

3. **Dashboard**
   - Debug instrumentation removed from `app/api/dashboard/animals/route.ts`. Production build is clean.

## Deploy to Vercel (so batch works in production)

1. Commit and push from this repo:
   ```bash
   git add -A && git status
   git commit -m "fix: batch API kitSize nullable, build fix, dashboard cleanup"
   git push origin main
   ```
2. Vercel will build and deploy from the push. Wait for the deployment to finish.
3. Open https://ranch-link.vercel.app/superadmin → Factory tab → Generate & Mint Tags. Use your superadmin password; batch creation should succeed (no "Invalid request").

## Coherence checklist

- Factory API schema accepts both kitSize null and omitted kitSize.
- Superadmin frontend builds and sends valid payload; error UI shows validation details if API returns them.
- Next.js build passes (npm run build in apps/web).
- Batch API validation tested locally (401 = validation passed).
- Dashboard animals API has no debug logging in production code.
- Debug route compiles (no duplicate definitions).
