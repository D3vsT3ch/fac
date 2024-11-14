document.addEventListener('DOMContentLoaded', async () => {
    const connectButton = document.getElementById('connectButton');
    const accountInfo = document.getElementById('accountInfo');
    const documentInput = document.getElementById('documentInput');
    const saveButton = document.getElementById('saveButton');
    const documentsList = document.getElementById('documentsList');
    const userContainer = document.getElementById('userCointainer');
    const bodySection = document.getElementById('bodySection');

    let web3;
    let userAccount;
    let operationsContract;
    let gsnProvider;

    function initializePage() {
        if (userContainer) userContainer.style.opacity = '0';
        if (bodySection) bodySection.style.display = 'none';
        if (connectButton) connectButton.style.display = 'block';
    }

    initializePage();

    async function initGSN(provider) {
        try {
            const gsnConfig = {
                paymasterAddress: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
                forwarderAddress: trustedForwarder,
                chainId: 31337,
                loggerConfiguration: {
                    logLevel: 'debug'
                }
            };

            const gsnProvider = new GSNProvider(
                window.ethereum,
                gsnConfig
            );

            await gsnProvider.init();
            return gsnProvider;
        } catch (error) {
            console.error("Error al inicializar GSN:", error);
            throw error;
        }
    }

    async function saveDocument(data) {
        try {
            const method = operationsContract.methods.saveDocument(data);
            const gasEstimate = await method.estimateGas({ from: userAccount });

            const tx = await method.send({
                from: userAccount,
                gas: Math.floor(gasEstimate * 1.2)
            });

            console.log('Documento guardado:', tx.transactionHash);
            alert('Documento guardado exitosamente');
            documentInput.value = '';
            await loadDocuments();
        } catch (error) {
            console.error("Error al guardar documento:", error);
            alert('Error al guardar documento: ' + error.message);
        }
    }

    async function loadDocuments() {
        try {
            const docs = await operationsContract.methods.getAllDocuments().call();
            const [hashes, timestamps, datas, uploaders] = docs;

            documentsList.innerHTML = '';
            for (let i = 0; i < hashes.length; i++) {
                const date = new Date(timestamps[i] * 1000);
                const docElement = document.createElement('div');
                docElement.className = 'document-item';
                docElement.innerHTML = `
                    <p><strong>Hash:</strong> ${hashes[i]}</p>
                    <p><strong>Fecha:</strong> ${date.toLocaleString()}</p>
                    <p><strong>Datos:</strong> ${datas[i]}</p>
                    <p><strong>Subido por:</strong> ${uploaders[i]}</p>
                `;
                documentsList.appendChild(docElement);
            }
        } catch (error) {
            console.error("Error al cargar documentos:", error);
            alert("Error al cargar la lista de documentos");
        }
    }

    async function connectMetamask() {
        if (window.ethereum) {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                userAccount = (await window.ethereum.request({ method: 'eth_accounts' }))[0];
                console.log("Cuenta conectada:", userAccount);
                
                if (accountInfo) accountInfo.textContent = userAccount;

                // Inicializar Web3 con GSN
                gsnProvider = await initGSN(window.ethereum);
                web3 = new Web3(gsnProvider);
                
                operationsContract = new web3.eth.Contract(contractABI, contractAddress);

                const isWhitelisted = await operationsContract.methods.isWhitelisted(userAccount).call();
                if (!isWhitelisted) {
                    alert("Tu cuenta no está en la lista blanca");
                    return;
                }

                if (userContainer) userContainer.style.opacity = '1';
                if (bodySection) bodySection.style.display = 'block';
                if (connectButton) connectButton.style.display = 'none';

                await loadDocuments();

                window.ethereum.on('accountsChanged', handleAccountsChanged);
                window.ethereum.on('chainChanged', () => window.location.reload());

            } catch (error) {
                console.error("Error al conectar:", error);
                alert("Error al conectar con MetaMask: " + error.message);
            }
        } else {
            alert("Por favor, instala MetaMask");
        }
    }

    async function handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            alert('Por favor, conecta MetaMask.');
            initializePage();
        } else {
            userAccount = accounts[0];
            if (accountInfo) accountInfo.textContent = userAccount;
            
            const isWhitelisted = await operationsContract.methods.isWhitelisted(userAccount).call();
            if (!isWhitelisted) {
                alert("Tu cuenta no está en la lista blanca");
                initializePage();
                return;
            }
            
            await loadDocuments();
        }
    }

    // Event Listeners
    if (connectButton) {
        connectButton.addEventListener('click', connectMetamask);
    }

    if (saveButton) {
        saveButton.addEventListener('click', async () => {
            const data = documentInput.value.trim();
            if (data) {
                await saveDocument(data);
            } else {
                alert('Por favor, ingrese datos para el documento');
            }
        });
    }
});