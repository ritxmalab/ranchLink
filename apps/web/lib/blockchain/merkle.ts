import { keccak256, encodePacked } from 'viem'

/**
 * Build a Merkle tree from an array of tag codes.
 * Leaf = keccak256(abi.encodePacked(tagCode)) — matches the Solidity contract.
 * Returns the root and a proof map: tagCode => proof (array of hex strings).
 */
export function buildTagMerkleTree(tagCodes: string[]): {
  root: `0x${string}`
  proofs: Record<string, `0x${string}`[]>
} {
  if (tagCodes.length === 0) throw new Error('Cannot build Merkle tree from empty array')

  // Compute leaves
  const leaves: `0x${string}`[] = tagCodes.map(code =>
    keccak256(encodePacked(['string'], [code]))
  )

  // Sort leaves for deterministic tree (standard practice)
  const sortedLeaves = [...leaves].sort()
  const leafIndex: Record<string, number> = {}
  tagCodes.forEach(code => {
    const leaf = keccak256(encodePacked(['string'], [code]))
    leafIndex[code] = sortedLeaves.indexOf(leaf)
  })

  // Build tree layers bottom-up
  const layers: `0x${string}`[][] = [sortedLeaves]
  while (layers[layers.length - 1].length > 1) {
    const prev = layers[layers.length - 1]
    const next: `0x${string}`[] = []
    for (let i = 0; i < prev.length; i += 2) {
      const left = prev[i]
      const right = i + 1 < prev.length ? prev[i + 1] : left
      // Sort pair before hashing (standard Merkle tree)
      const pair = [left, right].sort() as [`0x${string}`, `0x${string}`]
      next.push(keccak256(encodePacked(['bytes32', 'bytes32'], pair)))
    }
    layers.push(next)
  }

  const root = layers[layers.length - 1][0]

  // Generate proofs
  const proofs: Record<string, `0x${string}`[]> = {}
  tagCodes.forEach(code => {
    const proof: `0x${string}`[] = []
    let idx = leafIndex[code]
    for (let l = 0; l < layers.length - 1; l++) {
      const layer = layers[l]
      const sibling = idx % 2 === 0
        ? (idx + 1 < layer.length ? layer[idx + 1] : layer[idx])
        : layer[idx - 1]
      proof.push(sibling)
      idx = Math.floor(idx / 2)
    }
    proofs[code] = proof
  })

  return { root, proofs }
}

/**
 * Verify a single tag's Merkle proof (client-side check before submitting tx).
 */
export function verifyTagProof(
  tagCode: string,
  proof: `0x${string}`[],
  root: `0x${string}`
): boolean {
  let hash = keccak256(encodePacked(['string'], [tagCode]))
  for (const sibling of proof) {
    const pair = [hash, sibling].sort() as [`0x${string}`, `0x${string}`]
    hash = keccak256(encodePacked(['bytes32', 'bytes32'], pair))
  }
  return hash === root
}
