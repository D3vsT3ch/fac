const { ethers, upgrades } = require('hardhat');

async function main () {
  const FacV2 = await ethers.getContractFactory('FacV2');
  console.log('Upgrading Fac...');

  try {
    // Intenta actualizar el contrato proxy en la dirección proporcionada
    await upgrades.upgradeProxy('0xC62c9b0007BAFD86632ac3032D3508Ad9C52124a', FacV2);
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
