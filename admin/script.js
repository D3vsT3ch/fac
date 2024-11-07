document.addEventListener('DOMContentLoaded', () => {

   // Elements from the DOM
   const connectButton = document.getElementById('connectButton');
   const accountInfo = document.getElementById('accountInfo');
   const userContainer = document.getElementById('userContainer'); // Corrected ID
   const fieldsToHide = document.querySelectorAll('.hideOnLoad'); // Elements to hide on load
   const loading = document.getElementById('loading'); // Optional loading element
   const adminTable = document.getElementById('adminTable'); // Admin table
   const userTable = document.getElementById('userTable'); // User table

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
                userContainer.style.display = 'block'; // Mostrar el contenedor
                connectButton.style.display = 'none'; // Ocultar el botón de conectar

                // Inicializar el contrato
                await initContract();

                // Verificar la red actual (opcional)
                await verifyNetwork();

                // Cargar datos iniciales (opcional)
                await loadInitialData();

                // Escuchar cambios de cuenta o red
                window.ethereum.on('accountsChanged', handleAccountsChanged);
                window.ethereum.on('chainChanged', handleChainChanged);

            } catch (error) {
                console.error("Acceso a la cuenta denegado por el usuario", error);
                alert("Acceso a MetaMask denegado.");
            }
        } else {
            alert("MetaMask no está instalado. ¡Instálalo para continuar!");
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

            // Mostrar el contenido principal
            fieldsToHide.forEach(element => {
                element.style.display = 'block';
            });

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

    // Function to remove an address (to be implemented)
    function removeAddress(address, tableId) {
        // Implement removal logic here
        console.log(`Removing address ${address} from ${tableId}`);
    }

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
        contractInstance = new web3.eth.Contract(contractABI, contractAddress);
    }

    // Event listener for connect button
    connectButton.addEventListener('click', connectMetamask);

});
