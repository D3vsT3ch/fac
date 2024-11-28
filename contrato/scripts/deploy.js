const { ethers, upgrades } = require('hardhat');
const ethersLib = require('ethers');


async function main() {

  console.log('Desplegando Fac como proxy...');

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log('Desplegando contratos con la cuenta:', deployer.address);
  

  

  const Fac = await ethers.getContractFactory('Fac');
  console.log('Desplegando Fac como proxy...');

  const userEOA = '0xd21f79b18438c6e850bd3a2ef50e35c1765e046b'; // Dirección EOA del usuario
  const userSmartAccount = '0x41b5ac6797a3fc9bd3ec305714e45b1419a9bed2'; // Dirección de la Smart Account asociada (puede ser la misma EOA o diferent
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
