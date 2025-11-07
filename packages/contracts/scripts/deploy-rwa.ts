import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying RWA contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Treasury address (Ledger wallet - Ethereum/Base)
  const TREASURY_ADDRESS = "0x223C5FEAA2523E0c3B13e0C43F662653B9726cb6";
  
  // Deploy RanchLinkRWA (ERC-7518 based)
  console.log("\n1. Deploying RanchLinkRWA (ERC-7518 DyCIST)...");
  const RanchLinkRWA = await ethers.getContractFactory("RanchLinkRWA");
  const rwaContract = await RanchLinkRWA.deploy(
    TREASURY_ADDRESS,
    deployer.address // Initial admin (should be multi-sig in production)
  );
  await rwaContract.waitForDeployment();
  const rwaAddress = await rwaContract.getAddress();
  console.log("✅ RanchLinkRWA deployed to:", rwaAddress);

  // Deploy SecureRegistry (if needed)
  console.log("\n2. Deploying SecureRegistry...");
  const SecureRegistry = await ethers.getContractFactory("SecureRegistry");
  const registryContract = await SecureRegistry.deploy(deployer.address);
  await registryContract.waitForDeployment();
  const registryAddress = await registryContract.getAddress();
  console.log("✅ SecureRegistry deployed to:", registryAddress);

  // Grant roles to server wallet
  const SERVER_WALLET = process.env.SERVER_WALLET_ADDRESS;
  if (SERVER_WALLET) {
    console.log("\n3. Granting roles to server wallet:", SERVER_WALLET);
    
    // Grant MINTER_ROLE
    const MINTER_ROLE = await rwaContract.MINTER_ROLE();
    await rwaContract.grantRole(MINTER_ROLE, SERVER_WALLET);
    console.log("✅ MINTER_ROLE granted");

    // Grant OPERATOR_ROLE
    const OPERATOR_ROLE = await rwaContract.OPERATOR_ROLE();
    await rwaContract.grantRole(OPERATOR_ROLE, SERVER_WALLET);
    console.log("✅ OPERATOR_ROLE granted");

    // Grant REVENUE_MANAGER_ROLE
    const REVENUE_MANAGER_ROLE = await rwaContract.REVENUE_MANAGER_ROLE();
    await rwaContract.grantRole(REVENUE_MANAGER_ROLE, SERVER_WALLET);
    console.log("✅ REVENUE_MANAGER_ROLE granted");

    // Grant ANCHORER_ROLE to server wallet (Registry)
    const ANCHORER_ROLE = await registryContract.ANCHORER_ROLE();
    await registryContract.grantRole(ANCHORER_ROLE, SERVER_WALLET);
    console.log("✅ ANCHORER_ROLE granted");
  } else {
    console.log("\n⚠️  SERVER_WALLET_ADDRESS not set in env. Grant roles manually.");
  }

  console.log("\n📋 Deployment Summary:");
  console.log("====================");
  console.log("RWA Contract:", rwaAddress);
  console.log("Registry Contract:", registryAddress);
  console.log("Treasury:", TREASURY_ADDRESS);
  console.log("Admin:", deployer.address);
  console.log("\n📊 Partitions Available:");
  console.log("- ANIMAL_TAGS");
  console.log("- SOFTWARE_LICENSE");
  console.log("- TRADEMARKS");
  console.log("- REVENUE_SHARE");
  console.log("\n⚠️  IMPORTANT:");
  console.log("1. Update .env.local with contract addresses");
  console.log("2. Verify contracts on block explorer");
  console.log("3. Set up multi-sig for admin role");
  console.log("4. Test revenue distribution");
  console.log("5. Configure partition rules");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

