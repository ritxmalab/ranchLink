/**
 * RanchLinkTag ERC-721 Contract Wrapper
 * Handles minting and querying tags on Base blockchain
 */

import { createWalletClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base, baseSepolia, currentChain, publicClient } from './config'

// Contract ABI (minimal - just what we need)
const RANCHLINK_TAG_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'publicIdHash', type: 'bytes32' },
      { name: 'cid', type: 'string' },
    ],
    name: 'mintTo',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'publicIdHash', type: 'bytes32' }],
    name: 'getTokenId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

/**
 * Get contract address from environment
 */
function getContractAddress(): `0x${string}` {
  const address = process.env.RANCHLINKTAG_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_TAG
  if (!address) {
    throw new Error('Missing RANCHLINKTAG_ADDRESS or NEXT_PUBLIC_CONTRACT_TAG environment variable')
  }
  if (!address.startsWith('0x') || address.length !== 42) {
    throw new Error(`Invalid contract address: ${address}`)
  }
  return address as `0x${string}`
}

/**
 * Get wallet client for minting (server-side only)
 * CRITICAL: Must use Base Mainnet (8453) and correct RPC URL
 * 
 * EXPORTED for diagnostics - do not use directly, use mintTag() instead
 */
export function getWalletClient() {
  const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY
  if (!privateKey) {
    throw new Error('Missing SERVER_WALLET_PRIVATE_KEY environment variable')
  }
  if (!privateKey.startsWith('0x')) {
    throw new Error('SERVER_WALLET_PRIVATE_KEY must start with 0x')
  }

  // CRITICAL: Use Base Mainnet (8453) - not testnet
  // Check if we're explicitly set to mainnet or default to mainnet
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '8453'
  const targetChain = chainId === '8453' ? base : baseSepolia
  
  // CRITICAL: Use explicit RPC URL - don't rely on chain defaults
  const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC || 
                 process.env.ALCHEMY_BASE_RPC || 
                 process.env.ALCHEMY_BASE_MAINNET_RPC ||
                 'https://mainnet.base.org'
  
  console.log('[MINT] Wallet client config:', {
    chainId: targetChain.id,
    chainName: targetChain.name,
    rpcUrl: rpcUrl.substring(0, 30) + '...', // Don't log full URL
  })

  const account = privateKeyToAccount(privateKey as `0x${string}`)
  return createWalletClient({
    account,
    chain: targetChain,
    transport: http(rpcUrl), // CRITICAL: Use explicit RPC URL
  })
}

/**
 * Hash a public ID (e.g., "AUS0001") to bytes32 for contract
 */
export function hashPublicId(publicId: string): `0x${string}` {
  const { keccak256, stringToBytes } = require('viem')
  return keccak256(stringToBytes(publicId))
}

/**
 * Mint a new tag NFT
 * @param tagCode - Tag code (e.g., "RL-001")
 * @param publicId - Public ID (e.g., "AUS0001")
 * @param cid - IPFS CID for metadata (optional, can be empty string initially)
 * @param recipientAddress - Address to mint to (defaults to server wallet)
 * @returns Token ID and transaction hash
 */
/**
 * Mint a new tag NFT
 * 
 * TODO: LastBurner / Non-custodial Support
 * - Currently mints to server wallet (custodial model)
 * - Future: Allow minting directly to rancher's EOA or Burner card address
 * - When LastBurner kits are shipped, recipientAddress will be the Burner address
 * - Liquidity flows (USDC, sales) can be wired to that same address
 */
export async function mintTag(
  tagCode: string,
  publicId: string,
  cid: string = '',
  recipientAddress?: `0x${string}`
): Promise<{ tokenId: bigint; txHash: `0x${string}` }> {
  // Pre-flight checks with detailed error messages
  const contractAddress = getContractAddress()
  if (!contractAddress) {
    throw new Error('Contract address not configured. Check RANCHLINKTAG_ADDRESS or NEXT_PUBLIC_CONTRACT_TAG env var.')
  }

  const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY
  if (!privateKey) {
    throw new Error('SERVER_WALLET_PRIVATE_KEY not configured')
  }

  try {
    const walletClient = getWalletClient()
    // TODO: For LastBurner kits, recipientAddress will be the Burner card address
    // For now, default to server wallet (custodial)
    const recipient = recipientAddress || walletClient.account.address

    console.error('[MINT] Starting mint process:', {
      tagCode,
      publicId,
      contractAddress,
      recipient,
      chainId: walletClient.chain.id,
    })

    // Hash the public ID
    const publicIdHash = hashPublicId(publicId)
    console.error('[MINT] Public ID hash:', publicIdHash)

    // Call mintTo function
    console.error('[MINT] Calling writeContract...')
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: RANCHLINK_TAG_ABI,
      functionName: 'mintTo',
      args: [recipient, publicIdHash, cid || ''],
    })

    console.error('[MINT] Transaction sent, hash:', hash)
    console.error('[MINT] Waiting for receipt...')

    // Wait for transaction receipt with increased timeout (Base can be slow)
    // Base mainnet typically confirms in 2-3 seconds, but we allow up to 120 seconds
    // Also add retry logic for network issues
    let receipt
    try {
      receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        timeout: 120000, // 120 seconds timeout (Base can be slow during high traffic)
        confirmations: 1, // Wait for 1 confirmation
        pollingInterval: 2000, // Check every 2 seconds
      })
      console.error('[MINT] Transaction confirmed:', {
        blockNumber: receipt.blockNumber.toString(),
        status: receipt.status,
        gasUsed: receipt.gasUsed.toString(),
      })
    } catch (timeoutError: any) {
      // If timeout, try to get the receipt anyway (transaction might have completed)
      console.error('[MINT] Timeout waiting for receipt, checking transaction status...')
      try {
        receipt = await publicClient.getTransactionReceipt({ hash })
        if (receipt) {
          console.error('[MINT] Transaction found after timeout:', {
            blockNumber: receipt.blockNumber.toString(),
            status: receipt.status,
          })
        } else {
          // Transaction not found yet, but might be pending
          // Check transaction status
          const tx = await publicClient.getTransaction({ hash })
          if (tx) {
            console.error('[MINT] Transaction is pending, hash:', hash)
            // Return the hash anyway - the transaction is submitted and will complete
            // The frontend can check the status later
            throw new Error(`Transaction submitted but not yet confirmed. Hash: ${hash}. Check Basescan: https://basescan.org/tx/${hash}`)
          }
          throw timeoutError
        }
      } catch (checkError: any) {
        // If we can't get the receipt, throw the original timeout error
        throw new Error(`Transaction timeout. Hash: ${hash}. The transaction may still be processing. Check Basescan: https://basescan.org/tx/${hash}`)
      }
    }

    if (receipt.status === 'reverted') {
      throw new Error(`Transaction reverted. Hash: ${hash}`)
    }

    // Get token ID using the contract's getTokenId function
    // This is more reliable than parsing events
    console.error('[MINT] Fetching token ID...')
    const tokenId = await publicClient.readContract({
      address: contractAddress,
      abi: RANCHLINK_TAG_ABI,
      functionName: 'getTokenId',
      args: [publicIdHash],
    }) as bigint

    console.error('[MINT] Token ID retrieved:', tokenId.toString())

    if (!tokenId || tokenId === BigInt(0)) {
      throw new Error(`Failed to get token ID after minting. Transaction hash: ${hash}`)
    }

    console.error('[MINT] ✅ Mint successful:', {
      tokenId: tokenId.toString(),
      txHash: hash,
      basescan: `https://basescan.org/tx/${hash}`,
    })

    return {
      tokenId,
      txHash: hash,
    }
  } catch (error: any) {
    // Enhanced error message with context
    const errorMessage = error.message || 'Unknown error'
    const errorDetails = {
      tagCode,
      publicId,
      contractAddress,
      error: errorMessage,
      stack: error.stack,
    }
    console.error('[MINT] ❌ Mint failed:', errorDetails)
    throw new Error(`Failed to mint tag ${tagCode}: ${errorMessage}`)
  }
}

/**
 * Get owner of a token
 * @param tokenId - Token ID
 * @returns Owner address
 */
export async function getOwner(tokenId: bigint): Promise<string> {
  try {
    const contractAddress = getContractAddress()
    const owner = await publicClient.readContract({
      address: contractAddress,
      abi: RANCHLINK_TAG_ABI,
      functionName: 'ownerOf',
      args: [tokenId],
    })
    return owner
  } catch (error: any) {
    throw new Error(`Failed to get owner: ${error.message}`)
  }
}

/**
 * Get token URI
 * @param tokenId - Token ID
 * @returns Token URI (IPFS URL)
 */
export async function getTokenURI(tokenId: bigint): Promise<string> {
  try {
    const contractAddress = getContractAddress()
    const uri = await publicClient.readContract({
      address: contractAddress,
      abi: RANCHLINK_TAG_ABI,
      functionName: 'tokenURI',
      args: [tokenId],
    })
    return uri
  } catch (error: any) {
    throw new Error(`Failed to get token URI: ${error.message}`)
  }
}

/**
 * Get Basescan URL for a token
 * @param tokenId - Token ID
 * @returns Basescan URL
 */
export function getBasescanUrl(tokenId: bigint): string {
  const contractAddress = getContractAddress()
  const chainId = currentChain.id
  const baseUrl = chainId === 8453 
    ? 'https://basescan.org' 
    : 'https://sepolia.basescan.org'
  return `${baseUrl}/token/${contractAddress}?a=${tokenId.toString()}`
}

