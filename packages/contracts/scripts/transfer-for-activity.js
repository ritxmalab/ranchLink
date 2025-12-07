const { Wallet, JsonRpcProvider, parseEther } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../apps/web/.env.local') });

async function main() {
  // Get wallet info from .env.local
  const privateKey = process.env.PRIVATE_KEY || process.env.SERVER_WALLET_PRIVATE_KEY;
  const recipientAddress = '0x4C41afD136415011Ee5422D9b287C4a7A6CF1915';
  
  if (!privateKey) {
    throw new Error('PRIVATE_KEY or SERVER_WALLET_PRIVATE_KEY not found in .env.local');
  }

  // Create wallet and provider
  const provider = new JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/trKkGtYbzcwRqlW4JtlK5');
  const wallet = new Wallet(privateKey, provider);

  console.log('=== Transferencia para Generar Actividad ===');
  console.log('From:', wallet.address);
  console.log('To:', recipientAddress);
  console.log('Network: Ethereum Mainnet');
  console.log('');

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  const balanceEth = parseFloat(balance) / 1e18;
  console.log('Balance actual:', balanceEth.toFixed(6), 'ETH');

  // Estimate gas
  const gasPrice = await provider.getFeeData();
  const gasLimit = 21000; // Standard ETH transfer
  const gasCost = gasPrice.gasPrice * BigInt(gasLimit);
  const gasCostEth = parseFloat(gasCost) / 1e18;
  console.log('Gas fee estimado:', gasCostEth.toFixed(6), 'ETH');
  console.log('');

  // Leave 0.001 ETH in wallet, send the rest
  const keepAmount = parseEther('0.001');
  const transferAmount = balance - keepAmount - gasCost;
  const transferAmountEth = parseFloat(transferAmount) / 1e18;
  const keepAmountEth = parseFloat(keepAmount) / 1e18;

  if (transferAmount <= 0) {
    throw new Error(`Balance insuficiente. Necesitas al menos ${(keepAmountEth + gasCostEth).toFixed(6)} ETH pero tienes ${balanceEth.toFixed(6)} ETH`);
  }

  console.log('Cantidad a transferir:', transferAmountEth.toFixed(6), 'ETH');
  console.log('Cantidad a mantener en wallet:', keepAmountEth.toFixed(6), 'ETH');
  console.log('Gas fee:', gasCostEth.toFixed(6), 'ETH');
  console.log('Balance después:', keepAmountEth.toFixed(6), 'ETH');
  console.log('');

  // Confirm
  console.log('⚠️  ¿Estás seguro? Esto enviará', transferAmountEth.toFixed(6), 'ETH a', recipientAddress);
  console.log('Y dejará', keepAmountEth.toFixed(6), 'ETH en la wallet para actividad');
  console.log('Presiona Ctrl+C para cancelar, o espera 5 segundos para continuar...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Send transaction
  console.log('Enviando transacción...');
  const tx = await wallet.sendTransaction({
    to: recipientAddress,
    value: transferAmount,
  });

  console.log('✅ Transacción enviada!');
  console.log('TX Hash:', tx.hash);
  console.log('Esperando confirmación...');

  const receipt = await tx.wait();
  console.log('✅ Transacción confirmada en bloque:', receipt.blockNumber);
  console.log('Gas usado:', receipt.gasUsed.toString());
  console.log('');
  console.log('Ver en Etherscan: https://etherscan.io/tx/' + tx.hash);
  console.log('');
  console.log('Ahora puedes intentar el faucet de Alchemy nuevamente.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exitCode = 1;
  });

