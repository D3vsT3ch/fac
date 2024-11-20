const { ethers } = require('hardhat');

async function main() {
  const facAddress = '0xC62c9b0007BAFD86632ac3032D3508Ad9C52124a'; // Reemplaza con la dirección real
  const Fac = await ethers.getContractFactory('Fac');
  const fac = Fac.attach(facAddress);

  const [owner] = await ethers.getSigners();

  // Agregar un usuario a la whitelist
  const userAddress = '0x668019d35aA5a4451CD32363C63c71F0A9Bf3144'; // Dirección del usuario
  const userName = 'Cliente';

  const tx = await fac.connect(owner).addToWhitelist(userAddress, userName);
  await tx.wait();

  console.log(`Usuario ${userName} agregado a la whitelist.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error en el script:', error);
    process.exit(1);
  });
