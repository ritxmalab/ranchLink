# Local Superadmin Verification

**Date:** December 7, 2025  
**Purpose:** Verify that local dev environment shows the correct v1.0 UI

---

## ✅ BUILD STATUS

**Build Command:** `cd apps/web && npm run build`

**Result:** 
- ✅ TypeScript errors fixed
- ✅ Build should complete successfully
- ✅ `/superadmin` route compiled

---

## 🔍 VERIFICATION STEPS

### 1. Start Dev Server:
```bash
cd apps/web
npm run dev
```

### 2. Open Browser:
- URL: `http://localhost:3000/superadmin`
- Use incognito/private window to avoid cache

### 3. Check Header:
- [ ] Title: "RanchLink Factory"
- [ ] Subtitle: "Generate blockchain-linked tags for production"
- [ ] **Build Badge (Top-Right):** 
  - [ ] Visible (NOT tiny, NOT gray)
  - [ ] Shows: `RanchLink v1.0.0 • Base Mainnet • 0xCE16...B6242 • build: <commit>`
  - [ ] Has background and border (not just text)

### 4. Check Tabs:
- [ ] **ONLY 3 tabs:**
  - [ ] 🏭 Factory (default active)
  - [ ] 📊 Dashboard
  - [ ] 📦 Inventory
- [ ] **NO "QR Generator" tab**
- [ ] **NO "Batches" tab**

### 5. Check Factory Tab:
- [ ] Batch creation form visible
- [ ] Fields: Batch Size, Material, Model, Blockchain, Color, Batch Name, Batch Date
- [ ] "🚀 Generate & Mint Tags" button visible
- [ ] **NO "Overlay QR" text anywhere**
- [ ] **NO "Base QR (30mm x 30mm) - Claimable" button**

### 6. Generate Test Batch:
- [ ] Fill form (Batch Size: 3, Batch Name: "Test Batch")
- [ ] Click "Generate & Mint Tags"
- [ ] Success message appears
- [ ] QR codes section appears below

### 7. Check QR Codes:
- [ ] **ONLY ONE QR code per tag** (not two)
- [ ] QR code points to `/t/RL-XXX` (check URL below QR)
- [ ] Tag ID visible: `RL-XXX`
- [ ] Token ID visible: `#XXX` or "Pending"
- [ ] On-chain status badge visible: ✅ ON-CHAIN / ⚪ OFF-CHAIN / 🔴 ERROR
- [ ] **NO "Overlay QR" text or image**
- [ ] **NO claim token references**

### 8. Check Dashboard Tab:
- [ ] Stats cards visible (Total Tags, On-Chain, Pending Mint, Attached)
- [ ] Build badge still visible in header

### 9. Check Inventory Tab:
- [ ] Table with columns: Tag Code, Token ID, Status, On-Chain, Animal
- [ ] Tags from test batch appear in table
- [ ] On-chain status badges visible

---

## ✅ EXPECTED RESULTS

**If ALL checks pass:**
- ✅ Local UI matches v1.0 spec
- ✅ Build badge is visible
- ✅ No legacy UI elements
- ✅ Ready to push to production

**If ANY check fails:**
- ❌ Fix the issue locally first
- ❌ Do NOT push until local is correct
- ❌ Re-run verification after fixes

---

## 🐛 COMMON ISSUES

### Issue 1: Build Badge Not Visible
**Symptom:** Can't see build badge in header  
**Fix:** Check that badge has background and border (not just `text-xs text-gray-500`)

### Issue 2: Old UI Still Appears
**Symptom:** See "QR Generator" tab or "Overlay QR"  
**Fix:** 
- Clear browser cache (Cmd+Shift+R)
- Restart dev server
- Check that `apps/web/app/superadmin/page.tsx` has correct tabs

### Issue 3: QR Codes Show Two QR Codes
**Symptom:** Each tag shows two QR codes  
**Fix:** Check that `overlay_qr_url` is never displayed, only `base_qr_url`

---

## 📋 VERIFICATION CHECKLIST

- [ ] Dev server starts without errors
- [ ] `/superadmin` loads correctly
- [ ] Build badge is visible and shows correct commit
- [ ] Only 3 tabs: Factory, Dashboard, Inventory
- [ ] NO "QR Generator" tab
- [ ] Factory tab shows batch creation form
- [ ] Test batch generates successfully
- [ ] QR codes show only ONE QR per tag
- [ ] QR codes point to `/t/RL-XXX`
- [ ] Token ID visible for each tag
- [ ] On-chain status badges visible
- [ ] NO "Overlay QR" text anywhere
- [ ] NO claim token references

---

**STATUS:** ⏳ Pending local verification

**NEXT STEP:** Run dev server and verify all checks pass

