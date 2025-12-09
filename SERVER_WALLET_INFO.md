# 🔐 Server Wallet Information

## Address

```
0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83
```

## Basescan Links

- **Wallet Address**: https://basescan.org/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83
- **Contract**: https://basescan.org/address/0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242

## What to Check in Basescan

1. **Balance**: Should have > 0.001 ETH for gas fees
2. **Transactions**: Should show mint transactions if minting is working
3. **MINTER_ROLE**: Check if this wallet has MINTER_ROLE on the contract

## How to Check MINTER_ROLE

1. Go to contract: https://basescan.org/address/0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242#readContract
2. Find function: `hasRole(bytes32 role, address account)`
3. For `role`, use: `0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6` (MINTER_ROLE)
4. For `account`, use: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
5. Should return `true` if role is granted

## Environment Variables

In Vercel, these should be set:
- `SERVER_WALLET_ADDRESS` = `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
- `SERVER_WALLET_PRIVATE_KEY` = `0x...` (the private key for this wallet)
- `RANCHLINKTAG_ADDRESS` = `0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242`

