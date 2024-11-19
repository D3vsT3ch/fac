const { ethers } = require('hardhat');

async function main() {
  const facAddress = '0x2e168E434AB3F8DE16B6f5C88550370Cba4d61ef'; // Reemplaza con la dirección real
  const Fac = await ethers.getContractFactory('Fac');
  const fac = Fac.attach(facAddress);

  const [owner] = await ethers.getSigners();

  // Agregar un administrador
  const adminAddress = '0x2f80427CA71E485c49DF63f40Fd339E5adbF6eAc'; // Dirección del administrador
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
