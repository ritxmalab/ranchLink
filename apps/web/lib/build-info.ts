/**
 * Build Information
 * Exposes build version and commit info for UI display
 */

// This will be set at build time via environment variable
export const BUILD_COMMIT = process.env.NEXT_PUBLIC_BUILD_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'dev'
export const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString()
export const VERSION = '1.0.0'

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_TAG || process.env.RANCHLINKTAG_ADDRESS || '0x2BAc88732c526d25698Bcd8940048Dac3d3e6C3B'

export function getBuildInfo() {
  return {
    version: VERSION,
    commit: BUILD_COMMIT,
    buildTime: BUILD_TIME,
    contractAddress: CONTRACT_ADDRESS,
    network: 'Base Mainnet',
  }
}

export function getBuildBadgeText() {
  const info = getBuildInfo()
  const shortAddress = `${info.contractAddress.substring(0, 6)}...${info.contractAddress.substring(info.contractAddress.length - 4)}`
  return `RanchLink v${info.version} • Base Mainnet • ${shortAddress} • build: ${info.commit}`
}

