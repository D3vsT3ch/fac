// scripts/upgrade_box.js
const { ethers, upgrades } = require('hardhat');

async function main () {
  const FacV2 = await ethers.getContractFactory('FacV2');
  console.log('Upgrading Fac...');
  await upgrades.upgradeProxy('0x2e168E434AB3F8DE16B6f5C88550370Cba4d61ef', FacV2);
  console.log('Box upgraded');
}

main();