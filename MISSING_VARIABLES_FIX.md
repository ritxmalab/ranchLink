# 🚨 CRITICAL: Missing Environment Variables in Vercel

## Problem

The red banner shows: **"Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"**

Looking at your Vercel environment variables screenshot, I can see you have many variables set, but **these two critical ones are missing**:

## ✅ Required Variables (MISSING)

You need to add these **TWO** variables to Vercel:

### 1. NEXT_PUBLIC_SUPABASE_URL

**Key:** `NEXT_PUBLIC_SUPABASE_URL`  
**Value:** `https://utovzxpmfnzihurotqnv.supabase.co`  
**Environment:** Production, Preview, Development

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY

**Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
**Value:** `<REDACTED_SUPABASE_KEY — rotated, see SECURITY_LAUNCH_AUDIT.md>`  
**Environment:** Production, Preview, Development

---

## 📋 How to Add in Vercel

1. Go to: https://vercel.com/dashboard
2. Select project: **ranch-link**
3. Click **Settings** → **Environment Variables**
4. Click **"Add New"** button
5. For each variable above:
   - Paste the **Key** exactly
   - Paste the **Value** exactly
   - Select **"Production, Preview, Development"**
   - Click **"Save"**
6. **Redeploy** after adding both variables

---

## 🔍 Pattern Error Fix

The "string did not match the expected pattern" error is likely from the **date input**. 

The date field expects format: `YYYY-MM-DD` (e.g., `2025-11-26`)

**Fix:** Make sure when you select a date, it's in the correct format. The HTML5 date input should handle this automatically, but if you see `11/26/2025`, try:
- Clicking the date field
- Selecting from the calendar picker
- Or manually entering: `2025-11-26`

---

## ✅ Verification Checklist

After adding the variables and redeploying:

- [ ] Red banner is **GONE**
- [ ] Can generate QR codes without errors
- [ ] QR codes save to Supabase successfully
- [ ] No "pattern" error when generating

---

## 🚀 After Fix

Once these two variables are added:
1. The red banner will disappear
2. QR generation will work
3. Devices will save to Supabase
4. Claim flow will function

**These are the ONLY two missing variables needed to fix the red banner!**

