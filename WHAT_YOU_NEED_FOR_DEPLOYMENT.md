# 🚀 What You Need for Deployment

## Quick Answer: 4 Things

### 1. **Supabase** (Database) - 5 minutes
- Sign up: https://supabase.com
- Create project
- Copy URL + keys
- Run migrations

### 2. **Base L2 Contracts** (Blockchain) - 15 minutes
- Deploy contracts to Base Sepolia (testnet)
- Get contract addresses
- Set up Alchemy RPC

### 3. **Coinbase CDP** (Wallets) - 10 minutes
- Sign up: https://portal.cdp.coinbase.com
- Create app
- Get API key + app ID
- Create server wallet

### 4. **Web3.Storage** (IPFS) - 2 minutes
- Sign up: https://web3.storage
- Get API token

## 📋 Complete List

### Must Have (for basic functionality):
1. ✅ **Supabase** - Database for animals, owners, devices
2. ✅ **Base L2 RPC** - Alchemy endpoint for blockchain
3. ✅ **Web3.Storage** - IPFS for public records
4. ✅ **Contract addresses** - Deploy RanchLinkTag + Registry

### Nice to Have (for full features):
5. ⚡ **Coinbase CDP** - Smart wallet integration
6. 📊 **Monitoring** - Sentry, analytics (optional)
7. 🔐 **Admin key** - For super admin access

## 🎯 Minimal Setup (30 minutes)

**To get everything working:**

1. **Supabase** (5 min)
   - Create account
   - New project
   - Copy keys
   - Run SQL migrations

2. **Deploy Contracts** (15 min)
   - `cd packages/contracts`
   - `npm install`
   - `npm run deploy:base-sepolia`
   - Copy contract addresses

3. **Alchemy RPC** (2 min)
   - Sign up at alchemy.com
   - Create Base app
   - Copy RPC URL

4. **Web3.Storage** (2 min)
   - Sign up
   - Create token
   - Copy token

5. **Fill .env.local** (5 min)
   - Add all keys
   - Test locally

6. **Deploy** (15 min)
   - Build
   - Upload to Hostinger

## 🔑 API Keys You Need

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...
```

### Base L2
```
ALCHEMY_BASE_RPC=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_CONTRACT_TAG=0x... (after deployment)
NEXT_PUBLIC_CONTRACT_REGISTRY=0x... (after deployment)
```

### Coinbase CDP
```
CDP_API_KEY=your-key
CDP_APP_ID=your-app-id
CDP_SERVER_WALLET=0x...
```

### IPFS
```
WEB3STORAGE_TOKEN=your-token
```

## 📝 Step-by-Step

### Step 1: Supabase (5 min)
1. Go to https://supabase.com
2. Click "New Project"
3. Fill in details
4. Wait for setup
5. Go to Settings → API
6. Copy URL and keys
7. Go to SQL Editor
8. Run `infra/db/migrations/001_initial_schema.sql`

### Step 2: Deploy Contracts (15 min)
1. Get Alchemy RPC: https://alchemy.com
2. Create Base app
3. Copy RPC URL
4. In terminal:
   ```bash
   cd packages/contracts
   npm install
   export ALCHEMY_BASE_SEPOLIA_RPC=https://...
   export PRIVATE_KEY=your-private-key
   npm run deploy:base-sepolia
   ```
5. Copy contract addresses from output

### Step 3: Web3.Storage (2 min)
1. Go to https://web3.storage
2. Sign up
3. Create API token
4. Copy token

### Step 4: Coinbase CDP (10 min)
1. Go to https://portal.cdp.coinbase.com
2. Sign up
3. Create app
4. Get API key + app ID
5. Create server wallet (for gas sponsorship)

### Step 5: Environment Variables
Create `apps/web/.env.local`:
```bash
# Copy all keys from above
```

### Step 6: Test Locally
```bash
cd apps/web
npm run dev
# Test claim flow, animal card, etc.
```

### Step 7: Deploy
```bash
./scripts/deploy-hostinger.sh
```

## ✅ What Works Without Backend

- ✅ All UI pages
- ✅ Navigation
- ✅ QR code generator (generates codes)
- ✅ Forms (UI only)
- ❌ API calls (need Supabase)
- ❌ Database queries (need Supabase)
- ❌ NFT minting (need contracts)

## 🎯 Priority Order

**To get it working:**
1. Supabase (database) - **CRITICAL**
2. Contracts (blockchain) - **CRITICAL**
3. Web3.Storage (IPFS) - **IMPORTANT**
4. Coinbase CDP (wallets) - **CAN ADD LATER**

**To make it production-ready:**
5. Monitoring
6. Analytics
7. Error tracking
8. Rate limiting

## 💡 I Can Help You With:

1. ✅ Setting up Supabase project
2. ✅ Deploying contracts
3. ✅ Configuring environment
4. ✅ Testing locally
5. ✅ Deployment to Hostinger

**Just tell me which one to start with!**

