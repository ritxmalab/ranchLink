import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Treasury address (Ledger wallet - Ethereum/Base)
  const TREASURY_ADDRESS = "0x223C5FEAA2523E0c3B13e0C43F662653B9726cb6";
  
  // Deploy SecureRanchLinkTag
  console.log("\n1. Deploying SecureRanchLinkTag...");
  const SecureRanchLinkTag = await ethers.getContractFactory("SecureRanchLinkTag");
  const tagContract = await SecureRanchLinkTag.deploy(
    TREASURY_ADDRESS,
    deployer.address // Initial admin (should be multi-sig in production)
  );
  await tagContract.waitForDeployment();
  const tagAddress = await tagContract.getAddress();
  console.log("✅ SecureRanchLinkTag deployed to:", tagAddress);

  // Deploy SecureRegistry
  console.log("\n2. Deploying SecureRegistry...");
  const SecureRegistry = await ethers.getContractFactory("SecureRegistry");
  const registryContract = await SecureRegistry.deploy(deployer.address);
  await registryContract.waitForDeployment();
  const registryAddress = await registryContract.getAddress();
  console.log("✅ SecureRegistry deployed to:", registryAddress);

  // Grant MINTER_ROLE to server wallet (set in env)
  const SERVER_WALLET = process.env.SERVER_WALLET_ADDRESS;
  if (SERVER_WALLET) {
    console.log("\n3. Granting MINTER_ROLE to server wallet:", SERVER_WALLET);
    const MINTER_ROLE = await tagContract.MINTER_ROLE();
    await tagContract.grantRole(MINTER_ROLE, SERVER_WALLET);
    console.log("✅ MINTER_ROLE granted");

    // Grant ANCHORER_ROLE to server wallet
    console.log("4. Granting ANCHORER_ROLE to server wallet...");
    const ANCHORER_ROLE = await registryContract.ANCHORER_ROLE();
    await registryContract.grantRole(ANCHORER_ROLE, SERVER_WALLET);
    console.log("✅ ANCHORER_ROLE granted");
  } else {
    console.log("\n⚠️  SERVER_WALLET_ADDRESS not set in env. Grant roles manually.");
  }

  console.log("\n📋 Deployment Summary:");
  console.log("====================");
  console.log("Tag Contract:", tagAddress);
  console.log("Registry Contract:", registryAddress);
  console.log("Treasury:", TREASURY_ADDRESS);
  console.log("Admin:", deployer.address);
  console.log("\n⚠️  IMPORTANT: Update .env.local with contract addresses!");
  console.log("⚠️  IMPORTANT: Verify contracts on block explorer!");
  console.log("⚠️  IMPORTANT: Set up multi-sig for admin role!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

