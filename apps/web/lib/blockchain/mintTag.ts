/**
 * Unified minting function that supports multiple contract standards
 * 
 * This abstraction layer allows the system to:
 * - Mint to ERC-721 (current)
 * - Mint to ERC-3643 (future RWA compliance)
 * - Mint to ERC-7518 (future advanced features)
 * 
 * The function automatically selects the correct contract and wrapper
 * based on the contract's standard.
 */

import { getContractForAsset, ContractConfig } from './contractRegistry';
import { mintTag as mintTagERC721 } from './ranchLinkTag';
// Future imports (when needed):
// import { mintTag as mintTagERC3643 } from './ranchLinkRWA';
// import { mintTag as mintTagERC7518 } from './ranchLinkLicense';

export interface MintTagParams {
  tagCode: string;
  publicId: string;
  cid: string;
  assetType?: 'cattle' | 'licensed_products' | 'software_license' | 'trademark';
}

export interface MintTagResult {
  tokenId: bigint;
  txHash: string;
  contractAddress: string;
  standard: string;
}

/**
 * Mint a tag using the appropriate contract based on asset type
 * 
 * TODO: LastBurner / Non-custodial Support
 * - Currently mints to server wallet (custodial model)
 * - Future: Add recipientAddress parameter to support LastBurner kits
 * - When LastBurner kits are shipped, tags will be minted to rancher's Burner address
 * - Contract registry + tags table already support this (contract_address field)
 */
export async function mintTag(params: MintTagParams): Promise<MintTagResult> {
  const assetType = params.assetType || 'cattle';
  
  // Get contract configuration for this asset type
  const contract = await getContractForAsset(assetType);
  
  if (!contract) {
    throw new Error(`No contract found for asset type: ${assetType}`);
  }

  // Route to appropriate minting function based on standard
  switch (contract.standard) {
    case 'ERC721':
      // TODO: For LastBurner kits, pass recipientAddress to mintTagERC721
      // const recipientAddress = params.recipientAddress; // Future parameter
      const erc721Result = await mintTagERC721(params.tagCode, params.publicId, params.cid);
      return {
        tokenId: erc721Result.tokenId,
        txHash: erc721Result.txHash,
        contractAddress: contract.contract_address,
        standard: 'ERC721',
      };

    case 'ERC3643':
      // TODO: Implement when ERC-3643 contract is deployed
      throw new Error('ERC-3643 minting not yet implemented. Use ERC-721 for now.');

    case 'ERC7518':
      // TODO: Implement when ERC-7518 contract is deployed
      throw new Error('ERC-7518 minting not yet implemented. Use ERC-721 for now.');

    default:
      throw new Error(`Unsupported contract standard: ${contract.standard}`);
  }
}

/**
 * Get contract info for a tag (reads from tags table)
 * This allows the system to know which contract/standard a tag uses
 */
export async function getTagContractInfo(tagCode: string): Promise<ContractConfig | null> {
  const { getSupabaseServerClient } = await import('../supabase/server');
  const supabase = getSupabaseServerClient();
  
  // Get tag from database
  const { data: tag, error } = await supabase
    .from('tags')
    .select('contract_address, chain')
    .eq('tag_code', tagCode)
    .single();

  if (error || !tag || !tag.contract_address) {
    return null;
  }

  // Get contract config from registry
  const { getContractByAddress } = await import('./contractRegistry');
  return getContractByAddress(tag.contract_address);
}

