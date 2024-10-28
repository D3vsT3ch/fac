// Elementos del DOM
const connectButton = document.getElementById("connectButton");
const signButton = document.getElementById("signButton");
const nextButton = document.getElementById("nextButton");
const accountInfo = document.getElementById("accountInfo");
const online = document.getElementById("online");
const userCointainer = document.getElementById("userCointainer");
const jsonContent = document.getElementById("jsonContent");

let web3;
let userAccount;
let contractInstance;

// ABI del contrato (asegúrate de que corresponda al contrato desplegado)
const contractABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_admin",
				"type": "address"
			}
		],
		"name": "addAdmin",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "addToWhitelist",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "admin",
				"type": "address"
			}
		],
		"name": "AdminAdded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "admin",
				"type": "address"
			}
		],
		"name": "AdminRemoved",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "AmountEstablished",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "BalanceSent",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "docHash",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "uploader",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "DocumentSaved",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_admin",
				"type": "address"
			}
		],
		"name": "removeAdmin",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "removeFromWhitelist",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_data",
				"type": "string"
			}
		],
		"name": "saveDocument",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address payable",
				"name": "_to",
				"type": "address"
			}
		],
		"name": "sendBalance",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_amount",
				"type": "uint256"
			}
		],
		"name": "setEstablishedAmount",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "UserRemovedFromWhitelist",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "UserWhitelisted",
		"type": "event"
	},
	{
		"stateMutability": "payable",
		"type": "fallback"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	},
	{
		"inputs": [],
		"name": "establishedAmount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAdmins",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAllDocuments",
		"outputs": [
			{
				"internalType": "bytes32[]",
				"name": "",
				"type": "bytes32[]"
			},
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			},
			{
				"internalType": "string[]",
				"name": "",
				"type": "string[]"
			},
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_docHash",
				"type": "bytes32"
			}
		],
		"name": "getDocument",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getWhitelistedUsers",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "isAdmin",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "isWhitelisted",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

const contractAddress = '0x00eb3044B01Dc3207Ce2e4214e4A3F9F33857039'; // Reemplaza con la dirección correcta

// Función para obtener parámetros JSON desde la URL
function getJsonFromUrl() {
    let query = location.search.substr(1);
    let result = {};
    query.split("&").forEach(function(part) {
        let item = part.split("=");
        result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
}

// Función para mostrar el JSON en el DOM
function displayJson(jsonString) {
    try {
        const jsonObject = JSON.parse(jsonString);
        jsonContent.innerHTML = ""; // Limpiar contenido previo
        for (const [key, value] of Object.entries(jsonObject)) {
            const p = document.createElement("p");

            const strong = document.createElement("strong");
            strong.textContent = `${key}: `;

            p.appendChild(strong);
            p.appendChild(document.createTextNode(value));

            jsonContent.appendChild(p);
        }
        return jsonObject; // Devuelve el objeto JSON
    } catch (e) {
        jsonContent.textContent = "El JSON proporcionado no es válido.";
        return null;
    }
}

const urlParams = getJsonFromUrl();
let dataJson; // Variable para almacenar los datos
if (urlParams.data) {
    dataJson = displayJson(urlParams.data);
} else {
    jsonContent.textContent = "No se proporcionó JSON en la URL.";
}

// Función para actualizar el estado de la aplicación en el DOM
function updateState(state, additionalInfo) {
    jsonContent.innerHTML = ""; // Limpiar contenido previo
    let p, strong;

    switch(state) {
        case 'notSigned':
            // Estado inicial, antes de firmar
            break;
        case 'signed':
            p = document.createElement("p");
            strong = document.createElement("strong");
            strong.textContent = `Hash de Firma: `;
            p.appendChild(strong);
            p.appendChild(document.createTextNode(additionalInfo.signature));
            jsonContent.appendChild(p);

            p = document.createElement("p");
            strong = document.createElement("strong");
            strong.textContent = `Estado: `;
            p.appendChild(strong);
            p.appendChild(document.createTextNode("FIRMADO"));
            jsonContent.appendChild(p);
            break;
        case 'saved':
            p = document.createElement("p");
            strong = document.createElement("strong");
            strong.textContent = `Hash de Transacción: `;
            p.appendChild(strong);
            p.appendChild(document.createTextNode(additionalInfo.transactionHash));
            jsonContent.appendChild(p);

            p = document.createElement("p");
            strong = document.createElement("strong");
            strong.textContent = `Estado: `;
            p.appendChild(strong);
            p.appendChild(document.createTextNode("DOCUMENTO GUARDADO"));
            jsonContent.appendChild(p);
            break;
        case 'error':
            jsonContent.textContent = `Error: ${additionalInfo.message}`;
            break;
        default:
            jsonContent.textContent = "Estado desconocido.";
    }
}

// Función para conectar MetaMask usando web3.js
async function connectMetamask() {
    console.log("Intentando conectar con MetaMask");
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            // Solicitar acceso a las cuentas de MetaMask
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = (await web3.eth.getAccounts())[0];
            console.log("Cuenta conectada:", userAccount);
            accountInfo.textContent = `${userAccount}`;
            connectButton.style.display = 'none';
            signButton.style.display = 'inline-block';
            online.style.opacity = 1;
            userCointainer.style.opacity = 1;

            // Inicializar el contrato
            await initContract();
            console.log("Contrato inicializado");

            // Verificar la red actual
            await verifyNetwork();

            // Escuchar cambios de cuenta o red
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

        } catch (error) {
            console.error("Acceso a la cuenta denegado por el usuario", error);
            updateState('error', { message: "Acceso a la cuenta denegado por el usuario." });
        }
    } else {
        alert("MetaMask no está instalado. ¡Instálalo para continuar!");
    }
}

// Función para inicializar el contrato inteligente
async function initContract() {
    contractInstance = new web3.eth.Contract(contractABI, contractAddress);
}

// Función para esperar el recibo de la transacción
async function waitForReceipt(txHash, retries = 10, delay = 2000) {
    return new Promise((resolve, reject) => {
        (function retryAttempt(attempt) {
            web3.eth.getTransactionReceipt(txHash, (err, receipt) => {
                if (err) {
                    reject(err);
                } else if (receipt) {
                    resolve(receipt);
                } else if (attempt > 0) {
                    setTimeout(() => retryAttempt(attempt - 1), delay);
                } else {
                    reject(new Error('No se pudo obtener el recibo de la transacción después de varios intentos'));
                }
            });
        })(retries);
    });
}

// Función para verificar si la red actual es Sepolia
async function verifyNetwork() {
    try {
        const chainId = await web3.eth.getChainId();
        console.log("Chain ID obtenido:", chainId, "Tipo:", typeof chainId);
        if (Number(chainId) !== 11155111) { // Sepolia chain ID
            alert('Por favor, cambia a la red de prueba Sepolia en MetaMask.');
            updateState('error', { message: 'Red incorrecta. Cambia a la red de prueba Sepolia.' });
            // Intentar cambiar la red automáticamente
            await switchToSepolia();
        } else {
            console.log("Conectado a la red Sepolia.");
            online.style.opacity = 1;
        }
    } catch (error) {
        console.error("Error al verificar la red:", error);
        updateState('error', { message: "Error al verificar la red." });
    }
}

// Función para cambiar dinámicamente a Sepolia
async function switchToSepolia() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xAA36A7' }], // 11155111 en hexadecimal
        });
        console.log("Cambio a Sepolia exitoso.");
        updateState('notSigned');
    } catch (switchError) {
        // Este error indica que Sepolia no está agregado a MetaMask
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0xAA36A7',
                        chainName: 'Sepolia Test Network',
                        rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID'], // Reemplaza con tu URL RPC si es necesario
                        nativeCurrency: {
                            name: 'Sepolia Ether',
                            symbol: 'ETH',
                            decimals: 18
                        },
                        blockExplorerUrls: ['https://sepolia.etherscan.io']
                    }],
                });
                console.log("Red Sepolia agregada exitosamente.");
                // Después de agregar, intenta cambiar nuevamente
                await switchToSepolia();
            } catch (addError) {
                console.error("Error al agregar la red Sepolia:", addError);
                updateState('error', { message: 'No se pudo agregar la red Sepolia a MetaMask.' });
            }
        } else {
            console.error("Error al cambiar a Sepolia:", switchError);
            updateState('error', { message: 'No se pudo cambiar a la red Sepolia.' });
        }
    }
}

// Manejar cambios de cuenta
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        console.log("Por favor, conecta una cuenta.");
        updateState('error', { message: "Por favor, conecta una cuenta en MetaMask." });
    } else {
        userAccount = accounts[0];
        accountInfo.textContent = `${userAccount}`;
        console.log("Cuenta cambiada a:", userAccount);
        updateState('notSigned');
    }
}

// Manejar cambios de red
async function handleChainChanged(_chainId) {
    console.log("Chain cambiado a:", _chainId);
    await verifyNetwork();
    // Recargar la página para evitar inconsistencias
    window.location.reload();
}

// Añadir eventos a los botones
connectButton.addEventListener('click', connectMetamask);

signButton.addEventListener('click', async () => {
    if (web3 && userAccount) {
        try {
            const message = "Confirmar conexión";
            const signature = await web3.eth.personal.sign(message, userAccount, '');
            nextButton.style.display = 'inline-block';
            signButton.style.display = 'none';

            updateState('signed', { signature: signature });
        } catch (error) {
            console.error("Error en la firma", error);
            updateState('error', { message: "Error al firmar la conexión." });
        }
    }
});

nextButton.addEventListener('click', async () => {
    if (contractInstance && userAccount) {
        try {
            const chainId = await web3.eth.getChainId();
            console.log("Chain ID obtenido en 'nextButton':", chainId, "Tipo:", typeof chainId);
            if (Number(chainId) !== 11155111) { // Sepolia chain ID
                alert('Por favor, cambia a la red de prueba Sepolia en MetaMask.');
                updateState('error', { message: 'Red incorrecta. Cambia a la red de prueba Sepolia.' });
                // Intentar cambiar la red automáticamente
                await switchToSepolia();
                return;
            }
            try {
                if (!dataJson) {
                    throw new Error("Datos JSON no disponibles para enviar.");
                }

                // Convertir el objeto JSON a una cadena y envolverlo con comillas sencillas
                let dataString = JSON.stringify(dataJson);
                // Escapar comillas sencillas dentro del string si es necesario
                dataString = dataString.replace(/'/g, "\\'");
                // Envolver el string completo con comillas sencillas
                dataString = `'${dataString}'`;

                console.log('Intentando guardar el documento con datos de la URL:', dataString);
                
                // Estimación dinámica de gas
                const gasEstimate = await contractInstance.methods.saveDocument(dataString).estimateGas({ from: userAccount });

                let tx;
                try {
                    tx = await contractInstance.methods.saveDocument(dataString).send({ 
                        from: userAccount,
                        gas: gasEstimate
                    });
                    await waitForReceipt(tx.transactionHash);
                } catch (sendError) {
                    console.error('Error al enviar la transacción:', sendError);
                    updateState('error', { message: `Error al enviar la transacción: ${sendError.message}` });
                    return;
                }

                console.log('Documento guardado, recibo de transacción:', tx);
                updateState('saved', { transactionHash: tx.transactionHash });

                alert('¡Documento guardado exitosamente en la blockchain!');
            } catch (error) {
                console.error('Error al guardar el documento:', error);
                console.error('Detalles del error:', error.message);
                updateState('error', { message: `Hubo un error al guardar el documento: ${error.message}` });
                alert('Hubo un error al guardar el documento.');
            }
        } catch (networkError) {
            console.error("Error al obtener el chain ID:", networkError);
            updateState('error', { message: "Error al verificar la red." });
        }
    } else {
        alert('Contrato no inicializado o cuenta de usuario no disponible.');
        updateState('error', { message: "Contrato no inicializado o cuenta de usuario no disponible." });
    }
});