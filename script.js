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
		"stateMutability": "payable",
		"type": "receive"
	}
];

// Dirección del contrato desplegado en Sepolia
const contractAddress = '0xf8e81D47203A594245E36C48e151709F0C19fBe8'; // Reemplaza con la dirección correcta


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
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            // Solicitar acceso a las cuentas de MetaMask
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = (await web3.eth.getAccounts())[0];
            accountInfo.textContent = `${userAccount}`;
            connectButton.style.display = 'none';
            signButton.style.display = 'inline-block';
            online.style.opacity = 1;
            userCointainer.style.opacity = 1;

            // Inicializar el contrato
            await initContract();

        } catch (error) {
            console.error("Acceso a la cuenta denegado por el usuario");
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
            const dataString = Object.entries(dataJson).map(([key, value]) => `${key}:${value}`).join(', ');
            console.log('Intentando guardar el documento con datos:', dataString);
            let gasEstimate;
            try {
                gasEstimate = await contractInstance.methods.saveDocument(dataString).estimateGas({ from: userAccount });
            } catch (error) {
                console.error('Error al estimar el gas:', error);
                updateState('error', { message: 'Error al estimar el gas: ' + error.message });
                return;
            }

            const tx = await contractInstance.methods.saveDocument(dataString).send({ 
                from: userAccount,
                gas: gasEstimate
            });

            console.log('Documento guardado, recibo de transacción:', tx);
            updateState('saved', { transactionHash: tx.transactionHash });

            alert('¡Documento guardado exitosamente en la blockchain!');
        } catch (error) {
            console.error('Error al guardar el documento:', error);
            console.error('Detalles del error:', error.message);
            updateState('error', { message: `Hubo un error al guardar el documento: ${error.message}` });
            alert('Hubo un error al guardar el documento.');
        }
    } else {
        alert('Contrato no inicializado o cuenta de usuario no disponible.');
        updateState('error', { message: "Contrato no inicializado o cuenta de usuario no disponible." });
    }
});
