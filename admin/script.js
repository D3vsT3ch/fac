document.addEventListener('DOMContentLoaded', () => {

    // Elements from the DOM
    const connectButton = document.getElementById('connectButton');
    const accountInfo = document.getElementById('accountInfo');
    const userContainer = document.getElementById('userCointainer'); // ID corregido
    const fieldsToHide = document.querySelectorAll('.hideOnLoad'); // Elements to hide on load
    const adminTable = document.getElementById('adminTable'); // Admin table
    const userTable = document.getElementById('userTable'); // User table
    const bodySection = document.getElementById('bodySection');

    // Variables
    let web3;
    let userAccount;
    let contractInstance;

    // On page load, hide certain elements
    function initializePage() {
        fieldsToHide.forEach(element => {
            element.style.display = 'none';
        });
        userContainer.style.display = 'none';
    }
    initializePage();

    // Function to connect to MetaMask
    async function connectMetamask() {
        if (window.ethereum) {
            web3 = new Web3(window.ethereum);
            try {
                // Solicitar acceso a las cuentas de MetaMask
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                userAccount = (await web3.eth.getAccounts())[0];
                console.log("Cuenta conectada:", userAccount);

                // Mostrar la cuenta en el contenedor
                accountInfo.textContent = `${userAccount}`;
                userContainer.style.display = 'block';
                userContainer.style.opacity="1" // Mostrar el contenedor
                connectButton.style.display = 'none'; // Ocultar el botón de conectar

                // Inicializar el contrato
                await initContract();

                // Verificar la red actual (opcional)
                await verifyNetwork();

                // Verificar si el usuario es administrador o propietario
                await checkUserRole();

                // Cargar datos iniciales (opcional)
                await loadInitialData();

                // Escuchar cambios de cuenta o red
                window.ethereum.on('accountsChanged', handleAccountsChanged);
                window.ethereum.on('chainChanged', handleChainChanged);

            } catch (error) {
                console.error("Error al conectar con MetaMask", error);
                if (error.code === 4001) {
                    // Usuario rechazó la solicitud
                    alert("Acceso a MetaMask denegado por el usuario.");
                } else {
                    alert("Error al conectar con MetaMask: " + error.message);
                }
            }
        } else {
            alert("MetaMask no está instalado. ¡Instálalo para continuar!");
        }
    }

   
    // Check if user is admin or owner
    async function checkUserRole() {
        const owner = await contractInstance.methods.owner().call();
        const isAdmin = await contractInstance.methods.isAdmin(userAccount).call();
        if (userAccount.toLowerCase() === owner.toLowerCase() || isAdmin) {
            isUserAdmin = true;
            // Mostrar el contenido principal
            fieldsToHide.forEach(element => {
                element.style.display = 'block';
            });
        } else {
            alert('No tienes permisos para acceder a esta página.');
            // Puedes redirigir al usuario o ocultar ciertas secciones
        }
    }

    // Function to load initial data
    async function loadInitialData() {
        try {
            // Load admins
            const admins = await contractInstance.methods.getAdmins().call();
            populateTable(adminTable, admins);

            // Load whitelisted users
            const users = await contractInstance.methods.getWhitelistedUsers().call();
            populateTable(userTable, users);

        } catch (error) {
            console.error('Error al cargar datos iniciales', error);
        }
    }

    // Function to populate a table with addresses
    function populateTable(tableElement, addressArray) {
        // Clear existing rows
        tableElement.innerHTML = '';

        addressArray.forEach(address => {
            const row = tableElement.insertRow();
            const cellAddress = row.insertCell(0);
            const cellAction = row.insertCell(1);

            cellAddress.textContent = address;
            // Add an action button or icon if needed
            const deleteIcon = document.createElement('img');
            deleteIcon.src = '../images/icon_delete.svg';
            deleteIcon.style.cursor = 'pointer';
            deleteIcon.onclick = () => removeAddress(address, tableElement.id);
            cellAction.appendChild(deleteIcon);
        });
    }

    // Function to remove an address
    function removeAddress(address, tableId) {
        if (tableId === 'userTable') {
            // Remover usuario de la whitelist
            removeFromWhitelist(address);
        } else if (tableId === 'adminTable') {
            // Remover administrador
            removeAdmin(address);
        }
    }

    // Remover usuario de la whitelist
    async function removeFromWhitelist(address) {
        try {
            await contractInstance.methods.removeFromWhitelist(address).send({ from: userAccount });
            alert('Cuenta removida de la whitelist exitosamente.');
            loadInitialData();
        } catch (error) {
            console.error('Error al remover cuenta de la whitelist:', error);
            alert('Error al remover cuenta de la whitelist: ' + error.message);
        }
    }

    // Remover administrador
    async function removeAdmin(address) {
        try {
            await contractInstance.methods.removeAdmin(address).send({ from: userAccount });
            alert('Administrador removido exitosamente.');
            loadInitialData();
        } catch (error) {
            console.error('Error al remover administrador:', error);
            alert('Error al remover administrador: ' + error.message);
        }
    }

    // Event listeners for action buttons
    // Añadir cuenta a la whitelist
    document.getElementById('addAccountButton').addEventListener('click', async () => {
        const address = document.getElementById('addAccount').value.trim();
        if (web3.utils.isAddress(address)) {
            try {
                await contractInstance.methods.addToWhitelist(address).send({ from: userAccount });
                alert('Cuenta añadida a la whitelist exitosamente.');
                document.getElementById('addAccount').value = '';
                loadInitialData();
            } catch (error) {
                console.error('Error al añadir cuenta a la whitelist:', error);
                alert('Error al añadir cuenta a la whitelist: ' + error.message);
            }
        } else {
            alert('Por favor, ingresa una dirección válida de Ethereum.');
        }
    });

    // Remover cuenta de la whitelist
    document.getElementById('removeAccountButton').addEventListener('click', async () => {
        const address = document.getElementById('removeAccount').value.trim();
        if (web3.utils.isAddress(address)) {
            try {
                await contractInstance.methods.removeFromWhitelist(address).send({ from: userAccount });
                alert('Cuenta removida de la whitelist exitosamente.');
                document.getElementById('removeAccount').value = '';
                loadInitialData();
            } catch (error) {
                console.error('Error al remover cuenta de la whitelist:', error);
                alert('Error al remover cuenta de la whitelist: ' + error.message);
            }
        } else {
            alert('Por favor, ingresa una dirección válida de Ethereum.');
        }
    });

    // Añadir administrador
    document.getElementById('addAdminButton').addEventListener('click', async () => {
        const address = document.getElementById('addAdmin').value.trim();
        if (web3.utils.isAddress(address)) {
            try {
                await contractInstance.methods.addAdmin(address).send({ from: userAccount });
                alert('Administrador añadido exitosamente.');
                document.getElementById('addAdmin').value = '';
                loadInitialData();
            } catch (error) {
                console.error('Error al añadir administrador:', error);
                alert('Error al añadir administrador: ' + error.message);
            }
        } else {
            alert('Por favor, ingresa una dirección válida de Ethereum.');
        }
    });

    // Remover administrador
    document.getElementById('removeAdminButton').addEventListener('click', async () => {
        const address = document.getElementById('removeAdmin').value.trim();
        if (web3.utils.isAddress(address)) {
            try {
                await contractInstance.methods.removeAdmin(address).send({ from: userAccount });
                alert('Administrador removido exitosamente.');
                document.getElementById('removeAdmin').value = '';
                loadInitialData();
            } catch (error) {
                console.error('Error al remover administrador:', error);
                alert('Error al remover administrador: ' + error.message);
            }
        } else {
            alert('Por favor, ingresa una dirección válida de Ethereum.');
        }
    });

    // Establecer monto
    document.getElementById('setAmountButton').addEventListener('click', async () => {
        const amount = document.getElementById('sendAmount').value.trim();
        if (!isNaN(amount) && amount > 0) {
            try {
                await contractInstance.methods.setEstablishedAmount(web3.utils.toWei(amount, 'ether')).send({ from: userAccount });
                alert('Monto establecido exitosamente.');
                document.getElementById('sendAmount').value = '';
            } catch (error) {
                console.error('Error al establecer el monto:', error);
                alert('Error al establecer el monto: ' + error.message);
            }
        } else {
            alert('Por favor, ingresa un monto válido.');
        }
    });

    // Enviar balance
    document.getElementById('sendBalanceButton').addEventListener('click', async () => {
        const address = document.getElementById('sendAccount').value.trim();
        if (web3.utils.isAddress(address)) {
            try {
                await contractInstance.methods.sendBalance(address).send({ from: userAccount });
                alert('Balance enviado exitosamente.');
                document.getElementById('sendAccount').value = '';
            } catch (error) {
                console.error('Error al enviar balance:', error);
                alert('Error al enviar balance: ' + error.message);
            }
        } else {
            alert('Por favor, ingresa una dirección válida de Ethereum.');
        }
    });

    // Handle account changes
    function handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            alert('Por favor, conecta tu cuenta en MetaMask.');
            // Hide fields and show connect button
            initializePage();
            connectButton.style.display = 'block';
        } else {
            userAccount = accounts[0];
            accountInfo.textContent = `${userAccount}`;
            // Re-initialize contract and check permissions
            connectMetamask();
        }
    }

    // Handle network changes
    function handleChainChanged(_chainId) {
        window.location.reload();
    }

    // Optional: Verify network
    async function verifyNetwork() {
        const chainId = await web3.eth.getChainId();
        if (Number(chainId) !== 11155111) { // Sepolia network
            alert('Por favor, cambia a la red de prueba Sepolia en MetaMask.');
            // Optionally, you can try to switch networks programmatically
        }
    }

    // Initialize the smart contract
    async function initContract() {
        if (typeof contractABI === 'undefined' || typeof contractAddress === 'undefined') {
            alert('El contrato no está definido correctamente.');
            throw new Error('contractABI o contractAddress no están definidos.');
        }
        contractInstance = new web3.eth.Contract(contractABI, contractAddress);
    }

    // Event listener for connect button
    connectButton.addEventListener('click', connectMetamask);

});