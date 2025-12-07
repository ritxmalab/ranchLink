# Superadmin v1.0 UI Specification

**Date:** December 7, 2025  
**Purpose:** Document the EXACT UI that should appear in `/superadmin` for v1.0

---

## ✅ CORRECT v1.0 UI

### Header Section

**Title:** "RanchLink Factory"  
**Subtitle:** "Generate blockchain-linked tags for production"

**Build Badge (Top-Right):**
- **MUST BE VISIBLE** - Not tiny, not gray
- Background: `bg-[var(--bg-card)]` with border
- Text: `text-sm font-bold text-[var(--c2)]`
- Content: `RanchLink v1.0.0 • Base Mainnet • 0xCE16...B6242 • build: <short-commit>`
- **This badge MUST be clearly visible in production**

---

### Tabs Section

**ONLY THREE TABS:**
1. **🏭 Factory** (default active)
2. **📊 Dashboard**
3. **📦 Inventory**

**❌ NO "QR Generator" TAB**  
**❌ NO "Batches" TAB** (batches are shown within Factory tab)

---

### Factory Tab Content

**Section 1: Batch Creation Form**
- Batch Size (number input)
- Material (dropdown: PETG, PLA, ABS, TPU, CARBON_FIBER)
- Model (dropdown: BASIC_QR, BOOTS_ON, etc.)
- Blockchain (dropdown: BASE - disabled, shows "Base Mainnet (v1.0)")
- Color (text input)
- Batch Name (text input)
- Batch Date (date picker)
- **🚀 Generate & Mint Tags** button

**Section 2: Success/Error Messages**
- Green success message with ✅ icon
- Red error message with ❌ icon

**Section 3: Latest Batch Panel** (if batch was created)
- Shows batch name and creation date
- Table with columns:
  - Tag Code
  - Token ID
  - Contract (link to Basescan)
  - Chain
  - Status
  - On-Chain (✅ ON-CHAIN / ⚪ OFF-CHAIN / 🔴 ERROR)

**Section 4: QR Codes for Printing** (if tags exist)
- Grid layout (3-4 columns)
- Each QR code card shows:
  - **Tag ID:** RL-XXX (prominent)
  - **Token ID:** #XXX or "Pending" (prominent)
  - **Animal ID:** AUS0001 or "Not attached"
  - **Chain:** BASE Mainnet
  - **QR Code:** Points to `/t/RL-XXX` (ONLY ONE QR, NO OVERLAY)
  - **On-Chain Status:** Large badge (✅ ON-CHAIN / ⚪ OFF-CHAIN / 🔴 ERROR)
  - **Metadata:** Material, Model, Chain, Color, Batch, TX hash

**❌ NO "Overlay QR" text or image anywhere**  
**❌ NO "Base QR (30mm x 30mm) - Claimable" button**  
**✅ ONLY ONE QR CODE per tag, pointing to `/t/[tag_code]`**

---

### Dashboard Tab Content

**Stats Cards (4 columns):**
- Total Tags (number)
- On-Chain (number, green)
- Pending Mint (number, yellow)
- Attached (number, blue)

---

### Inventory Tab Content

**Table with columns:**
- Tag Code
- Token ID
- Status
- On-Chain (✅ / ⚪ / 🔴)
- Animal (link to `/a/[public_id]` or "Not attached")

**Refresh button** (top-right)

---

## ❌ WHAT SHOULD NOT APPEAR

1. **❌ "QR Generator" tab** - Does not exist in v1.0
2. **❌ "Batches" tab** - Batches are shown within Factory tab
3. **❌ "Overlay QR" text or image** - Completely removed in v1.0
4. **❌ "Base QR (30mm x 30mm) - Claimable" button** - Not in v1.0
5. **❌ Two QR codes per tag** - Only ONE QR code pointing to `/t/[tag_code]`
6. **❌ Claim token references** - Not used in v1.0

---

## ✅ WHAT MUST APPEAR

1. **✅ Build badge** - Clearly visible in top-right
2. **✅ Token ID** - Visible for each tag (or "Pending")
3. **✅ On-chain status** - ✅ ON-CHAIN / ⚪ OFF-CHAIN / 🔴 ERROR badges
4. **✅ Contract address** - Link to Basescan
5. **✅ Single QR code** - Points to `/t/[tag_code]`
6. **✅ Factory, Dashboard, Inventory tabs** - Only these three

---

## 🎯 VERIFICATION CHECKLIST

When checking production `/superadmin`:

- [ ] Build badge is visible and shows correct commit hash
- [ ] Only 3 tabs: Factory, Dashboard, Inventory
- [ ] NO "QR Generator" tab
- [ ] Factory tab shows batch creation form
- [ ] QR codes show only ONE QR per tag
- [ ] QR codes point to `/t/RL-XXX` (not `/start?token=`)
- [ ] Token ID is visible for each tag
- [ ] On-chain status badges are visible
- [ ] NO "Overlay QR" text anywhere
- [ ] NO claim token references

---

**If ANY of these are missing or incorrect, production is serving the wrong build.**

