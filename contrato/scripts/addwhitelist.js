const { ethers } = require('hardhat');

async function main() {
  // Dirección del contrato desplegado
  const facAddress = '0xa1EED54087efF4CdDcFc08c780b19A0364805E8b'; // Reemplaza con la dirección real

  // Obtener la instancia del contrato
  const Fac = await ethers.getContractFactory('Fac');
  const fac = Fac.attach(facAddress);

  // Obtener los signers (cuentas disponibles)
  const [owner] = await ethers.getSigners();

  // Datos del usuario a agregar a la whitelist
  const userEOA = '0xd21f79b18438c6e850bd3a2ef50e35c1765e046b'; // Dirección EOA del usuario
  const userSmartAccount = '0x41b5ac6797a3fc9bd3ec305714e45b1419a9bed2'; // Dirección de la Smart Account asociada (puede ser la misma EOA o diferente)
  const userName = 'Propietario'; // Nombre del usuario

  // Definir el rol del usuario
  // 0 para USER, 1 para ADMIN
  const Role = {
    USER: 0,
    ADMIN: 1
  };
  
  const userRole = Role.ADMIN; // Cambia a Role.ADMIN si deseas asignar el rol de administrador

  // Ejecutar la transacción para agregar al usuario a la whitelist
  const tx = await fac.connect(owner).addToWhitelist(userEOA, userSmartAccount, userName, userRole);
  await tx.wait();

  console.log(`Usuario ${userName} agregado a la whitelist con rol ${userRole === Role.USER ? 'USER' : 'ADMIN'}.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error en el script:', error);
    process.exit(1);
  });
