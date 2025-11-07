# 🚀 Complete Setup Checklist - RanchLink Production Ready

## ✅ Phase 1: Crypto Addresses (DONE)
- [x] Bitcoin address: `bc1q5n769dgm6dza7z4ytkt8euldywdnequsa40ue4`
- [x] Ethereum address: `0x223C5FEAA2523E0c3B13e0C43F662653B9726cb6` (works on Base L2!)
- [x] Solana address: `65T2bjQaHD9yzqRN4uPg6Wrk3kz3NDUr17ofbSwtbLAz`
- [x] Base L2: Same as Ethereum (EVM-compatible)

## 🔐 Phase 2: Security Setup

### 2.1 Create Server Wallet (Hot Wallet)
```bash
# Create a NEW wallet (NOT your Ledger!)
# Use MetaMask, create new account
# Export private key securely
# Fund with 0.1-0.5 ETH (for gas)
# Use ONLY for server operations
```
- [ ] Create server wallet
- [ ] Save private key securely (never commit to Git)
- [ ] Fund with small amount
- [ ] Test on testnet first

### 2.2 Set Up Multi-Sig (Treasury)
```bash
# Use Gnosis Safe: https://gnosis-safe.io
# Add 2-3 signers (your Ledger + backup)
# Set timelock: 24-48 hours for critical ops
# Use as contract owner/admin
```
- [ ] Create Gnosis Safe
- [ ] Add signers
- [ ] Configure timelock
- [ ] Test with small transactions

### 2.3 Smart Contract Security
- [ ] Deploy to Base Sepolia (testnet)
- [ ] Test all functions
- [ ] Verify contracts
- [ ] Set up monitoring
- [ ] Get security audit (recommended)
- [ ] Deploy to Base Mainnet

## 🔑 Phase 3: API Keys & Services

### 3.1 Blockchain Infrastructure
- [ ] **Alchemy** - Get Base RPC URL
  - Sign up: https://alchemy.com
  - Create Base app
  - Copy RPC URL
  - Cost: Free tier available

- [ ] **Infura** (Backup) - Get RPC URLs
  - Sign up: https://infura.io
  - Create projects (Base, Ethereum)
  - Cost: Free tier available

### 3.2 Wallet Infrastructure
- [ ] **Coinbase Developer Platform (CDP)**
  - Sign up: https://portal.cdp.coinbase.com
  - Create app
  - Get API key + App ID
  - Cost: Free

- [ ] **Server Wallet Setup**
  - Create hot wallet (separate from Ledger)
  - Set daily spending limits
  - Configure gas sponsorship

### 3.3 IPFS Storage
- [ ] **Web3.Storage** (Primary)
  - Sign up: https://web3.storage
  - Create API token
  - Cost: Free tier (5GB)

- [ ] **Pinata** (Backup)
  - Sign up: https://pinata.cloud
  - Get API keys
  - Cost: Free tier (1GB)

### 3.4 Database
- [ ] **Supabase**
  - Sign up: https://supabase.com
  - Create project
  - Run migrations
  - Get URL + keys
  - Cost: Free tier available

### 3.5 Payment Processing
- [ ] **Stripe** (Fiat → Crypto)
  - Sign up: https://stripe.com
  - Get API keys
  - Configure webhooks
  - Cost: 2.9% + $0.30 per transaction

- [ ] **Coinbase Commerce** (Crypto Payments)
  - Sign up: https://commerce.coinbase.com
  - Get API key
  - Configure webhooks
  - Cost: 1% fee

### 3.6 Security & Monitoring
- [ ] **Sentry** (Error Tracking)
  - Sign up: https://sentry.io
  - Create project
  - Get DSN
  - Cost: Free tier available

- [ ] **Basescan API** (Contract Verification)
  - Sign up: https://basescan.org
  - Get API key
  - Cost: Free

### 3.7 Optional Services
- [ ] **Twilio** (SMS/OTP) - Optional
- [ ] **Resend** (Email) - Optional

## 📝 Phase 4: Environment Configuration

Create `apps/web/.env.local`:

```bash
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...

# Blockchain (Base L2 - Primary)
ALCHEMY_BASE_RPC=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_BASE_CHAIN_ID=8453

# Blockchain (Ethereum - Backup)
ALCHEMY_ETH_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# Blockchain (Optimism - Optional)
ALCHEMY_OPTIMISM_RPC=https://opt-mainnet.g.alchemy.com/v2/YOUR_KEY

# IPFS Storage
WEB3STORAGE_TOKEN=your-web3storage-token
PINATA_API_KEY=your-pinata-key (optional backup)

# Coinbase Smart Wallet (CDP)
CDP_API_KEY=your-cdp-api-key
CDP_APP_ID=your-app-id
CDP_SERVER_WALLET=0x... (server wallet address, NOT Ledger!)

# Server Wallet (Hot Wallet - for gas sponsorship)
SERVER_WALLET_ADDRESS=0x... (different from Ledger)
SERVER_WALLET_PRIVATE_KEY=0x... (keep secure, never commit!)
SERVER_WALLET_DAILY_LIMIT=0.1

# Contract Addresses (after deployment)
NEXT_PUBLIC_CONTRACT_TAG=0x... (Base L2)
NEXT_PUBLIC_CONTRACT_REGISTRY=0x... (Base L2)

# Treasury Addresses (Ledger - for payments)
NEXT_PUBLIC_TREASURY_BTC=bc1q5n769dgm6dza7z4ytkt8euldywdnequsa40ue4
NEXT_PUBLIC_TREASURY_ETH=0x223C5FEAA2523E0c3B13e0C43F662653B9726cb6
NEXT_PUBLIC_TREASURY_BASE=0x223C5FEAA2523E0c3B13e0C43F662653B9726cb6
NEXT_PUBLIC_TREASURY_SOL=65T2bjQaHD9yzqRN4uPg6Wrk3kz3NDUr17ofbSwtbLAz

# Payment Processing
STRIPE_SECRET_KEY=sk_live_... (if using Stripe)
STRIPE_PUBLISHABLE_KEY=pk_live_...
COINBASE_COMMERCE_API_KEY=your-commerce-key (if using)

# Security & Monitoring
SENTRY_DSN=https://...@sentry.io/...
BASESCAN_API_KEY=your-basescan-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://ritxma.com/ranchlink
NEXT_PUBLIC_BASE_PATH=/ranchlink

# Admin (optional)
ADMIN_KEY=your-secure-admin-key
```

## 🏗️ Phase 5: Smart Contract Deployment

### 5.1 Testnet Deployment
```bash
cd packages/contracts
npm install

# Set environment
export ALCHEMY_BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
export PRIVATE_KEY=your-testnet-key
export SERVER_WALLET_ADDRESS=0x... (testnet server wallet)

# Deploy
npm run deploy:base-sepolia

# Test
npm run test

# Verify contracts
npx hardhat verify --network baseSepolia DEPLOYED_ADDRESS
```

### 5.2 Security Audit
- [ ] Choose audit firm (OpenZeppelin, Trail of Bits, etc.)
- [ ] Schedule audit (2-6 weeks)
- [ ] Review findings
- [ ] Fix issues
- [ ] Re-audit if needed

### 5.3 Mainnet Deployment
```bash
# Set environment
export ALCHEMY_BASE_RPC=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
export PRIVATE_KEY=your-mainnet-key (multi-sig or secure key)
export SERVER_WALLET_ADDRESS=0x... (mainnet server wallet)

# Deploy
npm run deploy:base

# Verify contracts
npx hardhat verify --network base DEPLOYED_ADDRESS

# Set up monitoring
# - Add to Tenderly
# - Set up Alchemy notifications
# - Configure Sentry alerts
```

## 🔒 Phase 6: Security Hardening

### 6.1 Access Control
- [ ] Grant MINTER_ROLE to server wallet
- [ ] Grant ANCHORER_ROLE to server wallet
- [ ] Transfer DEFAULT_ADMIN_ROLE to multi-sig
- [ ] Remove deployer from admin (if not multi-sig)

### 6.2 Rate Limiting
- [ ] Set max mint per transaction
- [ ] Configure daily spending limits
- [ ] Set up API rate limiting
- [ ] Monitor for abuse

### 6.3 Monitoring
- [ ] Set up transaction monitoring (Tenderly)
- [ ] Configure error tracking (Sentry)
- [ ] Set up gas price alerts
- [ ] Configure balance alerts
- [ ] Set up uptime monitoring

## 💰 Phase 7: Payment Integration

### 7.1 Crypto Payments
- [ ] Integrate Bitcoin payments
- [ ] Integrate Ethereum payments
- [ ] Integrate Base (USDC) payments
- [ ] Integrate Solana payments
- [ ] Test payment flows

### 7.2 Fiat Payments (Optional)
- [ ] Set up Stripe
- [ ] Configure Coinbase Commerce
- [ ] Test credit card → crypto conversion
- [ ] Set up webhooks

## 🚀 Phase 8: Deployment

### 8.1 Database Setup
```bash
# In Supabase dashboard:
# 1. Go to SQL Editor
# 2. Run: infra/db/migrations/001_initial_schema.sql
# 3. Verify tables created
```

### 8.2 Frontend Deployment
```bash
# Build
cd apps/web
npm run build

# Deploy to Vercel (recommended)
# Or deploy to Hostinger VPS
```

### 8.3 Post-Deployment
- [ ] Verify contracts on block explorer
- [ ] Test claim flow end-to-end
- [ ] Test payment flows
- [ ] Monitor first 24 hours
- [ ] Set up backups
- [ ] Document everything

## 📊 Phase 9: Ongoing Operations

### 9.1 Daily Checks
- [ ] Monitor transaction volume
- [ ] Check server wallet balance
- [ ] Review error logs
- [ ] Check gas prices

### 9.2 Weekly Checks
- [ ] Review security alerts
- [ ] Check contract balances
- [ ] Review user feedback
- [ ] Update documentation

### 9.3 Monthly Checks
- [ ] Security audit review
- [ ] Performance optimization
- [ ] Cost analysis
- [ ] Feature updates

## 🎯 Priority Order

### Must Have (Launch):
1. ✅ Crypto addresses (DONE)
2. 🔄 Server wallet creation
3. 🔄 Alchemy RPC (Base)
4. 🔄 Supabase database
5. 🔄 Web3.Storage IPFS
6. 🔄 Contract deployment (testnet)
7. 🔄 Coinbase CDP setup

### Should Have (Soon):
8. 🔄 Multi-sig setup
9. 🔄 Payment integration
10. 🔄 Monitoring setup
11. 🔄 Security audit

### Nice to Have (Later):
12. 🔄 Fiat payment integration
13. 🔄 Advanced analytics
14. 🔄 Mobile app

## 💡 Recommendations

### For Maximum Security:
1. **Use Multi-Sig** for contract owner (Gnosis Safe)
2. **Use Timelock** for critical operations (24-48 hours)
3. **Separate Wallets**: Ledger (treasury), Server (operations)
4. **Get Audit** before mainnet (recommended)
5. **Monitor Everything**: Transactions, errors, balances

### For Cost Efficiency:
1. **Use Base L2** for NFT minting (low fees)
2. **Batch Transactions** when possible
3. **Use USDC on Base** for payments (stable, low fees)
4. **Optimize Gas** usage in contracts

### For User Experience:
1. **Gasless Transactions** (sponsored by server wallet)
2. **Instant Confirmations** (Base L2 is fast)
3. **Simple Wallet Setup** (Coinbase Smart Wallet)
4. **Clear Instructions** (QR codes, guides)

## 🆘 Support & Resources

### Documentation:
- Base L2 Docs: https://docs.base.org
- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts
- Coinbase CDP: https://docs.cdp.coinbase.com
- Supabase: https://supabase.com/docs

### Security Resources:
- OpenZeppelin Security: https://security.openzeppelin.com
- Consensys Best Practices: https://consensys.github.io/smart-contract-best-practices

### Community:
- Base Discord: https://discord.gg/base
- Ethereum Stack Exchange: https://ethereum.stackexchange.com

## ✅ Ready When You Are!

Once you have:
1. Server wallet created
2. API keys obtained
3. Contracts deployed (testnet)
4. Database set up

We can test everything end-to-end and deploy to mainnet!

Let me know which phase you want to tackle first! 🚀

