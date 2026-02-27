import { NextResponse } from 'next/server'

/**
 * GET /api/health-mint
 * Simple health check that also verifies minting environment
 * This will show up in Vercel logs immediately
 */
export async function GET() {
  console.error('[HEALTH-MINT] ========================================')
  console.error('[HEALTH-MINT] Health check called')
  console.error('[HEALTH-MINT] ========================================')
  
  const checks: Record<string, any> = {}
  
  // Check environment variables
  checks.SERVER_WALLET_PRIVATE_KEY = !!process.env.SERVER_WALLET_PRIVATE_KEY
  checks.RANCHLINKTAG_ADDRESS = process.env.RANCHLINKTAG_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_TAG || 'MISSING'
  checks.NEXT_PUBLIC_ALCHEMY_BASE_RPC = !!process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC
  checks.ALCHEMY_BASE_RPC = !!process.env.ALCHEMY_BASE_RPC
  checks.SERVER_WALLET_ADDRESS = process.env.SERVER_WALLET_ADDRESS || '0x6781Eb019e553c3C3732c4B11e6859638282ED96'
  
  console.error('[HEALTH-MINT] Environment check:', JSON.stringify(checks, null, 2))
  
  // Try to check wallet balance
  try {
    const { createPublicClient, http, formatEther } = await import('viem')
    const { base } = await import('@/lib/blockchain/config')
    const serverWalletAddress = checks.SERVER_WALLET_ADDRESS as `0x${string}`
    
    const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC || process.env.ALCHEMY_BASE_RPC || 'https://mainnet.base.org'
    console.error('[HEALTH-MINT] Using RPC:', rpcUrl.replace(/\/v2\/[^/]+/, '/v2/***'))
    
    const publicClient = createPublicClient({
      chain: base,
      transport: http(rpcUrl),
    })

    const balance = await publicClient.getBalance({ address: serverWalletAddress })
    const balanceEth = formatEther(balance)
    checks.balance = balanceEth
    // Base mainnet gas is very cheap, minimum is 0.0001 ETH
    checks.balance_sufficient = parseFloat(balanceEth) >= 0.0001
    checks.balance_recommended = parseFloat(balanceEth) >= 0.001
    
    console.error('[HEALTH-MINT] Wallet balance:', balanceEth, 'ETH')
  } catch (balanceError: any) {
    console.error('[HEALTH-MINT] Balance check failed:', balanceError.message)
    checks.balance_error = balanceError.message
  }
  
  // Try to check MINTER_ROLE
  try {
    const { createPublicClient, http } = await import('viem')
    const { base } = await import('@/lib/blockchain/config')
    const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC || process.env.ALCHEMY_BASE_RPC || 'https://mainnet.base.org'
    
    const publicClient = createPublicClient({
      chain: base,
      transport: http(rpcUrl),
    })

    const serverWalletAddress = checks.SERVER_WALLET_ADDRESS as `0x${string}`
    const contractAddress = checks.RANCHLINKTAG_ADDRESS as `0x${string}`
    const MINTER_ROLE = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6'
    
    const hasRole = await publicClient.readContract({
      address: contractAddress,
      abi: [
        {
          inputs: [
            { name: 'role', type: 'bytes32' },
            { name: 'account', type: 'address' },
          ],
          name: 'hasRole',
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'hasRole',
      args: [MINTER_ROLE as `0x${string}`, serverWalletAddress],
    })
    
    checks.has_minter_role = hasRole
    console.error('[HEALTH-MINT] MINTER_ROLE check:', hasRole)
  } catch (roleError: any) {
    console.error('[HEALTH-MINT] MINTER_ROLE check failed:', roleError.message)
    checks.role_error = roleError.message
  }
  
  console.error('[HEALTH-MINT] ========================================')
  console.error('[HEALTH-MINT] Final checks:', JSON.stringify(checks, null, 2))
  console.error('[HEALTH-MINT] ========================================')
  
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks,
  })
}

