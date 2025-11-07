# 🔐 How to Set Up Safely (Step-by-Step)

## ✅ Everything Stays On Your Computer!

**Important**: You NEVER need to share secrets with me or anyone else. Everything is done locally on your machine.

---

## 📋 Step 1: Service Role Key (Supabase)

### **What You're Doing:**
Adding a secret key to a file on YOUR computer.

### **Steps:**
1. Go to your Supabase dashboard (in your browser, privately):
   ```
   https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv/settings/api
   ```

2. Find "service_role" key (it's long, starts with `eyJ...`)

3. Open this file on YOUR computer:
   ```
   apps/web/.env.local
   ```

4. Find this line:
   ```
   SUPABASE_SERVICE_KEY=
   ```

5. Add the key after the `=`:
   ```
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

6. Save the file

**That's it!** The key is now in a file on your computer only. No sharing needed.

---

## 📋 Step 2: Database Migrations

### **What You're Doing:**
Running SQL in YOUR Supabase dashboard to create tables.

### **Steps:**
1. Go to your Supabase dashboard:
   ```
   https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv/sql/new
   ```

2. Open this file on your computer:
   ```
   infra/db/migrations/001_initial_schema.sql
   ```

3. Copy the entire SQL script (Cmd/Ctrl + A, then Cmd/Ctrl + C)

4. Paste into Supabase SQL Editor (in your browser)

5. Click "Run" button (or press Cmd/Ctrl + Enter)

6. Wait a few seconds

7. You should see "Success" message

**That's it!** Tables are created in YOUR database. No secrets shared.

---

## 📋 Step 3: CDP (Coinbase Developer Platform)

### **What It Is:**
A service that lets users interact with blockchain easily (without installing MetaMask).

### **Why You Need It:**
- Makes it easier for farmers to use your app
- Can pay gas fees for users (better experience)
- Provides "smart wallets"

### **Steps:**
1. Sign up at: https://portal.cdp.coinbase.com
   - Use your email
   - Create account (free)

2. Create a new app:
   - Click "Create App"
   - Give it a name (e.g., "RanchLink")
   - Select "Base" network

3. Get your keys:
   - You'll see "API Key" - copy it
   - You'll see "App ID" - copy it

4. Add to `.env.local` on YOUR computer:
   ```
   CDP_API_KEY=your-api-key-here
   CDP_APP_ID=your-app-id-here
   ```

5. Save the file

**That's it!** Keys are on your computer only. No sharing needed.

---

## 📋 Step 4: Server Wallet

### **What It Is:**
A cryptocurrency wallet that your SERVER uses (separate from your Ledger).

### **Why You Need It:**
- Your Ledger = Treasury (receiving payments) - KEEP SAFE
- Server Wallet = Operations (paying gas) - Use for daily operations
- Keeps them separate for security

### **Steps:**
1. Install MetaMask (if you don't have it):
   ```
   https://metamask.io
   ```

2. Create a NEW wallet in MetaMask:
   - Click "Create Account"
   - Give it a name (e.g., "RanchLink Server")
   - Save the seed phrase (keep it secret!)
   - **IMPORTANT**: This is DIFFERENT from your Ledger wallet

3. Get the private key:
   - In MetaMask, click the account name
   - Click "Account details"
   - Click "Export Private Key"
   - Enter password
   - Copy the private key (keep it secret!)

4. Get the address:
   - Copy the wallet address (starts with `0x...`)

5. Add to `.env.local` on YOUR computer:
   ```
   SERVER_WALLET_ADDRESS=0x...
   SERVER_WALLET_PRIVATE_KEY=0x...
   ```

6. Fund the wallet:
   - Send 0.1-0.5 ETH to Base network
   - Use this for gas fees only
   - Keep amount small (for security)

**That's it!** Private key stays on your computer only. **NEVER share it!**

---

## 🔒 Security Checklist

### **✅ You're Safe If:**
- [ ] Secrets are only in `.env.local` (on your computer)
- [ ] `.env.local` is not committed to Git (already protected)
- [ ] You never share secrets in chat/email
- [ ] Server wallet is separate from Ledger wallet
- [ ] Server wallet has small amount (0.1-0.5 ETH)

### **❌ You're NOT Safe If:**
- [ ] You paste secrets in chat/email
- [ ] You commit `.env.local` to Git
- [ ] You use Ledger private key for server operations
- [ ] You share private keys with anyone

---

## 📊 Summary

| Item | Where to Get | Where to Add | Share? |
|------|-------------|--------------|--------|
| Service Role Key | Supabase Dashboard | `.env.local` | ❌ NO |
| Migrations | SQL File | Supabase SQL Editor | ✅ OK (no secrets) |
| CDP API Key | Coinbase CDP | `.env.local` | ❌ NO |
| Server Wallet | Create Locally | `.env.local` | ❌ NO |

**Everything goes in `.env.local` on YOUR computer. Never share it!**

---

## 💡 Quick Reference

### **Files on Your Computer:**
- `apps/web/.env.local` - Contains all secrets (private)
- `.gitignore` - Protects `.env.local` from Git

### **What's Public:**
- Code files (no secrets)
- Documentation (no secrets)
- Everything in Git (no secrets)

### **What's Private:**
- `.env.local` file (your computer only)
- Supabase dashboard (your account)
- Coinbase CDP (your account)
- Your wallets (your computer only)

---

## 🆘 Questions?

**Q: Do I need to share secrets with you?**
A: **NO!** Everything stays on your computer.

**Q: Is it safe to add secrets to `.env.local`?**
A: **YES!** It's not committed to Git, stays on your computer only.

**Q: What if I accidentally share a secret?**
A: Regenerate it immediately! (Most services let you regenerate keys)

**Q: Can I use my Ledger for server operations?**
A: **NO!** Use separate wallet for security. Ledger = Treasury only.

**Q: How do I know `.env.local` is safe?**
A: Check `.gitignore` - it should list `.env.local`. If it does, you're safe!

---

**You're doing great being security-conscious!** 🔐

Let me know if you need help with any step! 🚀

