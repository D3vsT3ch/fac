// scripts/verifyWhitelist.js

const { ethers } = require("hardhat");

async function main() {
  const facAddress = "0x2e168E434AB3F8DE16B6f5C88550370Cba4d61ef"; // Reemplaza con la dirección desplegada de Fac
  const Fac = await ethers.getContractFactory("Fac");
  const fac = Fac.attach(facAddress);

  const owner = await fac.owner();
  console.log("Propietario:", owner);

  const client = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const isClientWhitelisted = await fac.isWhitelisted(client);
  console.log(`¿El cliente ${client} está en la whitelist?`, isClientWhitelisted);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
