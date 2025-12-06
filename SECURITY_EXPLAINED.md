# 🔐 Security Explained - Important!

## ⚠️ NEVER Share Secrets Publicly!

You are **100% correct** - you should **NEVER** share:
- Service role keys
- Private keys
- API keys with sensitive permissions

**Everything should be done locally on your machine!**

## 🔑 What Each Thing Means

### **1. Service Role Key (Supabase)**

**What it is:**
- A secret key that gives admin access to your Supabase database
- Needed for server-side operations (creating users, admin functions)

**What to do:**
1. ✅ Get it from your Supabase dashboard (privately)
2. ✅ Add it to `.env.local` file on YOUR computer (locally)
3. ✅ Keep it secret - never share with anyone
4. ❌ **DO NOT** paste it in chat, email, or anywhere public

**Where to add it:**
- File: `apps/web/.env.local` (on your local machine)
- The file is already in `.gitignore` (won't be committed to Git)
- Only exists on your computer

**Why it's safe:**
- You're adding it locally on your machine
- `.env.local` is not committed to Git
- Only your server code can use it (server-side only)
- Never exposed to frontend/browser

---

### **2. CDP (Coinbase Developer Platform)**

**What it is:**
- CDP = Coinbase Developer Platform
- A service that provides "smart wallets" for your users
- Allows users to interact with blockchain without installing MetaMask
- Enables "gasless" transactions (you pay gas for users)

**Why you need it:**
- Makes it easier for farmers to use (no wallet setup needed)
- Better user experience
- Can sponsor gas fees (pay for user transactions)

**What to do:**
1. ✅ Sign up at: https://portal.cdp.coinbase.com (your account)
2. ✅ Create an app in your dashboard
3. ✅ Get API Key and App ID (they give you these)
4. ✅ Add to `.env.local` on YOUR computer (locally)
5. ❌ **DO NOT** share these keys publicly

**What you get:**
- `CDP_API_KEY` - Your API key
- `CDP_APP_ID` - Your app ID

**It's safe because:**
- You add it locally to `.env.local`
- These are less sensitive than private keys
- Still, keep them private (don't share publicly)

---

### **3. Server Wallet**

**What it is:**
- A cryptocurrency wallet (like MetaMask) that your SERVER uses
- **Separate from your Ledger wallet** (which is your treasury)
- Used for server operations (paying gas fees, sponsoring transactions)

**Why you need it:**
- Your Ledger is for treasury (receiving payments)
- Server wallet is for operations (spending gas)
- Keeps them separate for security

**What to do:**
1. ✅ Create a NEW wallet on your computer (MetaMask, etc.)
2. ✅ Export the private key (keep it secret!)
3. ✅ Add private key to `.env.local` on YOUR computer (locally)
4. ✅ Fund it with small amount (0.1-0.5 ETH on Base)
5. ❌ **DO NOT** share the private key with anyone (including me!)

**Important:**
- This is a "hot wallet" (connected to internet)
- Only fund with small amount (for gas)
- Your Ledger is "cold wallet" (safer, for treasury)
- Keep them separate!

**Security:**
- Private key stays on your computer
- Only in `.env.local` (not committed to Git)
- Server uses it for operations only

---

### **4. Migrations (Database Setup)**

**What it is:**
- SQL scripts that create database tables
- Think of it like building the structure of your database
- Creates tables like "animals", "owners", "events", etc.

**What to do:**
1. ✅ Go to your Supabase dashboard (privately)
2. ✅ Open SQL Editor
3. ✅ Copy the SQL from `infra/db/migrations/001_initial_schema.sql`
4. ✅ Paste into Supabase SQL Editor
5. ✅ Click "Run"
6. ✅ Tables are created in YOUR database

**Why it's safe:**
- You're running SQL in YOUR own Supabase project
- No secrets are shared
- You're just creating tables in your database
- Everything happens in your private dashboard

**What gets created:**
- Tables for storing data (animals, owners, events, etc.)
- Indexes for faster queries
- All in YOUR Supabase project (private to you)

---

## 🛡️ Security Best Practices

### **✅ DO:**
- Add secrets to `.env.local` locally (on your computer)
- Keep `.env.local` private (it's in `.gitignore`)
- Use secrets only in server-side code
- Keep Ledger wallet separate from server wallet
- Use separate wallets for different purposes

### **❌ DON'T:**
- Share secrets in chat, email, or public places
- Commit `.env.local` to Git (already protected)
- Expose service role keys in frontend code
- Use Ledger private key for server operations
- Share private keys with anyone

---

## 📋 Step-by-Step (Safe Way)

### **1. Service Role Key:**
```
1. Open Supabase dashboard (privately)
2. Go to Settings → API
3. Copy "service_role" key
4. Open apps/web/.env.local on YOUR computer
5. Add: SUPABASE_SERVICE_KEY=your-key-here
6. Save file (stays on your computer)
7. Done! (No sharing needed)
```

### **2. Migrations:**
```
1. Open Supabase dashboard (privately)
2. Go to SQL Editor
3. Open infra/db/migrations/001_initial_schema.sql
4. Copy SQL script
5. Paste into Supabase SQL Editor
6. Click "Run"
7. Tables created in YOUR database
8. Done! (No secrets shared)
```

### **3. CDP (Coinbase):**
```
1. Sign up at portal.cdp.coinbase.com (your account)
2. Create app
3. Get API Key and App ID
4. Add to apps/web/.env.local on YOUR computer
5. Save file (stays on your computer)
6. Done! (No sharing needed)
```

### **4. Server Wallet:**
```
1. Create new wallet on YOUR computer (MetaMask)
2. Export private key (keep secret!)
3. Add to apps/web/.env.local on YOUR computer
4. Fund with small amount
5. Save file (stays on your computer)
6. Done! (No sharing needed)
```

---

## 🔒 What's Protected

### **`.env.local` file:**
- ✅ Already in `.gitignore`
- ✅ Won't be committed to Git
- ✅ Stays on your computer only
- ✅ Never shared publicly

### **Your Secrets:**
- ✅ Service role key: Only in `.env.local` (local)
- ✅ Private keys: Only in `.env.local` (local)
- ✅ API keys: Only in `.env.local` (local)
- ✅ All stay on your computer

---

## 💡 Summary

**You're doing it right by being cautious!**

1. **Service Role Key**: Add to `.env.local` locally (don't share)
2. **CDP**: Get API keys, add to `.env.local` locally (don't share)
3. **Server Wallet**: Create locally, add to `.env.local` (don't share private key)
4. **Migrations**: Run SQL in your Supabase dashboard (no secrets shared)

**Everything happens locally on your machine - no public sharing needed!**

Let me know if you have more questions about security! 🔐


