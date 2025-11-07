# RanchLink 🐄

**Sophisticated livestock management tag system by Ritxma Integrations LLC**

Tag. Scan. Done. — 2-minute setup. Public Animal Card. Owner-only edits. Vet photos & proofs in one place.

## Architecture

Monorepo structure with:
- **apps/web**: Next.js application (public cards, dashboard, marketplace, admin)
- **packages/contracts**: Hardhat smart contracts (Base L2)
- **packages/schemas**: Zod types, EAS schemas, shared DTOs
- **packages/ui**: Design system components
- **infra/db**: Supabase migrations
- **infra/api**: Edge functions / API routes
- **infra/workflows**: CI/CD (GitHub Actions)

## Tech Stack

- **Frontend**: Next.js 14 (app router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Postgres, Auth, Storage)
- **Blockchain**: Base L2, Coinbase Smart Wallet (CDP), EAS
- **Storage**: IPFS (web3.storage), Supabase Storage
- **Contracts**: Hardhat, viem, ethers

## Design Tokens (Texas Theme)

```css
--bg: #F8F3E8
--c1: #2C241F
--c2: #BF5700
--c3: #E7B552
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Fill in your keys

# Run database migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Start development
pnpm dev
```

## Key Features

- ✅ QR-based claim system (overlay + base)
- ✅ Public animal cards (`/a?id=AUS0001`)
- ✅ Owner dashboard with animals grid
- ✅ Marketplace with 3D previews
- ✅ Super-admin factory (batch management, QR generation)
- ✅ EAS attestations (vaccination, movement, weight)
- ✅ Coinbase Smart Wallet (gas-sponsored)
- ✅ IPFS public records
- ✅ NFT-based ownership (ERC-721 on Base)

## Compliance

**Management tag — not APHIS 840 official. Use with 840 RFID for interstate.**

## License

Copyright © 2025 Ritxma Integrations LLC. All rights reserved.

