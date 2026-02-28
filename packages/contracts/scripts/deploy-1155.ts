import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying RanchLinkTag1155 with:', deployer.address)
  
  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Balance:', ethers.formatEther(balance), 'ETH')

  const Factory = await ethers.getContractFactory('RanchLinkTag1155')
  const contract = await Factory.deploy(deployer.address)
  await contract.waitForDeployment()

  const address = await contract.getAddress()
  console.log('RanchLinkTag1155 deployed to:', address)
  console.log('Network:', (await ethers.provider.getNetwork()).name)
  console.log('')
  console.log('Set this in Vercel:')
  console.log('RANCHLINKTAG_1155_ADDRESS=' + address)
}

main().catch((e) => { console.error(e); process.exit(1) })
