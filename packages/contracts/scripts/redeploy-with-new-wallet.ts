import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../apps/web/.env.local') });

/**
 * REDEPLOY RanchLinkTag con la NUEVA wallet como deployer
 * 
 * IMPORTANTE: Esto crea un NUEVO contrato. El viejo (0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242) se queda obsoleto.
 * 
 * La nueva wallet será:
 * - Deployer (tiene ADMIN_ROLE y MINTER_ROLE automáticamente)
 * - Puede mint tags inmediatamente
 * - No necesita ninguna wallet vieja
 * 
 * Usage:
 *   PRIVATE_KEY=<new_wallet_private_key> \
 *   npx hardhat run scripts/redeploy-with-new-wallet.ts --network base
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("==========================================");
  console.log("REDEPLOY RanchLinkTag con NUEVA Wallet");
  console.log("==========================================");
  console.log("Deployer (NUEVA wallet):", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceEth = ethers.formatEther(balance);
  console.log("Deployer balance:", balanceEth, "ETH");

  if (parseFloat(balanceEth) < 0.001) {
    throw new Error(`Insufficient balance: ${balanceEth} ETH. Need at least 0.001 ETH for deployment.`);
  }

  // Deploy upgradeable contract
  console.log("\nDeploying RanchLinkTagUpgradeable with UUPS Proxy...");
  console.log("⚠️  This will create a NEW contract. Old contract will be obsolete.");
  
  const RanchLinkTagUpgradeable = await ethers.getContractFactory("RanchLinkTagUpgradeable");
  
  // Deploy proxy + implementation
  // The proxy address will be the permanent contract address
  const contract = await upgrades.deployProxy(
    RanchLinkTagUpgradeable,
    [deployer.address], // initialOwner = nueva wallet (tiene todos los roles)
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
  console.log("NUEVO PROXY ADDRESS (USE THIS):", proxyAddress);
  console.log("Implementation address:", implementationAddress);
  console.log("Network:", await ethers.provider.getNetwork().then(n => n.name));
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("==========================================");

  // Verify roles - nueva wallet debe tener todos los roles
  const MINTER_ROLE = await contract.MINTER_ROLE();
  const ADMIN_ROLE = await contract.ADMIN_ROLE();
  const hasMinterRole = await contract.hasRole(MINTER_ROLE, deployer.address);
  const hasAdminRole = await contract.hasRole(ADMIN_ROLE, deployer.address);

  console.log("\nRole Verification (Nueva Wallet):");
  console.log("  MINTER_ROLE:", hasMinterRole ? "✅ GRANTED" : "❌ MISSING");
  console.log("  ADMIN_ROLE:", hasAdminRole ? "✅ GRANTED" : "❌ MISSING");

  if (!hasMinterRole || !hasAdminRole) {
    throw new Error("Failed to grant roles to new wallet!");
  }

  // Save deployment info
  console.log("\n==========================================");
  console.log("DEPLOYMENT SUMMARY");
  console.log("==========================================");
  console.log("Contract: RanchLinkTagUpgradeable (UUPS)");
  console.log("NUEVO PROXY ADDRESS:", proxyAddress);
  console.log("Implementation address:", implementationAddress);
  console.log("Deployer (Nueva Wallet):", deployer.address);
  console.log("Network:", await ethers.provider.getNetwork().then(n => n.name));
  console.log("\n✅ Nueva wallet tiene MINTER_ROLE y ADMIN_ROLE");
  console.log("✅ Puede mint tags inmediatamente");
  console.log("✅ NO necesita wallet vieja para nada");
  console.log("\n⚠️  IMPORTANTE: Actualizar Vercel con NUEVO address:");
  console.log(`   RANCHLINKTAG_ADDRESS=${proxyAddress}`);
  console.log(`   NEXT_PUBLIC_CONTRACT_TAG=${proxyAddress}`);
  console.log("\n⚠️  IMPORTANTE: Actualizar Supabase contracts table:");
  console.log(`   UPDATE contracts SET contract_address='${proxyAddress.toLowerCase()}' WHERE contract_address='0xce165b70379ca6211f9dcf6ffe8c3ac1eedb6242';`);
  console.log("\n⚠️  CONTRATO VIEJO (obsoleto):");
  console.log("   0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242");
  console.log("   Este contrato ya NO se usará");
  console.log("==========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });


