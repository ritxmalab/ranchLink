import { createPublicClient, http, defineChain } from 'viem'

// Base L2 Chain
export const base = defineChain({
  id: 8453,
  name: 'Base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC || 'https://mainnet.base.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseScan',
      url: 'https://basescan.org',
    },
  },
})

// Base Sepolia (testnet)
export const baseSepolia = defineChain({
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ALCHEMY_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseScan',
      url: 'https://sepolia.basescan.org',
    },
  },
})

// Get current chain (use testnet for development)
export const currentChain = process.env.NEXT_PUBLIC_CHAIN_ID === '8453' ? base : baseSepolia

// Public client for read operations
export const publicClient = createPublicClient({
  chain: currentChain,
  transport: http(),
})

// Contract addresses
export const CONTRACTS = {
  TAG: process.env.NEXT_PUBLIC_CONTRACT_TAG || '',
  REGISTRY: process.env.NEXT_PUBLIC_CONTRACT_REGISTRY || '',
}


