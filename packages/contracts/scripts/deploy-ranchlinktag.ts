import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Deploy script for RanchLinkTag ERC-721 contract
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-ranchlinktag.ts --network baseSepolia
 *   npx hardhat run scripts/deploy-ranchlinktag.ts --network base
 * 
 * Environment variables required:
 *   - PRIVATE_KEY: Deployer wallet private key
 *   - ALCHEMY_BASE_SEPOLIA_RPC: For testnet
 *   - ALCHEMY_BASE_RPC: For mainnet
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("==========================================");
  console.log("Deploying RanchLinkTag Contract");
  console.log("==========================================");
  console.log("Deployer address:", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

  if (balance === BigInt(0)) {
    throw new Error("Deployer wallet has no ETH. Please fund it first.");
  }

  // Deploy RanchLinkTag
  console.log("\nDeploying RanchLinkTag...");
  const RanchLinkTag = await ethers.getContractFactory("RanchLinkTag");
  
  // Constructor takes initialOwner address (deployer will be the owner)
  const contract = await RanchLinkTag.deploy(deployer.address);
  
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("\n✅ RanchLinkTag deployed successfully!");
  console.log("Contract address:", contractAddress);
  console.log("Network:", await ethers.provider.getNetwork().then(n => n.name));
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);

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
  console.log("Contract: RanchLinkTag");
  console.log("Address:", contractAddress);
  console.log("Deployer:", deployer.address);
  console.log("Network:", await ethers.provider.getNetwork().then(n => n.name));
  console.log("\n⚠️  IMPORTANT: Save this address and set it in Vercel:");
  console.log(`   RANCHLINKTAG_ADDRESS=${contractAddress}`);
  console.log(`   NEXT_PUBLIC_CONTRACT_TAG=${contractAddress}`);
  console.log("\n⚠️  Next step: Grant MINTER_ROLE to server wallet:");
  console.log("   Run: npx hardhat run scripts/grant-minter.ts --network <network>");
  console.log("==========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

