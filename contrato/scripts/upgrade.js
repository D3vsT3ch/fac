const { ethers, upgrades } = require('hardhat');

async function main () {
  const FacV2 = await ethers.getContractFactory('FacV2');
  console.log('Upgrading Fac...');

  try {
    // Intenta actualizar el contrato proxy en la dirección proporcionada
    await upgrades.upgradeProxy('0xB328c52173E70adcd0b6E09aD90AfEb141D11714', FacV2);
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
