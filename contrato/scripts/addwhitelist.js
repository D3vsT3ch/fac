const { ethers } = require('hardhat');

async function main() {
  // Dirección del contrato desplegado
  const facAddress = '0x7cf6a96DFcA4CCfadbe65fB83f68d74aA808530A'; // Reemplaza con la dirección real

  // Obtener la instancia del contrato
  const Fac = await ethers.getContractFactory('Fac');
  const fac = Fac.attach(facAddress);

  // Obtener los signers (cuentas disponibles)
  const [owner] = await ethers.getSigners();

  // Datos del usuario a agregar a la whitelist
  const userEOA = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'; // Dirección EOA del usuario
  const userSmartAccount = '0x0788816536DEFa6A14779711c0B08b7f0edFe68b'; // Dirección de la Smart Account asociada (puede ser la misma EOA o diferente)
  const userName = 'Julio Leon'; // Nombre del usuario

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
