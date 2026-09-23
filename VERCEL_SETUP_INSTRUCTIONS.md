# 📋 Step-by-Step: Adding Environment Variables to Vercel

## Quick Start

1. **Open Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Click on your project: **ranch-link**

2. **Navigate to Environment Variables**
   - Click **"Settings"** in the top navigation
   - Click **"Environment Variables"** in the left sidebar

3. **Add Variables One by One**

   For each variable, follow these steps:
   
   a. Click the **"Add New"** button (top right)
   
   b. Fill in the form:
      - **Key**: Copy the variable name exactly (case-sensitive!)
      - **Value**: Copy the value exactly
      - **Environment**: Select **"Production, Preview, Development"** (or just Production)
      - Click **"Save"**
   
   c. Repeat for all variables

4. **Important Notes**
   - ⚠️ For `NEXT_PUBLIC_APP_URL`, use: `https://ranch-link.vercel.app` (NOT localhost)
   - ⚠️ Leave `NEXT_PUBLIC_CONTRACT_TAG` and `NEXT_PUBLIC_CONTRACT_REGISTRY` **empty** for now
   - ✅ All other values are ready to copy from the list below

5. **After Adding All Variables**
   - Go to **"Deployments"** tab
   - Click **"..."** on the latest deployment
   - Click **"Redeploy"**
   - Wait for build to complete
   - Check that the red banner is gone!

---

## 📝 Complete Variable List

### CLIENT-SIDE (NEXT_PUBLIC_*)

**1. NEXT_PUBLIC_SUPABASE_URL**
```
https://utovzxpmfnzihurotqnv.supabase.co
```

**2. NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
<REDACTED_SUPABASE_KEY — rotated, see SECURITY_LAUNCH_AUDIT.md>
```

**3. NEXT_PUBLIC_APP_URL** ⚠️ UPDATE THIS
```
https://ranch-link.vercel.app
```

**4. NEXT_PUBLIC_ALCHEMY_BASE_RPC**
```
https://base-mainnet.g.alchemy.com/v2/trKkGtYbzcwRqlW4JtlK5
```

**5. NEXT_PUBLIC_ALCHEMY_BASE_SEPOLIA_RPC**
```
https://base-sepolia.g.alchemy.com/v2/trKkGtYbzcwRqlW4JtlK5
```

**6. NEXT_PUBLIC_CHAIN_ID**
```
84532
```

**7. NEXT_PUBLIC_CONTRACT_TAG** ⚠️ LEAVE EMPTY
```
(empty - fill after contract deployment)
```

**8. NEXT_PUBLIC_CONTRACT_REGISTRY** ⚠️ LEAVE EMPTY
```
(empty - fill after contract deployment)
```

---

### SERVER-SIDE SECRETS

**9. SUPABASE_SERVICE_KEY**
```
<REDACTED_SUPABASE_SERVICE_KEY — rotated, see SECURITY_LAUNCH_AUDIT.md>
```

**10. PINATA_JWT**
```
<REDACTED_SUPABASE_KEY — rotated, see SECURITY_LAUNCH_AUDIT.md>
```

**11. CDP_API_KEY**
```
f0625bda-ea80-45f6-8b0d-ca41e3d766bb
```

**12. CDP_APP_ID**
```
787f5a59-7321-4b47-9e24-f7751d5a14aa
```

**13. CDP_CLIENT_AUTH**
```
xnL27LScZoQxuULH1gbvSAzu0FIj5XO8
```

**14. CDP_API_KEY_ID**
```
de5ca718-44f1-488b-af5a-435d2e74bb44
```

**15. CDP_API_KEY_SECRET**
```
2xrAYxjxcO6y4RnLbDeXQ2qmqzvNdH0j5kQosmPk8/trNpVrdHvaMCf7vT5TkMeT0DAOu+OYqlBkf4UZ4yMZWg==
```

**16. CDP_WALLET_SECRET**
```
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgqAWub7EM4gVbCYzy3XMuF3c5RZ+CWWdMQepK2q1Z8x6hRANCAASH+EnY2ewxl/zCGfKakkD2f39NlD8efObLZlKVAjkcpr63Q0LLkf87rI5VPGko7zsamTHA/0ewE8wfcElCElWm
```

**17. SERVER_WALLET_ADDRESS**
```
0xCC84937FCbcaD3128E1c2457769f8f2A79Bc9a2f
```

**18. SERVER_SOLANA_ADDRESS**
```
4TTb6z1Fd8Ni9tbo7aYk1Zy9bv4d6KkFuist4kUiBQBZ
```

**19. ALCHEMY_BASE_SEPOLIA_RPC**
```
https://base-sepolia.g.alchemy.com/v2/trKkGtYbzcwRqlW4JtlK5
```

**20. ALCHEMY_BASE_MAINNET_RPC**
```
https://base-mainnet.g.alchemy.com/v2/trKkGtYbzcwRqlW4JtlK5
```

**21. ALCHEMY_ETH_MAINNET_RPC**
```
https://eth-mainnet.g.alchemy.com/v2/trKkGtYbzcwRqlW4JtlK5
```

**22. ALCHEMY_SOLANA_MAINNET_RPC**
```
https://solana-mainnet.g.alchemy.com/v2/trKkGtYbzcwRqlW4JtlK5
```

**23. ALCHEMY_BITCOIN_MAINNET_RPC**
```
https://bitcoin-mainnet.g.alchemy.com/v2/trKkGtYbzcwRqlW4JtlK5
```

**24. ALCHEMY_APP_ID**
```
u7t0cerqlvt58vh6
```

**25. ALCHEMY_API_KEY**
```
trKkGtYbzcwRqlW4JtlK5
```

---

## ✅ Verification

After redeploying, check:

1. Visit: `https://ranch-link.vercel.app/superadmin/qr-generator`
2. **Red banner should be GONE** ✅
3. Generate a test batch (3 tags)
4. Check Supabase `devices` table - should see new entries
5. Try claiming a tag via `/start?token=...`

---

## 🚀 Next Steps

After environment variables are set:
1. ✅ Red banner fixed
2. ✅ QR generation works
3. ✅ Claim flow works
4. ⏳ Deploy smart contracts
5. ⏳ Add contract addresses
6. ⏳ Enable blockchain minting


