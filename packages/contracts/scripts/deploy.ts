import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy RanchLinkTag
  const RanchLinkTag = await ethers.getContractFactory("RanchLinkTag");
  const tagContract = await RanchLinkTag.deploy(deployer.address);
  await tagContract.waitForDeployment();
  const tagAddress = await tagContract.getAddress();
  console.log("RanchLinkTag deployed to:", tagAddress);

  // Deploy Registry
  const Registry = await ethers.getContractFactory("Registry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("Registry deployed to:", registryAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("RanchLinkTag:", tagAddress);
  console.log("Registry:", registryAddress);
  console.log("\nSave these addresses in your .env file!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

