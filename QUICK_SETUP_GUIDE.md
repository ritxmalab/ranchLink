# 🚀 Quick Setup Guide - RanchLink

## ✅ What's Done

1. ✅ **Supabase** - Configured in `.env.local`
   - URL: `https://utovzxpmfnzihurotqnv.supabase.co`
   - Anon Key: ✅ Set
   - Service Role Key: ⚠️ Need to get

2. ✅ **Pinata IPFS** - Configured
   - API Key: `ranchLink by Ritxma:768fb0934fcd6f8e44ea`

3. ✅ **Crypto Addresses** - All set
   - Bitcoin, Ethereum, Base, Solana

## 📋 Immediate Next Steps

### **1. Get Supabase Service Role Key (5 minutes)**

1. Go to: https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv/settings/api
2. Find **"service_role"** key (under "Project API keys")
3. Copy the key
4. Open `apps/web/.env.local`
5. Find `SUPABASE_SERVICE_KEY=`
6. Paste the key after the `=`

**⚠️ Important**: Keep this key secret! Never expose it.

### **2. Run Database Migrations (10 minutes)**

#### **Option A: Using Supabase SQL Editor (Easiest)**

1. Go to: https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv/sql/new
2. Open file: `infra/db/migrations/001_initial_schema.sql`
3. Copy the entire SQL script
4. Paste into Supabase SQL Editor
5. Click "Run" (or press Cmd/Ctrl + Enter)

#### **Option B: Verify Tables Created**

1. Go to: https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv/editor
2. You should see 12 tables:
   - `owners`, `animals`, `events`, `anchors`, `transfers`
   - `batches`, `devices`, `qa_tests`, `custody_log`
   - `contracts`, `wallets`, `rwa_iot`

### **3. Test Supabase Connection (2 minutes)**

```bash
cd apps/web
npm run dev
```

Then visit: http://localhost:3000/api/test-supabase

You should see:
```json
{
  "success": true,
  "connected": true,
  "message": "Supabase connected successfully!"
}
```

## 🔑 Still Need (In Priority Order)

### **1. Alchemy RPC (Base L2) - CRITICAL**
**Why**: Need to connect to blockchain  
**Where**: https://www.alchemy.com  
**Time**: 5 minutes  
**Steps**:
1. Sign up (free)
2. Create app → Select "Base"
3. Copy RPC URL
4. Add to `.env.local` as `ALCHEMY_BASE_RPC`

### **2. Coinbase CDP (Wallet) - CRITICAL**
**Why**: Smart wallet, gas sponsorship  
**Where**: https://portal.cdp.coinbase.com  
**Time**: 10 minutes  
**Steps**:
1. Sign up (free)
2. Create app
3. Copy API Key → `CDP_API_KEY`
4. Copy App ID → `CDP_APP_ID`

### **3. Server Wallet - CRITICAL**
**Why**: Server operations, gas sponsorship  
**Time**: 5 minutes  
**Steps**:
1. Install MetaMask (or use another wallet)
2. Create NEW wallet (NOT your Ledger!)
3. Export private key
4. Fund with 0.1-0.5 ETH on Base
5. Add to `.env.local`:
   - `SERVER_WALLET_ADDRESS`
   - `SERVER_WALLET_PRIVATE_KEY`

## 📊 Progress Checklist

### **Completed (40%)**
- [x] Supabase URL & Anon Key
- [x] Pinata IPFS Key
- [x] Crypto Addresses
- [x] Database Schema
- [x] Environment Setup

### **In Progress (10%)**
- [ ] Supabase Service Role Key
- [ ] Database Migrations

### **Pending (50%)**
- [ ] Alchemy RPC
- [ ] Coinbase CDP
- [ ] Server Wallet
- [ ] Deploy Contracts
- [ ] Test End-to-End

## 🚀 Quick Commands

```bash
# Check environment variables
cat apps/web/.env.local | grep SUPABASE

# Test Supabase connection
cd apps/web && npm run dev
# Visit: http://localhost:3000/api/test-supabase

# Run setup script
./scripts/setup-supabase.sh
```

## 📝 Files Created

- ✅ `apps/web/.env.local` - Environment variables
- ✅ `SUPABASE_SETUP.md` - Detailed setup guide
- ✅ `API_KEYS_STATUS.md` - Status tracker
- ✅ `apps/web/app/api/test-supabase/route.ts` - Test endpoint

## 💡 Tips

1. **Service Role Key**: Get it from Supabase dashboard
2. **Migrations**: Use SQL Editor (easiest way)
3. **Test First**: Always test connection before proceeding
4. **Keep Secrets**: Never commit `.env.local` to Git

## 🆘 Troubleshooting

### **"Missing SUPABASE_SERVICE_KEY"**
- Get service role key from Supabase dashboard
- Add to `.env.local`

### **"Table doesn't exist"**
- Run database migrations
- Use SQL Editor or CLI

### **Connection errors**
- Check `.env.local` has correct values
- Verify Supabase project is active
- Check network/firewall

## 🎯 Next After Supabase

Once Supabase is fully set up:

1. ✅ Database ready
2. ✅ Can store app data
3. ⏳ Next: Get Alchemy RPC (blockchain)
4. ⏳ Then: Get Coinbase CDP (wallet)
5. ⏳ Then: Create server wallet
6. ⏳ Then: Deploy contracts
7. ⏳ Then: Test end-to-end

**You're doing great!** 🚀

Let me know when you have the service role key and migrations run!

