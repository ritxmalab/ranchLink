import { CdpClient } from "@coinbase/cdp-sdk";
import dotenv from "dotenv";

dotenv.config({ path: "apps/web/.env.local" });

async function main() {
  const cdp = new CdpClient();

  const evm = await cdp.evm.getOrCreateAccount({
    name: "ranchlink-server-evm",
    network: "base-sepolia",
  });

  console.log("Funding EVM account:", evm.address);

  const faucetResponse = await cdp.evm.requestFaucet({
    address: evm.address,
    network: "base-sepolia",
    token: "eth",
  });

  console.log(
    `Requested funds from ETH faucet: https://sepolia.basescan.org/tx/${faucetResponse.transactionHash}`
  );
}

main().catch(console.error);
