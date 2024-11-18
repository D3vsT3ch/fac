// scripts/upgrade_box.js
const { ethers, upgrades } = require('hardhat');

async function main () {
  const FacV2 = await ethers.getContractFactory('FacV2');
  console.log('Upgrading Fac...');
  await upgrades.upgradeProxy('0x0C2065D75F111fE43550CC6A285082a17E59400f', FacV2);
  console.log('Box upgraded');
}

main();