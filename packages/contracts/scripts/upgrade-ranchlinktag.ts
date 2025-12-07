import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../apps/web/.env.local') });

/**
 * Upgrade script for RanchLinkTag (UUPS Proxy)
 * 
 * This upgrades the implementation contract while keeping the same proxy address.
 * Users continue to interact with the same proxy address - no changes needed!
 * 
 * Usage:
 *   RANCHLINKTAG_ADDRESS=0x... \
 *   npx hardhat run scripts/upgrade-ranchlinktag.ts --network base
 * 
 * IMPORTANT: The proxy address (RANCHLINKTAG_ADDRESS) NEVER changes.
 * Only the implementation contract is upgraded.
 */
async function main() {
  const PROXY_ADDRESS = process.env.RANCHLINKTAG_ADDRESS;

  if (!PROXY_ADDRESS) {
    throw new Error("RANCHLINKTAG_ADDRESS must be set in environment variables");
  }

  const [deployer] = await ethers.getSigners();

  console.log("==========================================");
  console.log("Upgrading RanchLinkTag Contract");
  console.log("==========================================");
  console.log("Proxy address (permanent):", PROXY_ADDRESS);
  console.log("Upgrader:", deployer.address);
  console.log("Network:", await ethers.provider.getNetwork().then(n => n.name));
  console.log("");

  // Get current implementation
  const currentImplementation = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
  console.log("Current implementation:", currentImplementation);

  // Deploy new implementation
  console.log("\nDeploying new implementation...");
  const RanchLinkTagUpgradeable = await ethers.getContractFactory("RanchLinkTagUpgradeable");
  
  // Upgrade proxy to new implementation
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, RanchLinkTagUpgradeable);
  await upgraded.waitForDeployment();

  // Get new implementation address
  const newImplementation = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);

  console.log("\n✅ Upgrade successful!");
  console.log("==========================================");
  console.log("PROXY ADDRESS (unchanged):", PROXY_ADDRESS);
  console.log("New implementation:", newImplementation);
  console.log("Old implementation:", currentImplementation);
  console.log("==========================================");
  console.log("\n✅ IMPORTANT:");
  console.log("   - Proxy address did NOT change");
  console.log("   - Users continue using the same address");
  console.log("   - No changes needed in frontend/backend");
  console.log("   - All existing tokens and state preserved");
  console.log("==========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

