const { ethers, upgrades } = require('hardhat');

async function main () {
  const FacV2 = await ethers.getContractFactory('FacV2');
  console.log('Upgrading Fac...');

  try {
    // Intenta actualizar el contrato proxy en la dirección proporcionada
    await upgrades.upgradeProxy('0x5F12172a05DdF67bf6A16069Ee7C533B769A129d', FacV2);
    console.log('Fac upgraded successfully');
  } catch (error) {
    console.error('Error during upgrade:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error en el script de despliegue:', error);
    process.exit(1);
  });
