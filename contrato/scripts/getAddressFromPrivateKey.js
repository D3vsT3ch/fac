const { ethers } = require('hardhat');

async function main() {
  const [signer] = await ethers.getSigners();
  const address = await signer.getAddress();
  console.log('Dirección asociada a la clave privada:', address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
