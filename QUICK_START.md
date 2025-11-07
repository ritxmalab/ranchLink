# RanchLink Quick Start - Cursor Centralized Development

## 🎯 Everything runs through Cursor!

All development, connections, and deployment handled in this monorepo.

## Setup (One Time)

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment template
cp .env.example apps/web/.env.local

# 3. Fill in your keys in apps/web/.env.local
# - Supabase URL & keys
# - Alchemy RPC (Base L2)
# - Web3.Storage token
# - Contract addresses (after deployment)

# 4. Run database migrations
# (Connect to Supabase dashboard and run migrations/infra/db/migrations/001_initial_schema.sql)

# 5. Start development
pnpm dev
```

## Development

```bash
# Start dev server (Next.js)
pnpm dev

# Or use the script
./scripts/dev.sh
```

App runs at: `http://localhost:3000`

## Build

```bash
# Build everything
pnpm build

# Or use the script
./scripts/build.sh
```

## Deploy to Hostinger

```bash
# Set VPS credentials
export VPS_HOST="your-vps-ip"
export VPS_USER="root"
export VPS_PATH="/var/www/ranchlink"

# Deploy
./scripts/deploy-hostinger.sh
```

## Project Structure

```
ranchlink/
├── apps/web/              # Next.js app (main app)
│   ├── app/              # Pages & API routes
│   ├── lib/              # Utilities (Supabase, blockchain, IPFS)
│   └── components/       # React components
├── packages/
│   ├── contracts/        # Smart contracts (Base L2)
│   ├── schemas/          # Zod types, EAS schemas
│   └── ui/               # Design system
├── infra/
│   ├── db/               # Database migrations
│   └── api/              # API utilities
└── scripts/              # Deployment scripts
```

## Key Connections

### Supabase (Database)
- Config: `apps/web/lib/supabase/client.ts`
- Used for: Owners, animals, events, devices, batches
- Already connected to Hostinger

### Blockchain (Base L2)
- Config: `apps/web/lib/blockchain/config.ts`
- Contracts: `packages/contracts/`
- Used for: NFT ownership, anchoring

### IPFS (Storage)
- Config: `apps/web/lib/ipfs/client.ts`
- Used for: Public animal metadata, photos

## API Routes

All API routes in `apps/web/app/api/`:

- `POST /api/claim` - Claim a tag with token
- `GET /api/animals/[id]` - Get animal by public_id
- More routes coming...

## Environment Variables

Required in `apps/web/.env.local`:

```bash
# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# Blockchain (Base L2)
NEXT_PUBLIC_ALCHEMY_BASE_RPC=https://...
NEXT_PUBLIC_CONTRACT_TAG=0x...
NEXT_PUBLIC_CONTRACT_REGISTRY=0x...

# IPFS
WEB3STORAGE_TOKEN=...

# App
NEXT_PUBLIC_APP_URL=https://ritxma.com/ranchlink
NEXT_PUBLIC_BASE_PATH=/ranchlink
```

## What's Built

✅ **Monorepo** - Everything in one place
✅ **Next.js App** - Landing page, routing
✅ **API Routes** - Claim, animals endpoints
✅ **Supabase Client** - Database connection
✅ **Blockchain Config** - Base L2 setup
✅ **IPFS Client** - Storage connection
✅ **Smart Contracts** - ERC-721 tag contract
✅ **57 Tags Generated** - QR codes ready
✅ **Deployment Scripts** - Hostinger VPS ready

## Next Steps

1. **Fill in .env.local** with your keys
2. **Run migrations** in Supabase
3. **Deploy contracts** to Base L2 (testnet first)
4. **Start dev server** and test!
5. **Deploy to Hostinger** when ready

## Troubleshooting

**Supabase connection issues?**
- Check `NEXT_PUBLIC_SUPABASE_URL` and keys
- Verify Supabase project is active

**Blockchain errors?**
- Check Alchemy RPC URL
- Verify contract addresses after deployment

**IPFS upload fails?**
- Check `WEB3STORAGE_TOKEN`
- Falls back gracefully (can retry later)

## All Connected Through Cursor! 🎉

Everything is centralized here - no external tools needed for development.

