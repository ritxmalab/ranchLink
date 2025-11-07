# 🔑 API Keys Status

## ✅ Configured

### **1. Supabase (Database)**
- ✅ **URL**: `https://utovzxpmfnzihurotqnv.supabase.co`
- ✅ **Anon Key**: Configured in `.env.local`
- ⚠️ **Service Role Key**: Need to get from dashboard
  - Get it from: https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv/settings/api
  - Add to `.env.local` as `SUPABASE_SERVICE_KEY`

### **2. Pinata IPFS**
- ✅ **API Key**: `ranchLink by Ritxma:768fb0934fcd6f8e44ea`
- ✅ Configured in `.env.local`
- ⚠️ **Note**: Verify this is the full key in Pinata dashboard

### **3. Crypto Addresses**
- ✅ **Bitcoin**: `bc1q5n769dgm6dza7z4ytkt8euldywdnequsa40ue4`
- ✅ **Ethereum**: `0x223C5FEAA2523E0c3B13e0C43F662653B9726cb6`
- ✅ **Base**: `0x223C5FEAA2523E0c3B13e0C43F662653B9726cb6` (same as Ethereum)
- ✅ **Solana**: `65T2bjQaHD9yzqRN4uPg6Wrk3kz3NDUr17ofbSwtbLAz`

## ⏳ Still Needed

### **1. Alchemy RPC (Base L2) - CRITICAL ⚠️**
**What**: Connect to Base blockchain  
**Where**: https://www.alchemy.com  
**Steps**:
1. Sign up at Alchemy
2. Create new app
3. Select "Base" network
4. Copy RPC URL
5. Add to `.env.local` as `ALCHEMY_BASE_RPC`

### **2. Coinbase Developer Platform (CDP) - CRITICAL ⚠️**
**What**: Smart wallet integration, gas sponsorship  
**Where**: https://portal.cdp.coinbase.com  
**Steps**:
1. Sign up at CDP portal
2. Create new app
3. Copy API Key → `CDP_API_KEY`
4. Copy App ID → `CDP_APP_ID`

### **3. Server Wallet - CRITICAL ⚠️**
**What**: Hot wallet for server operations  
**Where**: Create new wallet (MetaMask, etc.)  
**Steps**:
1. Install MetaMask (or use another wallet)
2. Create NEW wallet (NOT your Ledger!)
3. Export private key securely
4. Fund with small amount (0.1-0.5 ETH on Base)
5. Add to `.env.local`:
   - `SERVER_WALLET_ADDRESS`
   - `SERVER_WALLET_PRIVATE_KEY`

## 📊 Progress

- ✅ Supabase: 90% (need service role key)
- ✅ Pinata: 100%
- ✅ Crypto Addresses: 100%
- ⏳ Alchemy: 0%
- ⏳ Coinbase CDP: 0%
- ⏳ Server Wallet: 0%

**Overall: ~40% Complete**

## 🚀 Next Steps

1. **Get Supabase Service Role Key**
   - Go to: https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv/settings/api
   - Copy "service_role" key
   - Add to `.env.local`

2. **Run Database Migrations**
   - Use Supabase SQL Editor or CLI
   - See `SUPABASE_SETUP.md` for instructions

3. **Get Alchemy RPC**
   - Sign up at Alchemy
   - Create Base app
   - Copy RPC URL

4. **Get Coinbase CDP**
   - Sign up at CDP portal
   - Create app
   - Get API key and App ID

5. **Create Server Wallet**
   - Create new wallet (MetaMask)
   - Export private key
   - Fund with small amount

## 📝 Quick Reference

### **Environment File Location:**
```
apps/web/.env.local
```

### **Test Supabase Connection:**
```bash
cd apps/web
npm run dev
# Then visit: http://localhost:3000/api/test-supabase
```

### **Verify Configuration:**
```bash
# Check what's configured
cat apps/web/.env.local | grep -E "(SUPABASE|PINATA|TREASURY)"
```

