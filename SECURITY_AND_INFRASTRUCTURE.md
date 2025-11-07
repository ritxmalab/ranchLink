# 🔐 Security & Infrastructure Setup Guide

## 🎯 Security Requirements

### 1. Smart Contract Security

#### Owner Safety:
- ✅ Multi-signature wallet for contract ownership
- ✅ Timelock for critical operations (24-48 hours)
- ✅ Pausable functionality (emergency stops)
- ✅ Role-based access control (RBAC)
- ✅ Treasury withdrawal limits

#### Interactor (AI/Server) Safety:
- ✅ Server-side wallet (hot wallet) with spending limits
- ✅ Rate limiting on API calls
- ✅ Automatic transaction batching
- ✅ Gas price limits
- ✅ Maximum transaction amount limits
- ✅ Daily spending caps

#### User Safety:
- ✅ One-time tag activation (prevents duplicate claims)
- ✅ PIN protection for public viewing
- ✅ Encrypted sensitive data
- ✅ Non-custodial wallets (users control keys)
- ✅ Clear transaction previews
- ✅ Gasless transactions (sponsored by server wallet)

### 2. Tamper-Proof Features

- ✅ Immutable NFT metadata (IPFS hashes)
- ✅ Event logs on-chain (permanent record)
- ✅ Transfer history on-chain
- ✅ Anchor data hashes (Registry contract)
- ✅ Timestamp verification
- ✅ Chain of custody tracking

### 3. Flexibility Features

- ✅ Upgradeable contracts (via proxy pattern - with timelock)
- ✅ Configurable parameters (prices, fees, limits)
- ✅ Multi-chain support (Base, Optimism, Ethereum)
- ✅ Bridge integration ready
- ✅ EAS (Ethereum Attestation Service) integration
- ✅ Custom metadata support

## 🔑 Required API Keys & Services

### 1. **Blockchain Infrastructure**

#### Alchemy (RPC Provider)
```bash
# Get from: https://www.alchemy.com
ALCHEMY_BASE_RPC=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
ALCHEMY_ETH_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
ALCHEMY_OPTIMISM_RPC=https://opt-mainnet.g.alchemy.com/v2/YOUR_KEY
```
**Why:** Reliable RPC, better rate limits, WebSocket support

#### Infura (Backup RPC)
```bash
# Get from: https://infura.io
INFURA_BASE_RPC=https://base-mainnet.infura.io/v3/YOUR_KEY
INFURA_ETH_RPC=https://mainnet.infura.io/v3/YOUR_KEY
```
**Why:** Backup provider, redundancy

### 2. **Wallet Infrastructure**

#### Coinbase Developer Platform (CDP)
```bash
# Get from: https://portal.cdp.coinbase.com
CDP_API_KEY=your-cdp-api-key
CDP_APP_ID=your-app-id
CDP_SERVER_WALLET_PRIVATE_KEY=0x... (hot wallet for gas sponsorship)
```
**Why:** Smart wallet integration, gas sponsorship, seamless UX

#### Server Wallet Setup
```bash
# Create a separate hot wallet for server operations
# DO NOT use your Ledger private key!
# Use a dedicated server wallet with limited funds
SERVER_WALLET_ADDRESS=0x... (different from Ledger)
SERVER_WALLET_PRIVATE_KEY=0x... (keep in secure env, never commit)
SERVER_WALLET_DAILY_LIMIT=0.1 ETH (adjust based on needs)
```

### 3. **IPFS Storage**

#### Web3.Storage (Primary)
```bash
# Get from: https://web3.storage
WEB3STORAGE_TOKEN=your-web3storage-token
```
**Why:** Free tier, reliable, decentralized

#### Pinata (Backup)
```bash
# Get from: https://pinata.cloud
PINATA_API_KEY=your-pinata-key
PINATA_SECRET_KEY=your-pinata-secret
PINATA_JWT=your-pinata-jwt
```
**Why:** Backup storage, faster pinning, commercial support

### 4. **Database (Supabase)**

```bash
# Get from: https://supabase.com
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci... (server-side only!)
```
**Why:** Postgres database, auth, storage, real-time

### 5. **Payment Processing**

#### Stripe (Fiat → Crypto Bridge)
```bash
# Get from: https://stripe.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```
**Why:** Accept credit cards, convert to crypto automatically

#### Coinbase Commerce (Crypto Payments)
```bash
# Get from: https://commerce.coinbase.com
COINBASE_COMMERCE_API_KEY=your-commerce-key
COINBASE_COMMERCE_WEBHOOK_SECRET=your-webhook-secret
```
**Why:** Native crypto payments, automatic confirmations

### 6. **Security & Monitoring**

#### Sentry (Error Tracking)
```bash
# Get from: https://sentry.io
SENTRY_DSN=https://...@sentry.io/...
```
**Why:** Monitor errors, track issues, performance monitoring

#### Etherscan API (Contract Verification)
```bash
# Get from: https://etherscan.io/apis
ETHERSCAN_API_KEY=your-etherscan-key
BASESCAN_API_KEY=your-basescan-key
```
**Why:** Verify contracts, monitor transactions

### 7. **Additional Services**

#### Twilio (SMS/OTP)
```bash
# Get from: https://twilio.com
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1...
```
**Why:** OTP verification, SMS alerts (optional)

#### Resend (Email)
```bash
# Get from: https://resend.com
RESEND_API_KEY=re_...
```
**Why:** Transactional emails, notifications

## 🏗️ Smart Contract Architecture

### Contracts Needed:

1. **RanchLinkTag.sol** (ERC-721 NFT)
   - Soulbound until transfer
   - Metadata on IPFS
   - Owner-only minting
   - Transfer restrictions (if needed)

2. **Registry.sol** (Data Anchoring)
   - Anchor data hashes
   - Timestamp verification
   - Event logs

3. **PaymentProcessor.sol** (Optional)
   - Handle payments
   - Split revenue
   - Refund logic

4. **AccessControl.sol** (Role Management)
   - Owner, Admin, Operator roles
   - Pausable functions
   - Timelock controller

### Security Features:

```solidity
// Example security patterns
- Multi-sig ownership (Gnosis Safe recommended)
- Timelock for upgrades (24-48 hours)
- Pausable for emergencies
- ReentrancyGuard
- Access control (OpenZeppelin)
- SafeMath (Solidity 0.8+ has built-in)
- Input validation
- Event emission for all state changes
```

## 🔒 Best Practices

### 1. **Private Key Management**
- ✅ Ledger for treasury (cold storage)
- ✅ Server wallet for operations (hot wallet, limited funds)
- ✅ Never commit private keys to Git
- ✅ Use environment variables (.env.local)
- ✅ Rotate keys periodically
- ✅ Use hardware wallet for contract owner

### 2. **Contract Deployment**
- ✅ Test thoroughly on testnet first
- ✅ Get audit before mainnet (recommended firms below)
- ✅ Start with small limits
- ✅ Monitor first transactions closely
- ✅ Keep upgrade keys secure

### 3. **API Security**
- ✅ Rate limiting
- ✅ Authentication (JWT tokens)
- ✅ HTTPS only
- ✅ CORS configuration
- ✅ Input validation
- ✅ SQL injection prevention

### 4. **Monitoring**
- ✅ Transaction monitoring (Tenderly, Alchemy)
- ✅ Error tracking (Sentry)
- ✅ Uptime monitoring
- ✅ Gas price alerts
- ✅ Balance alerts (low funds)

## 📊 Audit Recommendations

### Recommended Audit Firms:
1. **OpenZeppelin** - Top tier, expensive but thorough
2. **Trail of Bits** - Excellent, security-focused
3. **CertiK** - Good, comprehensive
4. **Consensys Diligence** - Professional, thorough
5. **Halborn** - Specialized in DeFi security

### Audit Scope:
- Smart contract code review
- Gas optimization
- Access control verification
- Reentrancy checks
- Front-running protection
- Economic attack vectors
- Upgrade mechanism security

### Cost Estimate:
- Basic audit: $5,000 - $15,000
- Comprehensive audit: $20,000 - $50,000
- Time: 2-6 weeks

## 💰 Payment Integration

### Fiat → Crypto Options:

1. **Stripe + Coinbase Pay**
   - Accept credit cards
   - Automatic conversion to crypto
   - Send to your addresses

2. **MoonPay**
   - Direct crypto purchases
   - Credit card support
   - Mobile-friendly

3. **Wyre / Ramp**
   - Fiat on-ramps
   - Low fees
   - API integration

### Crypto Payment Options:

1. **Native Crypto**
   - Bitcoin, Ethereum, Solana (direct)
   - Use your Ledger addresses

2. **Stablecoins**
   - USDC on Base (recommended - low fees)
   - USDT on Ethereum
   - USDC on Solana

3. **Payment Processors**
   - Coinbase Commerce
   - BTCPay Server (Bitcoin)
   - Stripe Crypto

## 🚀 Deployment Checklist

### Pre-Deployment:
- [ ] All contracts tested on testnet
- [ ] Security audit completed
- [ ] All API keys obtained
- [ ] Server wallet created (separate from Ledger)
- [ ] Multi-sig wallet set up (for contract owner)
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] IPFS storage tested
- [ ] Payment processors configured
- [ ] Monitoring tools set up

### Post-Deployment:
- [ ] Contracts verified on block explorer
- [ ] Test transactions on mainnet (small amounts)
- [ ] Monitor first 24 hours closely
- [ ] Set up alerts
- [ ] Document all addresses
- [ ] Backup all keys securely
- [ ] Set up disaster recovery

## 📝 Recommended Next Steps

1. **Create Server Wallet**
   - Generate new wallet (MetaMask, etc.)
   - Fund with small amount (0.1-0.5 ETH)
   - Use for gas sponsorship only
   - Keep separate from Ledger

2. **Set Up Multi-Sig**
   - Use Gnosis Safe (recommended)
   - Add 2-3 signers
   - Set timelock for critical operations
   - Use as contract owner

3. **Get API Keys**
   - Alchemy (Base RPC)
   - Coinbase CDP
   - Web3.Storage
   - Supabase
   - Stripe (if needed)

4. **Deploy to Testnet First**
   - Base Sepolia
   - Test all functions
   - Verify contracts
   - Test payment flows

5. **Security Audit**
   - Choose audit firm
   - Schedule audit
   - Fix any issues
   - Re-audit if needed

6. **Deploy to Mainnet**
   - Deploy contracts
   - Verify on block explorer
   - Test with small amounts
   - Monitor closely

## 🎯 Quick Start Commands

```bash
# 1. Create server wallet (separate from Ledger)
# Use MetaMask or similar, export private key securely

# 2. Set up environment
cp .env.example .env.local
# Fill in all keys

# 3. Deploy to testnet
cd packages/contracts
npm run deploy:base-sepolia

# 4. Test everything
npm run test

# 5. Get audit
# Contact audit firm

# 6. Deploy to mainnet
npm run deploy:base
```

## 🔐 Security Reminders

⚠️ **NEVER:**
- Commit private keys to Git
- Share private keys
- Use Ledger key for server operations
- Deploy without testing
- Skip security audits (for production)

✅ **ALWAYS:**
- Use hardware wallet for treasury
- Use separate server wallet for operations
- Test on testnet first
- Monitor transactions
- Keep backups secure
- Use multi-sig for ownership

