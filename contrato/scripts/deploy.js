const { ethers, upgrades } = require('hardhat');

async function main() {
  const Fac = await ethers.getContractFactory('Fac');
  console.log('Desplegando Fac como proxy...');

  const userEOA = '0xd21f79b18438c6e850bd3a2ef50e35c1765e046b'; // Dirección EOA del usuario
  const userSmartAccount = '0x41b5aC6797A3Fc9bD3eC305714E45b1419a9beD2'; // Dirección de la Smart Account asociada (puede ser la misma EOA o diferent
  const name ="Propietario"
  // Desplegar Fac como proxy sin parámetros
  const fac = await upgrades.deployProxy(Fac, [userEOA, userSmartAccount, name], { initializer: 'initialize' });

  console.log('Fac proxy desplegado en:', await fac.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error en el script de despliegue:', error);
    process.exit(1);
  });
