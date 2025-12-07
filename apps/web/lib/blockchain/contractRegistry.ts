/**
 * Contract Registry - Manages multiple smart contracts and standards
 * 
 * This allows the system to:
 * - Start with ERC-721 (RanchLinkTag)
 * - Migrate to ERC-3643 (RWA compliance) when needed
 * - Use ERC-7518 (DyCIST) for advanced features
 * - Support multiple contracts simultaneously
 * 
 * The registry reads from Supabase `contracts` table, allowing
 * dynamic contract management without code changes.
 */

import { getSupabaseServerClient } from '../supabase/server';

export type ContractStandard = 'ERC721' | 'ERC3643' | 'ERC7518' | 'ERC1155';
export type AssetType = 'cattle' | 'licensed_products' | 'software_license' | 'trademark' | 'revenue_share';

export interface ContractConfig {
  id: string;
  name: string;
  symbol: string;
  contract_address: string;
  chain: string;
  standard: ContractStandard;
  default_for: string[]; // Asset types this contract handles
  created_at: string;
}

/**
 * Get contract configuration for a specific asset type
 * Reads from Supabase `contracts` table
 */
export async function getContractForAsset(assetType: AssetType): Promise<ContractConfig | null> {
  const supabase = getSupabaseServerClient();
  
  // Query contracts table for contracts that handle this asset type
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .contains('default_for', [assetType])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.warn(`No contract found for asset type: ${assetType}`, error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    symbol: data.symbol,
    contract_address: data.contract_address,
    chain: data.chain,
    standard: data.standard as ContractStandard,
    default_for: data.default_for || [],
    created_at: data.created_at,
  };
}

/**
 * Get contract by address
 */
export async function getContractByAddress(address: string): Promise<ContractConfig | null> {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('contract_address', address.toLowerCase())
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    symbol: data.symbol,
    contract_address: data.contract_address,
    chain: data.chain,
    standard: data.standard as ContractStandard,
    default_for: data.default_for || [],
    created_at: data.created_at,
  };
}

/**
 * Get all active contracts
 */
export async function getAllContracts(): Promise<ContractConfig[]> {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(contract => ({
    id: contract.id,
    name: contract.name,
    symbol: contract.symbol,
    contract_address: contract.contract_address,
    chain: contract.chain,
    standard: contract.standard as ContractStandard,
    default_for: contract.default_for || [],
    created_at: contract.created_at,
  }));
}

/**
 * Register a new contract in the registry
 */
export async function registerContract(config: Omit<ContractConfig, 'id' | 'created_at'>): Promise<ContractConfig | null> {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('contracts')
    .insert({
      name: config.name,
      symbol: config.symbol,
      contract_address: config.contract_address.toLowerCase(),
      chain: config.chain,
      standard: config.standard,
      default_for: config.default_for,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error registering contract:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    symbol: data.symbol,
    contract_address: data.contract_address,
    chain: data.chain,
    standard: data.standard as ContractStandard,
    default_for: data.default_for || [],
    created_at: data.created_at,
  };
}

/**
 * Get default contract for cattle tags (backward compatibility)
 * Falls back to environment variable if no contract in DB
 */
export async function getDefaultCattleContract(): Promise<ContractConfig | null> {
  // Try to get from registry first
  const contract = await getContractForAsset('cattle');
  if (contract) {
    return contract;
  }

  // Fallback to environment variable (for v1.0 deployment)
  const address = process.env.RANCHLINKTAG_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_TAG;
  if (address) {
    return {
      id: 'legacy',
      name: 'RanchLinkTag (Legacy)',
      symbol: 'RLTAG',
      contract_address: address,
      chain: process.env.NEXT_PUBLIC_CHAIN_ID === '8453' ? 'BASE_MAINNET' : 'BASE_SEPOLIA',
      standard: 'ERC721',
      default_for: ['cattle'],
      created_at: new Date().toISOString(),
    };
  }

  return null;
}

