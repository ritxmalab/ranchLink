import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Grant MINTER_ROLE to server wallet
 * 
 * Usage:
 *   RANCHLINKTAG_ADDRESS=0x... SERVER_WALLET_ADDRESS=0x... \
 *   npx hardhat run scripts/grant-minter.ts --network baseSepolia
 * 
 * Environment variables required:
 *   - RANCHLINKTAG_ADDRESS: Deployed contract address
 *   - SERVER_WALLET_ADDRESS: Server wallet address to grant MINTER_ROLE
 *   - PRIVATE_KEY: Wallet with ADMIN_ROLE (usually deployer)
 */
async function main() {
  const CONTRACT_ADDRESS = process.env.RANCHLINKTAG_ADDRESS;
  const SERVER_WALLET = process.env.SERVER_WALLET_ADDRESS;

  if (!CONTRACT_ADDRESS) {
    throw new Error("RANCHLINKTAG_ADDRESS must be set in environment variables");
  }

  if (!SERVER_WALLET) {
    throw new Error("SERVER_WALLET_ADDRESS must be set in environment variables");
  }

  // Validate addresses
  if (!ethers.isAddress(CONTRACT_ADDRESS)) {
    throw new Error(`Invalid contract address: ${CONTRACT_ADDRESS}`);
  }

  if (!ethers.isAddress(SERVER_WALLET)) {
    throw new Error(`Invalid server wallet address: ${SERVER_WALLET}`);
  }

  const [admin] = await ethers.getSigners();
  console.log("==========================================");
  console.log("Granting MINTER_ROLE");
  console.log("==========================================");
  console.log("Contract address:", CONTRACT_ADDRESS);
  console.log("Server wallet:", SERVER_WALLET);
  console.log("Admin (grantor):", admin.address);
  console.log("Network:", await ethers.provider.getNetwork().then(n => n.name));

  // Attach to deployed contract
  const RanchLinkTag = await ethers.getContractFactory("RanchLinkTag");
  const contract = RanchLinkTag.attach(CONTRACT_ADDRESS);

  // Verify contract is deployed
  try {
    const name = await contract.name();
    const symbol = await contract.symbol();
    console.log(`\nContract verified: ${name} (${symbol})`);
  } catch (error) {
    throw new Error(`Contract not found at ${CONTRACT_ADDRESS}. Is it deployed?`);
  }

  // Check if admin has ADMIN_ROLE
  const ADMIN_ROLE = await contract.ADMIN_ROLE();
  const hasAdminRole = await contract.hasRole(ADMIN_ROLE, admin.address);
  
  if (!hasAdminRole) {
    throw new Error(`Admin address ${admin.address} does not have ADMIN_ROLE`);
  }

  // Check if server wallet already has MINTER_ROLE
  const MINTER_ROLE = await contract.MINTER_ROLE();
  const alreadyHasRole = await contract.hasRole(MINTER_ROLE, SERVER_WALLET);

  if (alreadyHasRole) {
    console.log("\n⚠️  Server wallet already has MINTER_ROLE");
    console.log("No action needed.");
    return;
  }

  // Grant MINTER_ROLE
  console.log("\nGranting MINTER_ROLE...");
  const tx = await contract.grantRole(MINTER_ROLE, SERVER_WALLET);
  console.log("Transaction hash:", tx.hash);
  
  console.log("Waiting for confirmation...");
  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed in block:", receipt?.blockNumber);

  // Verify role was granted
  const hasRole = await contract.hasRole(MINTER_ROLE, SERVER_WALLET);
  if (hasRole) {
    console.log("\n✅ MINTER_ROLE granted successfully!");
    console.log("Server wallet can now mint tags.");
  } else {
    throw new Error("Failed to verify MINTER_ROLE was granted");
  }

  console.log("\n==========================================");
  console.log("ROLE GRANT SUMMARY");
  console.log("==========================================");
  console.log("Contract:", CONTRACT_ADDRESS);
  console.log("Server wallet:", SERVER_WALLET);
  console.log("Role: MINTER_ROLE");
  console.log("Status: ✅ GRANTED");
  console.log("==========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

