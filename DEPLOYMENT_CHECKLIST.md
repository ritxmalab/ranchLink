# 🚀 Deployment Checklist - What You Need

## ✅ What's Ready
- ✅ Frontend UI (all pages)
- ✅ Database schema (Supabase)
- ✅ Smart contracts (Base L2)
- ✅ QR code generator
- ✅ API routes structure

## 🔧 What You Need to Provide

### 1. **Supabase Setup** (Database)
```bash
# Get these from: https://supabase.com/dashboard
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...
```

**Steps:**
1. Create Supabase project
2. Run migrations: `infra/db/migrations/001_initial_schema.sql`
3. Copy keys to `.env.local`

### 2. **Base L2 Blockchain** (Contracts)
```bash
# Get from: https://alchemy.com (Base mainnet RPC)
ALCHEMY_BASE_RPC=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=0x... (for deploying contracts)
```

**Steps:**
1. Deploy contracts to Base Sepolia (testnet first):
   ```bash
   cd packages/contracts
   npm install
   npm run deploy:base-sepolia
   ```
2. Copy contract addresses to `.env.local`:
   ```bash
   NEXT_PUBLIC_CONTRACT_TAG=0x...
   NEXT_PUBLIC_CONTRACT_REGISTRY=0x...
   ```
3. Deploy to Base mainnet when ready

### 3. **Coinbase Smart Wallet (CDP)**
```bash
# Get from: https://portal.cdp.coinbase.com
CDP_API_KEY=your-cdp-api-key
CDP_APP_ID=your-app-id
CDP_SERVER_WALLET=0x... (server wallet address)
```

**Steps:**
1. Sign up at Coinbase Developer Portal
2. Create app
3. Get API key and app ID
4. Create server wallet (hot wallet for gas sponsorship)

### 4. **IPFS Storage**
```bash
# Get from: https://web3.storage (free tier)
WEB3STORAGE_TOKEN=your-web3storage-token
```

**Steps:**
1. Sign up at web3.storage
2. Create API token
3. Add to `.env.local`

### 5. **Hostinger Deployment**

**Option A: VPS (Recommended)**
```bash
# VPS credentials
VPS_HOST=your-vps-ip
VPS_USER=root
VPS_PATH=/var/www/ranchlink
```

**Steps:**
1. Build: `cd apps/web && npm run build`
2. Deploy: `./scripts/deploy-hostinger.sh`
3. Configure Nginx (reverse proxy)
4. Set up SSL (Let's Encrypt)

**Option B: Direct Upload**
1. Build standalone: `NEXT_OUTPUT=standalone npm run build`
2. Upload `.next/standalone` folder to Hostinger
3. Install dependencies on server
4. Run with PM2

## 📋 Complete Environment Variables

Create `apps/web/.env.local`:

```bash
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...

# Blockchain (Base L2)
ALCHEMY_BASE_RPC=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=0x... (for contract deployment only - keep secret!)
NEXT_PUBLIC_CONTRACT_TAG=0x...
NEXT_PUBLIC_CONTRACT_REGISTRY=0x...
NEXT_PUBLIC_CHAIN_ID=8453

# Coinbase Smart Wallet (CDP)
CDP_API_KEY=your-cdp-api-key
CDP_APP_ID=your-app-id
CDP_SERVER_WALLET=0x...

# IPFS Storage
WEB3STORAGE_TOKEN=your-web3storage-token

# App Configuration
NEXT_PUBLIC_APP_URL=https://ritxma.com/ranchlink
NEXT_PUBLIC_BASE_PATH=/ranchlink

# Admin (optional)
ADMIN_KEY=your-secure-admin-key
```

## 🎯 Pre-Deployment Checklist

### Before Deploying:

- [ ] Supabase project created
- [ ] Database migrations run
- [ ] Contracts deployed to Base Sepolia (testnet)
- [ ] Contracts tested on testnet
- [ ] Coinbase CDP app created
- [ ] Web3.Storage account created
- [ ] All environment variables set
- [ ] QR codes generated for 57 tags
- [ ] Tested claim flow locally
- [ ] Tested animal card page
- [ ] Tested dashboard

### For Production:

- [ ] Contracts deployed to Base mainnet
- [ ] Production Supabase database
- [ ] Production CDP app
- [ ] SSL certificate configured
- [ ] Custom domain (app.ritxma.com or ritxma.com/ranchlink)
- [ ] Monitoring set up (optional)
- [ ] Backup strategy

## 🚀 Deployment Steps

### 1. Set Up Services (30 min)
```bash
# Create accounts:
# - Supabase (database)
# - Alchemy (Base RPC)
# - Coinbase CDP (wallet)
# - Web3.Storage (IPFS)
```

### 2. Deploy Contracts (15 min)
```bash
cd packages/contracts
npm install
npm run deploy:base-sepolia  # Testnet first
# Test everything
npm run deploy:base  # Mainnet when ready
```

### 3. Configure Environment (10 min)
```bash
# Copy .env.example to .env.local
# Fill in all keys
```

### 4. Run Migrations (5 min)
```bash
# In Supabase dashboard:
# - Go to SQL Editor
# - Run: infra/db/migrations/001_initial_schema.sql
```

### 5. Deploy to Hostinger (15 min)
```bash
# Build and deploy
./scripts/deploy-hostinger.sh
```

**Total Time: ~75 minutes**

## 🔐 Security Checklist

- [ ] Private keys NOT in code (use .env.local)
- [ ] .env.local in .gitignore
- [ ] Admin key is strong
- [ ] CDP server wallet has spending limits
- [ ] Contracts audited (for production)
- [ ] Rate limiting on API routes
- [ ] CORS configured properly

## 📊 What Works Now (Without Backend)

- ✅ All UI pages render
- ✅ Navigation works
- ✅ QR code generator (generates codes)
- ✅ Forms display
- ⏳ API calls will fail (no backend yet)
- ⏳ Database queries will fail (no Supabase yet)

## 🎯 Minimal Viable Setup

**To get it working end-to-end, you need:**

1. **Supabase** (database) - 5 min setup
2. **Base L2 contracts** (deploy) - 15 min
3. **Web3.Storage** (IPFS) - 2 min setup
4. **Environment variables** - 5 min

**Total: ~30 minutes to get fully working!**

## 📝 Next Steps

1. **Get Supabase keys** (I can help set up)
2. **Deploy contracts** (I can help deploy)
3. **Get CDP keys** (you sign up at Coinbase)
4. **Get Web3.Storage token** (2 min signup)
5. **Fill in .env.local**
6. **Deploy!**

Want me to help you set up any of these? I can guide you step by step!

