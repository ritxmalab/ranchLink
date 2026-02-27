import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../apps/web/.env.local') });

/**
 * Grant MINTER_ROLE and ADMIN_ROLE to new server wallet (one transaction)
 * 
 * This script:
 * 1. Grants MINTER_ROLE to new wallet (for minting)
 * 2. Grants ADMIN_ROLE to new wallet (for future management)
 * 
 * Usage:
 *   PRIVATE_KEY=<old_wallet_private_key> \
 *   SERVER_WALLET_ADDRESS=<new_wallet_address> \
 *   npx hardhat run scripts/grant-minter-and-admin-to-new-wallet.ts --network base
 */
async function main() {
  const CONTRACT_ADDRESS = process.env.RANCHLINKTAG_ADDRESS || '0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242';
  const NEW_WALLET = process.env.SERVER_WALLET_ADDRESS || '0xD305B89BbD5Bc65609dab650d53cCe94Fa44BDe4';

  if (!CONTRACT_ADDRESS) {
    throw new Error("RANCHLINKTAG_ADDRESS must be set in environment variables");
  }

  if (!NEW_WALLET) {
    throw new Error("SERVER_WALLET_ADDRESS must be set in environment variables");
  }

  const [admin] = await ethers.getSigners();
  console.log("==========================================");
  console.log("Granting Roles to New Server Wallet");
  console.log("==========================================");
  console.log("Contract address (PROXY):", CONTRACT_ADDRESS);
  console.log("New server wallet:", NEW_WALLET);
  console.log("Admin (grantor - old wallet):", admin.address);
  console.log("Network:", await ethers.provider.getNetwork().then(n => n.name));

  // Check admin balance
  const balance = await ethers.provider.getBalance(admin.address);
  const balanceEth = ethers.formatEther(balance);
  console.log("Admin balance:", balanceEth, "ETH");
  
  if (parseFloat(balanceEth) < 0.0001) {
    throw new Error(`Insufficient balance: ${balanceEth} ETH. Need at least 0.0001 ETH for gas.`);
  }

  // Attach to deployed contract (proxy)
  const RanchLinkTagUpgradeable = await ethers.getContractFactory("RanchLinkTagUpgradeable");
  const contract = RanchLinkTagUpgradeable.attach(CONTRACT_ADDRESS);

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

  // Check current roles for new wallet
  const MINTER_ROLE = await contract.MINTER_ROLE();
  const hasMinterRole = await contract.hasRole(MINTER_ROLE, NEW_WALLET);
  const hasAdminRoleNew = await contract.hasRole(ADMIN_ROLE, NEW_WALLET);

  console.log("\nCurrent roles for new wallet:");
  console.log("  MINTER_ROLE:", hasMinterRole ? "✅ Already has" : "❌ Missing");
  console.log("  ADMIN_ROLE:", hasAdminRoleNew ? "✅ Already has" : "❌ Missing");

  // Grant MINTER_ROLE if missing
  if (!hasMinterRole) {
    console.log("\nGranting MINTER_ROLE...");
    const tx1 = await contract.grantRole(MINTER_ROLE, NEW_WALLET);
    console.log("Transaction hash:", tx1.hash);
    console.log("Waiting for confirmation...");
    const receipt1 = await tx1.wait();
    console.log("✅ MINTER_ROLE granted in block:", receipt1?.blockNumber);
  } else {
    console.log("\n⚠️  New wallet already has MINTER_ROLE");
  }

  // Grant ADMIN_ROLE if missing (so we can manage roles in the future)
  if (!hasAdminRoleNew) {
    console.log("\nGranting ADMIN_ROLE...");
    const tx2 = await contract.grantRole(ADMIN_ROLE, NEW_WALLET);
    console.log("Transaction hash:", tx2.hash);
    console.log("Waiting for confirmation...");
    const receipt2 = await tx2.wait();
    console.log("✅ ADMIN_ROLE granted in block:", receipt2?.blockNumber);
  } else {
    console.log("\n⚠️  New wallet already has ADMIN_ROLE");
  }

  // Verify roles were granted
  const finalMinterRole = await contract.hasRole(MINTER_ROLE, NEW_WALLET);
  const finalAdminRole = await contract.hasRole(ADMIN_ROLE, NEW_WALLET);

  console.log("\n==========================================");
  console.log("ROLE GRANT SUMMARY");
  console.log("==========================================");
  console.log("Contract (PROXY):", CONTRACT_ADDRESS);
  console.log("New server wallet:", NEW_WALLET);
  console.log("MINTER_ROLE:", finalMinterRole ? "✅ GRANTED" : "❌ FAILED");
  console.log("ADMIN_ROLE:", finalAdminRole ? "✅ GRANTED" : "❌ FAILED");
  console.log("==========================================");

  if (finalMinterRole && finalAdminRole) {
    console.log("\n✅ SUCCESS! New wallet can now:");
    console.log("   - Mint tags (MINTER_ROLE)");
    console.log("   - Manage roles (ADMIN_ROLE)");
    console.log("\n⚠️  You can now forget about the old wallet completely!");
  } else {
    throw new Error("Failed to grant all roles");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });


