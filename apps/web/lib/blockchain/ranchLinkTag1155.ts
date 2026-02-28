import { createWalletClient, createPublicClient, http, parseAbi, keccak256, encodePacked, toBytes } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from '@/lib/blockchain/config'

// Correct topic0: keccak256 of the event signature string
const TAG_ACTIVATED_TOPIC = keccak256(toBytes('TagActivated(uint256,bytes32,address,string)'))

const CONTRACT_1155_ABI = parseAbi([
  'function anchorBatch(bytes32 batchId, bytes32 merkleRoot, string calldata batchURI) external',
  'function lazyMint(address to, string calldata tagCode, bytes32 batchId, bytes32[] calldata proof, string calldata cid) external returns (uint256 tokenId)',
  'function setCID(uint256 tokenId, string calldata cid) external',
  'function tagCodeToTokenId(string calldata tagCode) external pure returns (uint256)',
  'function verifyTag(string calldata tagCode, bytes32 batchId, bytes32[] calldata proof) external view returns (bool)',
  'function activated(uint256 tokenId) external view returns (bool)',
  'function batchRoots(bytes32 batchId) external view returns (bytes32)',
  'event BatchAnchored(bytes32 indexed batchId, bytes32 merkleRoot, string batchURI, uint256 timestamp)',
  'event TagActivated(uint256 indexed tokenId, bytes32 indexed batchId, address to, string tagCode)',
])

function getClients() {
  const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY as `0x${string}`
  if (!privateKey) throw new Error('Missing SERVER_WALLET_PRIVATE_KEY')

  const rawAddr = process.env.RANCHLINKTAG_1155_ADDRESS
  if (!rawAddr) throw new Error('Missing RANCHLINKTAG_1155_ADDRESS')
  const contractAddress = rawAddr as `0x${string}`

  const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC || process.env.ALCHEMY_BASE_RPC || 'https://mainnet.base.org'

  const account = privateKeyToAccount(privateKey)
  const walletClient = createWalletClient({ account, chain: base, transport: http(rpcUrl) })
  const publicClient = createPublicClient({ chain: base, transport: http(rpcUrl) })

  return { walletClient, publicClient, account, contractAddress }
}

/**
 * Anchor a factory batch on-chain. One transaction for any batch size.
 * Cost: ~$0.05 flat.
 */
export async function anchorBatch(
  batchId: `0x${string}`,
  merkleRoot: `0x${string}`,
  batchURI: string
): Promise<string> {
  const { walletClient, publicClient, contractAddress } = getClients()

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: CONTRACT_1155_ABI,
    functionName: 'anchorBatch',
    args: [batchId, merkleRoot, batchURI],
  })

  await publicClient.waitForTransactionReceipt({ hash })
  return hash
}

/**
 * Lazy mint a single tag at claim time.
 * Returns the tokenId (deterministic: uint256(keccak256(tagCode))).
 */
export async function lazyMintTag(
  tagCode: string,
  batchId: `0x${string}`,
  proof: `0x${string}`[],
  cid: string
): Promise<{ tokenId: bigint; txHash: string }> {
  const { walletClient, publicClient, account, contractAddress } = getClients()

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: CONTRACT_1155_ABI,
    functionName: 'lazyMint',
    args: [account.address, tagCode, batchId, proof, cid],
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 })

  // Parse TagActivated event — match by correct keccak256 topic0
  let tokenId = BigInt(0)
  for (const log of receipt.logs) {
    if (
      log.address.toLowerCase() === contractAddress.toLowerCase() &&
      log.topics[0] === TAG_ACTIVATED_TOPIC &&
      log.topics[1]
    ) {
      tokenId = BigInt(log.topics[1])
      break
    }
  }

  // Fallback: tokenId is deterministic — keccak256(tagCode)
  if (tokenId === BigInt(0)) {
    tokenId = BigInt(keccak256(encodePacked(['string'], [tagCode])))
  }

  return { tokenId, txHash: hash }
}

/**
 * Update animal metadata CID on-chain.
 */
export async function setCID1155(tokenId: bigint, cid: string): Promise<string> {
  const { walletClient, publicClient, contractAddress } = getClients()

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: CONTRACT_1155_ABI,
    functionName: 'setCID',
    args: [tokenId, cid],
  })

  await publicClient.waitForTransactionReceipt({ hash })
  return hash
}

/**
 * Get the deterministic tokenId for a tag code (no RPC call needed).
 */
export function getTokenId1155(tagCode: string): bigint {
  return BigInt(keccak256(encodePacked(['string'], [tagCode])))
}

export function get1155BasescanUrl(txHash: string): string {
  return `https://basescan.org/tx/${txHash}`
}
