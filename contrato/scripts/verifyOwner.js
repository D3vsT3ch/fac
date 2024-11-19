const { ethers } = require('hardhat');

async function main() {
  const facAddress = '0x4635157EA5EBbC20250e30DC1a69449d93cA9BC4'; // Reemplaza con la dirección desplegada de tu contrato
  const Fac = await ethers.getContractFactory('Fac');
  const fac = Fac.attach(facAddress);

  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();

  const ownerAddress = await fac.owner();

  console.log('Dirección del firmante:', signerAddress);
  console.log('Dirección del propietario del contrato:', ownerAddress);

  if (signerAddress.toLowerCase() === ownerAddress.toLowerCase()) {
    console.log('El firmante es el propietario del contrato.');
  } else {
    console.log('El firmante NO es el propietario del contrato.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
