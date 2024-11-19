const { ethers, upgrades } = require('hardhat');

async function main() {
  const Fac = await ethers.getContractFactory('Fac');
  console.log('Desplegando Fac como proxy...');

  // Desplegar Fac como proxy sin parámetros
  const fac = await upgrades.deployProxy(Fac, [], { initializer: 'initialize' });

  console.log('Fac proxy desplegado en:', await fac.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error en el script de despliegue:', error);
    process.exit(1);
  });
