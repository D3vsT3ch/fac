const hre = require("hardhat");

async function main() {
    try {
        console.log("\n=== Iniciando despliegue de contratos ===\n");

        const [deployer] = await ethers.getSigners();
        console.log("Cuenta del deployer:", deployer.address);

        const balance = await deployer.provider.getBalance(deployer.address);
        console.log("Balance del deployer:", ethers.formatEther(balance), "ETH");

        // Desplegar FacFunds
        console.log("\nDesplegando FacFunds...");
        const FacFunds = await ethers.getContractFactory("FacFunds");
        const facFunds = await FacFunds.deploy();
        await facFunds.waitForDeployment();
        const facFundsAddress = await facFunds.getAddress();
        console.log("FacFunds desplegado en:", facFundsAddress);

        // Dirección del trustedForwarder de OpenGSN
        const trustedForwarder = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
        console.log("\nTrustedForwarder:", trustedForwarder);

        // Desplegar FacOperations
        console.log("\nDesplegando FacOperations...");
        const FacOperations = await ethers.getContractFactory("FacOperations");
        const facOperations = await FacOperations.deploy(trustedForwarder, {
            gasLimit: 5000000
        });
        await facOperations.waitForDeployment();
        const facOperationsAddress = await facOperations.getAddress();
        console.log("FacOperations desplegado en:", facOperationsAddress);

        // Verificar los despliegues
        console.log("\n=== Verificando despliegues ===");
        
        const fundsOwner = await facFunds.owner();
        const operationsOwner = await facOperations.owner();
        const forwarderAddress = await facOperations.trustedForwarder();

        console.log("\nFacFunds:");
        console.log("- Owner:", fundsOwner);
        console.log("\nFacOperations:");
        console.log("- Owner:", operationsOwner);
        console.log("- TrustedForwarder:", forwarderAddress);

        console.log("\n=== Despliegue completado exitosamente ===");
        console.log("----------------------------------------");
        console.log("FacFunds:", facFundsAddress);
        console.log("FacOperations:", facOperationsAddress);
        console.log("----------------------------------------\n");

    } catch (error) {
        console.error("\n=== Error durante el despliegue ===");
        console.error("Mensaje:", error.message);
        console.error("Stack:", error.stack);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n=== Error fatal ===");
        console.error(error);
        process.exit(1);
    });