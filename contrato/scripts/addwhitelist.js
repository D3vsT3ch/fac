const { ethers } = require('hardhat');

async function main() {
  const facAddress = '0x2e168E434AB3F8DE16B6f5C88550370Cba4d61ef'; // Reemplaza con la dirección real
  const Fac = await ethers.getContractFactory('Fac');
  const fac = Fac.attach(facAddress);

  const [owner] = await ethers.getSigners();

  // Agregar un usuario a la whitelist
  const userAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // Dirección del usuario
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
