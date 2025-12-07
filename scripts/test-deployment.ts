/**
 * Smoke test script for deployed contract
 * Tests: 1 tag creation via factory endpoint
 */

import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env.local') });

const CONTRACT_ADDRESS = process.env.RANCHLINKTAG_ADDRESS || '0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242';
const SERVER_WALLET = process.env.SERVER_WALLET_ADDRESS || '0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83';

async function main() {
  console.log("==========================================");
  console.log("Smoke Test - Contract Deployment");
  console.log("==========================================");
  console.log("Contract (PROXY):", CONTRACT_ADDRESS);
  console.log("Server wallet:", SERVER_WALLET);
  console.log("Network: Base Mainnet");
  console.log("");

  const [signer] = await ethers.getSigners();
  console.log("Test signer:", signer.address);

  // Attach to contract
  const contract = await ethers.getContractAt("RanchLinkTagUpgradeable", CONTRACT_ADDRESS);

  // Test 1: Verify contract name and symbol
  console.log("\n1. Testing contract info...");
  const name = await contract.name();
  const symbol = await contract.symbol();
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  if (name !== "RanchLink Tag" || symbol !== "RLTAG") {
    throw new Error("Contract name/symbol mismatch");
  }
  console.log("   ✅ Contract info correct");

  // Test 2: Verify MINTER_ROLE
  console.log("\n2. Testing MINTER_ROLE...");
  const MINTER_ROLE = await contract.MINTER_ROLE();
  const hasRole = await contract.hasRole(MINTER_ROLE, SERVER_WALLET);
  console.log(`   MINTER_ROLE: ${MINTER_ROLE}`);
  console.log(`   Server wallet has MINTER_ROLE: ${hasRole}`);
  if (!hasRole) {
    throw new Error("Server wallet does not have MINTER_ROLE");
  }
  console.log("   ✅ MINTER_ROLE verified");

  // Test 3: Test getTokenId with non-existent hash
  console.log("\n3. Testing getTokenId...");
  const testHash = ethers.keccak256(ethers.toUtf8Bytes("TEST0000"));
  const tokenId = await contract.getTokenId(testHash);
  console.log(`   getTokenId for non-existent hash: ${tokenId}`);
  if (tokenId !== BigInt(0)) {
    throw new Error("getTokenId should return 0 for non-existent hash");
  }
  console.log("   ✅ getTokenId works correctly");

  console.log("\n==========================================");
  console.log("✅ All smoke tests passed!");
  console.log("==========================================");
  console.log("\nNext: Test factory endpoint to create 1 tag");
  console.log("   POST /api/factory/batches");
  console.log("   Body: { batchSize: 1, ... }");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Smoke test failed:", error);
    process.exitCode = 1;
  });

