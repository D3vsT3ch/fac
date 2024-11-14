document.addEventListener('DOMContentLoaded', () => {

    // Elementos del DOM
    const connectButton = document.getElementById('connectButton');
    const accountInfo = document.getElementById('accountInfo');
    const userContainer = document.getElementById('userCointainer');
    const fieldsToHide = document.querySelectorAll('.hideOnLoad');
    const userTable = document.getElementById('userTable');
    const bodySection = document.getElementById('bodySection');

    const depositAmountInput = document.getElementById('depositAmount');
    const depositButton = document.getElementById('depositButton');

    // Elementos para la gestión del monto
    const establishedAmountInput = document.getElementById('establishedAmount');
    const refreshAmountButton = document.getElementById('refreshAmountButton');
    const setAmountButton = document.getElementById('setAmountButton');
    const sendAmountInput = document.getElementById('sendAmount');

    // Variables
    let web3;
    let userAccount;
    let contractInstance;
    let isUserAdmin = false;
    let ownerAccount;

    // Al cargar la página, ocultamos ciertos elementos
    function initializePage() {
        fieldsToHide.forEach(element => {
            element.style.display = 'none';
        });
        userContainer.style.display = 'none';
    }
    initializePage();

      // Evento para depositar Ether
      depositButton.addEventListener('click', async () => {
        const amount = depositAmountInput.value.trim();
        if (!isNaN(amount) && amount > 0) {
            try {
                // Convertir Ether a Wei
                const amountWei = web3.utils.toWei(amount, 'ether');
                // Llamar a la función deposit con el valor especificado
                await contractInstance.methods.deposit().send({
                    from: userAccount,
                    value: amountWei
                });
                alert('Deposito exitoso.');
                depositAmountInput.value = '';
                await loadEstablishedAmount(); // Opcional: actualizar el monto establecido si es necesario
            } catch (error) {
                console.error('Error al depositar Ether:', error);
                alert('Error al depositar Ether: ' + error.message);
            }
        } else {
            alert('Por favor, ingresa una cantidad válida de Ether.');
        }
    });

    // Función para conectar con MetaMask
    async function connectMetamask() {
        if (window.ethereum) {
            web3 = new Web3(window.ethereum);
            try {
                // Solicitar acceso a la cuenta
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                userAccount = (await web3.eth.getAccounts())[0];
                console.log("Cuenta conectada:", userAccount);

                // Mostrar información de la cuenta
                accountInfo.textContent = `${userAccount}`;
                userContainer.style.display = 'block';
                userContainer.style.opacity = '1';
                connectButton.style.display = 'none';
                

                // Inicializar el contrato
                await initContract();

                // Verificar la red
                await verifyNetwork();

                // Verificar el rol del usuario
                await checkUserRole();

                // Cargar datos iniciales
                await loadInitialData();

                // Escuchar cambios de cuenta y red
                window.ethereum.on('accountsChanged', handleAccountsChanged);
                window.ethereum.on('chainChanged', handleChainChanged);

            } catch (error) {
                console.error("Error al conectar con MetaMask", error);
                if (error.code === 4001) {
                    alert("Acceso a MetaMask denegado por el usuario.");
                } else {
                    alert("Error al conectar con MetaMask: " + error.message);
                }
            }
        } else {
            alert("MetaMask no está instalado. Por favor, instálalo para continuar.");
        }
    }

    // Verificar si el usuario es administrador o propietario
    async function checkUserRole() {
        ownerAccount = await contractInstance.methods.owner().call();
        const isAdmin = await contractInstance.methods.isAdmin(userAccount).call();
        if (userAccount.toLowerCase() === ownerAccount.toLowerCase() || isAdmin) {
            isUserAdmin = true;
            // Mostrar el contenido principal
            fieldsToHide.forEach(element => {
                element.style.display = 'block';
            });
        } else {
            alert('No tienes permisos para acceder a esta página.');
        }
    }

    // Función para cargar datos iniciales
    async function loadInitialData() {
        try {
            // Cargar administradores y usuarios
            const admins = await contractInstance.methods.getAdmins().call();
            const users = await contractInstance.methods.getWhitelistedUsers().call();

            // Combinar usuarios y roles
            const combinedData = {};
            users.forEach(address => {
                combinedData[address.toLowerCase()] = { isWhitelisted: true, isAdmin: false };
            });
            admins.forEach(address => {
                const lowerAddress = address.toLowerCase();
                if (combinedData[lowerAddress]) {
                    combinedData[lowerAddress].isAdmin = true;
                } else {
                    combinedData[lowerAddress] = { isWhitelisted: false, isAdmin: true };
                }
            });

            // Convertir combinedData a un array
            const userList = Object.keys(combinedData).map(address => ({
                address,
                ...combinedData[address]
            }));

            // Poblar la tabla
            populateTable(userTable, userList);

            // Cargar el monto establecido
            await loadEstablishedAmount();

        } catch (error) {
            console.error('Error al cargar datos iniciales', error);
        }
    }

    // Función para cargar el monto establecido
    async function loadEstablishedAmount() {
        try {
            const amountWei = await contractInstance.methods.establishedAmount().call();
            const amountEther = web3.utils.fromWei(amountWei, 'ether');
            establishedAmountInput.value = amountEther;
        } catch (error) {
            console.error('Error al cargar el monto establecido', error);
        }
    }

    // Función para poblar la tabla de usuarios
    function populateTable(tableElement, userList) {
        // Limpiar filas existentes
        tableElement.innerHTML = '';

        userList.forEach(user => {
            const row = tableElement.insertRow();
            const cellAddress = row.insertCell(0);
            const cellRoles = row.insertCell(1);
            const cellActions = row.insertCell(2);

            // Dirección
            cellAddress.textContent = user.address;

            // Iconos de roles
            const rolesContainer = document.createElement('div');
            rolesContainer.classList.add('rolesContainer');

            if (user.isWhitelisted) {
                const whitelistIcon = document.createElement('div');
                whitelistIcon.className = 'tag'
                whitelistIcon.innerHTML = "Usuario"
                rolesContainer.appendChild(whitelistIcon);
            }

            if (user.isAdmin) {
                const adminIcon = document.createElement('div');
                adminIcon.className = 'tag'
                adminIcon.innerHTML = "Administrador"
                rolesContainer.appendChild(adminIcon);
            }

            cellRoles.appendChild(rolesContainer);

            // Iconos de acciones
            const actionsContainer = document.createElement('div');
            actionsContainer.classList.add('actionsContainer');

            const lowerUserAddress = user.address.toLowerCase();
            const lowerOwnerAddress = ownerAccount.toLowerCase();
            const lowerConnectedAddress = userAccount.toLowerCase();

            // Botón de enviar monto (no se muestra si es el usuario conectado o el owner)
            if (lowerUserAddress !== lowerConnectedAddress && lowerUserAddress !== lowerOwnerAddress) {
                const sendAmountIcon = document.createElement('img');
                sendAmountIcon.src = '../images/icon_symbol_money.svg';
                sendAmountIcon.style.cursor = 'pointer';
                sendAmountIcon.title = 'Enviar monto establecido';
                sendAmountIcon.onclick = () => sendAmountToUser(user.address);
                actionsContainer.appendChild(sendAmountIcon);
            }

            // Toggle whitelist (el owner no puede ser modificado)
            /*if (lowerUserAddress !== lowerOwnerAddress) {
                const whitelistToggleIcon = document.createElement('img');
                whitelistToggleIcon.src = user.isWhitelisted ? '../images/icon_remove_whitelist.svg' : '../images/icon_add_whitelist.svg';
                whitelistToggleIcon.style.cursor = 'pointer';
                whitelistToggleIcon.title = user.isWhitelisted ? 'Remover de whitelist' : 'Agregar a whitelist';
                whitelistToggleIcon.onclick = () => toggleWhitelist(user.address, !user.isWhitelisted);
                actionsContainer.appendChild(whitelistToggleIcon);
            }*/

            // Toggle admin (el owner no puede ser modificado)
            if (lowerUserAddress !== lowerOwnerAddress) {
                const adminToggleIcon = document.createElement('img');
                adminToggleIcon.src = user.isAdmin ? '../images/icon_remove_admin.svg' : '../images/icon_group_users.svg';
                adminToggleIcon.style.cursor = 'pointer';
                adminToggleIcon.title = user.isAdmin ? 'Revocar rol de administrador' : 'Conceder rol de administrador';
                adminToggleIcon.onclick = () => toggleAdmin(user.address, !user.isAdmin);
                actionsContainer.appendChild(adminToggleIcon);
            }

            // Eliminar usuario (el owner no puede ser eliminado)
            if (lowerUserAddress !== lowerOwnerAddress) {
                const deleteIcon = document.createElement('img');
                deleteIcon.src = '../images/icon_delete.svg';
                deleteIcon.style.cursor = 'pointer';
                deleteIcon.title = 'Eliminar usuario';
                deleteIcon.onclick = () => deleteUser(user.address);
                actionsContainer.appendChild(deleteIcon);
            }

            cellActions.appendChild(actionsContainer);
        });
    }

    // Función para enviar el monto establecido al usuario
    async function sendAmountToUser(address) {
        try {
            await contractInstance.methods.sendBalance(address).send({ from: userAccount });
            alert('Monto enviado exitosamente.');
        } catch (error) {
            console.error('Error al enviar el monto:', error);
            alert('Error: ' + error.message);
        }
    }

    // Función para alternar el estado en whitelist
    async function toggleWhitelist(address, add) {
        try {
            if (add) {
                await contractInstance.methods.addToWhitelist(address).send({ from: userAccount });
                alert('Usuario agregado a whitelist.');
            } else {
                await contractInstance.methods.removeFromWhitelist(address).send({ from: userAccount });
                alert('Usuario removido de whitelist.');
            }
            loadInitialData();
        } catch (error) {
            console.error('Error al modificar whitelist:', error);
            alert('Error: ' + error.message);
        }
    }

    // Función para alternar el rol de administrador
    async function toggleAdmin(address, add) {
        try {
            if (add) {
                await contractInstance.methods.addAdmin(address).send({ from: userAccount });
                alert('Rol de administrador concedido.');
            } else {
                await contractInstance.methods.removeAdmin(address).send({ from: userAccount });
                alert('Rol de administrador revocado.');
            }
            loadInitialData();
        } catch (error) {
            console.error('Error al modificar rol de administrador:', error);
            alert('Error: ' + error.message);
        }
    }

    // Función para eliminar un usuario (remover de ambos roles)
    async function deleteUser(address) {
        try {
            await contractInstance.methods.removeFromWhitelist(address).send({ from: userAccount });
            await contractInstance.methods.removeAdmin(address).send({ from: userAccount });
            alert('Usuario eliminado de whitelist y roles de administrador.');
            loadInitialData();
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            alert('Error: ' + error.message);
        }
    }

    // Evento para añadir un nuevo usuario
    document.getElementById('addAccountButton').addEventListener('click', async () => {
        const address = document.getElementById('addAccount').value.trim();
        if (web3.utils.isAddress(address)) {
            try {
                await contractInstance.methods.addToWhitelist(address).send({ from: userAccount });
                alert('Usuario agregado a whitelist.');
                document.getElementById('addAccount').value = '';
                loadInitialData();
            } catch (error) {
                console.error('Error al agregar usuario a whitelist:', error);
                alert('Error: ' + error.message);
            }
        } else {
            alert('Por favor, ingresa una dirección de Ethereum válida.');
        }
    });

    // Evento para refrescar el monto establecido
    if(refreshAmountButton != null){
        refreshAmountButton.addEventListener('click', async () => {
            await loadEstablishedAmount();
            alert('Monto establecido actualizado.');
        });
    }

    // Evento para establecer un nuevo monto
    // Evento para establecer un nuevo monto
setAmountButton.addEventListener('click', async () => {
    const amount = sendAmountInput.value.trim();
    if (!isNaN(amount) && amount > 0) {
        try {
            // Verificar si amount está en Ether o Wei
            const amountWei = web3.utils.toWei(amount, 'ether');
            await contractInstance.methods.setEstablishedAmount(amountWei).send({ from: userAccount });
            alert('Monto establecido actualizado.');
            sendAmountInput.value = '';
            await loadEstablishedAmount();
        } catch (error) {
            console.error('Error al establecer el monto:', error);
            alert('Error: ' + error.message);
        }
    } else {
        alert('Por favor, ingresa un monto válido.');
    }
});


    // Manejar cambios de cuenta
    function handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            alert('Por favor, conecta tu cuenta en MetaMask.');
            initializePage();
            connectButton.style.display = 'block';
        } else {
            userAccount = accounts[0];
            accountInfo.textContent = `${userAccount}`;
            connectMetamask();
        }
    }

    // Manejar cambios de red
    function handleChainChanged(_chainId) {
        window.location.reload();
    }

    // Verificar la red
    async function verifyNetwork() {
        const chainId = await web3.eth.getChainId();
        if (Number(chainId) !== 31337) { // Red de prueba Sepolia
            alert('Por favor, cambia a la red de prueba Sepolia en MetaMask.');
        }
    }

    // Inicializar el contrato inteligente
    async function initContract() {
        if (typeof contractABI === 'undefined' || typeof contractAddress === 'undefined') {
            alert('El contrato no está definido correctamente.');
            throw new Error('contractABI o contractAddress no están definidos.');
        }
        contractInstance = new web3.eth.Contract(contractABI, contractAddress);
    }

    // Evento para el botón de conectar
    connectButton.addEventListener('click', connectMetamask);

});
