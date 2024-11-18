document.addEventListener('DOMContentLoaded', async () => {
    let biconomy;
    let web3;
    let userAccount;
    let contractInstance;

    const connectButton = document.getElementById("connectButton");
    const actionButton = document.getElementById("actionButton");
    const accountInfo = document.getElementById("accountInfo");
    const loading = document.getElementById("loading");
    const jsonContent = document.getElementById("jsonContent");

    // Mostrar/ocultar carga
    function showLoading(message) {
        loading.style.display = "block";
        loading.innerHTML = `<p>${message}</p><div class="spinner"></div>`;
    }

    function hideLoading() {
        loading.style.display = "none";
    }

    // Cambiar de red a Polygon Mumbai
    async function switchToNetwork() {
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: `0x${requiredChainId.toString(16)}` }],
            });
        } catch (error) {
            if (error.code === 4902) {
                await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [
                        {
                            chainId: `0x${requiredChainId.toString(16)}`,
                            chainName,
                            rpcUrls: [rpcUrls],
                            nativeCurrency: {
                                name: nameCoint,
                                symbol: coint,
                                decimals: 18,
                            },
                            blockExplorerUrls: [blockExplorerUrls],
                        },
                    ],
                });
            } else {
                console.error("Error al cambiar de red:", error);
            }
        }
    }

    // Conectar MetaMask
    async function connectMetamask() {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                userAccount = accounts[0];
                accountInfo.textContent = `Cuenta: ${userAccount}`;
                connectButton.style.display = "none";
                actionButton.style.display = "block";

                const chainId = parseInt(await window.ethereum.request({ method: "eth_chainId" }), 16);
                if (chainId !== requiredChainId) {
                    await switchToNetwork();
                }

                await initializeBiconomy();
            } catch (error) {
                console.error("Error al conectar MetaMask:", error);
                alert("No se pudo conectar a MetaMask.");
            }
        } else {
            alert("MetaMask no está instalado.");
        }
    }

    // Inicializar Biconomy
    async function initializeBiconomy() {
        showLoading("Inicializando Biconomy...");
        biconomy = new Biconomy(window.ethereum, {
            apiKey,
            debug: true,
            strictMode: true,
        });

        web3 = new Web3(biconomy);

        biconomy
            .onEvent(biconomy.READY, () => {
                console.log("Biconomy está listo.");
                contractInstance = new web3.eth.Contract(contractABI, contractAddress);
                hideLoading();
            })
            .onEvent(biconomy.ERROR, (error, message) => {
                console.error("Error en Biconomy:", error, message);
                alert("Error en Biconomy: Verifica tu configuración.");
                hideLoading();
            });
    }

    // Enviar transacción patrocinada
    async function sendSponsoredTransaction(data) {
        try {
            showLoading("Enviando transacción patrocinada...");
            const gasEstimate = await contractInstance.methods.saveDocument(data).estimateGas({ from: userAccount });
            const tx = await contractInstance.methods.saveDocument(data).send({
                from: userAccount,
                gas: gasEstimate,
                signatureType: biconomy.EIP712_SIGN,
            });
            console.log("Transacción exitosa:", tx.transactionHash);
            jsonContent.innerHTML = `<p>Transacción exitosa: ${tx.transactionHash}</p>`;
            hideLoading();
        } catch (error) {
            console.error("Error al enviar transacción:", error);
            alert("Error: " + error.message);
            hideLoading();
        }
    }

    // Manejar eventos de botones
    connectButton.addEventListener("click", connectMetamask);
    actionButton.addEventListener("click", () => {
        const dataJson = { key1: "value1", key2: "value2" }; // Reemplaza con tus datos
        const dataString = JSON.stringify(dataJson);
        sendSponsoredTransaction(dataString);
    });
});
