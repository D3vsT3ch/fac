const { ethers } = require("hardhat");

async function main() {
    // Obtener la cuenta que desplegará el contrato
    const [deployer] = await ethers.getSigners();
    console.log("Desplegando el contrato con la cuenta:", deployer.address);

    const DocumentManager = await ethers.getContractFactory("DocumentManager");

    // Dirección del trustedForwarder desplegado por OpenGSN en tu red local
    const trustedForwarderAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

    // Desplegar el contrato pasando la dirección del trustedForwarder
    const documentManager = await DocumentManager.deploy(trustedForwarderAddress);

    // Esperar a que el contrato esté desplegado
    await documentManager.waitForDeployment();

    // Obtener la dirección del contrato desplegado
    console.log("DocumentManager desplegado en:", documentManager.target);

    // Obtener el propietario del contrato llamando a la función owner()
    const ownerAddress = await documentManager.owner();
    console.log("El propietario del contrato es:", ownerAddress);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error("Error en el script de despliegue:", error);
        process.exit(1);
    });
