/**
 * Ritxma Integrations LLC - Official Crypto Addresses
 * These are the Ledger wallet addresses for payments and treasury
 */

export const RITXMA_ADDRESSES = {
  bitcoin: {
    address: 'bc1q5n769dgm6dza7z4ytkt8euldywdnequsa40ue4',
    network: 'mainnet',
    currency: 'BTC',
    label: 'Bitcoin Payments',
  },
  ethereum: {
    address: '0x223C5FEAA2523E0c3B13e0C43F662653B9726cb6',
    network: 'mainnet',
    currency: 'ETH',
    label: 'Ethereum Payments',
    // This same address works on Base L2, Optimism, Polygon (EVM-compatible)
    compatibleChains: ['ethereum', 'base', 'optimism', 'polygon'],
  },
  base: {
    // Same address as Ethereum (EVM-compatible)
    address: '0x223C5FEAA2523E0c3B13e0C43F662653B9726cb6',
    network: 'base-mainnet',
    currency: 'ETH',
    label: 'Base L2 Operations',
  },
  solana: {
    address: '65T2bjQaHD9yzqRN4uPg6Wrk3kz3NDUr17ofbSwtbLAz',
    network: 'mainnet',
    currency: 'SOL',
    label: 'Solana Payments',
    compatibleWith: ['solana', 'hemi'], // Hemi provides Bitcoin access via Solana
  },
} as const

/**
 * Get payment address for a specific blockchain
 */
export function getPaymentAddress(chain: 'bitcoin' | 'ethereum' | 'base' | 'solana'): string {
  return RITXMA_ADDRESSES[chain].address
}

/**
 * Get all payment addresses
 */
export function getAllPaymentAddresses() {
  return {
    bitcoin: RITXMA_ADDRESSES.bitcoin.address,
    ethereum: RITXMA_ADDRESSES.ethereum.address,
    base: RITXMA_ADDRESSES.base.address,
    solana: RITXMA_ADDRESSES.solana.address,
  }
}

/**
 * Check if address is valid for a chain
 */
export function isValidAddress(address: string, chain: string): boolean {
  switch (chain.toLowerCase()) {
    case 'bitcoin':
    case 'btc':
      return address.startsWith('bc1') || address.startsWith('1') || address.startsWith('3')
    case 'ethereum':
    case 'base':
    case 'optimism':
    case 'polygon':
      return /^0x[a-fA-F0-9]{40}$/.test(address)
    case 'solana':
    case 'sol':
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
    default:
      return false
  }
}

