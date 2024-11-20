const { ethers } = require('hardhat');

async function main() {
  const facAddress = '0xC62c9b0007BAFD86632ac3032D3508Ad9C52124a'; // Reemplaza con la dirección real
  const Fac = await ethers.getContractFactory('Fac');
  const fac = Fac.attach(facAddress);

  const [owner] = await ethers.getSigners();

  // Agregar un administrador
  const adminAddress = '0x0788816536defa6a14779711c0b08b7f0edfe68b'; // Dirección del administrador
  const adminName = 'User';

  // Asegurarse de que el administrador esté en la whitelist
  let isWhitelisted = await fac.isWhitelisted(adminAddress);
  if (!isWhitelisted) {
    let tx = await fac.connect(owner).addToWhitelist(adminAddress, adminName);
    await tx.wait();
    console.log(`Administrador ${adminName} agregado a la whitelist.`);
  }

  // Agregar como administrador
  let tx = await fac.connect(owner).addAdmin(adminAddress, adminName);
  await tx.wait();
  console.log(`Administrador ${adminName} agregado.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error en el script:', error);
    process.exit(1);
  });
