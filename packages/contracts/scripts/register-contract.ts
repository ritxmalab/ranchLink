import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../apps/web/.env.local') });

/**
 * Register a deployed contract in the Supabase contracts table
 * 
 * This script helps register contracts in the database so the system
 * can dynamically select which contract to use.
 * 
 * Usage:
 *   RANCHLINKTAG_ADDRESS=0x... \
 *   npx hardhat run scripts/register-contract.ts --network base
 */
async function main() {
  const CONTRACT_ADDRESS = process.env.RANCHLINKTAG_ADDRESS;
  const CHAIN = process.env.NEXT_PUBLIC_CHAIN_ID === '8453' ? 'BASE_MAINNET' : 'BASE_SEPOLIA';
  const STANDARD = 'ERC721';
  const ASSET_TYPE = 'cattle';

  if (!CONTRACT_ADDRESS) {
    throw new Error("RANCHLINKTAG_ADDRESS must be set in environment variables");
  }

  console.log("==========================================");
  console.log("Registering Contract in Database");
  console.log("==========================================");
  console.log("Contract address:", CONTRACT_ADDRESS);
  console.log("Chain:", CHAIN);
  console.log("Standard:", STANDARD);
  console.log("Asset type:", ASSET_TYPE);

  // Verify contract is deployed
  const [signer] = await ethers.getSigners();
  const code = await ethers.provider.getCode(CONTRACT_ADDRESS);
  
  if (code === "0x") {
    throw new Error(`No contract found at ${CONTRACT_ADDRESS}`);
  }

  console.log("\n✅ Contract verified at address");

  // Get contract name (if possible)
  try {
    const contract = await ethers.getContractAt("RanchLinkTagUpgradeable", CONTRACT_ADDRESS);
    const name = await contract.name();
    const symbol = await contract.symbol();
    console.log(`Contract: ${name} (${symbol})`);
  } catch (error) {
    console.log("Could not read contract name (may need ABI)");
  }

  console.log("\n==========================================");
  console.log("NEXT STEPS:");
  console.log("==========================================");
  console.log("1. Run this SQL in Supabase SQL Editor:");
  console.log("");
  console.log(`INSERT INTO contracts (name, symbol, contract_address, chain, standard, default_for)`);
  console.log(`VALUES (`);
  console.log(`  'RanchLinkTag ${CHAIN}',`);
  console.log(`  'RLTAG',`);
  console.log(`  '${CONTRACT_ADDRESS.toLowerCase()}',`);
  console.log(`  '${CHAIN}',`);
  console.log(`  '${STANDARD}',`);
  console.log(`  ARRAY['${ASSET_TYPE}']`);
  console.log(`)`);
  console.log(`ON CONFLICT (contract_address) DO UPDATE SET`);
  console.log(`  name = EXCLUDED.name,`);
  console.log(`  standard = EXCLUDED.standard,`);
  console.log(`  default_for = EXCLUDED.default_for;`);
  console.log("");
  console.log("2. Or use the API endpoint: POST /api/admin/contracts");
  console.log("   (if you create that endpoint)");
  console.log("==========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

