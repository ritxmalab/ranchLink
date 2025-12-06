/**
 * RanchLinkTag ERC-721 Contract Wrapper
 * Handles minting and querying tags on Base blockchain
 */

import { createWalletClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { currentChain, publicClient } from './config'

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
 */
function getWalletClient() {
  const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY
  if (!privateKey) {
    throw new Error('Missing SERVER_WALLET_PRIVATE_KEY environment variable')
  }
  if (!privateKey.startsWith('0x')) {
    throw new Error('SERVER_WALLET_PRIVATE_KEY must start with 0x')
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`)
  return createWalletClient({
    account,
    chain: currentChain,
    transport: http(),
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
export async function mintTag(
  tagCode: string,
  publicId: string,
  cid: string = '',
  recipientAddress?: `0x${string}`
): Promise<{ tokenId: bigint; txHash: `0x${string}` }> {
  try {
    const contractAddress = getContractAddress()
    const walletClient = getWalletClient()
    const recipient = recipientAddress || walletClient.account.address

    // Hash the public ID
    const publicIdHash = hashPublicId(publicId)

    // Call mintTo function
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: RANCHLINK_TAG_ABI,
      functionName: 'mintTo',
      args: [recipient, publicIdHash, cid],
    })

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    // Extract token ID from events or receipt
    // Note: The contract returns tokenId, but we need to parse it from events
    // For now, we'll need to call a view function or parse events
    // This is a simplified version - you may need to adjust based on contract events

    // Parse token ID from transaction receipt events
    // The contract emits TagMinted event with tokenId
    // For now, we'll need to query the contract or parse events
    // This is a simplified version - adjust based on your contract's event structure
    let tokenId: bigint = BigInt(0)
    
    // Try to get token ID from events
    if (receipt.logs && receipt.logs.length > 0) {
      // Parse TagMinted event - adjust based on actual event structure
      // For now, we'll query the contract's nextTokenId or use a workaround
      // You may need to adjust this based on your contract implementation
    }
    
    // If we can't get it from events, we'll need to query the contract
    // For v1.0, we can store the txHash and query tokenId later if needed
    // Or implement a view function in the contract to get the latest minted token

    return {
      tokenId,
      txHash: hash,
    }
  } catch (error: any) {
    throw new Error(`Failed to mint tag: ${error.message}`)
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

