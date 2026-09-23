# 🚀 Vercel Environment Variables Setup Guide

## Complete List of All Environment Variables

### 📋 **CLIENT-SIDE VARIABLES** (NEXT_PUBLIC_*)
These are exposed to the browser and must be set in Vercel.

| Variable Name | Value | Purpose |
|--------------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://utovzxpmfnzihurotqnv.supabase.co` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<REDACTED_SUPABASE_KEY — rotated, see SECURITY_LAUNCH_AUDIT.md>` | Supabase anonymous key (public) |
| `NEXT_PUBLIC_APP_URL` | `https://ranch-link.vercel.app` | Production app URL (UPDATE THIS) |
| `NEXT_PUBLIC_ALCHEMY_BASE_RPC` | `https://base-mainnet.g.alchemy.com/v2/trKkGtYbzcwRqlW4JtlK5` | Base mainnet RPC endpoint |
| `NEXT_PUBLIC_ALCHEMY_BASE_SEPOLIA_RPC` | `https://base-sepolia.g.alchemy.com/v2/trKkGtYbzcwRqlW4JtlK5` | Base Sepolia testnet RPC |
| `NEXT_PUBLIC_CHAIN_ID` | `84532` | Chain ID (84532=Sepolia, 8453=Mainnet) |
| `NEXT_PUBLIC_CONTRACT_TAG` | *(empty - fill after deployment)* | Tag contract address |
| `NEXT_PUBLIC_CONTRACT_REGISTRY` | *(empty - fill after deployment)* | Registry contract address |

### 🔐 **SERVER-SIDE SECRETS** (NOT NEXT_PUBLIC_*)
These are kept private and only available to server-side code.

| Variable Name | Value | Purpose |
|--------------|-------|---------|
| `SUPABASE_SERVICE_KEY` | `<REDACTED_SUPABASE_SERVICE_KEY — rotated, see SECURITY_LAUNCH_AUDIT.md>` | Supabase service role key (admin access) |
| `PINATA_JWT` | `<REDACTED_SUPABASE_KEY — rotated, see SECURITY_LAUNCH_AUDIT.md>` | Pinata IPFS JWT token |
| `CDP_API_KEY` | `f0625bda-ea80-45f6-8b0d-ca41e3d766bb` | Coinbase CDP API key |
| `CDP_APP_ID` | `787f5a59-7321-4b47-9e24-f7751d5a14aa` | Coinbase CDP app ID |
| `CDP_CLIENT_AUTH` | `xnL27LScZoQxuULH1gbvSAzu0FIj5XO8` | Coinbase CDP client auth |
| `CDP_API_KEY_ID` | `de5ca718-44f1-488b-af5a-435d2e74bb44` | Coinbase CDP API key ID |
| `CDP_API_KEY_SECRET` | `2xrAYxjxcO6y4RnLbDeXQ2qmqzvNdH0j5kQosmPk8/trNpVrdHvaMCf7vT5TkMeT0DAOu+OYqlBkf4UZ4yMZWg==` | Coinbase CDP API key secret |
| `CDP_WALLET_SECRET` | `MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgqAWub7EM4gVbCYzy3XMuF3c5RZ+CWWdMQepK2q1Z8x6hRANCAASH+EnY2ewxl/zCGfKakkD2f39NlD8efObLZlKVAjkcpr63Q0LLkf87rI5VPGko7zsamTHA/0ewE8wfcElCElWm` | Coinbase CDP wallet secret |
| `SERVER_WALLET_ADDRESS` | `0xCC84937FCbcaD3128E1c2457769f8f2A79Bc9a2f` | Server wallet (EVM) address |
| `SERVER_SOLANA_ADDRESS` | `4TTb6z1Fd8Ni9tbo7aYk1Zy9bv4d6KkFuist4kUiBQBZ` | Server wallet (Solana) address |
| `ALCHEMY_BASE_SEPOLIA_RPC` | `https://base-sepolia.g.alchemy.com/v2/trKkGtYbzcwRqlW4JtlK5` | Base Sepolia RPC (server-side) |
| `ALCHEMY_BASE_MAINNET_RPC` | `https://base-mainnet.g.alchemy.com/v2/trKkGtYbzcwRqlW4JtlK5` | Base mainnet RPC (server-side) |
| `ALCHEMY_ETH_MAINNET_RPC` | `https://eth-mainnet.g.alchemy.com/v2/trKkGtYbzcwRqlW4JtlK5` | Ethereum mainnet RPC |
| `ALCHEMY_SOLANA_MAINNET_RPC` | `https://solana-mainnet.g.alchemy.com/v2/trKkGtYbzcwRqlW4JtlK5` | Solana mainnet RPC |
| `ALCHEMY_BITCOIN_MAINNET_RPC` | `https://bitcoin-mainnet.g.alchemy.com/v2/trKkGtYbzcwRqlW4JtlK5` | Bitcoin mainnet RPC |
| `ALCHEMY_APP_ID` | `u7t0cerqlvt58vh6` | Alchemy app ID |
| `ALCHEMY_API_KEY` | `trKkGtYbzcwRqlW4JtlK5` | Alchemy API key |

---

## 📝 Step-by-Step: Adding to Vercel

### 1. Go to Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Select your project: **ranch-link**
- Click **Settings** → **Environment Variables**

### 2. Add Each Variable
For each variable above:
1. Click **"Add New"** button
2. **Key**: Copy the variable name exactly (case-sensitive)
3. **Value**: Copy the value exactly
4. **Environment**: Select **"Production, Preview, Development"** (or just Production if you prefer)
5. Click **"Save"**

### 3. Important Notes
- ⚠️ **NEXT_PUBLIC_APP_URL**: Update this to your actual Vercel production URL: `https://ranch-link.vercel.app` (or your custom domain)
- ⚠️ **NEXT_PUBLIC_CONTRACT_TAG** and **NEXT_PUBLIC_CONTRACT_REGISTRY**: Leave empty for now, fill after deploying smart contracts
- ✅ All other values are ready to copy/paste

### 4. After Adding All Variables
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **"..."** menu → **"Redeploy"**
4. Wait for build to complete
5. Check that red banner is gone!

---

## ✅ Verification Checklist

After redeploy, verify:
- [ ] No red banner on `/superadmin/qr-generator` page
- [ ] Can generate QR codes successfully
- [ ] QR codes save to Supabase (check devices table)
- [ ] Claim flow works (`/start?token=...`)
- [ ] Animal cards display (`/a?id=...`)

---

## 🔗 Related Files
- Local env file: `apps/web/.env.local`
- Turbo config: `turbo.json` (needs env passthrough)
- Supabase client: `apps/web/lib/supabase/client.ts`
- Blockchain config: `apps/web/lib/blockchain/config.ts`


