import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../apps/web/.env.local') });

/**
 * Deploy script for RanchLinkTag Upgradeable (UUPS Proxy Pattern)
 * 
 * This deploys:
 * 1. Implementation contract (RanchLinkTagUpgradeable)
 * 2. Proxy contract (UUPS) pointing to implementation
 * 
 * Users will interact with the PROXY address (permanent, never changes)
 * The implementation can be upgraded while keeping the same proxy address.
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-ranchlinktag-upgradeable.ts --network base
 * 
 * Environment variables required:
 *   - PRIVATE_KEY: Deployer wallet private key
 *   - ALCHEMY_BASE_RPC: For mainnet
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("==========================================");
  console.log("Deploying RanchLinkTag (Upgradeable)");
  console.log("==========================================");
  console.log("Deployer address:", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

  if (balance === BigInt(0)) {
    throw new Error("Deployer wallet has no ETH. Please fund it first.");
  }

  // Deploy upgradeable contract
  console.log("\nDeploying RanchLinkTagUpgradeable with UUPS Proxy...");
  const RanchLinkTagUpgradeable = await ethers.getContractFactory("RanchLinkTagUpgradeable");
  
  // Deploy proxy + implementation
  // The proxy address will be the permanent contract address
  const contract = await upgrades.deployProxy(
    RanchLinkTagUpgradeable,
    [deployer.address], // initialOwner parameter for initialize()
    {
      initializer: "initialize",
      kind: "uups" // Use UUPS proxy pattern
    }
  );

  await contract.waitForDeployment();
  const proxyAddress = await contract.getAddress();

  // Get implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("\n✅ Deployment successful!");
  console.log("==========================================");
  console.log("PROXY ADDRESS (USE THIS):", proxyAddress);
  console.log("Implementation address:", implementationAddress);
  console.log("Network:", await ethers.provider.getNetwork().then(n => n.name));
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("==========================================");

  // Verify roles
  const MINTER_ROLE = await contract.MINTER_ROLE();
  const ADMIN_ROLE = await contract.ADMIN_ROLE();
  const hasMinterRole = await contract.hasRole(MINTER_ROLE, deployer.address);
  const hasAdminRole = await contract.hasRole(ADMIN_ROLE, deployer.address);

  console.log("\nRole Verification:");
  console.log("  MINTER_ROLE:", MINTER_ROLE);
  console.log("  ADMIN_ROLE:", ADMIN_ROLE);
  console.log("  Deployer has MINTER_ROLE:", hasMinterRole);
  console.log("  Deployer has ADMIN_ROLE:", hasAdminRole);

  // Save deployment info
  console.log("\n==========================================");
  console.log("DEPLOYMENT SUMMARY");
  console.log("==========================================");
  console.log("Contract: RanchLinkTagUpgradeable (UUPS)");
  console.log("PROXY ADDRESS (permanent):", proxyAddress);
  console.log("Implementation address:", implementationAddress);
  console.log("Deployer:", deployer.address);
  console.log("Network:", await ethers.provider.getNetwork().then(n => n.name));
  console.log("\n⚠️  IMPORTANT: Use PROXY ADDRESS as contract address!");
  console.log("   The proxy address NEVER changes, even after upgrades.");
  console.log("\nSet in Vercel:");
  console.log(`   RANCHLINKTAG_ADDRESS=${proxyAddress}`);
  console.log(`   NEXT_PUBLIC_CONTRACT_TAG=${proxyAddress}`);
  console.log("\n⚠️  Next step: Grant MINTER_ROLE to server wallet:");
  console.log("   Run: npx hardhat run scripts/grant-minter-upgradeable.ts --network base");
  console.log("==========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

