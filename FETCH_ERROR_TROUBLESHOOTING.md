# 🔧 "TypeError: fetch failed" - Troubleshooting Guide

## Problem

When clicking "Generate & Save QR Codes", you get:
```
TypeError: fetch failed
```

This means the browser cannot connect to your API route (`/api/superadmin/devices`).

---

## 🔍 Root Causes

### **1. Missing Environment Variables in Vercel (Most Likely)**

The API route needs these variables to work:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

**Check:**
1. Go to Vercel → Settings → Environment Variables
2. Verify both variables are present
3. Make sure they're set for **Production, Preview, Development**
4. **Redeploy** after adding variables

### **2. API Route Not Found**

The route might not be deployed correctly.

**Check:**
- Visit: `https://your-app.vercel.app/api/superadmin/devices`
- Should return JSON (even if error)
- If 404, the route isn't deployed

### **3. CORS or Network Issue**

Less likely, but possible.

**Check:**
- Browser console for CORS errors
- Network tab in DevTools
- Check if request is being blocked

---

## ✅ Step-by-Step Fix

### **Step 1: Verify Environment Variables in Vercel**

1. Go to: https://vercel.com/dashboard
2. Select project: **ranch-link**
3. Click **Settings** → **Environment Variables**
4. Verify these exist:
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_SERVICE_KEY`

**If missing, add them:**
- Copy from `apps/web/.env.local`
- Set scope: **Production, Preview, Development**
- Click **Save**

### **Step 2: Redeploy**

After adding variables:
1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait for build to complete

### **Step 3: Test API Route Directly**

Visit in browser:
```
https://ranch-link.vercel.app/api/superadmin/devices
```

**Expected responses:**
- ✅ `{"devices": [...]}` - Working!
- ❌ `{"error": "Missing NEXT_PUBLIC_SUPABASE_URL..."}` - Missing env var
- ❌ `404 Not Found` - Route not deployed
- ❌ `500 Internal Server Error` - Check Vercel logs

### **Step 4: Check Vercel Function Logs**

1. Go to Vercel → **Logs** tab
2. Look for errors when you click "Generate"
3. Check for:
   - "Missing environment variable"
   - "Supabase connection error"
   - "Network error"

---

## 🛠️ What I Just Fixed

I've improved error handling to show better messages:

1. **API Route** (`/api/superadmin/devices/route.ts`):
   - ✅ Checks for env vars before trying to connect
   - ✅ Returns clear error messages
   - ✅ Better error handling

2. **Frontend** (`app/superadmin/page.tsx`):
   - ✅ Better error messages for network failures
   - ✅ Specific guidance about missing env vars
   - ✅ More helpful user feedback

---

## 🧪 Quick Test

After redeploying, test this in browser console:

```javascript
fetch('/api/superadmin/devices')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**If it works:** You'll see `{devices: [...]}`
**If it fails:** You'll see the exact error message

---

## 📋 Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` added to Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` added to Vercel
- [ ] `SUPABASE_SERVICE_KEY` added to Vercel
- [ ] All variables set for **Production, Preview, Development**
- [ ] Redeployed after adding variables
- [ ] Tested API route directly (`/api/superadmin/devices`)
- [ ] Checked Vercel logs for errors

---

## 🚨 Most Common Issue

**90% of the time, this is because:**
- Environment variables were added to Vercel
- But deployment wasn't redeployed
- So the old build doesn't have the variables

**Fix:** Always redeploy after adding environment variables!

---

## 💡 Next Steps

1. ✅ Add missing env vars to Vercel (if not already)
2. ✅ Redeploy the latest deployment
3. ✅ Test the API route directly
4. ✅ Try generating QR codes again
5. ✅ Check Vercel logs if still failing

The improved error messages will now tell you exactly what's missing!

