/**
 * Generate a new EOA (Externally Owned Account) wallet for server operations
 * This creates a NORMAL wallet (not a smart wallet) that won't auto-drain funds
 * 
 * Run: node scripts/generate-new-server-wallet.js
 */

const { generatePrivateKey, privateKeyToAccount } = require('viem/accounts')

async function main() {
  console.log('🔐 Generating new EOA server wallet...\n')

  // Generate new private key
  const privateKey = generatePrivateKey()
  
  // Get address from private key
  const account = privateKeyToAccount(privateKey)

  console.log('✅ New wallet generated!\n')
  console.log('='.repeat(60))
  console.log('📋 WALLET INFORMATION:')
  console.log('='.repeat(60))
  console.log(`Address:     ${account.address}`)
  console.log(`Private Key: ${privateKey}`)
  console.log('='.repeat(60))
  console.log('\n⚠️  SECURITY WARNING:')
  console.log('   - Save the private key SECURELY')
  console.log('   - NEVER share it or commit to Git')
  console.log('   - Add to apps/web/.env.local:')
  console.log(`     SERVER_WALLET_ADDRESS=${account.address}`)
  console.log(`     SERVER_WALLET_PRIVATE_KEY=${privateKey}`)
  console.log('   - Update Vercel environment variables')
  console.log('   - Grant MINTER_ROLE to this address')
  console.log('   - Fund with ETH on Base Mainnet')
  console.log('\n✅ This is a NORMAL EOA wallet (not a smart wallet)')
  console.log('   It will NOT auto-drain funds like Coinbase CDP smart wallets')
  console.log('\n🔗 Verify on Basescan:')
  console.log(`   https://basescan.org/address/${account.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })

