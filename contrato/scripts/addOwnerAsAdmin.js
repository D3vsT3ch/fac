const { ethers } = require('hardhat');

async function main() {
  const facAddress = '0xBCD9D22f017112FA762d4e2Ac647c6555C207B4C'; // Replace with your deployed Fac contract address
  const Fac = await ethers.getContractFactory('Fac');
  const fac = Fac.attach(facAddress);

  const [admin] = await ethers.getSigners();

  const isAdmin = await fac.isAdmin(admin.address);
  if (!isAdmin) {
    console.error(`Address ${admin.address} is not an admin.`);
    process.exit(1);
  }

  const userAddress = '0x0788816536DEFa6A14779711c0B08b7f0edFe68b'; // The address you want to whitelist
  const userName = 'Smart Account'; // Name associated with the user

  const isWhitelisted = await fac.isWhitelisted(userAddress);
  if (isWhitelisted) {
    console.log(`Address ${userAddress} is already whitelisted.`);
  } else {
    const tx = await fac.addToWhitelist(userAddress, userName);
    await tx.wait();
    console.log(`Address ${userAddress} added to the whitelist.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error in script:', error);
    process.exit(1);
  });
