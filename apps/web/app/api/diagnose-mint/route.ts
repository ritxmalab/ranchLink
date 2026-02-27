import { NextResponse } from 'next/server'

/**
 * GET /api/diagnose-mint
 * Comprehensive minting diagnosis endpoint
 * Returns ALL diagnostic info in the HTTP response (no logs needed)
 */
export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: {},
    errors: [],
    warnings: [],
    recommendations: [],
  }

  // 1. Environment Variables Check
  diagnostics.checks.env = {}
  const requiredEnvVars = [
    'SERVER_WALLET_PRIVATE_KEY',
    'SERVER_WALLET_ADDRESS',
    'RANCHLINKTAG_ADDRESS',
    'NEXT_PUBLIC_CONTRACT_TAG',
    'NEXT_PUBLIC_ALCHEMY_BASE_RPC',
    'ALCHEMY_BASE_RPC',
  ]

  for (const varName of requiredEnvVars) {
    const value = process.env[varName]
    diagnostics.checks.env[varName] = {
      exists: !!value,
      length: value?.length || 0,
      preview: value ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}` : 'MISSING',
    }
    if (!value) {
      diagnostics.errors.push(`Missing environment variable: ${varName}`)
    }
  }

  // 2. Contract Address Check
  const contractAddress = process.env.RANCHLINKTAG_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_TAG
  if (!contractAddress) {
    diagnostics.errors.push('No contract address found in environment variables')
  } else {
    diagnostics.checks.contract_address = contractAddress
  }

  // 3. Wallet Balance Check
  try {
    const { createPublicClient, http, formatEther } = await import('viem')
    const { base } = await import('@/lib/blockchain/config')
    const serverWalletAddress = (process.env.SERVER_WALLET_ADDRESS || '0x6781Eb019e553c3C3732c4B11e6859638282ED96') as `0x${string}`
    const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC || process.env.ALCHEMY_BASE_RPC || 'https://mainnet.base.org'

    const publicClient = createPublicClient({
      chain: base,
      transport: http(rpcUrl),
    })

    const balance = await publicClient.getBalance({ address: serverWalletAddress })
    const balanceEth = formatEther(balance)
    // Base mainnet gas is very cheap, minimum is 0.0001 ETH
    diagnostics.checks.wallet = {
      address: serverWalletAddress,
      balance_wei: balance.toString(),
      balance_eth: balanceEth,
      sufficient: parseFloat(balanceEth) >= 0.0001,
      recommended: parseFloat(balanceEth) >= 0.001,
    }

    if (parseFloat(balanceEth) < 0.0001) {
      diagnostics.errors.push(`Insufficient balance: ${balanceEth} ETH (need at least 0.0001 ETH)`)
    } else if (parseFloat(balanceEth) < 0.001) {
      diagnostics.warnings.push(`Low balance: ${balanceEth} ETH (recommended: 0.001+ ETH for multiple mints)`)
    }
  } catch (error: any) {
    diagnostics.errors.push(`Failed to check wallet balance: ${error.message}`)
    diagnostics.checks.wallet = { error: error.message }
  }

  // 4. MINTER_ROLE Check
  try {
    const { createPublicClient, http } = await import('viem')
    const { base } = await import('@/lib/blockchain/config')
    const serverWalletAddress = (process.env.SERVER_WALLET_ADDRESS || '0x6781Eb019e553c3C3732c4B11e6859638282ED96') as `0x${string}`
    const contractAddress = (process.env.RANCHLINKTAG_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_TAG) as `0x${string}`
    const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC || process.env.ALCHEMY_BASE_RPC || 'https://mainnet.base.org'
    const MINTER_ROLE = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6'

    const publicClient = createPublicClient({
      chain: base,
      transport: http(rpcUrl),
    })

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

    diagnostics.checks.minter_role = {
      has_role: hasRole,
      server_wallet: serverWalletAddress,
      contract: contractAddress,
    }

    if (!hasRole) {
      diagnostics.errors.push('Server wallet does NOT have MINTER_ROLE on contract')
      diagnostics.recommendations.push('Run grant-minter script to grant MINTER_ROLE to server wallet')
    }
  } catch (error: any) {
    diagnostics.errors.push(`Failed to check MINTER_ROLE: ${error.message}`)
    diagnostics.checks.minter_role = { error: error.message }
  }

  // 5. Contract Registry Check
  try {
    const { getDefaultCattleContract } = await import('@/lib/blockchain/contractRegistry')
    const contract = await getDefaultCattleContract()
    diagnostics.checks.contract_registry = {
      found: !!contract,
      contract: contract ? {
        address: contract.contract_address,
        standard: contract.standard,
        chain: contract.chain,
      } : null,
    }

    if (!contract) {
      diagnostics.warnings.push('No contract found in registry, using env var fallback')
    }
  } catch (error: any) {
    diagnostics.errors.push(`Failed to check contract registry: ${error.message}`)
    diagnostics.checks.contract_registry = { error: error.message }
  }

  // 6. RPC Connection Test
  try {
    const { createPublicClient, http } = await import('viem')
    const { base } = await import('@/lib/blockchain/config')
    const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC || process.env.ALCHEMY_BASE_RPC || 'https://mainnet.base.org'

    const publicClient = createPublicClient({
      chain: base,
      transport: http(rpcUrl),
    })

    const blockNumber = await publicClient.getBlockNumber()
    diagnostics.checks.rpc = {
      connected: true,
      rpc_url_preview: rpcUrl.replace(/\/v2\/[^/]+/, '/v2/***'),
      latest_block: blockNumber.toString(),
    }
  } catch (error: any) {
    diagnostics.errors.push(`RPC connection failed: ${error.message}`)
    diagnostics.checks.rpc = { connected: false, error: error.message }
  }

  // 7. Wallet Client Test (without actually minting)
  try {
    const { getWalletClient } = await import('@/lib/blockchain/ranchLinkTag')
    // Access private function via dynamic import
    const walletClient = getWalletClient()
    diagnostics.checks.wallet_client = {
      can_create: true,
      address: walletClient.account.address,
      chain_id: walletClient.chain.id,
    }
  } catch (error: any) {
    diagnostics.errors.push(`Failed to create wallet client: ${error.message}`)
    diagnostics.checks.wallet_client = { can_create: false, error: error.message }
  }

  // Summary
  diagnostics.summary = {
    total_checks: Object.keys(diagnostics.checks).length,
    errors: diagnostics.errors.length,
    warnings: diagnostics.warnings.length,
    can_mint: diagnostics.errors.length === 0 && diagnostics.checks.wallet?.sufficient && diagnostics.checks.minter_role?.has_role,
  }

  return NextResponse.json(diagnostics, {
    status: diagnostics.errors.length > 0 ? 500 : 200,
  })
}

