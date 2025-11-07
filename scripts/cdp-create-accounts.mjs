import { CdpClient } from "@coinbase/cdp-sdk";
import dotenv from "dotenv";

dotenv.config({ path: "apps/web/.env.local" });

async function main() {
  const cdp = new CdpClient();

  const evm = await cdp.evm.getOrCreateAccount({
    name: "ranchlink-server-evm",
    network: "base-sepolia",
  });
  console.log("Server EVM account:", evm.address);

  const sol = await cdp.solana.getOrCreateAccount({
    name: "ranchlink-server-solana",
  });
  console.log("Server Solana account:", sol.address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
