const { JsonRpcProvider } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../apps/web/.env.local') });

const SERVER_WALLET = process.env.SERVER_WALLET_ADDRESS;
const PERSONAL_WALLET = '0x4C41afD136415011Ee5422D9b287C4a7A6CF1915';

const provider = new JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/trKkGtYbzcwRqlW4JtlK5');

async function getWalletInfo(address, label) {
  console.log(`\n=== ${label} ===`);
  console.log(`Address: ${address}`);
  
  const balance = await provider.getBalance(address);
  const balanceEth = parseFloat(balance) / 1e18;
  console.log(`Balance actual: ${balanceEth.toFixed(6)} ETH`);
  
  // Get transaction count
  const txCount = await provider.getTransactionCount(address);
  console.log(`Total transacciones enviadas: ${txCount}`);
  
  return { balanceEth, txCount };
}

async function main() {
  console.log('💰 REPORTE DE ESTADO DE WALLETS\n');
  console.log('='.repeat(50));
  
  const server = await getWalletInfo(SERVER_WALLET, 'SERVER WALLET');
  const personal = await getWalletInfo(PERSONAL_WALLET, 'PERSONAL WALLET');
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 RESUMEN:');
  console.log(`Server Wallet:`);
  console.log(`  - Balance: ${server.balanceEth.toFixed(6)} ETH`);
  console.log(`  - Transacciones: ${server.txCount}`);
  console.log(`\nPersonal Wallet:`);
  console.log(`  - Balance: ${personal.balanceEth.toFixed(6)} ETH`);
  console.log(`  - Transacciones: ${personal.txCount}`);
  
  // Calculate what was sent
  const expectedServerBalance = 0.001; // What we wanted to keep
  const actualServerBalance = server.balanceEth;
  const difference = actualServerBalance - expectedServerBalance;
  
  console.log(`\n💸 ANÁLISIS DE TRANSACCIONES:`);
  console.log(`Server wallet debería tener: ~0.001 ETH`);
  console.log(`Server wallet tiene: ${actualServerBalance.toFixed(6)} ETH`);
  console.log(`Diferencia: ${difference > 0 ? '+' : ''}${difference.toFixed(6)} ETH`);
  console.log(`\nPersonal wallet recibió: ~${personal.balanceEth.toFixed(6)} ETH`);
  
  console.log(`\n✅ Estado: Ambas wallets verificadas`);
}

main().catch(console.error);

