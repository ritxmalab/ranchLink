import { NextRequest, NextResponse } from 'next/server'
import { mintTag as mintTagUnified } from '@/lib/blockchain/mintTag'

/**
 * POST /api/test-mint
 * Direct test of minting functionality
 * This will help us diagnose why minting isn't working
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[TEST-MINT] Starting mint test...')
    
    // Pre-flight checks
    const checks: string[] = []
    const errors: string[] = []

    // Check environment variables
    if (!process.env.SERVER_WALLET_PRIVATE_KEY) {
      errors.push('Missing SERVER_WALLET_PRIVATE_KEY')
    } else {
      checks.push('✓ SERVER_WALLET_PRIVATE_KEY is set')
    }

    const contractAddress = process.env.RANCHLINKTAG_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_TAG || ''
    if (!contractAddress) {
      errors.push('Missing contract address')
    } else {
      checks.push(`✓ Contract address: ${contractAddress}`)
    }

    if (!process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC && !process.env.ALCHEMY_BASE_RPC) {
      errors.push('Missing RPC URL')
    } else {
      checks.push('✓ RPC URL is set')
    }

    // Check wallet balance
    try {
      const { createPublicClient, http, formatEther } = await import('viem')
      const { base } = await import('@/lib/blockchain/config')
      const serverWalletAddress = process.env.SERVER_WALLET_ADDRESS || '0x6781Eb019e553c3C3732c4B11e6859638282ED96'
      
      const publicClient = createPublicClient({
        chain: base,
        transport: http(process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC || process.env.ALCHEMY_BASE_RPC || 'https://mainnet.base.org'),
      })

      const balance = await publicClient.getBalance({ address: serverWalletAddress as `0x${string}` })
      const balanceEth = formatEther(balance)
      checks.push(`✓ Server wallet balance: ${balanceEth} ETH`)
      
      // Base mainnet gas is very cheap, minimum is 0.0001 ETH
      if (parseFloat(balanceEth) < 0.0001) {
        errors.push(`Insufficient balance: ${balanceEth} ETH (need at least 0.0001 ETH)`)
      } else if (parseFloat(balanceEth) < 0.001) {
        checks.push(`⚠️ Low balance: ${balanceEth} ETH (recommended: 0.001+ ETH)`)
      }
    } catch (balanceError: any) {
      errors.push(`Could not check balance: ${balanceError.message}`)
    }

    // Check MINTER_ROLE
    try {
      const { createPublicClient, http } = await import('viem')
      const { base } = await import('@/lib/blockchain/config')
      const publicClient = createPublicClient({
        chain: base,
        transport: http(process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC || process.env.ALCHEMY_BASE_RPC || 'https://mainnet.base.org'),
      })

      const serverWalletAddress = process.env.SERVER_WALLET_ADDRESS || '0x6781Eb019e553c3C3732c4B11e6859638282ED96'
      const MINTER_ROLE = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6'
      
      const hasRole = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
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
        args: [MINTER_ROLE as `0x${string}`, serverWalletAddress as `0x${string}`],
      })

      if (hasRole) {
        checks.push('✓ Server wallet has MINTER_ROLE')
      } else {
        errors.push('❌ Server wallet does NOT have MINTER_ROLE')
      }
    } catch (roleError: any) {
      errors.push(`Could not check MINTER_ROLE: ${roleError.message}`)
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        checks,
        errors,
        message: 'Pre-flight checks failed',
      }, { status: 500 })
    }

    // Try to mint a test tag
    console.log('[TEST-MINT] Attempting to mint test tag...')
    try {
      const testResult = await mintTagUnified({
        tagCode: 'RL-TEST',
        publicId: 'AUSTEST',
        cid: '',
        assetType: 'cattle',
      })

      return NextResponse.json({
        success: true,
        checks,
        message: 'Mint test successful!',
        token_id: testResult.tokenId.toString(),
        tx_hash: testResult.txHash,
        basescan_url: `https://basescan.org/tx/${testResult.txHash}`,
      })
    } catch (mintError: any) {
      console.error('[TEST-MINT] Mint failed:', mintError)
      return NextResponse.json({
        success: false,
        checks,
        errors: [mintError.message || 'Unknown mint error'],
        message: 'Mint test failed',
        details: process.env.NODE_ENV === 'development' ? mintError.stack : undefined,
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('[TEST-MINT] Test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Test failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })
  }
}

