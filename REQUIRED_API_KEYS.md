# 🔑 Required API Keys & Connections

## ✅ Already Have

1. **Pinata IPFS**
   - Key: `ranchLink by Ritxma:768fb0934fcd6f8e44ea`
   - Status: ✅ Ready to use
   - Use: IPFS storage for metadata

2. **Crypto Addresses**
   - Bitcoin: `bc1q5n769dgm6dza7z4ytkt8euldywdnequsa40ue4`
   - Ethereum: `0x223C5FEAA2523E0c3B13e0C43F662653B9726cb6`
   - Base: `0x223C5FEAA2523E0c3B13e0C43F662653B9726cb6` (same as Ethereum)
   - Solana: `65T2bjQaHD9yzqRN4uPg6Wrk3kz3NDUr17ofbSwtbLAz`

## 🔑 Still Need (In Priority Order)

### **1. Alchemy RPC (Base L2) - CRITICAL ⚠️**
**What**: Connect to Base blockchain  
**Where**: https://www.alchemy.com  
**Cost**: Free tier (300M compute units/month)  
**Steps**:
1. Sign up at Alchemy
2. Create new app
3. Select "Base" network
4. Copy RPC URL
5. Add to `.env.local` as `ALCHEMY_BASE_RPC`

**Why Critical**: Without this, can't connect to blockchain

---

### **2. Supabase (Database) - CRITICAL ⚠️**
**What**: Postgres database, auth, storage  
**Where**: https://supabase.com  
**Cost**: Free tier (500MB database, 1GB storage)  
**Steps**:
1. Sign up at Supabase
2. Create new project
3. Wait for setup (2-3 minutes)
4. Go to Settings → API
5. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_KEY` (keep secret!)
6. Run migrations (from `infra/db/migrations/001_initial_schema.sql`)

**Why Critical**: Stores all app data (tags, animals, users)

---

### **3. Coinbase Developer Platform (CDP) - CRITICAL ⚠️**
**What**: Smart wallet integration, gas sponsorship  
**Where**: https://portal.cdp.coinbase.com  
**Cost**: Free  
**Steps**:
1. Sign up at CDP portal
2. Create new app
3. Copy:
   - API Key → `CDP_API_KEY`
   - App ID → `CDP_APP_ID`
4. Create server wallet (separate from Ledger!)
   - Use MetaMask or similar
   - Export private key securely
   - Add to `.env.local` as `CDP_SERVER_WALLET_PRIVATE_KEY`

**Why Critical**: Enables gasless transactions for users

---

### **4. Server Wallet - CRITICAL ⚠️**
**What**: Hot wallet for server operations (gas sponsorship)  
**Where**: Create new wallet (MetaMask, etc.)  
**Cost**: Free (just create wallet)  
**Steps**:
1. Install MetaMask (or use another wallet)
2. Create NEW wallet (NOT your Ledger!)
3. Export private key securely
4. Fund with small amount (0.1-0.5 ETH on Base)
5. Add to `.env.local` as `SERVER_WALLET_ADDRESS` and `SERVER_WALLET_PRIVATE_KEY`

**Why Critical**: Needed for gas sponsorship and server operations

**⚠️ IMPORTANT**: 
- This is SEPARATE from your Ledger wallet
- Use ONLY for server operations
- Keep private key secure (never commit to Git)
- Fund with small amount only

---

### **5. Stripe (Optional - For Fiat Payments)**
**What**: Credit card → Crypto conversion  
**Where**: https://stripe.com  
**Cost**: 2.9% + $0.30 per transaction  
**Steps**:
1. Sign up at Stripe
2. Complete verification
3. Get API keys from Dashboard
4. Copy:
   - Secret key → `STRIPE_SECRET_KEY`
   - Publishable key → `STRIPE_PUBLISHABLE_KEY`

**Why Optional**: Only needed if you want to accept credit cards

---

### **6. Coinbase Commerce (Optional - Alternative to Stripe)**
**What**: Direct crypto payments  
**Where**: https://commerce.coinbase.com  
**Cost**: 1% fee  
**Steps**:
1. Sign up at Coinbase Commerce
2. Create API key
3. Copy key → `COINBASE_COMMERCE_API_KEY`

**Why Optional**: Alternative to Stripe, native crypto payments

---

### **7. Sentry (Recommended - Monitoring)**
**What**: Error tracking, monitoring  
**Where**: https://sentry.io  
**Cost**: Free tier (5K events/month)  
**Steps**:
1. Sign up at Sentry
2. Create new project
3. Select "Next.js"
4. Copy DSN → `SENTRY_DSN`

**Why Recommended**: Helps catch errors in production

---

### **8. Basescan API (Recommended - Contract Verification)**
**What**: Verify contracts on block explorer  
**Where**: https://basescan.org  
**Cost**: Free  
**Steps**:
1. Sign up at Basescan
2. Go to API section
3. Create API key
4. Copy key → `BASESCAN_API_KEY`

**Why Recommended**: Verify contracts after deployment

---

## 📋 Quick Checklist

### **Critical (Need Now):**
- [ ] Alchemy RPC (Base L2)
- [ ] Supabase (Database)
- [ ] Coinbase CDP (Wallet)
- [ ] Server Wallet (Create new)

### **Optional (Can Add Later):**
- [ ] Stripe (Fiat payments)
- [ ] Coinbase Commerce (Alternative payments)
- [ ] Sentry (Monitoring)
- [ ] Basescan API (Contract verification)

## 🔐 Security Reminders

⚠️ **NEVER commit these to Git:**
- Private keys
- API keys (use `.env.local`, add to `.gitignore`)
- Server wallet private key
- Supabase service key

✅ **ALWAYS:**
- Use `.env.local` for secrets
- Keep `.env.local` in `.gitignore`
- Rotate keys periodically
- Use separate wallets (Ledger for treasury, server wallet for operations)

## 🚀 Next Steps

1. **Get API Keys** (Start with Alchemy, Supabase, CDP)
2. **Create Server Wallet** (Separate from Ledger)
3. **Set Up Environment** (Create `.env.local`, add keys)
4. **Test Locally** (Run dev server, test connections)
5. **Deploy to Testnet** (Base Sepolia)
6. **Test End-to-End** (Claim tag, mint NFT, etc.)
7. **Deploy to Mainnet** (Base L2)

## 💡 Tips

- **Start Small**: Get critical keys first (Alchemy, Supabase, CDP)
- **Test on Testnet**: Always test before mainnet
- **Keep Secrets Secret**: Never share private keys
- **Backup Everything**: Save keys securely (password manager)

Ready to get started? Let me know which keys you want to get first! 🚀


