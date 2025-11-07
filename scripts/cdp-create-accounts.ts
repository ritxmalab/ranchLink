import { CdpClient } from "@coinbase/cdp-sdk";
import dotenv from "dotenv";

dotenv.config({ path: "apps/web/.env.local" });

async function main() {
  const cdp = new CdpClient();

  const evm = await cdp.evm.getOrCreateAccount({
    alias: "ranchlink-server-evm",
    network: "base-sepolia",
  });
  console.log("Server EVM account:", evm.address);

  const sol = await cdp.solana.getOrCreateAccount({
    alias: "ranchlink-server-solana",
  });
  console.log("Server Solana account:", sol.address);
}

main().catch(console.error);
